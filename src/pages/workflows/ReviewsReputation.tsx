/**
 * Workflow #4 — Reviews & Reputation UI
 * ============================================================================
 * Chief Experience Officer-grade dashboard:
 *   - Reputation snapshot per platform (rating + velocity + trajectory + response rate)
 *   - Sentiment timeline
 *   - Queue: pending reviews with category + urgency + SLA
 *   - Response drafting drawer with 2–3 variants for negatives, approval required
 *   - Testimonial library feeding WF1 content
 *   - Top complaints → ops accountability loop
 *   - Industry benchmark comparison
 * ============================================================================
 */

import { useCallback, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Clock,
  Eye,
  Flame,
  Loader2,
  MessageSquare,
  RefreshCw,
  Send,
  ShieldAlert,
  Sparkles,
  Star,
  ThumbsDown,
  ThumbsUp,
  TrendingUp,
  TrendingDown,
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  wf4ListReviews,
  wf4GetReview,
  wf4GenerateResponse,
  wf4PublishResponse,
  wf4DisputeReview,
  wf4IgnoreReview,
  wf4GetReputationSnapshot,
  wf4GetTestimonialLibrary,
  wf4RequestTestimonialPermission,
  type ReviewCategory,
  type ReviewRow,
  type ReviewPlatform,
} from "@/lib/api";

const CATEGORY_META: Record<
  ReviewCategory,
  { label: string; color: string; icon: typeof Star }
> = {
  positive: {
    label: "Positive",
    color: "bg-success/10 text-success border-success/30",
    icon: ThumbsUp,
  },
  neutral: {
    label: "Neutral",
    color: "bg-muted text-muted-foreground border-border",
    icon: Star,
  },
  negative: {
    label: "Negative",
    color: "bg-warning/10 text-warning border-warning/30",
    icon: ThumbsDown,
  },
  critical: {
    label: "Critical",
    color: "bg-destructive/10 text-destructive border-destructive/30",
    icon: ShieldAlert,
  },
};

const URGENCY_META: Record<string, string> = {
  immediate: "text-destructive",
  high: "text-warning",
  medium: "text-primary",
  low: "text-muted-foreground",
};

const PLATFORM_LABELS: Record<string, string> = {
  google_business_profile: "Google",
  facebook: "Facebook",
  trustpilot: "Trustpilot",
  g2: "G2",
  capterra: "Capterra",
  yelp: "Yelp",
  tripadvisor: "TripAdvisor",
  amazon: "Amazon",
  app_store: "App Store",
  play_store: "Play Store",
  glassdoor: "Glassdoor",
  reddit: "Reddit",
  twitter: "Twitter/X",
  bbb: "BBB",
  consumer_affairs: "Consumer Affairs",
  other: "Other",
};

