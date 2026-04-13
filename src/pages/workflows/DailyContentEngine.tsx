/**
 * Workflow #1 — Daily Content Engine UI
 * ============================================================================
 * Senior-agency level dashboard for the daily content plan. Shows:
 *   - The strategist's analysis (brand maturity, narrative arc, cultural
 *     opportunity, funnel stages, underserved pillars, emotional targets)
 *   - Today's concepts with framework justification, hook pattern,
 *     predicted performance range, risk level, and approval state
 *   - The learning loop state (winning patterns, anti-patterns, hashtag bank,
 *     prediction accuracy)
 *   - Autonomy mode selector (Full Autopilot / Hybrid / Approve Everything)
 *
 * This component is the user-visible proof that Workflow #1 is implemented at
 * full strategic depth per MAROA_15_WORKFLOWS_V2. It deliberately does NOT
 * hide the reasoning — that's the differentiator.
 * ============================================================================
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Brain,
  Clock,
  Compass,
  Flame,
  Gauge,
  Info,
  Layers,
  Play,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  wf1GetDailyPlan,
  wf1RunStrategicDecision,
  wf1Decision,
  wf1GetLearningState,
  wf1SetAutonomyMode,
} from "@/lib/api";
import { AUTONOMY_MODES, type AutonomyMode } from "@/lib/prompts/workflow_1_daily_content";

type Concept = NonNullable<
  Awaited<ReturnType<typeof wf1GetDailyPlan>>
>["concepts"][number];

const RISK_COLORS: Record<Concept["riskLevel"], string> = {
  low: "bg-success/10 text-success border-success/30",
  medium: "bg-warning/10 text-warning border-warning/30",
  high: "bg-destructive/10 text-destructive border-destructive/30",
};

const FUNNEL_COLORS: Record<string, string> = {
  tofu: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
  mofu: "bg-primary/10 text-primary border-primary/30",
  bofu: "bg-warning/10 text-warning border-warning/30",
  retention: "bg-success/10 text-success border-success/30",
};

const PLATFORM_LABELS: Record<string, string> = {
  instagram_reel: "Instagram Reel",
  instagram_story: "Instagram Story",
  instagram_feed: "Instagram Feed",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
  facebook: "Facebook",
  twitter: "Twitter / X",
  youtube_shorts: "YouTube Shorts",
  gbp_post: "Google Business Profile",
};

export default function DailyContentEngine() {
  const { businessId } = useAuth();
  const qc = useQueryClient();
  const [autonomyMode, setAutonomyMode] = useState<AutonomyMode>("hybrid");

  const planQuery = useQuery({
    queryKey: ["wf1", "plan", businessId],
    queryFn: () => wf1GetDailyPlan({ business_id: businessId! }),
    enabled: !!businessId,
    staleTime: 60_000,
    retry: false,
  });

  const learningQuery = useQuery({
    queryKey: ["wf1", "learning", businessId],
    queryFn: () => wf1GetLearningState({ business_id: businessId! }),
    enabled: !!businessId,
    staleTime: 5 * 60_000,
    retry: false,
  });

  const runNow = useMutation({
    mutationFn: () =>
      wf1RunStrategicDecision({ businessId: businessId!, forceReplan: true }),
    onSuccess: () => {
      toast.success("Strategist running — new plan incoming");
      qc.invalidateQueries({ queryKey: ["wf1", "plan", businessId] });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to start run"),
  });

  const decide = useMutation({
    mutationFn: (vars: {
      conceptId: string;
      decision: "approve" | "reject";
      reason?: string;
    }) =>
      wf1Decision({
        businessId: businessId!,
        conceptId: vars.conceptId,
        decision: vars.decision,
        reason: vars.reason,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wf1", "plan", businessId] });
    },
  });

  const saveAutonomy = useMutation({
    mutationFn: (mode: AutonomyMode) =>
      wf1SetAutonomyMode({ businessId: businessId!, mode }),
    onSuccess: () => toast.success("Autonomy mode updated"),
  });

  useEffect(() => {
    // Prefetch learning loop state when plan loads (they're shown together)
    if (planQuery.data && !learningQuery.data) void learningQuery.refetch();
  }, [planQuery.data, learningQuery]);

  const plan = planQuery.data;
  const concepts = plan?.concepts ?? [];
  const pendingCount = concepts.filter((c) => c.status === "pending").length;

  const handleApprove = useCallback(
    (conceptId: string) => decide.mutate({ conceptId, decision: "approve" }),
    [decide],
  );
  const handleReject = useCallback(
    (conceptId: string) =>
      decide.mutate({
        conceptId,
        decision: "reject",
        reason: "rejected from daily plan view",
      }),
    [decide],
  );

  return (
    <div className="space-y-6">
      {/* ── Header / Run strip ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            Workflow #1 · Daily Content Engine
          </div>
          <h1 className="mt-1 text-3xl font-medium tracking-tight text-foreground">
            Today's content plan
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            The strategist runs at 06:00 local every morning. Context → strategic
            decision → platform-native generation → quality gate → posting.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => planQuery.refetch()}
            disabled={planQuery.isFetching}
          >
            <RefreshCw
              className={`h-4 w-4 ${planQuery.isFetching ? "animate-spin" : ""}`}
            />
          </Button>
          <Button
            size="sm"
            onClick={() => runNow.mutate()}
            disabled={runNow.isPending}
          >
            <Play className="mr-1.5 h-4 w-4" />
            {runNow.isPending ? "Running…" : "Run strategist now"}
          </Button>
        </div>
      </div>

      {/* ── Autonomy mode selector ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Autonomy mode</CardTitle>
              <CardDescription className="text-xs">
                Controls when AI ships without approval. Data-backed defaults.
              </CardDescription>
            </div>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {(Object.keys(AUTONOMY_MODES) as AutonomyMode[]).map((mode) => {
              const def = AUTONOMY_MODES[mode];
              const active = autonomyMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    setAutonomyMode(mode);
                    saveAutonomy.mutate(mode);
                  }}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    active
                      ? "border-primary bg-primary/10"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      {def.label}
                    </span>
                    {active && (
                      <Badge variant="outline" className="text-[10px]">
                        active
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                    {def.description}
                  </p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Strategist analysis ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">
                Strategist's analysis
              </CardTitle>
            </div>
            {plan && (
              <Badge variant="outline" className="text-[10px]">
                {plan.date} · {plan.status}
              </Badge>
            )}
          </div>
          <CardDescription className="text-xs">
            Opus-grade strategic thinking. Every concept below derives from
            this reasoning.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {planQuery.isLoading ? (
            <AnalysisSkeleton />
          ) : !plan || !plan.analysis ? (
            <EmptyAnalysis onRun={() => runNow.mutate()} />
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <AnalysisStat
                  icon={Compass}
                  label="Brand maturity"
                  value={plan.analysis.brandMaturity}
                />
                <AnalysisStat
                  icon={TrendingUp}
                  label="Narrative arc"
                  value={plan.analysis.narrativeArc}
                />
                <AnalysisStat
                  icon={Target}
                  label="Funnel focus"
                  value={plan.analysis.funnelStagesNeedingAttention.join(", ") || "balanced"}
                />
                <AnalysisStat
                  icon={Layers}
                  label="Underserved pillars"
                  value={plan.analysis.underservedPillars.join(", ") || "on target"}
                />
              </div>

              <div className="rounded-lg border border-border bg-muted/40 p-4">
                <div className="flex items-start gap-2">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Cultural opportunity today
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {plan.analysis.culturalOpportunity}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Target emotions
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {plan.analysis.targetEmotions.map((e) => (
                    <Badge key={e} variant="outline" className="capitalize">
                      {e}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="border-l-2 border-primary/40 pl-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Strategist's reasoning
                </p>
                <p className="mt-1 text-sm leading-relaxed text-foreground">
                  {plan.analysis.reasoning}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Today's concepts ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-foreground">
          Today's concepts
          {concepts.length > 0 && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {pendingCount} pending approval · {concepts.length} total
            </span>
          )}
        </h2>
      </div>

      {planQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <ConceptSkeleton />
          <ConceptSkeleton />
        </div>
      ) : concepts.length === 0 ? (
        <EmptyConcepts />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {concepts.map((concept) => (
            <ConceptCard
              key={concept.id}
              concept={concept}
              onApprove={() => handleApprove(concept.id)}
              onReject={() => handleReject(concept.id)}
              isBusy={decide.isPending}
            />
          ))}
        </div>
      )}

      {/* ── Learning loop ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Learning loop</CardTitle>
          </div>
          <CardDescription className="text-xs">
            This is what separates Maroa from generic tools. Every post feeds
            back into the next.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="winners">
            <TabsList>
              <TabsTrigger value="winners">Winning patterns</TabsTrigger>
              <TabsTrigger value="losers">Anti-patterns</TabsTrigger>
              <TabsTrigger value="hashtags">Hashtag bank</TabsTrigger>
              <TabsTrigger value="accuracy">Prediction accuracy</TabsTrigger>
            </TabsList>
            <TabsContent value="winners" className="pt-3">
              <LearningList
                rows={
                  learningQuery.data?.winningPatterns.map((p) => ({
                    label: p.trait,
                    value: `+${(p.lift * 100).toFixed(0)}% lift`,
                    sub: `n=${p.sampleSize}`,
                  })) ?? []
                }
                emptyText="Winning patterns appear after ~14 days of posts."
              />
            </TabsContent>
            <TabsContent value="losers" className="pt-3">
              <LearningList
                rows={
                  learningQuery.data?.antiPatterns.map((p) => ({
                    label: p.trait,
                    value: `−${(p.drag * 100).toFixed(0)}% drag`,
                    sub: `n=${p.sampleSize}`,
                  })) ?? []
                }
                emptyText="No anti-patterns detected yet."
              />
            </TabsContent>
            <TabsContent value="hashtags" className="pt-3">
              <LearningList
                rows={
                  learningQuery.data?.hashtagBank.map((h) => ({
                    label: `${h.tag} · ${h.platform}`,
                    value: `${h.avgReach.toLocaleString()} avg reach`,
                    sub: `used ${h.usages}×`,
                  })) ?? []
                }
                emptyText="Personalized hashtag bank is built over time."
              />
            </TabsContent>
            <TabsContent value="accuracy" className="pt-3">
              {learningQuery.data ? (
                <div className="text-sm">
                  <p className="text-foreground">
                    Mean absolute prediction error:{" "}
                    <span className="font-medium">
                      {(learningQuery.data.predictionAccuracy.mae * 100).toFixed(1)}%
                    </span>{" "}
                    over {learningQuery.data.predictionAccuracy.sampleSize} posts.
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    MAE &lt;10% = highly calibrated. The model updates after
                    every post.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Not enough data yet.</p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

function AnalysisStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Compass;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <p className="mt-1 text-sm font-medium capitalize text-foreground">
        {value || "—"}
      </p>
    </div>
  );
}

function ConceptCard({
  concept,
  onApprove,
  onReject,
  isBusy,
}: {
  concept: Concept;
  onApprove: () => void;
  onReject: () => void;
  isBusy: boolean;
}) {
  const [lo, hi] = concept.predictedEngagementRange;
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="text-[10px]">
                {PLATFORM_LABELS[concept.platform] ?? concept.platform}
              </Badge>
              <Badge
                variant="outline"
                className={`text-[10px] ${FUNNEL_COLORS[concept.funnelStage] ?? ""}`}
              >
                {concept.funnelStage.toUpperCase()}
              </Badge>
              <Badge
                variant="outline"
                className={`text-[10px] ${RISK_COLORS[concept.riskLevel]}`}
              >
                risk: {concept.riskLevel}
              </Badge>
            </div>
            <CardTitle className="mt-2 text-base leading-snug">
              {concept.coreIdea}
            </CardTitle>
            <CardDescription className="text-[11px]">
              Pillar: {concept.pillar} · Format: {concept.format} · Emotion:{" "}
              {concept.emotion}
            </CardDescription>
          </div>
          {concept.qualityScore != null && (
            <div className="text-right">
              <div className="text-lg font-semibold text-foreground tabular-nums">
                {concept.qualityScore}
              </div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                quality
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-3 text-sm">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Hook
          </p>
          <p className="mt-0.5 text-sm font-medium text-foreground">
            "{concept.hook}"
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            CTA
          </p>
          <p className="mt-0.5 text-sm text-foreground">{concept.cta}</p>
        </div>
        <div className="rounded border border-primary/20 bg-primary/10 p-2.5">
          <div className="flex items-start gap-1.5">
            <Flame className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-primary">
                Framework lever
              </p>
              <p className="mt-0.5 text-xs text-foreground">
                {concept.framework}
              </p>
            </div>
          </div>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Why this, why now
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {concept.whyThisWhyNow}
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            predicted {(lo * 100).toFixed(1)}–{(hi * 100).toFixed(1)}% eng
          </span>
          {concept.generatedAsset && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {concept.generatedAsset.postingTime.localTime}
            </span>
          )}
        </div>
      </CardContent>
      <div className="flex items-center gap-2 border-t border-border p-3">
        {concept.status === "pending" ? (
          <>
            <Button
              size="sm"
              className="flex-1"
              onClick={onApprove}
              disabled={isBusy}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={onReject}
              disabled={isBusy}
            >
              Reject
            </Button>
          </>
        ) : (
          <Badge variant="outline" className="capitalize">
            {concept.status}
          </Badge>
        )}
      </div>
    </Card>
  );
}

function AnalysisSkeleton() {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-lg border border-border bg-muted"
          />
        ))}
      </div>
      <div className="h-20 animate-pulse rounded-lg bg-muted" />
      <div className="h-16 animate-pulse rounded-lg bg-muted" />
    </div>
  );
}

function ConceptSkeleton() {
  return <div className="h-72 animate-pulse rounded-lg border border-border bg-muted" />;
}

function EmptyAnalysis({ onRun }: { onRun: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed border-border p-6">
      <p className="text-sm text-foreground">
        No plan for today yet. The strategist runs automatically at 06:00 local
        time — or you can trigger it manually.
      </p>
      <Button size="sm" onClick={onRun}>
        <Play className="mr-1.5 h-4 w-4" />
        Run strategist now
      </Button>
    </div>
  );
}

function EmptyConcepts() {
  return (
    <Card className="border-dashed">
      <CardContent className="p-6 text-center text-sm text-muted-foreground">
        No concepts yet. Once the strategist runs, 1–3 concepts will appear here
        for your review.
      </CardContent>
    </Card>
  );
}

function LearningList({
  rows,
  emptyText,
}: {
  rows: Array<{ label: string; value: string; sub: string }>;
  emptyText: string;
}) {
  if (rows.length === 0)
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  return (
    <ul className="divide-y divide-border">
      {rows.map((r, i) => (
        <li key={i} className="flex items-center justify-between py-2 text-sm">
          <span className="text-foreground">{r.label}</span>
          <span className="flex items-center gap-2">
            <span className="font-medium tabular-nums text-foreground">
              {r.value}
            </span>
            <span className="text-[11px] text-muted-foreground">{r.sub}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
