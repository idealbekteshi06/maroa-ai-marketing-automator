/**
 * Budget & ROI Optimizer (WF14) + Forecasting
 * ============================================================================
 * Wired to real backend:
 *   - wf14GetLatest  → GET  /webhook/wf14-latest   (latest budget_optimizer_runs row)
 *   - wf14Run        → POST /webhook/wf14-run      (runs the Opus optimizer, then refetch)
 *   - forecastGenerate → POST /webhook/forecast    (canonical forecasting engine, sync)
 * ============================================================================
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  TrendingUp, TrendingDown, PieChart as PieChartIcon,
  Lightbulb, Target, Zap, BarChart3, Wallet, Calculator,
  Loader2, Info, Minus,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { wf14GetLatest, wf14Run, forecastGenerate } from "@/lib/api";

/* ── Response shapes (mirrors services/wf14 + services/forecasting) ── */

interface Wf14Channel {
  channel?: string;
  spend_current_monthly?: number;
  marginal_roas?: number;
  ltv_cac_ratio?: number;
  cac_payback_months?: number;
  trend_wow?: string; // "up" | "flat" | "down"
  recommendation?: string; // "increase" | "hold" | "decrease" | "pause"
  new_spend_monthly?: number;
  rationale?: string;
}

interface Wf14Move {
  from?: string;
  to?: string;
  amount_usd_monthly?: number;
}

interface Wf14Run {
  id?: string;
  month_start?: string;
  blended_roas?: number;
  blended_cac?: number;
  ltv_cac_ratio?: number;
  per_channel?: Wf14Channel[];
  reallocation_moves?: Wf14Move[];
  total_spend_change_usd?: number;
  projected_blended_roas?: number;
  confidence?: string; // "low" | "medium" | "high"
  model_used?: string;
  status?: string;
  created_at?: string;
}

interface ForecastBand {
  low?: number;
  mid?: number;
  high?: number;
  confidence?: string;
  r2?: number;
}

interface ForecastResult {
  horizon_days?: number;
  roas_forecast?: ForecastBand | null;
  spend_forecast?: ForecastBand | null;
  revenue_forecast?: ForecastBand | null;
  ltv_forecast?: {
    value?: number;
    currency?: string;
    repeat_rate?: number;
    confidence?: string;
    sample_size?: number;
  } | null;
  budget_allocation_recommendation?: {
    current?: Record<string, number>;
    recommended?: Record<string, number>;
    expected_lift_pct?: number | null;
  } | null;
  data_quality?: string; // "good" | "limited" | "insufficient"
  sample_size_days?: number;
  currency?: string;
  narrative?: string;
  caveats?: string[];
  short_circuited?: boolean;
  short_circuit_reason?: string | null;
}

/* ── Helpers ── */

const CHANNEL_COLORS: Record<string, string> = {
  meta: "#3b82f6",
  facebook: "#3b82f6",
  google: "#f59e0b",
  email: "#10b981",
  organic: "#14b8a6",
  tiktok: "#ec4899",
  linkedin: "#0ea5e9",
};
const FALLBACK_COLORS = ["#8b5cf6", "#f97316", "#22c55e", "#eab308", "#06b6d4"];

function channelColor(name: string | undefined, index: number): string {
  const key = (name ?? "").toLowerCase();
  return CHANNEL_COLORS[key] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

function channelLabel(name?: string): string {
  if (!name) return "Unknown";
  const map: Record<string, string> = {
    meta: "Meta Ads",
    facebook: "Meta Ads",
    google: "Google Ads",
    email: "Email Marketing",
    organic: "Organic",
    tiktok: "TikTok Ads",
    linkedin: "LinkedIn Ads",
  };
  return map[name.toLowerCase()] ?? name.charAt(0).toUpperCase() + name.slice(1);
}

function fmtMoney(n?: number | null, currency = "USD"): string {
  if (n == null || !Number.isFinite(Number(n))) return "—";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(Number(n));
  } catch {
    return `$${Number(n).toLocaleString()}`;
  }
}

function fmtRoas(n?: number | null): string {
  if (n == null || !Number.isFinite(Number(n))) return "—";
  return `${Number(n).toFixed(2)}x`;
}

const REC_BADGE: Record<string, string> = {
  increase: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30",
  hold: "bg-muted text-muted-foreground border-border",
  decrease: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
  pause: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
};

