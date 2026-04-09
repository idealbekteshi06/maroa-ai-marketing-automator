import { useCallback, useEffect, useState } from "react";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";
import * as api from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Star, MessageCircle, Loader2, Bot, Send, CheckCircle2 } from "lucide-react";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/lib/errorMessages";

interface Review {
  id: string;
  business_id: string;
  reviewer_name: string;
  rating: number;
  text: string;
  sentiment: string | null;
  response_status: string | null;
  response_text: string | null;
  response_draft: string | null;
  platform: string | null;
  review_date: string | null;
  created_at: string;
}

const sentimentBadge: Record<string, { bg: string; text: string; label: string }> = {
  positive: { bg: "bg-green-500/10", text: "text-green-600 dark:text-green-400", label: "\u2713 Positive" },
  neutral: { bg: "bg-muted", text: "text-muted-foreground", label: "\u2014 Neutral" },
  negative: { bg: "bg-red-500/10", text: "text-red-600 dark:text-red-400", label: "\u2715 Negative" },
};

const avatarColors = [
  "bg-blue-500", "bg-purple-500", "bg-green-500", "bg-orange-500",
  "bg-pink-500", "bg-teal-500", "bg-indigo-500", "bg-rose-500",
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  const filled = Math.round(Math.max(0, Math.min(5, Number(rating) || 0)));
  return (
    <span style={{ display: "inline-flex", gap: "2px", lineHeight: 1 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ fontSize: size, color: i <= filled ? "#F59E0B" : "var(--border-strong)", userSelect: "none" }}>★</span>
      ))}
    </span>
  );
}

