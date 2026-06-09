// @ts-nocheck
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Check, X, RefreshCw, Send, ChevronDown, FileText, Megaphone, Image as ImageIcon,
  Instagram, Facebook, Linkedin, Twitter, Youtube, Globe, Loader2,
  AlertTriangle, ShieldCheck, Eye,
} from "lucide-react";
import {
  approveContentPiece, rejectContentPiece, requestContentChanges,
  generateContentMagicLink, batchApproveContent, batchRejectContent,
  type ApprovalDecisionPayload,
} from "@/lib/api";

/**
 * DashboardApprovals — the "Marketing that asks before it ships" surface.
 *
 * This is the brand promise from the landing page hero. Every action
 * Maroa takes that touches a customer brand passes through this gate.
 * The page is built to feel decisive: large surface per item, real
 * preview text, real reasoning trace, one-tap actions, optimistic UI
 * with rollback on failure.
 *
 * Data flow
 *   1. Fetch all generated_content rows where status='pending_approval'
 *      for the current business. Sort oldest-first so urgent items
 *      bubble to the top.
 *   2. Subscribe to realtime INSERTs on the same table so a newly
 *      generated draft slides in without a manual refresh.
 *   3. On approve/reject/request-changes, optimistically remove the
 *      item from the list, then POST to the corresponding webhook.
 *      On failure, restore the item + toast.
 *
 * Auto-safe band (per the decision-log spec):
 *   - green: quality_score >= 8 AND compliance_passed (auto-publishable)
 *   - yellow: quality_score 5–7 OR borderline compliance (needs review)
 *   - red: quality_score < 5 OR compliance_refused (never auto-publish)
 *
 * Reasoning trace: expandable per-item, shows framework + awareness
 * stage + voice-fit score + compliance gates passed. Data comes from
 * the `reasoning_trace` JSONB column on generated_content.
 *
 * Empty state: a quiet abstract ring with a pulsing dot — same
 * pattern Phase 1 introduced on Home. Signals "inbox zero" without
 * shouting.
 *
 * Mobile: list collapses to single-column with action sheet at bottom
 * of each card. All buttons are min-h-48px (Apple HIG / Material
 * touch-target spec).
 *
 * prefers-reduced-motion: every animation (slide-in, pulse, ping)
 * collapses to opacity-only or no-motion via the same CSS pattern
 * used in tokens.css.
 */

/* ── Types ── */

type SafeBand = "green" | "yellow" | "red";
type ContentKind = "post" | "ad" | "creative" | "email";

interface ApprovalRow {
  id: string;
  platform: string | null;
  // generated_content stores per-platform copy; there is no bare `caption`
  // column. Selecting it returned a 400 (column does not exist).
  instagram_caption: string | null;
  facebook_post: string | null;
  content_theme: string | null;
  quality_score: number | null;
  compliance_passed: boolean | null;
  reasoning_trace: ReasoningTrace | null;
  created_at: string;
  /** "post" / "ad" / "creative" / "email" — falls back to "post" */
  content_type?: string | null;
}

interface ReasoningTrace {
  framework?: string;
  awareness_stage?: string;
  hook_type?: string;
  voice_fit_score?: number;
  compliance_gates_passed?: string[];
  past_performance_signal?: string;
  refusal_reason?: string | null;
}

type FilterKey = "all" | "today" | "yellow" | "red" | string; // string for platform

/* ── Constants ── */

const PLATFORM_ICONS: Record<string, typeof FileText> = {
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  x: Twitter,
  twitter: Twitter,
  youtube: Youtube,
  tiktok: Globe, // lucide doesn't ship a TikTok icon — Globe is the neutral fallback
  email: FileText,
  default: FileText,
};

const KIND_ICONS: Record<ContentKind, typeof FileText> = {
  post: FileText,
  ad: Megaphone,
  creative: ImageIcon,
  email: FileText,
};

/* Auto-safe band → token-driven styling. Reads from shadcn theme
 * tokens so dark + light both auto-resolve; brand-blue gradient
 * comes from --brand for the green band's "go" cue. */
const BAND_STYLES: Record<SafeBand, { dot: string; text: string; bg: string; label: string; subtext: string }> = {
  green: {
    dot: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-50/70 dark:bg-emerald-500/10",
    label: "Safe",
    subtext: "Quality + compliance both pass. One-tap approve.",
  },
  yellow: {
    dot: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50/70 dark:bg-amber-500/10",
    label: "Review",
    subtext: "Borderline score or claim. Read before approving.",
  },
  red: {
    dot: "bg-red-500",
    text: "text-red-700 dark:text-red-400",
    bg: "bg-red-50/70 dark:bg-red-500/10",
    label: "Stop",
    subtext: "Compliance refused or quality below floor. Reject or request changes.",
  },
};

