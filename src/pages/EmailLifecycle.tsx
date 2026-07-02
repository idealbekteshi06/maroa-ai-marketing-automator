import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Mail, Send, Clock, Users, BarChart3, Plus, CheckCircle,
  PauseCircle, ArrowRight, Zap, MousePointerClick, Loader2, UserPlus, X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { getAnalytics, emailSequenceCreate, emailEnroll } from "@/lib/api";

/* ── Types (canonical schema — routes/email-lifecycle.js writes
      email_blast_sequences: trigger_type + inline emails[] + delay_hours,
      enrollment state in contact_enrollments) ── */

interface SequenceEmailStep {
  subject_prompt?: string;
  body_prompt?: string;
  delay_hours?: number;
}

interface BlastSequence {
  id: string;
  name?: string;
  trigger_type?: string;
  trigger_value?: string | null;
  delay_hours?: number;
  is_active?: boolean;
  emails?: SequenceEmailStep[];
  created_at?: string;
}

interface Enrollment {
  id: string;
  sequence_id?: string;
  status?: string;
  created_at?: string;
  completed_at?: string | null;
}

interface EmailStats {
  email_sent?: number;
  email_opens?: number;
  email_clicks?: number;
}

interface StepDraft {
  subject_prompt: string;
  body_prompt: string;
  delay_days: number;
}

const VALID_TRIGGERS: { value: string; label: string; desc: string }[] = [
  { value: "signup", label: "🎉 On Signup", desc: "When someone creates an account" },
  { value: "link_click", label: "🖱️ On Click", desc: "When someone clicks an email link" },
  { value: "no_open_7d", label: "💤 Re-engagement", desc: "7 days without opening email" },
  { value: "purchase", label: "🛒 Post Purchase", desc: "After a customer buys" },
  { value: "cart_abandon", label: "🛍️ Cart Abandon", desc: "When a cart is left behind" },
];

const triggerLabel = (t?: string) =>
  VALID_TRIGGERS.find((v) => v.value === t)?.label ?? t ?? "—";

const formatDelay = (hours?: number): string => {
  const h = Number(hours);
  if (!Number.isFinite(h) || h <= 0) return "Immediate";
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"}`;
  const d = Math.round(h / 24);
  return `Day ${d}`;
};

const safePercent = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? `${n.toFixed(1)}%` : "—";
};

/* ── Sequence Timeline ── */

