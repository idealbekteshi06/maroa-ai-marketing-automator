import { ArrowRight } from "lucide-react";

interface HomeHeaderProps {
  greeting: string;
  firstName: string;
  /** Real count of distinct AI actions in the most recent 24h. */
  actionsLast24h: number;
  /** Items currently waiting for operator approval. */
  pendingCount: number;
  onReviewApprovals: () => void;
}

/**
 * HomeHeader — restrained light-theme header that owns the top of the
 * dashboard. No dark panel, no orb, no chrome. Just:
 *   1. Personal greeting + one honest sentence about today's work
 *   2. Live-status pill (tiny, secondary)
 *   3. Primary CTA only when there is actually something to do
 *
 * Replaces the cinematic HomeHero. The hero was loud (dark panel +
 * brain orb + 4-col movement strip + chips + 2 CTAs) but the cognitive
 * load was high and it competed with the KPI grid for the eye. A
 * compact header lets the KPIs become the real visual anchor.
 */
export default function HomeHeader({
  greeting,
  firstName,
  actionsLast24h,
  pendingCount,
  onReviewApprovals,
}: HomeHeaderProps) {
  const isLive = actionsLast24h > 0;

  const summary = (() => {
    if (actionsLast24h === 0 && pendingCount === 0) {
      return "Your AI team is warming up. First actions land in ~90 seconds.";
    }
    const pieces: string[] = [];
    if (actionsLast24h > 0) {
      pieces.push(
        `Your AI ran ${actionsLast24h} action${actionsLast24h === 1 ? "" : "s"} in the last 24 hours`,
      );
    }
    if (pendingCount > 0) {
      pieces.push(
        `${pendingCount} ${pendingCount === 1 ? "item is" : "items are"} waiting for your review`,
      );
    }
    return pieces.join(" — ") + ".";
  })();

  return (
    <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.02em] text-foreground md:text-[32px]">
          {greeting}, {firstName}.
        </h1>
        <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-muted-foreground md:text-[15px]">
          {summary}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <div className="hidden items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[12px] sm:flex">
          <span className="relative flex h-1.5 w-1.5">
            {isLive && (
              <span
                className="absolute inline-flex h-full w-full rounded-full opacity-60 motion-safe:animate-ping"
                style={{ background: "var(--brand)" }}
                aria-hidden
              />
            )}
            <span
              className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
                isLive ? "" : "bg-muted-foreground/40"
              }`}
              style={isLive ? { background: "var(--brand)" } : undefined}
            />
          </span>
          <span className="font-medium text-muted-foreground">
            {isLive ? "Autopilot live" : "Standing by"}
          </span>
        </div>

        {pendingCount > 0 && (
          <button
            onClick={onReviewApprovals}
            className="
              group inline-flex items-center gap-2 rounded-full px-4 py-2
              text-[13px] font-semibold text-white shadow-sm
              transition-transform hover:-translate-y-0.5
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
            "
            style={{ background: "var(--brand)" }}
          >
            Review {pendingCount}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        )}
      </div>
    </header>
  );
}
