/**
 * Workflow #13 — Weekly Strategy Brief UI
 * ============================================================================
 * Senior-agency deliverable. Not a dashboard of metrics. A briefing with:
 *   - Executive summary hero (pull-quote styling)
 *   - KPI grid with sparklines + contextual deltas (never naked numbers)
 *   - Wins with causal analysis + framework lever
 *   - Losses with root-cause + remediation
 *   - Biggest insight callout
 *   - Next-week plan as one-click action checklist
 *   - Risk watch
 *   - Strategic question (serif pull-quote)
 *   - Delivery settings + past briefs archive
 *   - PDF/email/share-link export
 * ============================================================================
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Flame,
  Info,
  Lightbulb,
  Link2,
  Loader2,
  Mail,
  MessageSquare,
  Play,
  Quote,
  RefreshCw,
  Send,
  Settings2,
  ShieldAlert,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import Sparkline from "@/components/Sparkline";
import {
  wf13GenerateBrief,
  wf13GetLatestBrief,
  wf13GetBriefHistory,
  wf13BriefDecision,
  wf13SaveDeliverySettings,
  wf13GetDeliverySettings,
  wf13PlanActionDecision,
  type Wf13BriefDetail,
} from "@/lib/api";
import { WF13_AUTONOMY_MODES, type Wf13AutonomyMode } from "@/lib/prompts/workflow_13_weekly_brief";

const formatPct = (n: number) => `${n > 0 ? "+" : ""}${(n * 100).toFixed(1)}%`;

function DeltaPill({ delta, label }: { delta: number; label: string }) {
  const positive = delta >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-medium tabular-nums ${
        positive
          ? "bg-success/10 text-success"
          : "bg-destructive/10 text-destructive"
      }`}
      title={label}
    >
      <Icon className="h-2.5 w-2.5" />
      {formatPct(delta)}
    </span>
  );
}

export default function WeeklyStrategyBrief() {
  const { businessId } = useAuth();
  const qc = useQueryClient();
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const briefQuery = useQuery({
    queryKey: ["wf13", "latest", businessId],
    queryFn: () => wf13GetLatestBrief({ business_id: businessId! }),
    enabled: !!businessId,
    staleTime: 60_000,
    retry: false,
  });

  const settingsQuery = useQuery({
    queryKey: ["wf13", "settings", businessId],
    queryFn: () => wf13GetDeliverySettings({ business_id: businessId! }),
    enabled: !!businessId && showSettings,
    retry: false,
  });

  const historyQuery = useQuery({
    queryKey: ["wf13", "history", businessId],
    queryFn: () => wf13GetBriefHistory({ business_id: businessId!, limit: "20" }),
    enabled: !!businessId && showHistory,
    retry: false,
  });

  const generate = useMutation({
    mutationFn: () => wf13GenerateBrief({ businessId: businessId! }),
    onSuccess: () => {
      toast.success("Synthesis started — this takes ~60 seconds");
      setTimeout(
        () => qc.invalidateQueries({ queryKey: ["wf13", "latest", businessId] }),
        3000,
      );
    },
    onError: (e: Error) => toast.error(e.message || "Failed to generate brief"),
  });

  const decide = useMutation({
    mutationFn: (vars: { briefId: string; decision: "approve" | "reject" }) =>
      wf13BriefDecision({
        businessId: businessId!,
        briefId: vars.briefId,
        decision: vars.decision,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wf13", "latest", businessId] });
    },
  });

  const planDecision = useMutation({
    mutationFn: (vars: {
      briefId: string;
      actionId: string;
      decision: "approve" | "reject" | "defer";
    }) => wf13PlanActionDecision({ businessId: businessId!, ...vars }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wf13", "latest", businessId] });
    },
  });

  const brief = briefQuery.data;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            Workflow #13 · Weekly Strategy Brief
          </div>
          <h1 className="mt-1 text-3xl font-medium tracking-tight text-foreground">
            {brief ? (
              <>Week of {formatDateRange(brief.weekStart, brief.weekEnd)}</>
            ) : (
              "Weekly Strategy Brief"
            )}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Agency-grade executive briefing. Delivered Monday 07:00 local —
            explains what happened, why, and what to do next.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistory(true)}
          >
            <Calendar className="mr-1.5 h-4 w-4" />
            History
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(true)}
          >
            <Settings2 className="mr-1.5 h-4 w-4" />
            Delivery
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => briefQuery.refetch()}
            disabled={briefQuery.isFetching}
          >
            <RefreshCw
              className={`h-4 w-4 ${briefQuery.isFetching ? "animate-spin" : ""}`}
            />
          </Button>
          <Button
            size="sm"
            onClick={() => generate.mutate()}
            disabled={generate.isPending}
          >
            {generate.isPending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-1.5 h-4 w-4" />
            )}
            Generate this week
          </Button>
        </div>
      </div>

      {briefQuery.isLoading ? (
        <BriefSkeleton />
      ) : !brief ? (
        <EmptyBrief onGenerate={() => generate.mutate()} />
      ) : (
        <BriefBody
          brief={brief}
          onApproveBrief={() =>
            decide.mutate({ briefId: brief.id, decision: "approve" })
          }
          onRejectBrief={() =>
            decide.mutate({ briefId: brief.id, decision: "reject" })
          }
          onPlanAction={(actionId, decision) =>
            planDecision.mutate({ briefId: brief.id, actionId, decision })
          }
          isBusy={decide.isPending || planDecision.isPending}
        />
      )}

      <DeliverySettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
        initial={settingsQuery.data ?? null}
        onSave={(payload) =>
          wf13SaveDeliverySettings({ businessId: businessId!, ...payload }).then(
            () => {
              toast.success("Delivery settings saved");
              setShowSettings(false);
              qc.invalidateQueries({ queryKey: ["wf13", "settings", businessId] });
            },
          )
        }
      />

      <HistoryDialog
        open={showHistory}
        onOpenChange={setShowHistory}
        items={historyQuery.data?.items ?? []}
        isLoading={historyQuery.isLoading}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Brief body — the actual senior-agency deliverable
// ---------------------------------------------------------------------------

function BriefBody({
  brief,
  onApproveBrief,
  onRejectBrief,
  onPlanAction,
  isBusy,
}: {
  brief: Wf13BriefDetail;
  onApproveBrief: () => void;
  onRejectBrief: () => void;
  onPlanAction: (actionId: string, decision: "approve" | "reject" | "defer") => void;
  isBusy: boolean;
}) {
  const awaitingReview = brief.status === "awaiting_review";
  return (
    <div className="space-y-6">
      {/* Review banner */}
      {awaitingReview && (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2">
              <ShieldAlert className="mt-0.5 h-4 w-4 text-warning" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Ready for your review
                </p>
                <p className="text-xs text-muted-foreground">
                  Delivery is paused until you approve. Review the brief below,
                  then approve to send or reject to regenerate.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={onApproveBrief} disabled={isBusy}>
                <Check className="mr-1.5 h-4 w-4" />
                Approve &amp; send
              </Button>
              <Button size="sm" variant="outline" onClick={onRejectBrief} disabled={isBusy}>
                <X className="mr-1.5 h-4 w-4" />
                Regenerate
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Executive summary hero */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <Quote className="h-6 w-6 shrink-0 text-primary/60" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Executive summary
              </p>
              <p className="mt-2 text-xl leading-relaxed text-foreground sm:text-2xl">
                {brief.executiveSummary}
              </p>
              {brief.headline && (
                <p className="mt-3 text-sm text-muted-foreground">
                  <span className="font-medium">Headline:</span> {brief.headline}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI grid */}
      {brief.kpiCards && brief.kpiCards.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {brief.kpiCards.map((k) => (
            <Card key={k.key}>
              <CardContent className="p-4">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {k.label}
                </p>
                <div className="mt-1.5 flex items-end justify-between gap-2">
                  <p className="text-2xl font-semibold tabular-nums text-foreground">
                    {k.value}
                  </p>
                  {k.sparkline.length > 1 && (
                    <Sparkline data={k.sparkline} className="h-8 w-20 text-primary" />
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  <DeltaPill delta={k.vsLastWeek} label="vs last week" />
                  <DeltaPill delta={k.vsBenchmark} label="vs industry benchmark" />
                  {k.vsGoal != null && (
                    <DeltaPill delta={k.vsGoal} label="vs goal" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* KPI narrative — numbers in context */}
      {brief.kpiNarrative && brief.kpiNarrative.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">What the numbers mean</CardTitle>
            <CardDescription className="text-xs">
              Every metric contextualized. No naked numbers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {brief.kpiNarrative.map((k, i) => (
              <div
                key={i}
                className="border-l-2 border-primary/30 pl-3"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {k.metric}
                </p>
                <p className="text-sm font-medium text-foreground">{k.value}</p>
                <p className="text-xs text-muted-foreground">{k.context}</p>
                <p className="mt-1 text-sm text-foreground">{k.meaning}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Wins + Losses in a 2-col grid on desktop */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-success" />
              <CardTitle className="text-base">What's working</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Momentum to protect. Causal analysis + framework lever.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {brief.wins.length === 0 ? (
              <p className="text-sm text-muted-foreground">No standout wins this week.</p>
            ) : (
              brief.wins.map((w, i) => (
                <div key={i} className="space-y-1.5 rounded border border-success/20 bg-success/5 p-3">
                  <p className="text-sm font-medium text-foreground">{w.headline}</p>
                  <p className="text-xs text-muted-foreground">{w.evidence}</p>
                  <div className="flex items-start gap-1.5 pt-1">
                    <Info className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                    <p className="text-xs text-foreground">
                      <span className="font-medium">Why it worked: </span>
                      {w.causalAnalysis}
                    </p>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Flame className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                    <p className="text-xs text-foreground">
                      <span className="font-medium">Framework lever: </span>
                      {w.frameworkLever}
                    </p>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Target className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                    <p className="text-xs text-foreground">
                      <span className="font-medium">Protection plan: </span>
                      {w.protectionPlan}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <ArrowDownRight className="h-4 w-4 text-destructive" />
              <CardTitle className="text-base">What needs fixing</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Root cause, not symptom. Framework violated, not blame.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {brief.losses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No material losses this week.</p>
            ) : (
              brief.losses.map((l, i) => (
                <div key={i} className="space-y-1.5 rounded border border-destructive/20 bg-destructive/5 p-3">
                  <p className="text-sm font-medium text-foreground">{l.headline}</p>
                  <p className="text-xs text-muted-foreground">{l.evidence}</p>
                  <div className="flex items-start gap-1.5 pt-1">
                    <Info className="mt-0.5 h-3 w-3 shrink-0 text-destructive" />
                    <p className="text-xs text-foreground">
                      <span className="font-medium">Root cause: </span>
                      {l.rootCause}
                    </p>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Flame className="mt-0.5 h-3 w-3 shrink-0 text-destructive" />
                    <p className="text-xs text-foreground">
                      <span className="font-medium">Framework diagnosis: </span>
                      {l.frameworkDiagnosis}
                    </p>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Target className="mt-0.5 h-3 w-3 shrink-0 text-destructive" />
                    <p className="text-xs text-foreground">
                      <span className="font-medium">Remediation: </span>
                      {l.remediationPlan}
                    </p>
                  </div>
                  <p className="text-[11px] italic text-muted-foreground">
                    If ignored: {l.consequenceIfIgnored}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Biggest insight — special treatment */}
      {brief.biggestInsight && (
        <Card className="border-primary/40">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-primary">
                  Biggest insight this week
                </p>
                <p className="mt-1.5 text-base leading-relaxed text-foreground">
                  {brief.biggestInsight}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next-week plan — one-click actions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Next week — 3 to 5 actions</CardTitle>
          <CardDescription className="text-xs">
            Each with owner, deadline, expected impact. Approve or defer in one click.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {brief.nextWeekPlan.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No new actions — stay the course.
            </p>
          ) : (
            brief.nextWeekPlan.map((a) => (
              <div
                key={a.id}
                className="flex flex-col gap-2 rounded border border-border p-3 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{a.action}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {a.whyNow}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-[10px]">
                      owner: {a.owner}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      by {formatShortDate(a.deadline)}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      ~{a.effortHours}h
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      impact: +{a.expectedImpact.low}–{a.expectedImpact.high} {a.expectedImpact.metric}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {a.status === "pending" ? (
                    <>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => onPlanAction(a.id, "approve")}
                        disabled={isBusy}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onPlanAction(a.id, "defer")}
                        disabled={isBusy}
                      >
                        Defer
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onPlanAction(a.id, "reject")}
                        disabled={isBusy}
                      >
                        Reject
                      </Button>
                    </>
                  ) : (
                    <Badge variant="outline" className="capitalize">
                      {a.status}
                    </Badge>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Risk watch */}
      {brief.riskWatch.length > 0 && (
        <Card className="border-warning/30">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <CardTitle className="text-base">Risk watch</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Leading indicators — what could go wrong next week.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {brief.riskWatch.map((r, i) => (
              <div key={i} className="rounded border border-warning/30 bg-warning/5 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{r.risk}</p>
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {r.probabilityHint} prob
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Leading indicator:</span> {r.leadingIndicator}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Mitigation:</span> {r.mitigation}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* What changed & market context */}
      <div className="grid gap-4 lg:grid-cols-2">
        {brief.whatChanged.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">What changed</CardTitle>
              <CardDescription className="text-xs">
                Pattern breaks vs last week, last month, last quarter.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {brief.whatChanged.map((c, i) => (
                <div key={i} className="rounded border border-border p-3">
                  <p className="text-sm font-medium text-foreground">{c.observation}</p>
                  <p className="text-xs text-muted-foreground">vs {c.vsBaseline}</p>
                  <p className="mt-1 text-xs text-foreground">Signal: {c.signal}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {brief.marketContext.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Market context</CardTitle>
              <CardDescription className="text-xs">
                External forces worth knowing about.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {brief.marketContext.map((m, i) => (
                <div
                  key={i}
                  className={`rounded border p-3 ${
                    m.actionable
                      ? "border-primary/30 bg-primary/5"
                      : "border-border"
                  }`}
                >
                  <p className="text-sm font-medium text-foreground">{m.event}</p>
                  <p className="text-xs text-muted-foreground">{m.implication}</p>
                  {m.actionable && (
                    <Badge variant="outline" className="mt-1 text-[10px]">
                      actionable
                    </Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* What's coming preview */}
      {brief.whatsComingPreview && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Next 7 days — what's coming</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-foreground">
              {brief.whatsComingPreview}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Strategic question — serif pull-quote */}
      {brief.strategicQuestion && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-start gap-3">
              <Quote className="h-6 w-6 shrink-0 text-primary" />
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  One strategic question for you this week
                </p>
                <p
                  className="mt-2 text-xl italic leading-relaxed text-foreground sm:text-2xl"
                  style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                >
                  {brief.strategicQuestion}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data sources + frameworks cited (transparency footer) */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-2 p-4 text-[11px] text-muted-foreground">
          <span className="font-medium uppercase tracking-wide">Data sources:</span>
          {brief.dataSources.map((d) => (
            <Badge key={d} variant="outline" className="text-[10px]">
              {d}
            </Badge>
          ))}
          <span className="ml-2 font-medium uppercase tracking-wide">Frameworks:</span>
          {brief.frameworksCited.map((f) => (
            <Badge key={f} variant="outline" className="text-[10px]">
              {f}
            </Badge>
          ))}
        </CardContent>
      </Card>

      {/* Export bar */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" disabled>
          <Download className="mr-1.5 h-4 w-4" />
          Export PDF
        </Button>
        <Button variant="outline" size="sm" disabled>
          <Mail className="mr-1.5 h-4 w-4" />
          Email preview
        </Button>
        <Button variant="outline" size="sm" disabled>
          <Link2 className="mr-1.5 h-4 w-4" />
          Share link
        </Button>
        <p className="ml-auto self-center text-[11px] text-muted-foreground">
          Word count: {brief.wordCount ?? "—"} · Status: {brief.status}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper UI
// ---------------------------------------------------------------------------

function BriefSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-32 animate-pulse rounded-lg bg-muted" />
      <div className="grid gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-lg bg-muted" />
    </div>
  );
}

function EmptyBrief({ onGenerate }: { onGenerate: () => void }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-start gap-3 p-6">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <FileText className="h-4 w-4" />
          No brief yet for this week
        </div>
        <p className="text-sm text-muted-foreground">
          The strategist runs Sunday evening and delivers Monday 07:00 local.
          Or generate one now — it takes about 60 seconds.
        </p>
        <Button size="sm" onClick={onGenerate}>
          <Play className="mr-1.5 h-4 w-4" />
          Generate this week's brief
        </Button>
      </CardContent>
    </Card>
  );
}

function DeliverySettingsDialog({
  open,
  onOpenChange,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  initial: Awaited<ReturnType<typeof wf13GetDeliverySettings>> | null;
  onSave: (payload: Parameters<typeof wf13SaveDeliverySettings>[0] extends { businessId: string } & infer R ? R : never) => Promise<unknown>;
}) {
  const [mode, setMode] = useState<Wf13AutonomyMode>("review_first");
  const [channels, setChannels] = useState<string[]>(["email"]);
  const [deliveryDay, setDeliveryDay] = useState("monday");
  const [deliveryTime, setDeliveryTime] = useState("07:00");
  const [preferredLength, setPreferredLength] = useState<"brief" | "standard" | "detailed">(
    "standard",
  );
  const [tone, setTone] = useState<"formal" | "casual" | "direct">("direct");
  const [depth, setDepth] = useState<"layman" | "intermediate" | "expert">("intermediate");
  const [language, setLanguage] = useState("en");
  const [recipientEmail, setRecipientEmail] = useState("");

  useEffect(() => {
    if (initial) {
      setMode(initial.autonomyMode as Wf13AutonomyMode);
      setChannels(initial.channels);
      setDeliveryDay(initial.deliveryDay);
      setDeliveryTime(initial.deliveryLocalTime);
      setPreferredLength(initial.preferredLength);
      setTone(initial.tonePreference);
      setDepth(initial.technicalDepth);
      setLanguage(initial.language);
      if (initial.recipients[0]?.email) setRecipientEmail(initial.recipients[0].email);
    }
  }, [initial]);

  const toggleChannel = (c: string) =>
    setChannels((cs) => (cs.includes(c) ? cs.filter((x) => x !== c) : [...cs, c]));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Delivery settings</DialogTitle>
          <DialogDescription>
            Control when and how the weekly brief is delivered. Maroa learns
            from your behavior over time.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs">Autonomy mode</Label>
            <div className="mt-1.5 grid gap-2">
              {(Object.keys(WF13_AUTONOMY_MODES) as Wf13AutonomyMode[]).map((m) => {
                const def = WF13_AUTONOMY_MODES[m];
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`rounded-lg border p-3 text-left transition-colors ${
                      mode === m
                        ? "border-primary bg-primary/10"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    <p className="text-sm font-medium text-foreground">{def.label}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {def.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label className="text-xs">Delivery channels</Label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {[
                { k: "email", icon: Mail, label: "Email" },
                { k: "slack", icon: MessageSquare, label: "Slack" },
                { k: "whatsapp", icon: Send, label: "WhatsApp" },
                { k: "dashboard_only", icon: FileText, label: "Dashboard only" },
                { k: "pdf", icon: Download, label: "PDF" },
              ].map(({ k, icon: Icon, label }) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => toggleChannel(k)}
                  className={`flex items-center gap-1.5 rounded border px-2.5 py-1.5 text-xs ${
                    channels.includes(k)
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Day</Label>
              <Select value={deliveryDay} onValueChange={setDeliveryDay}>
                <SelectTrigger className="mt-1 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map(
                    (d) => (
                      <SelectItem key={d} value={d} className="capitalize">
                        {d}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Time (local)</Label>
              <Input
                className="mt-1 h-9"
                type="time"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Primary recipient email</Label>
            <Input
              className="mt-1"
              type="email"
              placeholder="founder@business.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Length</Label>
              <Select value={preferredLength} onValueChange={(v) => setPreferredLength(v as typeof preferredLength)}>
                <SelectTrigger className="mt-1 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brief">Brief</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Tone</Label>
              <Select value={tone} onValueChange={(v) => setTone(v as typeof tone)}>
                <SelectTrigger className="mt-1 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="direct">Direct</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Depth</Label>
              <Select value={depth} onValueChange={(v) => setDepth(v as typeof depth)}>
                <SelectTrigger className="mt-1 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="layman">Layman</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() =>
              onSave({
                autonomyMode: mode,
                channels: channels as ("email" | "slack" | "whatsapp" | "dashboard_only" | "pdf")[],
                recipients: recipientEmail
                  ? [{ name: "Primary", email: recipientEmail }]
                  : [],
                deliveryDay: deliveryDay as "monday",
                deliveryLocalTime: deliveryTime,
                preferredLength,
                tonePreference: tone,
                technicalDepth: depth,
                language,
              })
            }
          >
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function HistoryDialog({
  open,
  onOpenChange,
  items,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  items: Array<{
    id: string;
    weekStart: string;
    weekEnd: string;
    status: string;
    headline: string | null;
    wordCount: number | null;
  }>;
  isLoading: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Past briefs</DialogTitle>
          <DialogDescription>
            Every brief delivered. Searchable archive for the board deck.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No briefs yet.</p>
        ) : (
          <ul className="max-h-[60vh] divide-y divide-border overflow-y-auto">
            {items.map((b) => (
              <li key={b.id} className="flex items-start justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {formatDateRange(b.weekStart, b.weekEnd)}
                  </p>
                  {b.headline && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{b.headline}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {b.status}
                  </Badge>
                  {b.wordCount && (
                    <span className="text-[10px] text-muted-foreground">
                      {b.wordCount}w
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// formatting helpers
// ---------------------------------------------------------------------------

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const year = e.getFullYear();
  return `${s.toLocaleDateString("en-US", opts)}–${e.toLocaleDateString("en-US", opts)}, ${year}`;
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
