import { ArrowRight, CheckCircle2, Clock, FileText, Image as ImageIcon, Megaphone } from "lucide-react";

export interface QueueApproval {
  id: string;
  title: string;
  snippet: string;
  platform?: string | null;
  type: "post" | "creative" | "ad";
  /** ISO timestamp the draft was created. */
  createdAt: string;
}

export interface QueueActivity {
  id: string;
  /** Short past-tense action, e.g. "Drafter shipped a new post". */
  message: string;
  /** Pre-formatted relative time, e.g. "2m ago". */
  timeLabel: string;
}

interface WorkQueueProps {
  pending: QueueApproval[];
  activity: QueueActivity[];
  /** Real count of approvals (not the visible slice — used in the header pill). */
  pendingCount: number;
  onReviewItem: (id: string) => void;
  onReviewAll: () => void;
  onViewAllActivity: () => void;
}

const TYPE_ICON = {
  post: FileText,
  creative: ImageIcon,
  ad: Megaphone,
};

function ageSince(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.round(ms / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}

/**
 * WorkQueue — the single dominant operating surface on Home.
 *
 * Folds two previously-separate sections (NeedsApprovalSection +
 * AgentActivityFeed) into ONE card with two stacked subsections so
 * the operator's attention isn't split across five competing lists.
 *
 * Subsection 1 — "Needs your approval" — only renders if there's
 * something to review. Each row shows the snippet + age + a single
 * Review button. No urgency badges, no card-grid theatrics.
 *
 * Subsection 2 — "Recent activity" — chronological list of what the
 * AI shipped, drafted, decided. Mono-spaced timestamp on the right.
 *
 * Both lists use hairline dividers and lots of vertical breathing
 * room. Brand color appears only on the "approval" status dot.
 */
export default function WorkQueue({
  pending,
  activity,
  pendingCount,
  onReviewItem,
  onReviewAll,
  onViewAllActivity,
}: WorkQueueProps) {
  const hasPending = pending.length > 0;
  const hasActivity = activity.length > 0;

  // Genuine empty state — only when both lists are empty
  if (!hasPending && !hasActivity) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card px-6 py-16 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <CheckCircle2 className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
        </div>
        <h3 className="text-[15px] font-semibold text-foreground">All clear</h3>
        <p className="mt-1 max-w-xs text-[13px] text-muted-foreground">
          Nothing waiting for you. Your AI will surface work here as it runs.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      {/* ── Pending approvals subsection ─────────────────────────── */}
      {hasPending && (
        <div>
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2" aria-hidden>
                <span
                  className="absolute inline-flex h-full w-full rounded-full opacity-60 motion-safe:animate-ping"
                  style={{ background: "var(--brand)", animationDuration: "2.4s" }}
                />
                <span
                  className="relative inline-flex h-2 w-2 rounded-full"
                  style={{ background: "var(--brand)" }}
                />
              </span>
              <h3 className="text-[13px] font-semibold text-foreground">
                Needs your approval
              </h3>
              <span className="text-[12px] text-muted-foreground">
                · {pendingCount} pending
              </span>
            </div>
            {pendingCount > pending.length && (
              <button
                onClick={onReviewAll}
                className="text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Review all →
              </button>
            )}
          </div>

          <ul className="divide-y divide-border">
            {pending.map(item => {
              const Icon = TYPE_ICON[item.type] || FileText;
              return (
                <li key={item.id} className="flex items-start gap-4 px-5 py-4">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Icon className="h-4 w-4" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="truncate text-[14px] font-medium text-foreground">
                        {item.title}
                      </span>
                      {item.platform && (
                        <span className="shrink-0 text-[11px] uppercase tracking-wide text-muted-foreground">
                          {item.platform}
                        </span>
                      )}
                    </div>
                    {item.snippet && (
                      <p className="mt-0.5 line-clamp-1 text-[13px] text-muted-foreground">
                        {item.snippet}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="hidden text-[11px] text-muted-foreground sm:inline">
                      {ageSince(item.createdAt)}
                    </span>
                    <button
                      onClick={() => onReviewItem(item.id)}
                      className="
                        inline-flex items-center gap-1 rounded-full bg-foreground px-3 py-1
                        text-[12px] font-medium text-background
                        transition-opacity hover:opacity-90
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30
                      "
                    >
                      Review
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* ── Recent activity subsection ────────────────────────── */}
      {hasActivity && (
        <div>
          <div className="flex items-center justify-between border-b border-border bg-muted/30 px-5 py-3">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
              <h3 className="text-[13px] font-semibold text-foreground">
                Recent activity
              </h3>
            </div>
            <button
              onClick={onViewAllActivity}
              className="text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              View all →
            </button>
          </div>

          <ul className="divide-y divide-border">
            {activity.slice(0, 6).map(a => (
              <li key={a.id} className="flex items-center gap-4 px-5 py-3">
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40"
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate text-[13px] text-foreground">
                  {a.message}
                </span>
                <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                  {a.timeLabel}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
