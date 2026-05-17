import { useCallback, useEffect, useMemo, useState } from "react";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, DollarSign, Target, Zap, PauseCircle, PlayCircle,
  Lightbulb, BarChart3, Loader2, RefreshCw, Megaphone,
} from "lucide-react";
import { toast } from "sonner";
import {
  metaCampaignActivate, metaCampaignOptimize, adOptimizerAuditCampaign,
} from "@/lib/api";

interface Campaign {
  id: string;
  campaign_name: string | null;
  business_name: string | null;
  meta_campaign_id: string | null;
  status: string;
  daily_budget: number;
  objective: string | null;
  last_decision: string | null;
  last_decision_reason: string | null;
  last_optimized_at: string | null;
}

interface PerfRow {
  campaign_id: string | null;
  spend: number;
  clicks: number;
  impressions: number;
  ctr: number;
  roas: number;
  cpc: number;
  conversions: number;
  logged_at: string;
}

interface AuditRow {
  id: string;
  campaign_id: string;
  audited_at: string;
  decision: string;
  decision_reason: string | null;
  new_daily_budget: number | null;
  audit_score: number | null;
  opportunities: unknown;
  warnings: unknown;
}

const safeNum = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const fmtUsd = (n: number, digits = 0): string =>
  `$${n.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;

const statusPill = (s: string) => {
  if (s === "active") return { label: "Active", cls: "bg-success/10 text-success", Icon: PlayCircle };
  if (s === "paused") return { label: "Paused", cls: "bg-muted text-muted-foreground", Icon: PauseCircle };
  if (s === "failed") return { label: "Failed", cls: "bg-destructive/10 text-destructive", Icon: PauseCircle };
  return { label: "Draft", cls: "bg-warning/10 text-warning", Icon: PauseCircle };
};

export default function AdOptimization() {
  const { businessId, isReady } = useAuth();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [perfLogs, setPerfLogs] = useState<PerfRow[]>([]);
  const [audits, setAudits] = useState<AuditRow[]>([]);
  const [pending, setPending] = useState<Record<string, "activate" | "pause" | "optimize" | "audit">>({});

  const fetchAll = useCallback(async () => {
    if (!businessId) { setLoading(false); return; }
    setLoading(true);
    try {
      const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
      const [{ data: camps }, { data: perf }, { data: audit }] = await Promise.all([
        externalSupabase
          .from("ad_campaigns")
          .select("id, campaign_name, business_name, meta_campaign_id, status, daily_budget, objective, last_decision, last_decision_reason, last_optimized_at")
          .eq("business_id", businessId)
          .order("last_optimized_at", { ascending: false }),
        externalSupabase
          .from("ad_performance_logs")
          .select("campaign_id, spend, clicks, impressions, ctr, roas, cpc, conversions, logged_at")
          .eq("business_id", businessId)
          .gte("logged_at", since)
          .order("logged_at", { ascending: true }),
        externalSupabase
          .from("ad_audit_results")
          .select("id, campaign_id, audited_at, decision, decision_reason, new_daily_budget, audit_score, opportunities, warnings")
          .eq("business_id", businessId)
          .order("audited_at", { ascending: false })
          .limit(20),
      ]);
      setCampaigns((camps ?? []) as Campaign[]);
      setPerfLogs((perf ?? []) as PerfRow[]);
      setAudits((audit ?? []) as AuditRow[]);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    if (!isReady) return;
    void fetchAll();
  }, [isReady, fetchAll]);

  /* ── Derived: 7-day KPI deltas + 30-day chart series ── */
  const summary = useMemo(() => {
    const now = Date.now();
    const day7 = now - 7 * 86_400_000;
    const day14 = now - 14 * 86_400_000;
    const last7 = perfLogs.filter(p => new Date(p.logged_at).getTime() >= day7);
    const prev7 = perfLogs.filter(p => {
      const t = new Date(p.logged_at).getTime();
      return t >= day14 && t < day7;
    });
    const sum = (rows: PerfRow[], key: keyof PerfRow) =>
      rows.reduce((acc, r) => acc + safeNum(r[key]), 0);
    const avg = (rows: PerfRow[], key: keyof PerfRow) =>
      rows.length ? sum(rows, key) / rows.length : 0;
    const pct = (a: number, b: number) => (b > 0 ? ((a - b) / b) * 100 : 0);

    return {
      spend: sum(last7, "spend"),
      spendDelta: pct(sum(last7, "spend"), sum(prev7, "spend")),
      roas: avg(last7, "roas"),
      roasDelta: avg(last7, "roas") - avg(prev7, "roas"),
      cpc: avg(last7, "cpc"),
      cpcDelta: pct(avg(last7, "cpc"), avg(prev7, "cpc")),
      conversions: sum(last7, "conversions"),
      conversionsDelta: sum(last7, "conversions") - sum(prev7, "conversions"),
    };
  }, [perfLogs]);

  const chartData = useMemo(() => {
    const byDay = new Map<string, { day: string; spend: number; conversions: number }>();
    perfLogs.forEach(p => {
      const d = new Date(p.logged_at);
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      const cur = byDay.get(key) || { day: key, spend: 0, conversions: 0 };
      cur.spend += safeNum(p.spend);
      cur.conversions += safeNum(p.conversions);
      byDay.set(key, cur);
    });
    return Array.from(byDay.values());
  }, [perfLogs]);

  const latestAuditByCampaign = useMemo(() => {
    const m = new Map<string, AuditRow>();
    audits.forEach(a => { if (!m.has(a.campaign_id)) m.set(a.campaign_id, a); });
    return m;
  }, [audits]);

  const opportunities = useMemo(() => {
    return audits.flatMap(a => {
      const ops = Array.isArray(a.opportunities) ? (a.opportunities as unknown[]) : [];
      return ops.slice(0, 3).map((op, idx) => ({
        key: `${a.id}-${idx}`,
        campaignId: a.campaign_id,
        decision: a.decision,
        text: typeof op === "string" ? op : (op as { text?: string; title?: string })?.text
          ?? (op as { title?: string })?.title ?? JSON.stringify(op),
      }));
    }).slice(0, 6);
  }, [audits]);

  const perfByCampaign = useMemo(() => {
    const m = new Map<string, PerfRow>();
    perfLogs.forEach(p => {
      if (!p.campaign_id) return;
      const cur = m.get(p.campaign_id);
      if (!cur || new Date(p.logged_at) > new Date(cur.logged_at)) m.set(p.campaign_id, p);
    });
    return m;
  }, [perfLogs]);

  const handleActivate = async (c: Campaign) => {
    if (!businessId || !c.meta_campaign_id) return;
    setPending(p => ({ ...p, [c.id]: "activate" }));
    try {
      await metaCampaignActivate({
        campaign_id: c.id,
        meta_campaign_id: c.meta_campaign_id,
        business_id: businessId,
      });
      toast.success(`Activated ${c.campaign_name ?? "campaign"}`);
      await fetchAll();
    } catch (err) {
      toast.error("Couldn't activate", { description: (err as Error).message });
    } finally {
      setPending(p => { const n = { ...p }; delete n[c.id]; return n; });
    }
  };

  const handleOptimize = async (c: Campaign) => {
    if (!businessId) return;
    setPending(p => ({ ...p, [c.id]: "optimize" }));
    try {
      await metaCampaignOptimize({ campaign_id: c.id, business_id: businessId });
      toast.success("Optimization queued");
      await fetchAll();
    } catch (err) {
      toast.error("Couldn't optimize", { description: (err as Error).message });
    } finally {
      setPending(p => { const n = { ...p }; delete n[c.id]; return n; });
    }
  };

  const handleReAudit = async (c: Campaign) => {
    if (!businessId) return;
    setPending(p => ({ ...p, [c.id]: "audit" }));
    try {
      await adOptimizerAuditCampaign({ campaign_id: c.id, business_id: businessId });
      toast.success("Re-audit complete");
      await fetchAll();
    } catch (err) {
      toast.error("Re-audit failed", { description: (err as Error).message });
    } finally {
      setPending(p => { const n = { ...p }; delete n[c.id]; return n; });
    }
  };

  /* ── Render states ── */
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="rounded-full bg-muted p-3">
            <Megaphone className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No ad campaigns yet</h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            Once your Meta or Google ad account is connected and the first
            campaign goes live, optimization decisions, spend, and ROAS will
            appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const openOpportunities = opportunities.length;

  return (
    <div className="space-y-6">
      {/* Hero — AI Ad Brain status */}
      <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="flex flex-col gap-4 pt-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Lightbulb className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">AI Ad Brain</h2>
              <p className="max-w-lg text-sm text-muted-foreground">
                {openOpportunities > 0
                  ? <>
                      <span className="font-medium text-primary">{openOpportunities}</span>{" "}
                      optimization opportunit{openOpportunities === 1 ? "y" : "ies"} surfaced from
                      the last {audits.length} audit{audits.length === 1 ? "" : "s"}.
                    </>
                  : <>No new opportunities detected in the latest audit run. The brain
                      re-audits every 24h.</>}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => void fetchAll()} className="shrink-0">
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </CardContent>
      </Card>

      {/* KPI Grid — real 7d vs prior-7d */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Spend · 7d"
          value={fmtUsd(summary.spend)}
          delta={summary.spendDelta}
          deltaSuffix="% vs prev 7d"
          icon={DollarSign}
          higherIsBetter={false}
        />
        <KpiCard
          label="ROAS · 7d"
          value={`${summary.roas.toFixed(2)}x`}
          delta={summary.roasDelta}
          deltaSuffix="x vs prev"
          icon={TrendingUp}
          higherIsBetter={true}
          isPercent={false}
        />
        <KpiCard
          label="CPC · 7d"
          value={fmtUsd(summary.cpc, 2)}
          delta={summary.cpcDelta}
          deltaSuffix="% vs prev"
          icon={Target}
          higherIsBetter={false}
        />
        <KpiCard
          label="Conversions · 7d"
          value={summary.conversions.toLocaleString()}
          delta={summary.conversionsDelta}
          deltaSuffix=" vs prev"
          icon={Zap}
          higherIsBetter={true}
          isPercent={false}
        />
      </div>

      {/* Campaign Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" /> Campaigns
          </CardTitle>
          <CardDescription>
            {campaigns.length} campaign{campaigns.length === 1 ? "" : "s"} —
            sorted by most-recently-audited
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Daily budget</TableHead>
                <TableHead className="hidden md:table-cell">Last decision</TableHead>
                <TableHead className="hidden lg:table-cell text-right">CTR</TableHead>
                <TableHead className="hidden lg:table-cell text-right">ROAS</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map(c => {
                const pill = statusPill(c.status);
                const audit = latestAuditByCampaign.get(c.id);
                const perf = perfByCampaign.get(c.id);
                const busy = pending[c.id];
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium max-w-[200px]">
                      <div className="truncate">{c.campaign_name ?? "Untitled"}</div>
                      {c.objective && (
                        <div className="text-[11px] text-muted-foreground truncate">
                          {c.objective}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs ${pill.cls}`}>
                        <pill.Icon className="h-3 w-3" /> {pill.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{fmtUsd(safeNum(c.daily_budget))}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {audit ? (
                        <div className="flex flex-col gap-0.5">
                          <Badge variant="outline" className="w-fit text-[10px] capitalize">
                            {audit.decision.replace(/_/g, " ")}
                          </Badge>
                          {audit.decision_reason && (
                            <span className="text-[11px] text-muted-foreground line-clamp-1 max-w-[220px]">
                              {audit.decision_reason}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-right">
                      {perf ? `${safeNum(perf.ctr).toFixed(2)}%` : "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-right">
                      {perf ? `${safeNum(perf.roas).toFixed(2)}x` : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {c.status === "paused" && c.meta_campaign_id && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => void handleActivate(c)}
                            disabled={!!busy}
                            className="h-7 px-2 text-xs"
                          >
                            {busy === "activate"
                              ? <Loader2 className="h-3 w-3 animate-spin" />
                              : "Activate"}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => void handleOptimize(c)}
                          disabled={!!busy}
                          className="h-7 px-2 text-xs"
                        >
                          {busy === "optimize"
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : "Optimize"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => void handleReAudit(c)}
                          disabled={!!busy}
                          className="h-7 px-2 text-xs"
                          aria-label="Re-audit"
                        >
                          {busy === "audit"
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : <RefreshCw className="h-3 w-3" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Opportunities — surfaced from ad_audit_results.opportunities JSONB */}
      {opportunities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" /> Optimization opportunities
            </CardTitle>
            <CardDescription>
              Surfaced by the daily audit (WF02) — newest first
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {opportunities.map(op => {
              const c = campaigns.find(x => x.id === op.campaignId);
              return (
                <div
                  key={op.key}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">{op.text}</p>
                    {c && (
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {c.campaign_name ?? "Untitled"} · {op.decision.replace(/_/g, " ")}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* 30-day spend vs conversions */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Spend vs conversions — last 30 days</CardTitle>
            <CardDescription>Aggregated across all campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    interval={Math.max(0, Math.floor(chartData.length / 8))}
                  />
                  <YAxis
                    yAxisId="spend"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={v => `$${v}`}
                  />
                  <YAxis
                    yAxisId="conv"
                    orientation="right"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      color: "hsl(var(--foreground))",
                      fontSize: 12,
                    }}
                  />
                  <Line yAxisId="spend" type="monotone" dataKey="spend"
                    stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Spend" />
                  <Line yAxisId="conv" type="monotone" dataKey="conversions"
                    stroke="hsl(var(--success, 142 71% 45%))" strokeWidth={2} dot={false} name="Conversions" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function KpiCard({
  label, value, delta, deltaSuffix, icon: Icon,
  higherIsBetter, isPercent = true,
}: {
  label: string;
  value: string;
  delta: number;
  deltaSuffix: string;
  icon: typeof DollarSign;
  higherIsBetter: boolean;
  isPercent?: boolean;
}) {
  const isUp = delta > 0;
  const isGood = higherIsBetter ? isUp : !isUp;
  const sign = isUp ? "+" : "";
  const display = isPercent
    ? `${sign}${delta.toFixed(1)}${deltaSuffix}`
    : `${sign}${delta.toFixed(2)}${deltaSuffix}`;
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{label}</span>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {delta !== 0 && (
          <p className={`mt-1 text-xs ${isGood ? "text-success" : "text-destructive"}`}>
            {display}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