function TrendIcon({ trend }: { trend?: string }) {
  if (trend === "up") return <TrendingUp className="h-4 w-4 text-green-500" />;
  if (trend === "down") return <TrendingDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

const HORIZONS = [30, 60, 90] as const;

/* ── Page ── */

export default function BudgetROI() {
  const { businessId } = useAuth();
  const qc = useQueryClient();
  const [horizon, setHorizon] = useState<(typeof HORIZONS)[number]>(30);
  const [forecast, setForecast] = useState<ForecastResult | null>(null);

  const latestQuery = useQuery({
    queryKey: ["wf14", "latest", businessId],
    queryFn: async () =>
      (await wf14GetLatest({ business_id: businessId! })) as Wf14Run | null,
    enabled: !!businessId,
    retry: false,
  });

  const latest = latestQuery.data ?? null;

  const runOptimizer = useMutation({
    mutationFn: () => wf14Run({ businessId: businessId!, force: !!latest }),
    onSuccess: () => {
      toast.success("Budget optimizer run complete");
      qc.invalidateQueries({ queryKey: ["wf14", "latest", businessId] });
    },
    onError: (e: Error) => toast.error(e.message || "Optimizer run failed"),
  });

  const runForecast = useMutation({
    mutationFn: async () =>
      (await forecastGenerate({
        businessId: businessId!,
        horizonDays: horizon,
      })) as ForecastResult,
    onSuccess: (d) => {
      setForecast(d ?? null);
      if (d?.short_circuited) {
        toast.info("Not enough history to forecast yet");
      } else {
        toast.success(`Forecast generated (${d?.horizon_days ?? horizon} days)`);
      }
    },
    onError: (e: Error) => toast.error(e.message || "Forecast failed"),
  });

  const channels = latest?.per_channel ?? [];
  const totalSpend = channels.reduce(
    (s, c) => s + (Number(c?.spend_current_monthly) || 0),
    0,
  );
  const totalNewSpend = channels.reduce(
    (s, c) => s + (Number(c?.new_spend_monthly) || 0),
    0,
  );
  const donutData = channels.map((c) => ({
    name: channelLabel(c?.channel),
    value: Number(c?.spend_current_monthly) || 0,
  }));
  const moves = latest?.reallocation_moves ?? [];

  /* ── Loading skeleton ── */
  if (latestQuery.isLoading) {
    return (
      <div className="space-y-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="pt-5 pb-4 space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-3 w-40" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-[280px] rounded-lg" />
          <Skeleton className="h-[280px] rounded-lg" />
        </div>
        <Skeleton className="h-[220px] rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Budget &amp; ROI
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {latest?.month_start
              ? `Latest optimization: ${new Date(latest.month_start).toLocaleDateString(undefined, { year: "numeric", month: "long" })}`
              : "AI-driven budget allocation across your ad channels"}
            {latest?.status ? ` · ${latest.status.replace(/_/g, " ")}` : ""}
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => runOptimizer.mutate()}
          disabled={runOptimizer.isPending || !businessId}
          className="gap-1.5"
        >
          {runOptimizer.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Zap className="h-4 w-4" />
          )}
          {runOptimizer.isPending ? "Optimizing…" : "Run optimizer"}
        </Button>
      </div>

      {latestQuery.isError && (
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertTitle>Could not load optimization data</AlertTitle>
          <AlertDescription className="text-sm">
            {(latestQuery.error as Error)?.message || "Unknown error"}
          </AlertDescription>
        </Alert>
      )}

      {/* ── Empty state ── */}
      {!latestQuery.isError && !latest && (
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-sm font-medium text-foreground">
              No optimization run yet
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              Run the budget optimizer to analyze your last 30 days of ad
              performance and get a channel-by-channel reallocation plan.
            </p>
            <Button
              size="sm"
              className="mt-4 gap-1.5"
              onClick={() => runOptimizer.mutate()}
              disabled={runOptimizer.isPending || !businessId}
            >
              {runOptimizer.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              Run optimizer
            </Button>
          </CardContent>
        </Card>
      )}

      {latest && (
        <>
          {/* ── Hero ── */}
          <section className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Monthly Spend
                  </span>
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {fmtMoney(totalSpend)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {totalNewSpend > 0
                    ? `Recommended: ${fmtMoney(totalNewSpend)} after rebalance`
                    : `Across ${channels.length} channel${channels.length === 1 ? "" : "s"}`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Blended ROAS
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-foreground">
                    {fmtRoas(latest?.blended_roas)}
                  </p>
                  {Number(latest?.projected_blended_roas) > 0 && (
                    <Badge
                      className="bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30"
                      variant="outline"
                    >
                      {fmtRoas(latest?.projected_blended_roas)} projected
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Confidence: {latest?.confidence ?? "unknown"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Blended CAC
                  </span>
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {latest?.blended_cac != null
                    ? fmtMoney(latest.blended_cac)
                    : "—"}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {Number(latest?.ltv_cac_ratio) > 0
                    ? `LTV:CAC ratio ${Number(latest?.ltv_cac_ratio).toFixed(1)}`
                    : "LTV:CAC not yet available"}
                </p>
              </CardContent>
            </Card>
          </section>

          {/* ── Channel Allocation Donut + Forecast panel ── */}
          <section className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4 text-primary" />
                  Channel Allocation
                </CardTitle>
                <CardDescription>
                  How your {fmtMoney(totalSpend)} monthly spend is distributed
                </CardDescription>
              </CardHeader>
              <CardContent>
                {channels.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No channel data in the latest run.
                  </p>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="w-[180px] h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={donutData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {channels.map((c, i) => (
                              <Cell key={i} fill={channelColor(c?.channel, i)} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number) => fmtMoney(value)}
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                              color: "hsl(var(--foreground))",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2 flex-1">
                      {channels.map((c, i) => {
                        const spend = Number(c?.spend_current_monthly) || 0;
                        const pct = totalSpend
                          ? Math.round((spend / totalSpend) * 100)
                          : 0;
                        return (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: channelColor(c?.channel, i) }}
                            />
                            <span className="text-foreground flex-1">
                              {channelLabel(c?.channel)}
                            </span>
                            <span className="text-muted-foreground font-medium">
                              {fmtMoney(spend)} ({pct}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <ForecastPanel
              horizon={horizon}
              setHorizon={setHorizon}
              forecast={forecast}
              isPending={runForecast.isPending}
              onGenerate={() => runForecast.mutate()}
              disabled={!businessId}
            />
          </section>

          {/* ── Channel Breakdown Table ── */}
          <section>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  Channel Breakdown
                </CardTitle>
                <CardDescription>
                  Per-channel diagnostics from the latest optimizer run
                  {latest?.model_used ? ` (${latest.model_used})` : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {channels.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No channel breakdown available yet.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Channel</TableHead>
                        <TableHead className="text-right">Current Spend</TableHead>
                        <TableHead className="text-right">Marginal ROAS</TableHead>
                        <TableHead className="text-right">LTV:CAC</TableHead>
                        <TableHead className="text-right">Trend (WoW)</TableHead>
                        <TableHead className="text-right">Recommendation</TableHead>
                        <TableHead className="text-right">New Spend</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {channels.map((c, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: channelColor(c?.channel, i) }}
                              />
                              <div>
                                {channelLabel(c?.channel)}
                                {c?.rationale && (
                                  <p className="max-w-[280px] truncate text-[11px] font-normal text-muted-foreground">
                                    {c.rationale}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {fmtMoney(c?.spend_current_monthly)}
                          </TableCell>
                          <TableCell className="text-right">
                            {fmtRoas(c?.marginal_roas)}
                          </TableCell>
                          <TableCell className="text-right">
                            {c?.ltv_cac_ratio != null &&
                            Number.isFinite(Number(c.ltv_cac_ratio)) ? (
                              <span
                                className={
                                  Number(c.ltv_cac_ratio) < 1.5
                                    ? "text-red-500 font-medium"
                                    : ""
                                }
                              >
                                {Number(c.ltv_cac_ratio).toFixed(1)}
                              </span>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end">
                              <TrendIcon trend={c?.trend_wow} />
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant="outline"
                              className={
                                REC_BADGE[c?.recommendation ?? ""] ??
                                "bg-muted text-muted-foreground border-border"
                              }
                            >
                              {c?.recommendation ?? "—"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {fmtMoney(c?.new_spend_monthly)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </section>

          {/* ── AI Rebalance Recommendation ── */}
          {moves.length > 0 && (
            <section>
              <Alert className="border-primary/30 bg-primary/5">
                <Lightbulb className="h-5 w-5 text-primary" />
                <AlertTitle className="text-foreground font-semibold">
                  AI Rebalance Recommendation
                </AlertTitle>
                <AlertDescription className="text-sm text-muted-foreground mt-1 space-y-2">
                  <ul className="list-disc space-y-1 pl-4">
                    {moves.map((m, i) => (
                      <li key={i}>
                        Move{" "}
                        <strong className="text-foreground">
                          {fmtMoney(m?.amount_usd_monthly)}/mo
                        </strong>{" "}
                        from {channelLabel(m?.from)} to {channelLabel(m?.to)}
                      </li>
                    ))}
                  </ul>
                  <p>
                    Net spend change:{" "}
                    <strong className="text-foreground">
                      {fmtMoney(latest?.total_spend_change_usd)}/mo
                    </strong>
                    {Number(latest?.projected_blended_roas) > 0 && (
                      <>
                        {" "}
                        · projected blended ROAS{" "}
                        <strong className="text-foreground">
                          {fmtRoas(latest?.projected_blended_roas)}
                        </strong>{" "}
                        next month
                      </>
                    )}
                    {" "}· confidence {latest?.confidence ?? "unknown"}
                  </p>
                </AlertDescription>
              </Alert>
            </section>
          )}
        </>
      )}
    </div>
  );
}

/* ── Forecast panel ── */

function ForecastPanel({
  horizon,
  setHorizon,
  forecast,
  isPending,
  onGenerate,
  disabled,
}: {
  horizon: (typeof HORIZONS)[number];
  setHorizon: (h: (typeof HORIZONS)[number]) => void;
  forecast: ForecastResult | null;
  isPending: boolean;
  onGenerate: () => void;
  disabled: boolean;
}) {
  const currency = forecast?.currency || "USD";
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Performance Forecast
            </CardTitle>
            <CardDescription>
              ROAS, spend &amp; revenue projections from your ad history
            </CardDescription>
          </div>
          <div className="flex rounded-md border border-border">
            {HORIZONS.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setHorizon(h)}
                className={`px-2.5 py-1 text-xs font-medium transition-colors first:rounded-l-md last:rounded-r-md ${
                  horizon === h
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {h}d
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {!forecast && !isPending && (
          <div className="rounded border border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No forecast generated yet.
            </p>
            <Button
              size="sm"
              className="mt-3 gap-1.5"
              onClick={onGenerate}
              disabled={disabled}
            >
              <TrendingUp className="h-4 w-4" />
              Generate {horizon}-day forecast
            </Button>
          </div>
        )}

        {isPending && (
          <div className="space-y-2 py-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        )}

        {forecast && !isPending && forecast.short_circuited && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Not enough data to forecast yet</AlertTitle>
            <AlertDescription className="text-sm">
              {forecast.short_circuit_reason ||
                "We need at least 14 days of ad performance history before forecasting."}
              {forecast.sample_size_days != null && (
                <> You currently have {forecast.sample_size_days} day
                {forecast.sample_size_days === 1 ? "" : "s"} of history — check
                back soon.</>
              )}
            </AlertDescription>
          </Alert>
        )}

        {forecast && !isPending && !forecast.short_circuited && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <ForecastStat
                label="ROAS"
                value={fmtRoas(forecast.roas_forecast?.mid)}
                sub={`${fmtRoas(forecast.roas_forecast?.low)} – ${fmtRoas(forecast.roas_forecast?.high)}`}
              />
              <ForecastStat
                label="Spend"
                value={fmtMoney(forecast.spend_forecast?.mid, currency)}
                sub={`${fmtMoney(forecast.spend_forecast?.low, currency)} – ${fmtMoney(forecast.spend_forecast?.high, currency)}`}
              />
              <ForecastStat
                label="Revenue"
                value={fmtMoney(forecast.revenue_forecast?.mid, currency)}
                sub={`${fmtMoney(forecast.revenue_forecast?.low, currency)} – ${fmtMoney(forecast.revenue_forecast?.high, currency)}`}
              />
            </div>

            {forecast.narrative && (
              <p className="text-sm text-muted-foreground">{forecast.narrative}</p>
            )}

            {(forecast.caveats?.length ?? 0) > 0 && (
              <ul className="space-y-0.5 text-[11px] text-muted-foreground">
                {forecast.caveats?.map((c, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <Info className="mt-0.5 h-3 w-3 shrink-0" />
                    {c}
                  </li>
                ))}
              </ul>
            )}

            <div className="flex items-center justify-between pt-1">
              <p className="text-[11px] text-muted-foreground">
                {forecast.horizon_days ?? horizon}-day horizon · data quality:{" "}
                {forecast.data_quality ?? "unknown"} ·{" "}
                {forecast.sample_size_days ?? 0} days of history
              </p>
              <Button size="sm" variant="outline" onClick={onGenerate} disabled={disabled}>
                Regenerate
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ForecastStat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded border border-border p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
        {value}
      </p>
      <p className="text-[10px] text-muted-foreground">{sub}</p>
    </div>
  );
}