function SequenceTimeline({ steps }: { steps: SequenceEmailStep[] }) {
  if (!steps?.length) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        This sequence has no email steps yet.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex items-center gap-0 min-w-max px-2 py-4">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center">
            {/* Node */}
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full border-2 border-primary bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                {i + 1}
              </div>
              <div className="mt-2 text-center max-w-[140px]">
                <p className="text-xs font-medium text-foreground leading-tight">
                  {step?.subject_prompt || "Untitled email"}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {formatDelay(step?.delay_hours)}
                </p>
              </div>
            </div>
            {/* Connector line */}
            {i < steps.length - 1 && (
              <div className="flex items-center mx-1" style={{ marginBottom: "2.5rem" }}>
                <div className="w-12 h-0.5 bg-border" />
                <ArrowRight className="h-3 w-3 text-muted-foreground -ml-1" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Component ── */

export default function EmailLifecycle() {
  const { businessId, user } = useAuth();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formTrigger, setFormTrigger] = useState("signup");
  const [formSteps, setFormSteps] = useState<StepDraft[]>([
    { subject_prompt: "", body_prompt: "", delay_days: 1 },
  ]);

  // Enroll dialog state
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [enrollEmail, setEnrollEmail] = useState("");
  const [enrollName, setEnrollName] = useState("");

  /* ── Reads ──
     Sequences: same Supabase client read path DashboardEmail uses, but bound
     to `email_blast_sequences` — the table the canonical
     routes/email-lifecycle.js endpoints actually write (migration 090). */
  const sequencesQuery = useQuery({
    queryKey: ["email-lifecycle", "sequences", businessId],
    queryFn: async (): Promise<BlastSequence[]> => {
      const { data, error } = await externalSupabase
        .from("email_blast_sequences")
        .select("*")
        .eq("business_id", businessId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as BlastSequence[];
    },
    enabled: !!businessId,
  });

  const enrollmentsQuery = useQuery({
    queryKey: ["email-lifecycle", "enrollments", businessId],
    queryFn: async (): Promise<Enrollment[]> => {
      const { data, error } = await externalSupabase
        .from("contact_enrollments")
        .select("id, sequence_id, status, created_at, completed_at")
        .eq("business_id", businessId!);
      if (error) throw error;
      return (data ?? []) as Enrollment[];
    },
    enabled: !!businessId,
  });

  const statsQuery = useQuery({
    queryKey: ["email-lifecycle", "stats", businessId],
    queryFn: async (): Promise<EmailStats> => {
      const res = await getAnalytics({
        business_id: businessId!,
        user_id: user?.id ?? "", // server expects user_id — this is auth.user.id
      });
      return (res ?? {}) as EmailStats;
    },
    enabled: !!businessId,
    retry: false,
  });

  const sequences = sequencesQuery.data ?? [];
  const enrollments = enrollmentsQuery.data ?? [];
  const stats = statsQuery.data;

  const selectedSequence =
    sequences.find((s) => s?.id === selected) ?? sequences[0] ?? null;

  /* ── Derived metrics ── */
  const activeSequences = sequences.filter((s) => s?.is_active).length;
  const activeEnrollments = enrollments.filter((e) => e?.status === "active").length;
  const sent = Number(stats?.email_sent) || 0;
  const openRate = sent > 0 ? safePercent(((Number(stats?.email_opens) || 0) / sent) * 100) : "—";
  const clickRate = sent > 0 ? safePercent(((Number(stats?.email_clicks) || 0) / sent) * 100) : "—";

  const enrollmentsBySequence = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of enrollments) {
      if (e?.sequence_id && e?.status === "active") {
        map[e.sequence_id] = (map[e.sequence_id] ?? 0) + 1;
      }
    }
    return map;
  }, [enrollments]);

  // 30-day enrollments vs completions chart from real enrollment rows
  const chartData = useMemo(() => {
    const days: { day: string; enrolled: number; completed: number }[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({
        day: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        enrolled: enrollments.filter((e) => e?.created_at?.slice(0, 10) === key).length,
        completed: enrollments.filter((e) => e?.completed_at?.slice(0, 10) === key).length,
      });
    }
    return days;
  }, [enrollments]);

  const heroMetrics = [
    { label: "Active Sequences", value: String(activeSequences), icon: Zap },
    { label: "Subscribers", value: activeEnrollments.toLocaleString(), icon: Users },
    { label: "Open Rate", value: openRate, icon: Mail },
    { label: "Click Rate", value: clickRate, icon: MousePointerClick },
  ];

  /* ── Mutations ── */
  const invalidateAll = () =>
    qc.invalidateQueries({ queryKey: ["email-lifecycle"] });

  const createMutation = useMutation({
    mutationFn: () =>
      emailSequenceCreate({
        business_id: businessId!,
        name: formName.trim(),
        trigger_type: formTrigger,
        delay_hours: (formSteps[0]?.delay_days ?? 1) * 24,
        emails: formSteps.map((s) => ({
          subject_prompt: s.subject_prompt,
          body_prompt: s.body_prompt,
          delay_hours: (s.delay_days || 1) * 24,
        })),
      }),
    onSuccess: () => {
      toast.success("Sequence created");
      setCreateOpen(false);
      setFormName("");
      setFormTrigger("signup");
      setFormSteps([{ subject_prompt: "", body_prompt: "", delay_days: 1 }]);
      invalidateAll();
    },
    onError: (e: Error) => toast.error(e?.message || "Failed to create sequence"),
  });

  const enrollMutation = useMutation({
    mutationFn: () =>
      emailEnroll({
        business_id: businessId!,
        contact_email: enrollEmail.trim(),
        contact_name: enrollName.trim() || undefined,
        sequence_id: selectedSequence?.id,
      }),
    onSuccess: () => {
      toast.success("Contact enrolled");
      setEnrollOpen(false);
      setEnrollEmail("");
      setEnrollName("");
      // Enrollment is processed async server-side — refetch shortly after
      setTimeout(invalidateAll, 1500);
    },
    onError: (e: Error) => toast.error(e?.message || "Failed to enroll contact"),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await externalSupabase
        .from("email_blast_sequences")
        .update({ is_active })
        .eq("id", id)
        .eq("business_id", businessId!);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      toast.success(vars.is_active ? "Sequence resumed" : "Sequence paused");
      invalidateAll();
    },
    onError: (e: Error) => {
      toast.error(e?.message || "Failed to update sequence");
      invalidateAll();
    },
  });

  /* ── Loading skeletons ── */
  if (sequencesQuery.isLoading || enrollmentsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-lg skeleton" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-lg skeleton" />
            ))}
          </div>
          <div className="lg:col-span-3 h-64 rounded-lg skeleton" />
        </div>
        <div className="h-80 rounded-lg skeleton" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {heroMetrics.map((m) => {
          const Icon = m.icon;
          return (
            <Card key={m.label}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">{m.label}</span>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold text-foreground">{m.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Sequence List + Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left — Sequence Cards */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-foreground">Email Sequences</h3>
            <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1 h-3 w-3" /> New
            </Button>
          </div>

          {sequences.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <Mail className="mx-auto h-10 w-10 text-muted-foreground/30" />
                <h3 className="mt-4 text-sm font-semibold text-foreground">
                  No sequences yet — create your first one
                </h3>
                <p className="mt-1.5 text-xs text-muted-foreground max-w-xs mx-auto">
                  Create a sequence to nurture leads automatically. AI writes each
                  email from your goals.
                </p>
                <Button size="sm" className="mt-4" onClick={() => setCreateOpen(true)}>
                  <Plus className="mr-1 h-3 w-3" /> Create First Sequence
                </Button>
              </CardContent>
            </Card>
          ) : (
            sequences.map((seq) => {
              const isActive = !!seq?.is_active;
              const emailCount = seq?.emails?.length ?? 0;
              const enrolled = enrollmentsBySequence[seq?.id] ?? 0;
              return (
                <Card
                  key={seq.id}
                  className={`cursor-pointer transition-colors ${
                    selectedSequence?.id === seq.id
                      ? "border-primary ring-1 ring-primary/30"
                      : ""
                  }`}
                  onClick={() => setSelected(seq.id)}
                >
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Send className="h-4 w-4 text-primary" />
                        <span className="font-medium text-foreground text-sm">
                          {seq?.name || "Untitled"}
                        </span>
                      </div>
                      <Switch
                        checked={isActive}
                        disabled={toggleMutation.isPending}
                        onCheckedChange={(checked) =>
                          toggleMutation.mutate({ id: seq.id, is_active: checked })
                        }
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {emailCount} email{emailCount === 1 ? "" : "s"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {enrolled} enrolled
                      </span>
                      <Badge
                        variant={isActive ? "default" : "secondary"}
                        className="text-[10px] ml-auto"
                      >
                        {isActive ? (
                          <><CheckCircle className="mr-1 h-2.5 w-2.5" /> Live</>
                        ) : (
                          <><PauseCircle className="mr-1 h-2.5 w-2.5" /> Paused</>
                        )}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Right — Sequence Preview */}
        <Card className="lg:col-span-3">
          {selectedSequence ? (
            <>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Clock className="h-4 w-4" />
                      {selectedSequence?.name || "Untitled"} — Sequence Preview
                    </CardTitle>
                    <CardDescription>
                      {selectedSequence?.emails?.length ?? 0} emails &middot;{" "}
                      {triggerLabel(selectedSequence?.trigger_type)} &middot;{" "}
                      {enrollmentsBySequence[selectedSequence?.id] ?? 0} active enrollments
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEnrollOpen(true)}
                  >
                    <UserPlus className="mr-1 h-3 w-3" /> Enroll contact
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <SequenceTimeline steps={selectedSequence?.emails ?? []} />
              </CardContent>
            </>
          ) : (
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              Select a sequence to preview its email steps.
            </CardContent>
          )}
        </Card>
      </div>

      {/* Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" /> Enrollments vs Completions — Last 30 Days
          </CardTitle>
          <CardDescription>
            Contacts entering and finishing sequences across all active sequences
          </CardDescription>
        </CardHeader>
        <CardContent>
          {enrollments.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No enrollment activity yet — enroll a contact to see performance here.
            </p>
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="enrolledFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="completedFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--success, 142 71% 45%))" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(var(--success, 142 71% 45%))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    interval={4}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="enrolled"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#enrolledFill)"
                    name="Enrolled"
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    stroke="hsl(var(--success, 142 71% 45%))"
                    strokeWidth={2}
                    fill="url(#completedFill)"
                    name="Completed"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Sequence Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Create Email Sequence</DialogTitle>
            <DialogDescription>AI writes the emails — just set the goal</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 mt-2">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">
                Sequence name
              </label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Welcome New Customers"
                autoFocus
                className="h-10"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">
                When should this trigger?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {VALID_TRIGGERS.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setFormTrigger(t.value)}
                    className={`rounded-lg border p-3 text-left transition-all ${
                      formTrigger === t.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <p className="text-sm font-medium text-foreground">{t.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">
                Email steps
              </label>
              <div className="space-y-3">
                {formSteps.map((step, i) => (
                  <div key={i} className="rounded-lg border border-border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                        {i + 1}
                      </span>
                      {formSteps.length > 1 && (
                        <button
                          onClick={() => setFormSteps((s) => s.filter((_, j) => j !== i))}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <Input
                      placeholder="Subject goal — what should the subject achieve?"
                      value={step.subject_prompt}
                      onChange={(e) =>
                        setFormSteps((s) =>
                          s.map((st, j) => (j === i ? { ...st, subject_prompt: e.target.value } : st)),
                        )
                      }
                      className="h-9 text-sm"
                    />
                    <Input
                      placeholder="Email goal — what should this email do?"
                      value={step.body_prompt}
                      onChange={(e) =>
                        setFormSteps((s) =>
                          s.map((st, j) => (j === i ? { ...st, body_prompt: e.target.value } : st)),
                        )
                      }
                      className="h-9 text-sm"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Send after</span>
                      <Input
                        type="number"
                        min={1}
                        value={step.delay_days}
                        onChange={(e) =>
                          setFormSteps((s) =>
                            s.map((st, j) =>
                              j === i ? { ...st, delay_days: parseInt(e.target.value) || 1 } : st,
                            ),
                          )
                        }
                        className="h-8 w-16 text-sm text-center"
                      />
                      <span className="text-xs text-muted-foreground">days</span>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 h-8 text-xs"
                onClick={() =>
                  setFormSteps((s) => [...s, { subject_prompt: "", body_prompt: "", delay_days: 3 }])
                }
              >
                <Plus className="mr-1 h-3 w-3" /> Add Step
              </Button>
              <p className="text-[11px] text-muted-foreground mt-2 italic">
                AI writes the complete email content based on your goals
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || !formName.trim() || !businessId}
              >
                {createMutation.isPending ? (
                  <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Creating...</>
                ) : (
                  "Create Sequence"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enroll Contact Dialog */}
      <Dialog open={enrollOpen} onOpenChange={setEnrollOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Enroll a contact</DialogTitle>
            <DialogDescription>
              Adds this contact to “{selectedSequence?.name || "the selected sequence"}”
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Email</label>
              <Input
                type="email"
                value={enrollEmail}
                onChange={(e) => setEnrollEmail(e.target.value)}
                placeholder="contact@example.com"
                autoFocus
                className="h-10"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">
                Name (optional)
              </label>
              <Input
                value={enrollName}
                onChange={(e) => setEnrollName(e.target.value)}
                placeholder="Jane Doe"
                className="h-10"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEnrollOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => enrollMutation.mutate()}
                disabled={
                  enrollMutation.isPending ||
                  !enrollEmail.trim() ||
                  !selectedSequence?.id ||
                  !businessId
                }
              >
                {enrollMutation.isPending ? (
                  <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Enrolling...</>
                ) : (
                  <><UserPlus className="mr-1.5 h-3.5 w-3.5" /> Enroll</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
