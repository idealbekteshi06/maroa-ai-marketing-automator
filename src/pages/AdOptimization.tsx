import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  TrendingUp, DollarSign, Target, Zap, PauseCircle, PlayCircle,
  ArrowUpRight, Lightbulb, BarChart3, Loader2, RefreshCw, FlaskConical,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  getMetaCampaigns,
  getGoogleCampaigns,
  adOptimizerAuditCampaign,
  abTestCreate,
  abTestEvaluate,
  abTestsList,
  type AbExperiment,
} from "@/lib/api";

/* ── Backend response shapes ──────────────────────────────────────────
 * GET /webhook/meta-campaigns-get   → { campaigns, creatives, summary }
 * GET /webhook/google-campaigns-get → { campaigns, summary }
 * Rows come straight from the ad_campaigns / ad_creatives tables —
 * every field may be null/missing, so everything is optional + guarded.
 */

interface AdCampaign {
  id?: string;
  business_id?: string;
  business_name?: string | null;
  platform?: string | null; // 'meta' | 'google'
  status?: string | null; // 'active' | 'paused' | 'draft'
  daily_budget?: number | string | null;
  objective?: string | null;
  /** JSONB on live path, JSON *string* on the meta draft path — parse both. */
  ai_strategy?: unknown;
  last_decision?: string | null;
  last_decision_reason?: string | null;
  last_optimized_at?: string | null;
  impressions?: number | string | null;
  clicks?: number | string | null;
  conversions?: number | string | null;
  total_spend?: number | string | null;
  roas?: number | string | null;
  paused_reason?: string | null;
  created_at?: string | null;
}

interface AdCreative {
  id?: string;
  campaign_id?: string | null;
  headline?: string | null;
  status?: string | null;
  is_winner?: boolean | null;
}

interface CampaignsSummary {
  total?: number;
  active?: number;
  paused?: number;
  total_spend?: string; // .toFixed(2) string from the backend
  avg_roas?: string; // .toFixed(2) string from the backend
}

interface MetaCampaignsResponse {
  campaigns?: AdCampaign[];
  creatives?: AdCreative[];
  summary?: CampaignsSummary;
}

interface GoogleCampaignsResponse {
  campaigns?: AdCampaign[];
  summary?: CampaignsSummary;
}

/** POST /webhook/ad-optimizer-audit-campaign response (canonical engine) */
interface AuditResult {
  decision?: string | null;
  decision_reason?: string | null;
  new_daily_budget?: number | null;
  audit_score?: number | null;
  critical_issues?: string[] | null;
  warnings?: string[] | null;
  opportunities?: string[] | null;
  short_circuited?: boolean;
  short_circuit_reason?: string | null;
  action_taken?: string | null;
}

/* ── Helpers ── */

const num = (v: unknown): number => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : 0;
};