export default function ReviewsReputation() {
  const { businessId } = useAuth();
  const [categoryFilter, setCategoryFilter] = useState<ReviewCategory | "all">("all");
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);

  const reviewsQuery = useQuery({
    queryKey: ["wf4", "reviews", businessId, categoryFilter],
    queryFn: () =>
      wf4ListReviews({
        business_id: businessId!,
        category: categoryFilter === "all" ? undefined : categoryFilter,
        limit: "50",
      }),
    enabled: !!businessId,
    retry: false,
  });

  const snapshotQuery = useQuery({
    queryKey: ["wf4", "snapshot", businessId],
    queryFn: () => wf4GetReputationSnapshot({ business_id: businessId! }),
    enabled: !!businessId,
    retry: false,
  });

  const reviews = reviewsQuery.data?.items ?? [];
  const counts = reviewsQuery.data?.counts ?? {
    positive: 0,
    neutral: 0,
    negative: 0,
    critical: 0,
  };
  const pendingCount = reviewsQuery.data?.pendingResponseCount ?? 0;

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            Workflow #4 · Reviews &amp; Reputation
          </div>
          <h1 className="mt-1 text-3xl font-medium tracking-tight text-foreground">
            Reputation engine
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every review is a conversation with 100 future customers. Response
            rate &gt;50% = +21% revenue vs non-responders (BrightLocal).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              reviewsQuery.refetch();
              snapshotQuery.refetch();
            }}
            disabled={reviewsQuery.isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${reviewsQuery.isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* ── Pending banner ── */}
      {pendingCount > 0 && (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="flex items-center gap-3 p-4">
            <Clock className="h-4 w-4 text-warning" />
            <p className="flex-1 text-sm text-foreground">
              <span className="font-medium">{pendingCount}</span> reviews waiting for
              a response. Draft + approve to ship.
            </p>
            <Button size="sm" onClick={() => setCategoryFilter("all")}>
              Show queue
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Reputation snapshot per platform ── */}
      {snapshotQuery.data && snapshotQuery.data.byPlatform.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {snapshotQuery.data.byPlatform.map((p) => (
            <PlatformSnapshotCard key={p.platform} data={p} />
          ))}
        </div>
      )}

      {/* ── Industry benchmark ── */}
      {snapshotQuery.data && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Industry benchmark</CardTitle>
            <CardDescription className="text-xs">
              Rating trajectory direction vs peers is the signal that matters.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              <BenchmarkBlock
                label="Industry average"
                value={snapshotQuery.data.benchmarks.industryAvgRating.toFixed(2)}
                suffix="⭐"
              />
              <BenchmarkBlock
                label="Top competitor"
                value={snapshotQuery.data.benchmarks.topCompetitorAvgRating.toFixed(2)}
                suffix="⭐"
              />
              <BenchmarkBlock
                label="Direction"
                value={snapshotQuery.data.benchmarks.directionVsIndustry}
                highlight={snapshotQuery.data.benchmarks.directionVsIndustry === "improving"}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Category filter ── */}
      <div className="flex flex-wrap gap-2">
        <FilterChip
          active={categoryFilter === "all"}
          label={`All (${Object.values(counts).reduce((a, b) => a + b, 0)})`}
          onClick={() => setCategoryFilter("all")}
        />
        {(["positive", "neutral", "negative", "critical"] as ReviewCategory[]).map((c) => (
          <FilterChip
            key={c}
            active={categoryFilter === c}
            label={`${CATEGORY_META[c].label} (${counts[c]})`}
            onClick={() => setCategoryFilter(c)}
            colorClass={CATEGORY_META[c].color}
          />
        ))}
      </div>

      {/* ── Reviews list ── */}
      <Card>
        <CardContent className="p-0">
          {reviewsQuery.isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">Loading…</p>
          ) : reviews.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No reviews in this view.</p>
          ) : (
            <ul className="divide-y divide-border">
              {reviews.map((r) => (
                <ReviewListItem
                  key={r.id}
                  review={r}
                  onOpen={() => setSelectedReviewId(r.id)}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* ── Themes + testimonials ── */}
      {snapshotQuery.data && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-success" />
                <CardTitle className="text-base">Top positive themes</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Feed into marketing — these become testimonials, ad copy, landing page quotes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {snapshotQuery.data.topPositiveThemes.map((t) => (
                <ThemeRow key={t.theme} theme={t.theme} count={t.count} sample={t.sampleQuote} positive />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-destructive" />
                <CardTitle className="text-base">Top complaints → ops</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Repeat complaints surface here. Accountability loop with ops team.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {snapshotQuery.data.topComplaintsForOps.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No recurring complaints detected.
                </p>
              ) : (
                snapshotQuery.data.topComplaintsForOps.map((c, i) => (
                  <div key={i} className="flex items-start gap-2 rounded border border-destructive/20 bg-destructive/5 p-2">
                    <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-destructive" />
                    <p className="text-xs text-foreground">{c}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Testimonial library ── */}
      <TestimonialLibrary businessId={businessId} />

      {/* ── Review detail drawer ── */}
      <Sheet
        open={!!selectedReviewId}
        onOpenChange={(open) => !open && setSelectedReviewId(null)}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          {selectedReviewId && (
            <ReviewDetailPanel
              businessId={businessId!}
              reviewId={selectedReviewId}
              onClose={() => setSelectedReviewId(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

function PlatformSnapshotCard({
  data,
}: {
  data: {
    platform: ReviewPlatform;
    currentAvgRating: number;
    reviewCount: number;
    monthlyVelocity: number;
    trajectory3m: number;
    responseRate: number;
    avgResponseTimeHours: number;
  };
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {PLATFORM_LABELS[data.platform] ?? data.platform}
          </p>
          <Badge variant="outline" className="text-[10px] tabular-nums">
            {data.reviewCount} reviews
          </Badge>
        </div>
        <div className="mt-1 flex items-end gap-2">
          <p className="text-3xl font-semibold tabular-nums text-foreground">
            {data.currentAvgRating.toFixed(2)}
          </p>
          <Star className="mb-1 h-5 w-5 fill-warning text-warning" />
        </div>
        <div className="mt-2 space-y-1 text-[11px]">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Velocity</span>
            <span className="tabular-nums">{data.monthlyVelocity}/month</span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Response rate</span>
            <span
              className={`tabular-nums ${
                data.responseRate >= 0.5 ? "text-success" : "text-warning"
              }`}
            >
              {(data.responseRate * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Avg response time</span>
            <span className="tabular-nums">{data.avgResponseTimeHours.toFixed(1)}h</span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span>3m trajectory</span>
            <span
              className={`tabular-nums ${
                data.trajectory3m > 0 ? "text-success" : data.trajectory3m < 0 ? "text-destructive" : ""
              }`}
            >
              {data.trajectory3m > 0 ? "+" : ""}
              {data.trajectory3m.toFixed(2)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BenchmarkBlock({
  label,
  value,
  suffix,
  highlight,
}: {
  label: string;
  value: string;
  suffix?: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded border border-border p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={`mt-1 text-lg font-semibold capitalize tabular-nums ${
          highlight ? "text-success" : "text-foreground"
        }`}
      >
        {value} {suffix ?? ""}
      </p>
    </div>
  );
}

function FilterChip({
  active,
  label,
  onClick,
  colorClass,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  colorClass?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
        active
          ? colorClass ?? "border-primary bg-primary/10 text-foreground"
          : "border-border text-muted-foreground hover:bg-muted"
      }`}
    >
      {label}
    </button>
  );
}

function ReviewListItem({ review, onOpen }: { review: ReviewRow; onOpen: () => void }) {
  const meta = CATEGORY_META[review.category];
  const Icon = meta.icon;
  return (
    <li
      onClick={onOpen}
      className="cursor-pointer p-4 transition-colors hover:bg-muted/30"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className={`text-[10px] ${meta.color}`}>
              <Icon className="mr-0.5 h-2.5 w-2.5" />
              {meta.label}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {PLATFORM_LABELS[review.platform] ?? review.platform}
            </Badge>
            <Badge variant="outline" className={`text-[10px] ${URGENCY_META[review.urgency]}`}>
              {review.urgency}
            </Badge>
            {review.isSuspicious && (
              <Badge variant="outline" className="text-[10px] text-warning border-warning/40">
                suspicious
              </Badge>
            )}
            {review.legalFlags.length > 0 && (
              <Badge variant="outline" className="text-[10px] text-destructive border-destructive/40">
                legal review
              </Badge>
            )}
          </div>
          <p className="mt-1.5 text-sm font-medium text-foreground">
            {review.title || review.body.slice(0, 100) + (review.body.length > 100 ? "…" : "")}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {review.reviewerName} · {new Date(review.postedAt).toLocaleDateString()} · {review.rating}⭐
          </p>
          {review.topics.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {review.topics.map((t) => (
                <span
                  key={t}
                  className="rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground"
                >
                  {t.replace("_", " ")}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge
            variant="outline"
            className={`text-[10px] capitalize ${
              review.responseStatus === "responded"
                ? "border-success/40 text-success"
                : review.responseStatus === "awaiting_approval"
                  ? "border-warning/40 text-warning"
                  : ""
            }`}
          >
            {review.responseStatus.replace("_", " ")}
          </Badge>
          {review.slaDeadline && (
            <p className="text-[10px] text-muted-foreground">
              SLA {new Date(review.slaDeadline).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </div>
    </li>
  );
}

function ThemeRow({
  theme,
  count,
  sample,
  positive,
}: {
  theme: string;
  count: number;
  sample: string;
  positive?: boolean;
}) {
  return (
    <div
      className={`rounded border p-2 ${
        positive ? "border-success/20 bg-success/5" : "border-destructive/20 bg-destructive/5"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">{theme}</p>
        <Badge variant="outline" className="text-[10px]">
          {count}
        </Badge>
      </div>
      <p className="mt-0.5 text-[11px] italic text-muted-foreground">"{sample}"</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Review detail panel with response drafting
// ---------------------------------------------------------------------------

function ReviewDetailPanel({
  businessId,
  reviewId,
  onClose,
}: {
  businessId: string;
  reviewId: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const detailQuery = useQuery({
    queryKey: ["wf4", "review", businessId, reviewId],
    queryFn: () => wf4GetReview({ business_id: businessId, review_id: reviewId }),
    retry: false,
  });

  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [editedBody, setEditedBody] = useState("");

  const generate = useMutation({
    mutationFn: (regenerate?: boolean) =>
      wf4GenerateResponse({ businessId, reviewId, regenerate }),
    onSuccess: (d) => {
      toast.success(`${d.drafts.length} draft${d.drafts.length > 1 ? "s" : ""} ready`);
      qc.invalidateQueries({ queryKey: ["wf4", "review", businessId, reviewId] });
      if (d.drafts.length > 0) {
        setSelectedDraftId(d.drafts[0].id);
        setEditedBody(d.drafts[0].body);
      }
    },
    onError: (e: Error) => toast.error(e.message || "Failed to draft"),
  });

  const publish = useMutation({
    mutationFn: () =>
      wf4PublishResponse({
        businessId,
        reviewId,
        draftId: selectedDraftId!,
        editedBody: editedBody || undefined,
      }),
    onSuccess: () => {
      toast.success("Response published");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message || "Failed to publish"),
  });

  const dispute = useMutation({
    mutationFn: () => wf4DisputeReview({ businessId, reviewId }),
    onSuccess: () => {
      toast.success("Dispute submitted");
      onClose();
    },
  });

  const ignore = useMutation({
    mutationFn: () => wf4IgnoreReview({ businessId, reviewId }),
    onSuccess: () => {
      toast.success("Review marked ignored");
      onClose();
    },
  });

  const d = detailQuery.data;
  if (detailQuery.isLoading)
    return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
  if (!d) return <p className="text-sm text-muted-foreground">Review not found.</p>;

  const meta = CATEGORY_META[d.category];
  const Icon = meta.icon;

  return (
    <div className="space-y-4">
      <SheetHeader>
        <SheetTitle className="flex flex-wrap items-center gap-2">
          <Icon className="h-4 w-4" />
          {d.reviewerName} · {d.rating}⭐
          <Badge variant="outline" className={`text-[10px] ${meta.color}`}>
            {meta.label}
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            {PLATFORM_LABELS[d.platform] ?? d.platform}
          </Badge>
        </SheetTitle>
        <SheetDescription className="text-xs">
          {new Date(d.postedAt).toLocaleString()} · authenticity {d.authenticityScore}/100
          {d.transactionVerified ? " · transaction verified" : ""}
        </SheetDescription>
      </SheetHeader>

      {/* Review body */}
      <div className="rounded border border-border bg-muted/40 p-3">
        {d.title && <p className="text-sm font-medium text-foreground">{d.title}</p>}
        <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{d.body}</p>
        {d.topics.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {d.topics.map((t) => (
              <Badge key={t} variant="outline" className="text-[10px]">
                {t.replace("_", " ")}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Suspicion/legal warnings */}
      {d.isSuspicious && (
        <div className="rounded border border-warning/30 bg-warning/5 p-2">
          <p className="text-xs font-medium text-warning">Authenticity concern</p>
          <p className="text-[11px] text-muted-foreground">
            Score {d.authenticityScore}/100 — consider dispute instead of response.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-1.5"
            onClick={() => dispute.mutate()}
            disabled={dispute.isPending}
          >
            Draft platform dispute
          </Button>
        </div>
      )}
      {d.legalFlags.length > 0 && (
        <div className="rounded border border-destructive/30 bg-destructive/5 p-2">
          <p className="text-xs font-medium text-destructive">Legal exposure</p>
          <p className="text-[11px] text-muted-foreground">
            Flags: {d.legalFlags.join(", ")}. Legal counsel consultation recommended
            before public response.
          </p>
        </div>
      )}

      {/* Response drafting */}
      <Tabs defaultValue="response">
        <TabsList>
          <TabsTrigger value="response">AI response</TabsTrigger>
          <TabsTrigger value="drafts">
            Drafts {d.draftedResponses.length > 0 && `(${d.draftedResponses.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="response" className="space-y-3 pt-3">
          {d.draftedResponses.length === 0 ? (
            <div className="rounded border border-dashed border-border p-4 text-center">
              <p className="text-sm text-muted-foreground">
                No drafts yet. Generate 1–3 variants tailored to this review.
              </p>
              <Button
                size="sm"
                className="mt-2"
                onClick={() => generate.mutate(false)}
                disabled={generate.isPending}
              >
                {generate.isPending ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-1.5 h-4 w-4" />
                )}
                Draft response{d.category === "negative" || d.category === "critical" ? "s" : ""}
              </Button>
            </div>
          ) : (
            <>
              {d.draftedResponses.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {d.draftedResponses.map((dft, i) => (
                    <button
                      key={dft.id}
                      type="button"
                      onClick={() => {
                        setSelectedDraftId(dft.id);
                        setEditedBody(dft.body);
                      }}
                      className={`rounded border px-2 py-1 text-[11px] ${
                        selectedDraftId === dft.id
                          ? "border-primary bg-primary/10"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      Variant {i + 1} · score {dft.personalizationScore}/100
                    </button>
                  ))}
                </div>
              )}
              <Textarea
                className="min-h-[180px]"
                value={editedBody || d.draftedResponses[0].body}
                onChange={(e) => setEditedBody(e.target.value)}
              />
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-muted-foreground">
                  {(editedBody || d.draftedResponses[0].body).split(/\s+/).filter(Boolean).length} words ·
                  personalization {d.draftedResponses[0].personalizationScore}/100 · brand voice {d.draftedResponses[0].brandVoiceMatchScore}/100
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => generate.mutate(true)}
                    disabled={generate.isPending}
                  >
                    Regenerate
                  </Button>
                  <Button size="sm" onClick={() => publish.mutate()} disabled={publish.isPending}>
                    {publish.isPending ? (
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-1.5 h-4 w-4" />
                    )}
                    Approve &amp; publish
                  </Button>
                </div>
              </div>
              {d.draftedResponses[0].psychologyLevers.length > 0 && (
                <div className="rounded border border-primary/20 bg-primary/5 p-2">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-primary">
                    Psychology levers
                  </p>
                  <p className="mt-0.5 text-[11px] text-foreground">
                    {d.draftedResponses[0].psychologyLevers.join(" · ")}
                  </p>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="drafts" className="space-y-2 pt-3">
          {d.draftedResponses.map((dft) => (
            <div key={dft.id} className="rounded border border-border p-3">
              <p className="text-[11px] text-muted-foreground">
                {new Date(dft.createdAt).toLocaleString()} · {dft.wordCount} words
              </p>
              <p className="mt-1 text-sm text-foreground">{dft.body}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {dft.signatureName}, {dft.signatureTitle}
              </p>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={() => ignore.mutate()}>
          Mark ignored
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Testimonial library
// ---------------------------------------------------------------------------

function TestimonialLibrary({ businessId }: { businessId: string | null }) {
  const qc = useQueryClient();
  const libQuery = useQuery({
    queryKey: ["wf4", "testimonials", businessId],
    queryFn: () => wf4GetTestimonialLibrary({ business_id: businessId! }),
    enabled: !!businessId,
    retry: false,
  });

  const requestPerm = useMutation({
    mutationFn: (reviewId: string) =>
      wf4RequestTestimonialPermission({ businessId: businessId!, reviewId }),
    onSuccess: () => {
      toast.success("Permission email sent");
      qc.invalidateQueries({ queryKey: ["wf4", "testimonials", businessId] });
    },
  });

  if (!libQuery.data || libQuery.data.items.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Testimonial library</CardTitle>
        <CardDescription className="text-xs">
          5⭐ reviews with specific, vivid language. With reviewer permission,
          these feed into Workflow #1 (content) and #10 (Studio).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {libQuery.data.items.slice(0, 6).map((t) => (
          <div
            key={t.reviewId}
            className="rounded border border-border p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-sm italic text-foreground">"{t.quote}"</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  — {t.reviewerName}, {PLATFORM_LABELS[t.platform] ?? t.platform}
                </p>
              </div>
              <Badge
                variant="outline"
                className={`text-[10px] capitalize ${
                  t.permissionStatus === "granted"
                    ? "border-success/40 text-success"
                    : t.permissionStatus === "requested"
                      ? "border-warning/40 text-warning"
                      : ""
                }`}
              >
                {t.permissionStatus.replace("_", " ")}
              </Badge>
            </div>
            {t.permissionStatus === "not_requested" && (
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() => requestPerm.mutate(t.reviewId)}
                disabled={requestPerm.isPending}
              >
                Request permission
              </Button>
            )}
            {t.usedIn.length > 0 && (
              <p className="mt-1 text-[10px] text-muted-foreground">
                Used in: {t.usedIn.join(", ")}
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
