import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  UserCheck, Heart, MessageSquare, TrendingUp, Brain, Target,
  Sparkles, Loader2, RefreshCw, Lightbulb, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { wf8GetLatestReport, wf8GenerateReport, vocAuto } from "@/lib/api";

/* ── WF8 insight report shapes (services/wf8 → insight_reports row) ── */

interface Wf8Theme {
  theme?: string;
  jtbd_functional?: string;
  jtbd_emotional?: string;
  jtbd_social?: string;
  evidence_count?: number;
  sample_quotes?: string[];
}

interface Wf8PainPoint {
  pain?: string;
  severity?: number;
  frequency?: number;
  quotes?: string[];
}

interface Wf8DelightMoment {
  moment?: string;
  frequency?: number;
  quotes?: string[];
}

interface Wf8UnmetNeed {
  need?: string;
  signal_strength?: number;
  expected_value?: string;
}

interface Wf8Persona {
  name?: string;
  demographics?: string;
  primary_jtbd?: string;
  key_pains?: string[];
  channels?: string[];
  words_they_use?: string[];
}

interface Wf8ActionItem {
  action?: string;
  workflow?: string;
  why_now?: string;
}

interface Wf8Report {
  id?: string;
  created_at?: string;
  window_start?: string;
  window_end?: string;
  top_themes?: Wf8Theme[];
  pain_points?: Wf8PainPoint[];
  delight_moments?: Wf8DelightMoment[];
  unmet_needs?: Wf8UnmetNeed[];
  personas?: Wf8Persona[];
  language_patterns?: string[];
  action_items?: Wf8ActionItem[];
}

/* ── VOC shapes (services/voc engine → synthesizeVoc result) ── */

interface VocPainPoint {
  theme?: string;
  frequency?: number;
  severity?: string;
  verbatim_quotes?: string[];
  languages?: string[];
}

interface VocJtbdSignal {
  job?: string;
  evidence_quotes?: string[];
}

interface VocResult {
  total_reviews_analyzed?: number;
  primary_language?: string;
  pain_points?: VocPainPoint[];
  jtbd_signals?: VocJtbdSignal[];
  persona_refinement?: {
    demographics_observed?: string;
    common_use_cases?: string[];
    vocabulary_clusters?: string[];
  } | null;
  sentiment?: {
    positive_pct?: number;
    neutral_pct?: number;
    negative_pct?: number;
  } | null;
  recommendations_for_marketing?: string[];
  data_quality?: string;
  caveats?: string[];
  short_circuited?: boolean;
  short_circuit_reason?: string;
}

type Sentiment = "positive" | "neutral" | "negative";

interface QuoteCard {
  quote: string;
  source: string;
  sentiment: Sentiment;
}

const sentimentBadge: Record<Sentiment, string> = {
  positive: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30",
  neutral: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
  negative: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
};

/** Flatten VOC output into quote cards — ONLY quotes the backend returned. */
function vocToQuoteCards(voc: VocResult | null | undefined): QuoteCard[] {
  if (!voc) return [];
  const cards: QuoteCard[] = [];
  voc.pain_points?.forEach((p) => {
    p.verbatim_quotes?.forEach((q) => {
      if (q) cards.push({ quote: q, source: p.theme || "Pain point", sentiment: "negative" });
    });
  });
  voc.jtbd_signals?.forEach((j) => {
    j.evidence_quotes?.forEach((q) => {
      if (q) cards.push({ quote: q, source: j.job || "Job to be done", sentiment: "neutral" });
    });
  });
  return cards;
}

function SectionSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {Array.from({ length: cards }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function CustomerInsights() {
  const { businessId } = useAuth();
  const qc = useQueryClient();
  const [expandedPersona, setExpandedPersona] = useState<number | null>(null);
  const [vocResult, setVocResult] = useState<VocResult | null>(null);

  const reportQuery = useQuery({
    queryKey: ["wf8", "latest-report", businessId],
    queryFn: async () =>
      (await wf8GetLatestReport({ business_id: businessId! })) as Wf8Report | null,
    enabled: !!businessId,
    retry: false,
  });

  const generate = useMutation({
    mutationFn: () => wf8GenerateReport({ businessId: businessId! }),
    onSuccess: () => {
      toast.success("Insights report generated");
      qc.invalidateQueries({ queryKey: ["wf8", "latest-report", businessId] });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to generate report"),
  });

  const mineVoc = useMutation({
    mutationFn: async () => (await vocAuto({ businessId: businessId! })) as VocResult,
    onMutate: () => {
      toast.info("Mining customer language from reviews and comments — this can take a minute…");
    },
    onSuccess: (data) => {
      setVocResult(data ?? null);
      if (data?.short_circuited) {
        toast.warning(data.short_circuit_reason || "Not enough reviews to mine customer language yet.");
      } else {
        toast.success(
          `Customer language mined from ${data?.total_reviews_analyzed ?? 0} reviews`,
        );
      }
    },
    onError: (e: Error) => toast.error(e.message || "Customer-language mining failed"),
  });

  const report = reportQuery.data ?? null;
  const personas = report?.personas ?? [];
  const themes = report?.top_themes ?? [];
  const actionItems = report?.action_items ?? [];
  const quoteCards = vocToQuoteCards(vocResult);

  const generateButton = (
    <Button
      size="sm"
      onClick={() => generate.mutate()}
      disabled={generate.isPending || !businessId}
    >
      {generate.isPending ? (
        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="mr-1.5 h-4 w-4" />
      )}
      {generate.isPending ? "Generating…" : report ? "Regenerate report" : "Generate report"}
    </Button>
  );

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-semibold text-foreground">Customer insights</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            AI-mined personas, themes, and verbatim customer language from your reviews and messages.
          </p>
          {report?.window_start && report?.window_end && (
            <p className="mt-1 text-xs text-muted-foreground">
              Window: {report.window_start} → {report.window_end}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => reportQuery.refetch()}
            disabled={reportQuery.isFetching || !businessId}
          >
            <RefreshCw className={`h-4 w-4 ${reportQuery.isFetching ? "animate-spin" : ""}`} />
          </Button>
          {generateButton}
        </div>
      </div>

      {reportQuery.isLoading ? (
        <>
          <SectionSkeleton />
          <SectionSkeleton cards={4} />
        </>
      ) : reportQuery.isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <AlertTriangle className="h-6 w-6 text-warning" />
            <p className="text-sm text-muted-foreground">
              Could not load your insights report. Try again in a moment.
            </p>
            <Button size="sm" variant="outline" onClick={() => reportQuery.refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : !report ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Brain className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              No insights report yet — generate your first one
            </p>
            <p className="max-w-md text-xs text-muted-foreground">
              Maroa mines your last 30 days of reviews and inbox messages for personas,
              pain points, and the exact language your customers use.
            </p>
            {generateButton}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ── AI Personas ── */}
          <section>
            <div className="flex items-center gap-2 mb-1">
              <Brain className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Customer personas</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Built from your order history, reviews, and support conversations.
            </p>

            {personas.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  No personas detected in this window yet. More reviews and messages sharpen these.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                {personas.map((p, i) => (
                  <Card
                    key={i}
                    className={`cursor-pointer transition-shadow hover:shadow-md ${expandedPersona === i ? "ring-2 ring-primary" : ""}`}
                    onClick={() => setExpandedPersona(expandedPersona === i ? null : i)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-semibold text-primary">
                          {(p.name || "?").charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <CardTitle className="text-base">{p.name || "Persona"}</CardTitle>
                          {p.demographics && <CardDescription>{p.demographics}</CardDescription>}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground space-y-3">
                      {p.primary_jtbd && <p>{p.primary_jtbd}</p>}
                      {(p.key_pains?.length ?? 0) > 0 && (
                        <div>
                          <span className="font-medium text-foreground text-xs uppercase tracking-wider">Key pains</span>
                          <ul className="mt-1 space-y-1">
                            {p.key_pains?.map((n, j) => (
                              <li key={j} className="flex items-center gap-1.5">
                                <Target className="h-3 w-3 text-primary shrink-0" />
                                {n}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {expandedPersona === i && (p.words_they_use?.length ?? 0) > 0 && (
                        <div>
                          <span className="font-medium text-foreground text-xs uppercase tracking-wider">Words they use</span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {p.words_they_use?.map((w, j) => (
                              <Badge key={j} variant="outline" className="text-[10px]">
                                {w}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {expandedPersona === i && (p.channels?.length ?? 0) > 0 && (
                        <p className="text-xs">
                          <span className="font-medium text-foreground">Channels:</span>{" "}
                          {p.channels?.join(", ")}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* ── Top Themes ── */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <UserCheck className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Top themes</h2>
            </div>

            {themes.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  No recurring themes surfaced in this window.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {themes.map((t, i) => (
                  <Card key={i}>
                    <CardContent className="pt-5 pb-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <TrendingUp className="h-5 w-5 text-primary" />
                        </div>
                        {typeof t.evidence_count === "number" && (
                          <Badge variant="outline" className="text-[10px]">
                            {t.evidence_count} signals
                          </Badge>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{t.theme || "Theme"}</p>
                        {t.jtbd_functional && (
                          <p className="mt-1 text-xs text-muted-foreground">{t.jtbd_functional}</p>
                        )}
                      </div>
                      {t.sample_quotes?.[0] && (
                        <p className="text-xs italic text-muted-foreground">
                          "{t.sample_quotes[0]}"
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* ── Recommended actions ── */}
          {actionItems.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Recommended actions</h2>
              </div>
              <Card>
                <CardContent className="pt-5">
                  <ul className="space-y-3">
                    {actionItems.map((a, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        <div>
                          <p className="text-sm text-foreground">{a.action}</p>
                          {a.why_now && (
                            <p className="text-xs text-muted-foreground">{a.why_now}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </section>
          )}
        </>
      )}

      {/* ── What Your Customers Say (VOC — verbatim only) ── */}
      <section>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Heart className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">What your customers say</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Verbatim language mined from real reviews and comments — never invented.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => mineVoc.mutate()}
            disabled={mineVoc.isPending || !businessId}
          >
            {mineVoc.isPending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <MessageSquare className="mr-1.5 h-4 w-4" />
            )}
            {mineVoc.isPending ? "Mining…" : "Mine customer language"}
          </Button>
        </div>

        {mineVoc.isPending ? (
          <SectionSkeleton />
        ) : quoteCards.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <MessageSquare className="mx-auto h-6 w-6 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                {vocResult
                  ? vocResult.short_circuit_reason ||
                    "No verbatim customer quotes found yet — collect more reviews and run again."
                  : "No customer language mined yet. Run the miner to pull real quotes from your reviews and comments."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {quoteCards.map((ins, i) => (
                <Card key={i}>
                  <CardContent className="pt-5 space-y-3">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <blockquote className="text-sm italic text-foreground leading-relaxed">
                      "{ins.quote}"
                    </blockquote>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{ins.source}</span>
                      <Badge variant="outline" className={sentimentBadge[ins.sentiment]}>
                        {ins.sentiment}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {(vocResult?.recommendations_for_marketing?.length ?? 0) > 0 && (
              <Card className="mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Use it in your marketing</CardTitle>
                  <CardDescription className="text-xs">
                    From {vocResult?.total_reviews_analyzed ?? 0} reviews analyzed
                    {vocResult?.data_quality ? ` · data quality: ${vocResult.data_quality}` : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1.5">
                    {vocResult?.recommendations_for_marketing?.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                        <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </section>
    </div>
  );
}
