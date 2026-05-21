import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiGet, apiPatchJson } from "@/lib/apiClient";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Sparkline from "@/components/Sparkline";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Mail, Send, Clock, Users, BarChart3, Plus, CheckCircle,
  PauseCircle, PlayCircle, ArrowRight, Zap, MousePointerClick,
} from "lucide-react";

interface SequenceEmail {
  subject: string;
  delay: string;
}

interface Sequence {
  id: string;
  name: string;
  emails: number;
  openRate: number;
  active: boolean;
  status: string;
  steps: SequenceEmail[];
}

interface LifecycleDashboard {
  sequences: Sequence[];
  metrics: {
    active_sequences: number;
    subscribers: number;
    open_rate_pct: number | null;
    click_rate_pct: number | null;
    emails_sent_30d: number;
  };
  chart: Array<{ day: string; opens: number; clicks: number }>;
  has_data: boolean;
}

function SequenceTimeline({ steps }: { steps: SequenceEmail[] }) {
  if (!steps.length) {
    return <p className="text-sm text-muted-foreground py-4">Step copy is generated when the sequence runs.</p>;
  }
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex items-center gap-0 min-w-max px-2 py-4">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full border-2 border-primary bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                {i + 1}
              </div>
              <div className="mt-2 text-center max-w-[140px]">
                <p className="text-xs font-medium text-foreground leading-tight">{step.subject}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{step.delay}</p>
              </div>
            </div>
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

export default function EmailLifecycle() {
  const { businessId, isReady } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [metrics, setMetrics] = useState<LifecycleDashboard["metrics"] | null>(null);
  const [chartData, setChartData] = useState<LifecycleDashboard["chart"]>([]);
  const [toggleState, setToggleState] = useState<Record<string, boolean>>({});
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!businessId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await apiGet<LifecycleDashboard>(`/api/business/${businessId}/email-lifecycle`);
      const seqs = data.sequences || [];
      setSequences(seqs);
      setMetrics(data.metrics);
      setChartData(data.chart || []);
      setToggleState(Object.fromEntries(seqs.map((s) => [s.id, s.active])));
      if (seqs.length && !seqs.find((s) => s.id === selected)) {
        setSelected(seqs[0].id);
      }
    } catch {
      setSequences([]);
      setMetrics(null);
      setChartData([]);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    if (isReady) load();
  }, [isReady, load]);

  const handleToggle = async (seqId: string, checked: boolean) => {
    if (!businessId) return;
    setTogglingId(seqId);
    setToggleState((prev) => ({ ...prev, [seqId]: checked }));
    try {
      await apiPatchJson(`/api/business/${businessId}/email-lifecycle/${seqId}`, { is_active: checked });
      toast.success(checked ? "Sequence activated" : "Sequence paused");
      await load();
    } catch (e) {
      setToggleState((prev) => ({ ...prev, [seqId]: !checked }));
      toast.error(e instanceof Error ? e.message : "Could not update sequence");
    } finally {
      setTogglingId(null);
    }
  };

  const selectedSequence = sequences.find((s) => s.id === selected) || sequences[0];

  const heroMetrics = metrics
    ? [
        {
          label: "Active Sequences",
          value: String(metrics.active_sequences),
          delta: "",
          up: true,
          icon: Zap,
          spark: [metrics.active_sequences],
        },
        {
          label: "Active enrollments",
          value: String(metrics.subscribers),
          delta: "",
          up: true,
          icon: Users,
          spark: [metrics.subscribers],
        },
        {
          label: "Open Rate",
          value: metrics.open_rate_pct != null ? `${metrics.open_rate_pct}%` : "—",
          delta: metrics.emails_sent_30d ? `${metrics.emails_sent_30d} sent` : "No sends yet",
          up: true,
          icon: Mail,
          spark: chartData.map((c) => c.opens),
        },
        {
          label: "Click Rate",
          value: metrics.click_rate_pct != null ? `${metrics.click_rate_pct}%` : "—",
          delta: "",
          up: true,
          icon: MousePointerClick,
          spark: chartData.map((c) => c.clicks),
        },
      ]
    : [];

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading email sequences…
      </div>
    );
  }

  if (!sequences.length) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Mail className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <h3 className="mt-4 text-base font-semibold">Sequences bootstrapping</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            Six lifecycle stages (welcome, nurture, cart recovery, etc.) are created on first visit.
            Refresh if you just finished onboarding.
          </p>
          <Button className="mt-6" variant="outline" onClick={() => load()}>
            Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {metrics && metrics.emails_sent_30d === 0 && (
        <Alert>
          <AlertTitle className="text-sm">Not enough email history yet</AlertTitle>
          <AlertDescription className="text-xs">
            Open and click rates need at least a few sends from retention logs. Enroll contacts or wait for
            the 15-minute lifecycle processor to dispatch due steps.
          </AlertDescription>
        </Alert>
      )}

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
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold text-foreground">{m.value}</p>
                    {m.delta && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {m.delta}
                      </Badge>
                    )}
                  </div>
                  {m.spark.length > 1 && <Sparkline data={m.spark} />}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-foreground">Email Sequences</h3>
          </div>
          {sequences.map((seq) => (
            <Card
              key={seq.id}
              className={`cursor-pointer transition-colors ${
                selected === seq.id ? "border-primary ring-1 ring-primary/30" : ""
              }`}
              onClick={() => setSelected(seq.id)}
            >
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Send className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground text-sm">{seq.name}</span>
                  </div>
                  <Switch
                    checked={toggleState[seq.id]}
                    disabled={togglingId === seq.id}
                    onCheckedChange={(checked) => handleToggle(seq.id, checked)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {seq.emails} emails
                  </span>
                  <Badge variant={toggleState[seq.id] ? "default" : "secondary"} className="text-[10px] ml-auto">
                    {toggleState[seq.id] ? (
                      <>
                        <CheckCircle className="mr-1 h-2.5 w-2.5" /> Live
                      </>
                    ) : (
                      <>
                        <PauseCircle className="mr-1 h-2.5 w-2.5" /> Paused
                      </>
                    )}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" /> {selectedSequence?.name} — cadence
            </CardTitle>
            <CardDescription>{selectedSequence?.emails} steps in this stage</CardDescription>
          </CardHeader>
          <CardContent>
            <SequenceTimeline steps={selectedSequence?.steps || []} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" /> Opens vs clicks
          </CardTitle>
          <CardDescription>From retention_logs (last 30 days with activity)</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length < 2 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Chart appears after your first lifecycle emails are sent.
            </p>
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="opens" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} name="Opens" />
                  <Area type="monotone" dataKey="clicks" stroke="#10b981" fill="#10b981" fillOpacity={0.1} name="Clicks" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