export default function DashboardReviews() {
  const { businessId, isReady } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editDrafts, setEditDrafts] = useState<Record<string, string>>({});

  // Send review request dialog
  const [requestOpen, setRequestOpen] = useState(false);
  const [contactEmail, setContactEmail] = useState("");
  const [contactName, setContactName] = useState("");
  const [requestSending, setRequestSending] = useState(false);

  const fetchReviews = useCallback(async () => {
    if (!businessId || !isReady) { setLoading(false); return; }
    try {
      const { data, error } = await externalSupabase
        .from("reviews")
        .select("*")
        .eq("business_id", businessId)
        .order("review_date", { ascending: false });
      if (error) throw error;
      setReviews((data as Review[]) ?? []);
    } catch {
      toast.error(ERROR_MESSAGES.GENERATION_FAILED);
    }
  }, [businessId, isReady]);

  useEffect(() => {
    if (!businessId || !isReady) { setLoading(false); return; }
    const load = async () => {
      setLoading(true);
      await fetchReviews();
      setLoading(false);
    };
    load();
  }, [businessId, fetchReviews, isReady]);

  const handleGenerateResponse = async (reviewId: string) => {
    if (!businessId) return;
    setGeneratingId(reviewId);
    try {
      await api.reviewResponseGenerate({ business_id: businessId, review_id: reviewId });
      toast.success(SUCCESS_MESSAGES.GENERATED);
      await fetchReviews();
    } catch {
      toast.error(ERROR_MESSAGES.GENERATION_FAILED);
    } finally {
      setGeneratingId(null);
    }
  };

  const handlePublishResponse = async (reviewId: string) => {
    if (!businessId) return;
    const draftText = editDrafts[reviewId];
    setPublishingId(reviewId);
    try {
      await api.reviewResponsePublish({ business_id: businessId, review_id: reviewId, response_text: draftText });
      toast.success(SUCCESS_MESSAGES.GENERATED);
      await fetchReviews();
    } catch {
      toast.error(ERROR_MESSAGES.GENERATION_FAILED);
    } finally {
      setPublishingId(null);
    }
  };

  const handleSendRequest = async () => {
    if (!businessId || !contactEmail || !contactName) return;
    setRequestSending(true);
    try {
      await api.reviewRequestSend({ business_id: businessId, contact_email: contactEmail, contact_name: contactName });
      toast.success(SUCCESS_MESSAGES.GENERATED);
      setRequestOpen(false);
      setContactEmail(""); setContactName("");
    } catch {
      toast.error(ERROR_MESSAGES.GENERATION_FAILED);
    } finally {
      setRequestSending(false);
    }
  };

  // Compute summary stats
  const totalCount = reviews.length;
  const avgRating = totalCount > 0 ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / totalCount : 0;
  const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
  const starCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(r => {
    const s = r.sentiment as keyof typeof sentimentCounts;
    if (s && sentimentCounts[s] !== undefined) sentimentCounts[s]++;
    const star = r.rating;
    if (star >= 1 && star <= 5) starCounts[star]++;
  });

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-28 rounded-lg border border-border bg-card animate-pulse" />
        ))}
      </div>
    );
  }

  const reviewRequestDialog = (
    <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Review Request</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <Input placeholder="Contact name" value={contactName} onChange={e => setContactName(e.target.value)} />
          <Input placeholder="Contact email" type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} />
          <Button className="w-full" onClick={handleSendRequest} disabled={requestSending || !contactEmail || !contactName}>
            {requestSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Send Request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  // Summary section (always shown)
  const summarySection = (
    <div className="rounded-lg border border-border bg-card p-5 shadow-meta">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Average Rating */}
        <div className="flex flex-col items-center justify-center text-center">
          <p className="text-3xl font-bold text-foreground">{avgRating.toFixed(1)}</p>
          <StarRating rating={avgRating} size={22} />
          <p className="text-xs text-muted-foreground mt-1">{totalCount} review{totalCount !== 1 ? "s" : ""}</p>
        </div>

        {/* Sentiment Breakdown */}
        <div className="flex flex-col justify-center">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Sentiment</p>
          <div className="space-y-2">
            {[
              { label: "Positive", count: sentimentCounts.positive, color: "#16A34A" },
              { label: "Neutral", count: sentimentCounts.neutral, color: "var(--text-muted)" },
              { label: "Negative", count: sentimentCounts.negative, color: "#DC2626" },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[13px] text-foreground">
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, display: "inline-block", flexShrink: 0 }} />
                  {s.label}
                </span>
                <span className="text-[13px] font-semibold text-foreground">
                  {s.count} <span className="text-muted-foreground font-normal">({totalCount > 0 ? Math.round((s.count / totalCount) * 100) : 0}%)</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Star Distribution */}
        <div className="sm:col-span-2 flex flex-col justify-center">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Rating Distribution</p>
          <div className="space-y-1">
            {[5, 4, 3, 2, 1].map(star => {
              const count = starCounts[star] || 0;
              const pct = totalCount > 0 ? (count / totalCount) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-6 text-right">{star}★</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-yellow-400 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground w-6">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  if (reviews.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button size="sm" className="h-9 text-xs" onClick={() => setRequestOpen(true)}>
            <Send className="mr-1.5 h-3.5 w-3.5" /> Send Review Request
          </Button>
        </div>
        {summarySection}
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <Star className="mx-auto h-10 w-10 text-yellow-400/30" />
          <h3 className="mt-4 text-sm font-semibold text-foreground">No reviews yet</h3>
          <p className="mt-1.5 text-xs text-muted-foreground max-w-xs mx-auto">Send review requests to customers after their visit. Your AI monitors and responds to reviews automatically.</p>
          <Button size="sm" className="mt-4" onClick={() => setRequestOpen(true)}>Send Your First Review Request</Button>
        </div>
        {reviewRequestDialog}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary">
          <Bot className="h-3 w-3" /> AI is handling this
        </span>
        <Button size="sm" className="h-9 text-xs" onClick={() => setRequestOpen(true)}>
          <Send className="mr-1.5 h-3.5 w-3.5" /> Send Review Request
        </Button>
      </div>

      {/* Summary */}
      {summarySection}

      {/* Reviews */}
      <div className="space-y-3">
        {reviews.map(r => {
          const sBadge = sentimentBadge[r.sentiment ?? "neutral"] ?? sentimentBadge.neutral;
          const initial = (r.reviewer_name || "A").charAt(0).toUpperCase();
          const isExpanded = expandedId === r.id;
          const textTruncated = r.text && r.text.length > 150;
          const displayText = isExpanded || !textTruncated ? r.text : r.text?.slice(0, 150) + "...";

          // Initialize draft text for editing
          if (r.response_draft && editDrafts[r.id] === undefined) {
            setEditDrafts(prev => ({ ...prev, [r.id]: r.response_draft! }));
          }

          return (
            <div
              key={r.id}
              className="rounded-lg border border-border bg-card p-5 shadow-meta transition-shadow hover:shadow-meta-hover"
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white text-sm font-semibold ${getAvatarColor(r.reviewer_name || "A")}`}>
                  {initial}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Name + date row */}
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-semibold text-foreground">{r.reviewer_name || "Anonymous"}</span>
                    {r.review_date && (
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(r.review_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    )}
                  </div>

                  {/* Stars + badges row */}
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <StarRating rating={r.rating ?? 0} />
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${sBadge.bg} ${sBadge.text}`}>
                      {sBadge.label}
                    </span>
                    {r.platform && (
                      <span className="inline-block rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        {r.platform}
                      </span>
                    )}
                  </div>

                  {/* Review text */}
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {displayText}
                    {textTruncated && (
                      <button
                        className="ml-1 text-primary text-xs font-medium hover:underline"
                        onClick={() => setExpandedId(isExpanded ? null : r.id)}
                      >
                        {isExpanded ? "Show less" : "Read more"}
                      </button>
                    )}
                  </p>

                  {/* Response section */}
                  {r.response_status === "published" && r.response_text ? (
                    <div className="mt-3 rounded-md bg-muted/50 p-3 border-l-2 border-green-500">
                      <div className="flex items-center gap-1.5 mb-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        <p className="text-[11px] font-medium text-green-600 dark:text-green-400">Published Response</p>
                      </div>
                      <p className="text-xs text-foreground">{r.response_text}</p>
                    </div>
                  ) : r.response_status === "draft_ready" && r.response_draft ? (
                    <div className="mt-3 rounded-md bg-muted/50 p-3 border-l-2 border-primary space-y-2">
                      <p className="text-[11px] font-medium text-muted-foreground">AI Draft Response</p>
                      <Textarea
                        className="text-xs min-h-[80px]"
                        value={editDrafts[r.id] ?? r.response_draft}
                        onChange={e => setEditDrafts(prev => ({ ...prev, [r.id]: e.target.value }))}
                      />
                      <Button
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => handlePublishResponse(r.id)}
                        disabled={publishingId === r.id}
                      >
                        {publishingId === r.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Send className="mr-1 h-3 w-3" />}
                        Publish
                      </Button>
                    </div>
                  ) : (!r.response_status || r.response_status === "pending") ? (
                    <div className="mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => handleGenerateResponse(r.id)}
                        disabled={generatingId === r.id}
                      >
                        {generatingId === r.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Bot className="mr-1 h-3 w-3" />}
                        Generate AI Response
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {reviewRequestDialog}
    </div>
  );
}