const money = (v: number) =>
  `$${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

/** ai_strategy is jsonb on the live path but a JSON string on the draft path. */
function parseStrategy(raw: unknown): Record<string, unknown> | null {
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  }
  return typeof raw === "object" ? (raw as Record<string, unknown>) : null;
}

function campaignName(c: AdCampaign): string {
  const strategy = parseStrategy(c?.ai_strategy);
  const strategyName = strategy?.campaign_name;
  if (typeof strategyName === "string" && strategyName.trim()) return strategyName;
  const parts = [c?.business_name, c?.objective].filter(Boolean);
  if (parts.length) return parts.join(" — ");
  return `${c?.platform === "google" ? "Google" : "Meta"} campaign`;
}

/* ── Component ── */

export default function AdOptimization() {
  const { businessId } = useAuth();
  const qc = useQueryClient();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const metaQuery = useQuery({
    queryKey: ["ad-optimization", "meta", businessId],
    queryFn: () =>
      getMetaCampaigns({ business_id: businessId! }) as Promise<MetaCampaignsResponse>,
    enabled: !!businessId,
    retry: false,
  });

  const googleQuery = useQuery({
    queryKey: ["ad-optimization", "google", businessId],
    queryFn: () =>
      getGoogleCampaigns({ business_id: businessId! }) as Promise<GoogleCampaignsResponse>,
    enabled: !!businessId,
    retry: false,
  });

  const audit = useMutation({
    mutationFn: (campaignId: string) =>
      adOptimizerAuditCampaign({
        businessId: businessId!,
        campaignId,
      }) as Promise<AuditResult>,
    onSuccess: (d) => {
      const decision = d?.decision ?? d?.action_taken ?? "complete";
      toast.success(`Audit complete — ${decision}`, {
        description: d?.decision_reason ?? d?.short_circuit_reason ?? undefined,
      });
      qc.invalidateQueries({ queryKey: ["ad-optimization"] });
    },
    onError: (e: Error) => toast.error(e?.message || "Audit failed"),
  });

  const campaigns = useMemo<AdCampaign[]>(
    () => [
      ...(Array.isArray(metaQuery.data?.campaigns) ? metaQuery.data!.campaigns! : []),
      ...(Array.isArray(googleQuery.data?.campaigns) ? googleQuery.data!.campaigns! : []),
    ],
    [metaQuery.data, googleQuery.data],
  );

  // Aggregate metrics from real campaign rows (no time-series endpoint yet,
  // so these are current totals rather than deltas).
  const totals = useMemo(() => {
    const spend = campaigns.reduce((s, c) => s + num(c?.total_spend), 0);
    const clicks = campaigns.reduce((s, c) => s + num(c?.clicks), 0);
    const impressions = campaigns.reduce((s, c) => s + num(c?.impressions), 0);
    const conversions = campaigns.reduce((s, c) => s + num(c?.conversions), 0);
    const roasRows = campaigns.filter((c) => num(c?.roas) > 0);
    const roas = roasRows.length
      ? roasRows.reduce((s, c) => s + num(c?.roas), 0) / roasRows.length
      : 0;
    return { spend, clicks, impressions, conversions, roas };
  }, [campaigns]);

  // Optimization suggestions come from the canonical ad-optimizer's last
  // recorded decision on each campaign (last_decision + reason).
  const opportunities = useMemo(
    () =>
      campaigns
        .filter(
          (c) =>
            !!c?.id &&
            !!c?.last_decision &&
            String(c.last_decision).toLowerCase() !== "keep" &&
            !dismissed.has(c.id!),
        )
        .map((c) => ({
          id: c.id!,
          title: `${campaignName(c)} — ${c.last_decision}`,
          description: c?.last_decision_reason ?? "No reason recorded.",
          impact: c?.last_decision ?? "",
        })),
    [campaigns, dismissed],
  );

  const isLoading =
    !!businessId && (metaQuery.isLoading || googleQuery.isLoading);
  const loadFailed = metaQuery.isError && googleQuery.isError;

  const metrics = [
    { label: "Total Spend", value: money(totals.spend), icon: DollarSign },
    {
      label: "ROAS",
      value: totals.roas > 0 ? `${totals.roas.toFixed(2)}x` : "—",
      icon: TrendingUp,
    },
    {
      label: "Avg CPC",
      value: totals.clicks > 0 ? money(totals.spend / totals.clicks) : "—",
      icon: Target,
    },
    { label: "Conversions", value: totals.conversions.toLocaleString(), icon: Zap },
  ];


  // ── Creative A/B experiments (two-proportion z-test engine) ──
  const [abVariantA, setAbVariantA] = useState<string>("");
  const [abVariantB, setAbVariantB] = useState<string>("");
  const abQuery = useQuery({
    queryKey: ["ab-tests", businessId],
    queryFn: () => abTestsList({ business_id: businessId! }),
    enabled: !!businessId,
  });
  const abCreate = useMutation({
    mutationFn: () =>
      abTestCreate({
        businessId: businessId!,
        name: "Creative A/B test",
        variantA: { campaign_id: abVariantA, label: campaigns.find((c) => c.id === abVariantA)?.objective || "A" },
        variantB: { campaign_id: abVariantB, label: campaigns.find((c) => c.id === abVariantB)?.objective || "B" },
      }),
    onSuccess: () => {
      toast.success("Experiment started", { description: "We'll call a winner once both ads have enough data." });
      setAbVariantA("");
      setAbVariantB("");
      qc.invalidateQueries({ queryKey: ["ab-tests", businessId] });
    },
    onError: (e) =>
      toast.error("Couldn't start the experiment", { description: e instanceof Error ? e.message : undefined }),
  });
  const abEvaluate = useMutation({
    mutationFn: (experimentId: string) => abTestEvaluate({ businessId: businessId!, experimentId }),
    onSuccess: (r) => {
      const verdict = r.result?.verdict || r.status;
      if (verdict === "collecting") {
        toast.info("Still collecting data", { description: r.result?.recommendation });
      } else {
        toast.success(`Verdict: ${verdict.replace("_", " ")}`, { description: r.result?.recommendation });
      }
      qc.invalidateQueries({ queryKey: ["ab-tests", businessId] });
    },
    onError: (e) =>
      toast.error("Evaluation failed", { description: e instanceof Error ? e.message : undefined }),
  });
  const abStatusLabel = (x: AbExperiment) =>
    x.status === "winner_a"
      ? `Winner: ${x.variant_a?.label || "A"}`
      : x.status === "winner_b"
        ? `Winner: ${x.variant_b?.label || "B"}`
        : x.status === "no_difference"
          ? "No difference"
          : "Collecting";

  return (
    <div className="space-y-6">
      {/* Hero — AI Ad Brain */}
      <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-6">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Lightbulb className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">AI Ad Brain</h2>
              <p className="text-sm text-muted-foreground max-w-lg">
                {isLoading
                  ? "Loading your campaigns…"
                  : campaigns.length === 0
                    ? "Connect your ad accounts and the optimizer audits every campaign daily."
                    : `${opportunities.length} optimization ${
                        opportunities.length === 1 ? "suggestion" : "suggestions"
                      } across ${campaigns.length} ${
                        campaigns.length === 1 ? "campaign" : "campaigns"
                      }. The optimizer re-audits daily at 08:00 UTC.`}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="shrink-0"
            onClick={() => {
              metaQuery.refetch();
              googleQuery.refetch();
            }}
            disabled={isLoading || metaQuery.isFetching || googleQuery.isFetching}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${
                metaQuery.isFetching || googleQuery.isFetching ? "animate-spin" : ""
              }`}
            />
            Refresh
          </Button>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-5 pb-4">
                  <Skeleton className="h-4 w-24 mb-3" />
                  <Skeleton className="h-8 w-20" />
                </CardContent>
              </Card>
            ))
          : metrics.map((m) => {
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

      {/* Campaign Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" /> Campaigns
          </CardTitle>
          <CardDescription>
            Meta + Google Ads campaigns managed by Maroa
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : loadFailed ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Could not load campaigns. Try refreshing in a moment.
            </p>
          ) : campaigns.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No campaigns yet — connect Meta/Google in Settings to launch your
              first AI-managed campaign.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Spend</TableHead>
                  <TableHead className="hidden md:table-cell">Budget</TableHead>
                  <TableHead className="hidden lg:table-cell text-right">Impressions</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                  <TableHead className="text-right">ROAS</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((c, idx) => {
                  const impressions = num(c?.impressions);
                  const clicks = num(c?.clicks);
                  const spend = num(c?.total_spend);
                  const dailyBudget = num(c?.daily_budget);
                  const monthlyBudget = dailyBudget * 30;
                  const budgetPct =
                    monthlyBudget > 0
                      ? Math.min(100, Math.round((spend / monthlyBudget) * 100))
                      : 0;
                  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
                  const roas = num(c?.roas);
                  const status = c?.status ?? "unknown";
                  const isAuditing =
                    audit.isPending && audit.variables === c?.id;
                  return (
                    <TableRow key={c?.id ?? idx}>
                      <TableCell className="font-medium max-w-[220px]">
                        <span className="block truncate">{campaignName(c)}</span>
                        <span className="text-[11px] uppercase text-muted-foreground">
                          {c?.platform ?? "meta"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={status === "active" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {status === "active" ? (
                            <PlayCircle className="mr-1 h-3 w-3" />
                          ) : (
                            <PauseCircle className="mr-1 h-3 w-3" />
                          )}
                          {status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{money(spend)}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {monthlyBudget > 0 ? (
                          <div className="flex items-center gap-2">
                            <Progress value={budgetPct} className="h-2 w-20" />
                            <span className="text-xs text-muted-foreground">
                              {money(dailyBudget)}/day
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-right">
                        {impressions.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">{clicks.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{ctr.toFixed(2)}%</TableCell>
                      <TableCell className="text-right">
                        {roas > 0 ? `${roas.toFixed(2)}x` : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!c?.id || audit.isPending}
                          onClick={() => c?.id && audit.mutate(c.id)}
                        >
                          {isAuditing ? (
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Zap className="mr-1.5 h-3.5 w-3.5" />
                          )}
                          Run audit
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Optimization Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" /> Optimization Opportunities
          </CardTitle>
          <CardDescription>
            Latest decisions from the AI ad optimizer for each campaign
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : opportunities.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {campaigns.length === 0
                ? "Suggestions appear here once your first campaign is running."
                : "No optimization suggestions right now — run an audit on a campaign above, or wait for the daily 08:00 UTC sweep."}
            </p>
          ) : (
            opportunities.map((o) => (
              <div
                key={o.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-border p-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-foreground">{o.title}</span>
                    <Badge variant="outline" className="text-xs shrink-0">
                      <ArrowUpRight className="mr-1 h-3 w-3" /> {o.impact}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{o.description}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    disabled={audit.isPending}
                    onClick={() => audit.mutate(o.id)}
                  >
                    {audit.isPending && audit.variables === o.id ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : null}
                    Re-audit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setDismissed((prev) => new Set([...prev, o.id]))
                    }
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Creative A/B experiments */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-primary" /> A/B Experiments
          </CardTitle>
          <CardDescription>
            Test two campaigns' creatives scientifically — we run a proper statistical test and only call a
            winner at 95% confidence, instead of eyeballing CTR.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Variant A</p>
              <select
                className="h-8 rounded-md border border-border bg-background px-2 text-xs"
                value={abVariantA}
                onChange={(e) => setAbVariantA(e.target.value)}
              >
                <option value="">Pick a campaign…</option>
                {campaigns.filter((c) => c.id && c.id !== abVariantB).map((c) => (
                  <option key={c.id} value={c.id}>
                    {(c.platform || "ad").toUpperCase()} — {c.objective || c.id!.slice(0, 8)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Variant B</p>
              <select
                className="h-8 rounded-md border border-border bg-background px-2 text-xs"
                value={abVariantB}
                onChange={(e) => setAbVariantB(e.target.value)}
              >
                <option value="">Pick a campaign…</option>
                {campaigns.filter((c) => c.id && c.id !== abVariantA).map((c) => (
                  <option key={c.id} value={c.id}>
                    {(c.platform || "ad").toUpperCase()} — {c.objective || c.id!.slice(0, 8)}
                  </option>
                ))}
              </select>
            </div>
            <Button
              size="sm"
              className="h-8 text-xs gap-1.5"
              disabled={!abVariantA || !abVariantB || abCreate.isPending}
              onClick={() => abCreate.mutate()}
            >
              {abCreate.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FlaskConical className="h-3.5 w-3.5" />}
              Start experiment
            </Button>
          </div>

          {(abQuery.data?.experiments ?? []).length === 0 && !abQuery.isLoading && (
            <p className="text-xs text-muted-foreground">No experiments yet — pick two campaigns above to start one.</p>
          )}
          {(abQuery.data?.experiments ?? []).map((x) => (
            <div key={x.id} className="rounded-lg border border-border p-3 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Badge
                    variant={x.status?.startsWith("winner") ? "default" : "outline"}
                    className="text-[10px] flex-shrink-0"
                  >
                    {abStatusLabel(x)}
                  </Badge>
                  <span className="text-xs text-muted-foreground truncate">
                    {(x.variant_a?.label || "A")} vs {(x.variant_b?.label || "B")} · {x.metric || "ctr"}
                  </span>
                </div>
                {x.status === "collecting" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1"
                    disabled={abEvaluate.isPending}
                    onClick={() => abEvaluate.mutate(x.id)}
                  >
                    {abEvaluate.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                    Check now
                  </Button>
                )}
              </div>
              {x.result?.recommendation && (
                <p className="text-xs text-muted-foreground">{x.result.recommendation}</p>
              )}
              {typeof x.result?.p_value === "number" && (
                <p className="text-[10px] text-muted-foreground">
                  p = {x.result.p_value.toFixed(4)}
                  {typeof x.result.lift_b_vs_a === "number" && ` · B vs A lift ${(x.result.lift_b_vs_a * 100).toFixed(1)}%`}
                </p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
