import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { externalSupabase } from "@/integrations/supabase/external-client";
import * as api from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Send, MousePointerClick, Loader2, Plus, Users, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/lib/errorMessages";

interface EmailSequence {
  id: string; name: string; trigger?: string; status: string;
  emails_sent: number; open_rate: number; created_at: string;
}

interface EmailStats { email_sent: number; email_opens: number; email_clicks: number; }

const triggerBadge: Record<string, { bg: string; text: string; label: string; desc: string }> = {
  signup: { bg: "bg-primary/10", text: "text-primary", label: "🎉 On Signup", desc: "When someone creates an account" },
  link_click: { bg: "bg-purple-500/10", text: "text-purple-500", label: "🖱️ On Click", desc: "When someone clicks an email link" },
  no_open_7d: { bg: "bg-warning/10", text: "text-warning", label: "💤 Re-engagement", desc: "7 days without opening email" },
  purchase: { bg: "bg-success/10", text: "text-success", label: "🛒 Post Purchase", desc: "After a customer buys" },
};

const safePercent = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n.toFixed(1) + "%" : "—"; };

interface EmailStep { subject_prompt: string; body_prompt: string; delay_days: number; }

export default function DashboardEmail() {
  const { businessId, user, isReady } = useAuth();
  const [sequences, setSequences] = useState<EmailSequence[]>([]);
  const [stats, setStats] = useState<EmailStats>({ email_sent: 0, email_opens: 0, email_clicks: 0 });
  const [activeEnrollments, setActiveEnrollments] = useState(0);
  const [loading, setLoading] = useState(true);

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formTrigger, setFormTrigger] = useState("signup");
  const [formSteps, setFormSteps] = useState<EmailStep[]>([{ subject_prompt: "", body_prompt: "", delay_days: 1 }]);
  const [creating, setCreating] = useState(false);

  const fetchData = useCallback(async () => {
    if (!businessId) return;
    try {
      const res = await api.getAnalytics({
        business_id: businessId,
        user_id: user?.id ?? "", // server expects user_id — this is auth.user.id = businesses.id
      });
      const d = res as { email_sent?: number; email_opens?: number; email_clicks?: number };
      setStats({ email_sent: d?.email_sent ?? 0, email_opens: d?.email_opens ?? 0, email_clicks: d?.email_clicks ?? 0 });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      toast.error(ERROR_MESSAGES.LOAD_FAILED);
    }
    try {
      const { count } = await externalSupabase.from("contact_enrollments").select("id", { count: "exact", head: true }).eq("business_id", businessId).eq("status", "active");
      setActiveEnrollments(count ?? 0);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      toast.error(ERROR_MESSAGES.LOAD_FAILED);
    }
    try {
      const { data } = await externalSupabase.from("email_sequences").select("*").eq("business_id", businessId).order("created_at", { ascending: false });
      setSequences((data ?? []) as EmailSequence[]);
    } catch { toast.error(ERROR_MESSAGES.GENERATION_FAILED); }
  }, [businessId, user?.id]);

  useEffect(() => {
    if (!businessId || !isReady) { setLoading(false); return; }
    (async () => { setLoading(true); await fetchData(); setLoading(false); })();
  }, [businessId, fetchData, isReady]);

  const handleCreate = async () => {
    if (!businessId || !formName.trim()) return;
    setCreating(true);
    try {
      await api.emailSequenceCreate({
        business_id: businessId,
        user_id: user?.id ?? "", // server expects user_id — this is auth.user.id = businesses.id
        name: formName, trigger: formTrigger,
        delay_hours: formSteps[0]?.delay_days * 24 || 24,
        emails: formSteps.map(s => ({ subject_prompt: s.subject_prompt, body_prompt: s.body_prompt, delay_hours: s.delay_days * 24 })),
      });
      toast.success(SUCCESS_MESSAGES.GENERATED);
      setCreateOpen(false);
      setFormName(""); setFormTrigger("signup"); setFormSteps([{ subject_prompt: "", body_prompt: "", delay_days: 1 }]);
      await fetchData();
    } catch { toast.error(ERROR_MESSAGES.GENERATION_FAILED); }
    finally { setCreating(false); }
  };

  const openRate = stats.email_sent > 0 ? safePercent((stats.email_opens / stats.email_sent) * 100) : "—";
  const clickRate = stats.email_sent > 0 ? safePercent((stats.email_clicks / stats.email_sent) * 100) : "—";

  if (loading) return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{[1, 2, 3, 4].map(i => <div key={i} className="h-20 rounded-lg skeleton" />)}</div>
      {[1, 2].map(i => <div key={i} className="h-24 rounded-lg skeleton" />)}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Emails Sent", value: stats.email_sent.toLocaleString(), icon: Send, color: "text-primary" },
          { label: "Open Rate", value: openRate, icon: Mail, color: "text-success" },
          { label: "Click Rate", value: clickRate, icon: MousePointerClick, color: "text-warning" },
          { label: "Active Enrollments", value: activeEnrollments.toLocaleString(), icon: Users, color: "text-purple-500" },
        ].map(s => (
          <div key={s.label} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-muted-foreground font-medium">{s.label}</p>
                <p className="text-xl font-bold text-foreground mt-1">{s.value}</p>
              </div>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-end">
        <Button size="sm" className="h-9 text-xs" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Create Sequence
        </Button>
      </div>

      {/* Sequences list */}
      {sequences.length === 0 ? (
        <div className="rounded-lg border border-border bg-card py-10 px-6 text-center">
          <Mail className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <h3 className="mt-4 text-sm font-semibold text-foreground">Email sequences run automatically</h3>
          <p className="mt-1.5 text-xs text-muted-foreground max-w-xs mx-auto">Create a sequence to nurture leads. AI writes personalized emails based on behavior.</p>
          <Button size="sm" className="mt-4" onClick={() => setCreateOpen(true)}>Create First Sequence</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {sequences.map(seq => {
            const isActive = seq.status === "active";
            const badge = triggerBadge[seq.trigger || ""] || triggerBadge.signup;
            return (
              <div key={seq.id} className="rounded-lg border border-border bg-card p-5 transition-shadow hover:shadow-md">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h4 className="text-sm font-semibold text-foreground">{seq.name || "Untitled"}</h4>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${isActive ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-success" : "bg-muted-foreground"}`} />{isActive ? "Active" : "Paused"}
                  </span>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${badge.bg} ${badge.text}`}>{badge.label}</span>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs text-muted-foreground"><span className="font-medium text-foreground">{seq.emails_sent ?? 0}</span> emails</span>
                  <span className="text-xs text-muted-foreground"><span className="font-medium text-foreground">{seq.open_rate != null ? safePercent(Number(seq.open_rate) * 100) : "—"}</span> opens</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Sequence Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Create Email Sequence</DialogTitle>
            <DialogDescription>AI writes the emails — just set the goal</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 mt-2">
            {/* Name */}
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Sequence name</label>
              <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Welcome New Customers" autoFocus className="h-10" />
            </div>

            {/* Trigger */}
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">When should this trigger?</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(triggerBadge).map(([key, val]) => (
                  <button key={key} onClick={() => setFormTrigger(key)}
                    className={`rounded-lg border p-3 text-left transition-all ${formTrigger === key ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                    <p className="text-sm font-medium text-foreground">{val.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{val.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Steps */}
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Email steps</label>
              <div className="space-y-3">
                {formSteps.map((step, i) => (
                  <div key={i} className="rounded-lg border border-border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">{i + 1}</span>
                      {formSteps.length > 1 && <button onClick={() => setFormSteps(s => s.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>}
                    </div>
                    <Input placeholder="Subject goal — what should subject achieve?" value={step.subject_prompt} onChange={e => setFormSteps(s => s.map((st, j) => j === i ? { ...st, subject_prompt: e.target.value } : st))} className="h-9 text-sm" />
                    <Input placeholder="Email goal — what should this email do?" value={step.body_prompt} onChange={e => setFormSteps(s => s.map((st, j) => j === i ? { ...st, body_prompt: e.target.value } : st))} className="h-9 text-sm" />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Send after</span>
                      <Input type="number" min={1} value={step.delay_days} onChange={e => setFormSteps(s => s.map((st, j) => j === i ? { ...st, delay_days: parseInt(e.target.value) || 1 } : st))} className="h-8 w-16 text-sm text-center" />
                      <span className="text-xs text-muted-foreground">days</span>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="mt-2 h-8 text-xs" onClick={() => setFormSteps(s => [...s, { subject_prompt: "", body_prompt: "", delay_days: 3 }])}>
                <Plus className="mr-1 h-3 w-3" /> Add Step
              </Button>
              <p className="text-[11px] text-muted-foreground mt-2 italic">AI writes the complete email content based on your goals</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={creating || !formName.trim()}>
                {creating ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Creating...</> : "Create Sequence"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