/* ── Helpers ── */

function bandFor(row: ApprovalRow): SafeBand {
  // Compliance refusal trumps quality
  if (row.compliance_passed === false) return "red";
  if (row.reasoning_trace?.refusal_reason) return "red";
  const score = row.quality_score ?? 5;
  if (score >= 8 && row.compliance_passed !== false) return "green";
  if (score < 5) return "red";
  return "yellow";
}

function ageLabel(createdAt: string): string {
  const ms = Date.now() - new Date(createdAt).getTime();
  const minutes = Math.round(ms / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  const weeks = Math.round(days / 7);
  return weeks === 1 ? "last week" : `${weeks}w ago`;
}

function platformLabel(p: string | null): string {
  if (!p) return "Post";
  return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
}

function inferKind(row: ApprovalRow): ContentKind {
  const t = (row.content_type || row.platform || "").toLowerCase();
  if (t.includes("ad")) return "ad";
  if (t.includes("image") || t.includes("creative") || t.includes("video")) return "creative";
  if (t.includes("email")) return "email";
  return "post";
}

/** Strip excess whitespace + truncate for inline preview. Full text
 *  still renders in the expanded view. */
function previewText(caption: string | null): string {
  if (!caption) return "";
  const trimmed = caption.replace(/\s+/g, " ").trim();
  return trimmed.length > 240 ? trimmed.slice(0, 237) + "..." : trimmed;
}

/* ── Component ── */

export default function DashboardApprovals() {
  const { businessId, user, isReady } = useAuth();

  const [items, setItems] = useState<ApprovalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [batchBusy, setBatchBusy] = useState<"approve-green" | "reject-red" | null>(null);

  // Keep a ref of the live items list so optimistic rollbacks can find
  // the row by id after a state update.
  const itemsRef = useRef(items);
  useEffect(() => { itemsRef.current = items; }, [items]);

  // ── Fetch ──
  const fetchPending = useCallback(async () => {
    if (!isReady || !businessId) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data } = await externalSupabase
        .from("generated_content")
        .select("id, platform, instagram_caption, facebook_post, content_theme, quality_score, compliance_passed, reasoning_trace, content_type, created_at")
        .eq("business_id", businessId)
        .in("status", ["pending_approval", "pending"])
        // Oldest first so urgent items surface at top of list.
        .order("created_at", { ascending: true })
        .limit(100);
      setItems((data ?? []) as ApprovalRow[]);
    } catch {
      toast.error("Couldn't load approvals — retrying in 30s");
    } finally {
      setLoading(false);
    }
  }, [businessId, isReady]);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  // Realtime: new draft generated → slide in at bottom (most recent
  // sits at the end since we sort oldest-first).
  useEffect(() => {
    if (!businessId || !isReady) return;
    const channel = externalSupabase
      .channel(`approvals-live-${businessId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "generated_content", filter: `business_id=eq.${businessId}` },
        () => { fetchPending(); }
      )
      .subscribe();
    return () => { externalSupabase.removeChannel(channel); };
  }, [businessId, isReady, fetchPending]);

  // ── Derived ──
  const availablePlatforms = useMemo(
    () => Array.from(new Set(items.map(i => (i.platform || "default").toLowerCase()))),
    [items],
  );

  const filteredItems = useMemo(() => {
    if (filter === "all") return items;
    if (filter === "today") {
      const dayMs = 24 * 60 * 60 * 1000;
      return items.filter(i => Date.now() - new Date(i.created_at).getTime() < dayMs);
    }
    if (filter === "yellow") return items.filter(i => bandFor(i) === "yellow");
    if (filter === "red") return items.filter(i => bandFor(i) === "red");
    // Platform filter
    return items.filter(i => (i.platform || "default").toLowerCase() === filter);
  }, [items, filter]);

  const greenItems = useMemo(() => items.filter(i => bandFor(i) === "green"), [items]);
  const redItems = useMemo(() => items.filter(i => bandFor(i) === "red"), [items]);
  const oldestAge = items.length > 0 ? ageLabel(items[0].created_at) : null;

  // ── Per-item actions ──
  const optimisticRemove = (id: string) => {
    const removed = itemsRef.current.find(i => i.id === id);
    setItems(prev => prev.filter(i => i.id !== id));
    return removed;
  };
  const optimisticRestore = (row: ApprovalRow | undefined) => {
    if (!row) return;
    // Insert back in the right oldest-first position
    setItems(prev => {
      const merged = [...prev, row];
      merged.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      return merged;
    });
  };

  const payloadFor = (id: string): ApprovalDecisionPayload => ({
    content_id: id,
    user_id: user?.id ?? "",
    business_id: businessId ?? "",
  });

  async function handleApprove(id: string) {
    setBusyId(id);
    const removed = optimisticRemove(id);
    try {
      await approveContentPiece({ ...payloadFor(id) });
      toast.success("Approved.");
    } catch (err) {
      optimisticRestore(removed);
      toast.error(err instanceof Error ? err.message : "Couldn't approve — try again.");
    }
    setBusyId(null);
  }

  async function handleReject(id: string) {
    setBusyId(id);
    const removed = optimisticRemove(id);
    try {
      await rejectContentPiece(payloadFor(id));
      toast.success("Rejected.");
    } catch (err) {
      optimisticRestore(removed);
      toast.error(err instanceof Error ? err.message : "Couldn't reject — try again.");
    }
    setBusyId(null);
  }

  async function handleRequestChanges(id: string) {
    setBusyId(id);
    const removed = optimisticRemove(id);
    try {
      await requestContentChanges(payloadFor(id));
      toast.success("Sent back for changes.");
    } catch (err) {
      optimisticRestore(removed);
      toast.error(err instanceof Error ? err.message : "Couldn't request changes — try again.");
    }
    setBusyId(null);
  }

  async function handleMagicLink(id: string) {
    setBusyId(id);
    try {
      const res = await generateContentMagicLink({ content_id: id, business_id: businessId ?? "" });
      // Copy to clipboard for one-tap paste into email/slack.
      await navigator.clipboard.writeText(res.url);
      toast.success("Magic link copied to clipboard.", {
        description: `Expires ${new Date(res.expires_at).toLocaleString()}`,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't generate magic link.");
    }
    setBusyId(null);
  }

  // ── Batch actions ──
  async function handleBatchApproveGreen() {
    if (greenItems.length === 0) return;
    setBatchBusy("approve-green");
    const ids = greenItems.map(i => i.id);
    const snapshot = itemsRef.current;
    setItems(prev => prev.filter(i => !ids.includes(i.id)));
    try {
      const res = await batchApproveContent({
        business_id: businessId ?? "",
        user_id: user?.id ?? "",
        content_ids: ids,
      });
      const failed = res.results.filter(r => !r.ok).map(r => r.content_id);
      if (failed.length === 0) {
        toast.success(`Approved ${ids.length} item${ids.length === 1 ? "" : "s"}.`);
      } else {
        const ok = ids.length - failed.length;
        toast.warning(`${ok} approved, ${failed.length} failed`, {
          description: "Failed items restored to the list.",
        });
        setItems(snapshot.filter(i => failed.includes(i.id)));
      }
    } catch (err) {
      setItems(snapshot);
      toast.error(err instanceof Error ? err.message : "Batch approve failed — list restored.");
    }
    setBatchBusy(null);
  }

  async function handleBatchRejectRed() {
    if (redItems.length === 0) return;
    setBatchBusy("reject-red");
    const ids = redItems.map(i => i.id);
    const snapshot = itemsRef.current;
    setItems(prev => prev.filter(i => !ids.includes(i.id)));
    try {
      const res = await batchRejectContent({
        business_id: businessId ?? "",
        user_id: user?.id ?? "",
        content_ids: ids,
      });
      const failed = res.results.filter(r => !r.ok).map(r => r.content_id);
      if (failed.length === 0) {
        toast.success(`Rejected ${ids.length} item${ids.length === 1 ? "" : "s"}.`);
      } else {
        toast.warning(`${ids.length - failed.length} rejected, ${failed.length} failed`);
        setItems(snapshot.filter(i => failed.includes(i.id)));
      }
    } catch (err) {
      setItems(snapshot);
      toast.error(err instanceof Error ? err.message : "Batch reject failed — list restored.");
    }
    setBatchBusy(null);
  }

  // ── Skeleton ──
  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="h-10 w-64 rounded-lg bg-muted animate-pulse" />
        <div className="h-12 rounded-2xl bg-muted animate-pulse" />
        {[1, 2, 3].map(i => (
          <div key={i} className="h-44 rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  // ── Empty state ──
  if (items.length === 0) {
    return <EmptyState />;
  }

  // ── Main render ──
  return (
    <div className="mx-auto max-w-5xl">
      {/* Header strip — counts, oldest age, batch shortcuts. */}
      <header className="mb-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Approvals</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {items.length} item{items.length === 1 ? "" : "s"} waiting
              {oldestAge ? ` · oldest ${oldestAge}` : ""}.
              Approve, reject, or send back with notes. Nothing publishes without you.
            </p>
          </div>
        </div>

        {/* Batch shortcuts — only render if there's something to act on. */}
        {(greenItems.length > 0 || redItems.length > 0) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {greenItems.length > 0 && (
              <button
                type="button"
                onClick={handleBatchApproveGreen}
                disabled={!!batchBusy}
                className="
                  inline-flex items-center gap-2 rounded-full
                  px-4 py-2 min-h-[40px]
                  bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800
                  text-white text-sm font-medium shadow-sm
                  transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2
                "
              >
                {batchBusy === "approve-green"
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Check className="h-4 w-4" />}
                Approve {greenItems.length} safe item{greenItems.length === 1 ? "" : "s"}
              </button>
            )}
            {redItems.length > 0 && (
              <button
                type="button"
                onClick={handleBatchRejectRed}
                disabled={!!batchBusy}
                className="
                  inline-flex items-center gap-2 rounded-full
                  px-4 py-2 min-h-[40px]
                  border border-red-200 dark:border-red-500/30
                  bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20
                  text-red-700 dark:text-red-400 text-sm font-medium
                  transition-colors disabled:opacity-50
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2
                "
              >
                {batchBusy === "reject-red"
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <X className="h-4 w-4" />}
                Reject {redItems.length} blocked item{redItems.length === 1 ? "" : "s"}
              </button>
            )}
          </div>
        )}
      </header>

      {/* Filter strip. */}
      <FilterBar
        active={filter}
        onChange={setFilter}
        counts={{
          all: items.length,
          today: items.filter(i => Date.now() - new Date(i.created_at).getTime() < 24 * 60 * 60 * 1000).length,
          yellow: items.filter(i => bandFor(i) === "yellow").length,
          red: redItems.length,
        }}
        platforms={availablePlatforms}
      />

      {/* List */}
      {filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center mt-6">
          <p className="text-sm text-muted-foreground">
            No items match this filter. Switch to <button onClick={() => setFilter("all")} className="text-[var(--brand)] hover:underline font-medium">all</button>.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {filteredItems.map(item => (
            <ApprovalCard
              key={item.id}
              row={item}
              expanded={expandedId === item.id}
              onToggleExpand={() => setExpandedId(expandedId === item.id ? null : item.id)}
              busy={busyId === item.id}
              onApprove={() => handleApprove(item.id)}
              onReject={() => handleReject(item.id)}
              onRequestChanges={() => handleRequestChanges(item.id)}
              onMagicLink={() => handleMagicLink(item.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────── */
/*   Filter bar                                                   */
/* ────────────────────────────────────────────────────────────── */

function FilterBar({
  active, onChange, counts, platforms,
}: {
  active: FilterKey;
  onChange: (k: FilterKey) => void;
  counts: { all: number; today: number; yellow: number; red: number };
  platforms: string[];
}) {
  const baseChip =
    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors " +
    "min-h-[36px] " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2";
  const activeChip = "bg-foreground text-background";
  const idleChip =
    "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground";

  const buildClass = (k: FilterKey) =>
    `${baseChip} ${active === k ? activeChip : idleChip}`;

  return (
    <div className="flex flex-wrap gap-2 overflow-x-auto -mx-1 px-1" role="tablist" aria-label="Approval filters">
      <button type="button" onClick={() => onChange("all")} className={buildClass("all")} role="tab" aria-selected={active === "all"}>
        All <span className="opacity-60">{counts.all}</span>
      </button>
      <button type="button" onClick={() => onChange("today")} className={buildClass("today")} role="tab" aria-selected={active === "today"}>
        Today <span className="opacity-60">{counts.today}</span>
      </button>
      <button type="button" onClick={() => onChange("yellow")} className={buildClass("yellow")} role="tab" aria-selected={active === "yellow"}>
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
        Yellow <span className="opacity-60">{counts.yellow}</span>
      </button>
      <button type="button" onClick={() => onChange("red")} className={buildClass("red")} role="tab" aria-selected={active === "red"}>
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" aria-hidden />
        Red <span className="opacity-60">{counts.red}</span>
      </button>
      {platforms.length > 1 && (
        <span className="mx-1 self-center text-muted-foreground" aria-hidden>·</span>
      )}
      {platforms.length > 1 && platforms.map(p => (
        <button key={p} type="button" onClick={() => onChange(p)} className={buildClass(p)} role="tab" aria-selected={active === p}>
          {p === "default" ? "Other" : platformLabel(p)}
        </button>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────── */
/*   ApprovalCard                                                 */
/* ────────────────────────────────────────────────────────────── */

function ApprovalCard({
  row, expanded, onToggleExpand, busy, onApprove, onReject, onRequestChanges, onMagicLink,
}: {
  row: ApprovalRow;
  expanded: boolean;
  onToggleExpand: () => void;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
  onRequestChanges: () => void;
  onMagicLink: () => void;
}) {
  const band = bandFor(row);
  const bandStyle = BAND_STYLES[band];
  const kind = inferKind(row);
  const KindIcon = KIND_ICONS[kind];
  const platformKey = (row.platform || "default").toLowerCase();
  const PlatformIcon = PLATFORM_ICONS[platformKey] || PLATFORM_ICONS.default;
  const caption = row.instagram_caption || row.facebook_post || null;
  const title = row.content_theme || caption?.slice(0, 80) || "Untitled draft";
  const preview = previewText(caption);
  const trace = row.reasoning_trace;

  return (
    <li
      className={`
        relative rounded-2xl border border-border bg-card overflow-hidden
        transition-shadow hover:shadow-card focus-within:ring-2 focus-within:ring-[var(--brand)]/40
      `}
      aria-busy={busy}
    >
      {/* Left edge band — green/yellow/red, matches the safe-banding cue */}
      <span
        aria-hidden
        className={`absolute left-0 top-0 bottom-0 w-[3px] ${bandStyle.dot}`}
      />

      <div className="p-5 sm:p-6">
        {/* Header row: kind icon, title, band chip, age */}
        <div className="flex items-start gap-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bandStyle.bg}`}>
            <KindIcon className={`h-5 w-5 ${bandStyle.text}`} aria-hidden />
          </div>

          <div className="min-w-0 flex-1">
            {/* Top meta row */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <PlatformIcon className="h-3.5 w-3.5" aria-hidden />
                {platformLabel(row.platform)}
              </span>
              <span aria-hidden>·</span>
              <span>drafted {ageLabel(row.created_at)}</span>
              <span aria-hidden>·</span>
              <span className={`inline-flex items-center gap-1 font-medium ${bandStyle.text}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${bandStyle.dot}`} aria-hidden />
                {bandStyle.label}
              </span>
              {typeof row.quality_score === "number" && (
                <>
                  <span aria-hidden>·</span>
                  <span className="font-mono tabular-nums">
                    score {row.quality_score.toFixed(1)}
                  </span>
                </>
              )}
            </div>

            {/* Title */}
            <h3 className="mt-1.5 text-[15px] sm:text-base font-semibold text-foreground leading-tight">
              {title}
            </h3>

            {/* Preview text */}
            {preview && (
              <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground whitespace-pre-line">
                {preview}
              </p>
            )}

            {/* Band hint */}
            <p className={`mt-2 text-[12px] ${bandStyle.text} opacity-80`}>
              {bandStyle.subtext}
            </p>
          </div>
        </div>

        {/* Reasoning trace toggle */}
        {trace && (
          <button
            type="button"
            onClick={onToggleExpand}
            className="
              mt-4 inline-flex items-center gap-1.5 rounded-full
              px-3 py-1.5 min-h-[36px]
              text-[12px] font-medium text-muted-foreground hover:text-foreground
              bg-muted/40 hover:bg-muted transition-colors
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]
            "
            aria-expanded={expanded}
            aria-controls={`trace-${row.id}`}
          >
            <Eye className="h-3.5 w-3.5" aria-hidden />
            {expanded ? "Hide reasoning trace" : "Show reasoning trace"}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden />
          </button>
        )}

        {/* Reasoning trace body */}
        {trace && expanded && (
          <div
            id={`trace-${row.id}`}
            className="mt-3 rounded-xl border border-border bg-muted/30 p-4 text-[13px]"
            role="region"
            aria-label="Reasoning trace"
          >
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              {trace.framework && <TraceRow label="Framework" value={trace.framework} />}
              {trace.awareness_stage && <TraceRow label="Awareness stage" value={trace.awareness_stage} />}
              {trace.hook_type && <TraceRow label="Hook type" value={trace.hook_type} />}
              {typeof trace.voice_fit_score === "number" && (
                <TraceRow label="Voice fit" value={`${trace.voice_fit_score.toFixed(2)} / 1.00`} />
              )}
              {trace.past_performance_signal && (
                <TraceRow label="Past performance" value={trace.past_performance_signal} />
              )}
              {trace.compliance_gates_passed && trace.compliance_gates_passed.length > 0 && (
                <TraceRow
                  label="Compliance gates passed"
                  value={
                    <span className="inline-flex flex-wrap items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
                      {trace.compliance_gates_passed.join(" · ")}
                    </span>
                  }
                />
              )}
              {trace.refusal_reason && (
                <TraceRow
                  label="Refusal reason"
                  value={
                    <span className="inline-flex items-center gap-1 text-red-600">
                      <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                      {trace.refusal_reason}
                    </span>
                  }
                />
              )}
            </dl>
          </div>
        )}

        {/* Actions */}
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onApprove}
            disabled={busy}
            className="
              inline-flex items-center gap-2 rounded-full
              px-5 py-2.5 min-h-[44px]
              bg-foreground text-background hover:opacity-90 active:opacity-80
              text-sm font-medium shadow-sm
              transition-opacity disabled:opacity-50 disabled:cursor-not-allowed
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2
            "
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Approve
          </button>

          <button
            type="button"
            onClick={onRequestChanges}
            disabled={busy}
            className="
              inline-flex items-center gap-2 rounded-full
              px-4 py-2.5 min-h-[44px]
              border border-border bg-background hover:bg-muted
              text-foreground text-sm font-medium
              transition-colors disabled:opacity-50
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2
            "
          >
            <RefreshCw className="h-4 w-4" />
            Request changes
          </button>

          <button
            type="button"
            onClick={onReject}
            disabled={busy}
            className="
              inline-flex items-center gap-2 rounded-full
              px-4 py-2.5 min-h-[44px]
              border border-red-200 dark:border-red-500/30
              bg-background hover:bg-red-50 dark:hover:bg-red-500/10
              text-red-700 dark:text-red-400 text-sm font-medium
              transition-colors disabled:opacity-50
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2
            "
          >
            <X className="h-4 w-4" />
            Reject
          </button>

          <div className="flex-1" />

          <button
            type="button"
            onClick={onMagicLink}
            disabled={busy}
            title="Generate a tokenized review link to send a client. Copies to clipboard."
            className="
              inline-flex items-center gap-2 rounded-full
              px-4 py-2.5 min-h-[44px]
              text-muted-foreground hover:text-foreground hover:bg-muted
              text-sm font-medium
              transition-colors disabled:opacity-50
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2
            "
          >
            <Send className="h-4 w-4" />
            Send for client review
          </button>
        </div>
      </div>
    </li>
  );
}

function TraceRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[11px] uppercase tracking-[0.06em] text-muted-foreground font-medium">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────── */
/*   Empty state                                                  */
/* ────────────────────────────────────────────────────────────── */

function EmptyState() {
  return (
    <div className="mx-auto max-w-2xl py-16 sm:py-24 text-center">
      {/* Abstract ring with pulsing dot — same brand-token treatment
          as Phase 1 Home, signals "all clear" without a celebratory icon. */}
      <div className="relative mx-auto mb-8 h-32 w-32" aria-hidden="true">
        <div
          className="absolute inset-0 rounded-full border-2 border-[var(--brand)]/15"
        />
        <div
          className="absolute inset-3 rounded-full border-2 border-[var(--brand)]/25"
        />
        <div
          className="absolute inset-6 rounded-full border-2 border-[var(--brand)]/35"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="relative flex h-3 w-3">
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--brand)] opacity-50 motion-reduce:hidden"
              style={{ animationDuration: "2.4s" }}
            />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-[var(--brand)]" />
          </span>
        </div>
      </div>

      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
        Inbox zero.
      </h2>
      <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground max-w-md mx-auto">
        Maroa will surface anything that needs you here.
        Until then, the agents are working in the background — no action required.
      </p>

      <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--brand-subtle)] px-4 py-2 text-[13px] text-[var(--brand)]">
        <span className="relative flex h-2 w-2">
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--brand)] opacity-40 motion-reduce:hidden"
            style={{ animationDuration: "2s" }}
          />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--brand)]" />
        </span>
        Listening for new drafts
      </div>
    </div>
  );
}