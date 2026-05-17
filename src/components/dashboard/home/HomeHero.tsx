import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Activity, Sparkles } from "lucide-react";

export interface HeroMetric {
  /** Compact label, e.g. "Reach", "Leads", "Spend", "Revenue" */
  label: string;
  /** Already-formatted display value, e.g. "12.4K", "$284" */
  value: string;
  /** "↑ 12%" | "↓ 4.1%" | "—". Optional. */
  delta?: string;
  /** Color of the delta — green for up, red for down, muted for neutral. */
  trend: "up" | "down" | "neutral";
}

export interface HomeHeroProps {
  /** "Good morning" / "Good afternoon" etc. */
  greeting: string;
  firstName: string;
  /** Count of distinct AI actions in the most recent 24h. */
  actionsLast24h: number;
  /** Most recent activity message — drives the "currently working on" line. */
  latestActivity: { message: string; timeIso: string } | null;
  /** Short chips for the strip below the headline. Each ~2-5 words. */
  todaysWins: string[];
  /** 7-day movement strip — up to 4 compact metrics rendered as a stat bar
   *  beneath the headline. Real values only; pass empty array to hide. */
  movement: HeroMetric[];
  /** Number of items in the approval queue. Drives the primary CTA. */
  pendingCount: number;
  /** "1h ago" style oldest-approval age, or undefined. */
  oldestApprovalAge?: string;
  onReviewApprovals: () => void;
  onViewActivity: () => void;
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const TREND_COLOR = {
  up: "text-[#10B981]",
  down: "text-[#F87171]",
  neutral: "text-white/50",
};

/**
 * HomeHero — the dominant "your AI is alive and working" panel.
 *
 * One bold dark surface (bg-foreground text-background, auto-inverts in
 * dark mode) that combines four things into a single moment so the user
 * sees the brain pulse, not five separate cards:
 *
 *   1. LIVE pill — pulsing dot signaling autopilot is on
 *   2. Greeting headline — name, big and personal
 *   3. Status line — "Latest: <real activity> · <relative time>" or
 *      a warming-up message if no activity yet
 *   4. Today's wins — up to 3 chips from real wins/feed entries
 *   5. Primary CTA — "Review N approvals" if pending; else "See live activity"
 *
 * Right-side decoration is a pure-CSS concentric-ring "brain orb" with
 * a soft pulse — no random data, no charts, just rhythm so the panel
 * feels alive at a glance. Respects prefers-reduced-motion.
 */
export default function HomeHero({
  greeting,
  firstName,
  actionsLast24h,
  latestActivity,
  todaysWins,
  movement,
  pendingCount,
  oldestApprovalAge,
  onReviewApprovals,
  onViewActivity,
}: HomeHeroProps) {
  // 30s tick — makes the "Latest: … 2m ago" line feel actually live
  // without re-fetching anything. Just bumps a counter that invalidates
  // the timeAgo memo.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick(t => t + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const statusLine = useMemo(() => {
    if (latestActivity) {
      return (
        <>
          <span className="font-medium">Latest:</span>{" "}
          <span>{latestActivity.message}</span>{" "}
          <span className="opacity-50">· {timeAgo(latestActivity.timeIso)}</span>
        </>
      );
    }
    return (
      <span className="opacity-70">
        Warming up — first AI actions land in ~90 seconds.
      </span>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tick is intentional
  }, [latestActivity, tick]);

  const headlineStat = actionsLast24h > 0
    ? `${actionsLast24h} action${actionsLast24h === 1 ? "" : "s"} in 24h`
    : "Standing by";

  return (
    <div className="relative mb-8 overflow-hidden rounded-[24px] bg-foreground text-background">
      {/* Brand atmosphere — single radial glow, no charts, no noise */}
      <div
        className="pointer-events-none absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full opacity-25 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--brand), transparent 70%)" }}
        aria-hidden
      />

      <div className="relative grid gap-8 px-6 py-7 md:px-10 md:py-9 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="min-w-0">
          {/* LIVE pill */}
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em]">
            <span className="relative flex h-2 w-2">
              <span
                className="absolute inline-flex h-full w-full rounded-full opacity-75 motion-safe:animate-ping"
                style={{ background: "var(--brand)" }}
                aria-hidden
              />
              <span
                className="relative inline-flex h-2 w-2 rounded-full"
                style={{ background: "var(--brand)" }}
              />
            </span>
            Autopilot · Live
          </div>

          {/* Greeting headline */}
          <h1 className="text-[clamp(28px,4vw,44px)] font-bold leading-[1.05] tracking-[-0.025em]">
            {greeting}, {firstName}.
          </h1>

          {/* Headline stat */}
          <div className="mt-3 flex items-baseline gap-3">
            <span
              className="font-mono text-[clamp(22px,2.6vw,32px)] font-semibold tabular-nums"
              style={{ fontFeatureSettings: '"tnum"', color: "var(--brand)" }}
            >
              {headlineStat}
            </span>
          </div>

          {/* Status line — latest activity or warming-up */}
          <p className="mt-3 max-w-[640px] text-[14px] leading-relaxed opacity-85">
            {statusLine}
          </p>

          {/* Today's wins chips */}
          {todaysWins.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {todaysWins.slice(0, 3).map((w, i) => (
                <span
                  key={`${w}-${i}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.12] bg-white/[0.04] px-3 py-1 text-[12px] opacity-90"
                >
                  <Sparkles className="h-3 w-3 opacity-70" aria-hidden />
                  {w}
                </span>
              ))}
            </div>
          )}

          {/* 7-day movement strip — real KPI deltas, hairline separators */}
          {movement.length > 0 && (
            <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-white/10 pt-5 sm:grid-cols-4 sm:divide-x sm:divide-white/10 sm:gap-x-0 sm:gap-y-0">
              {movement.slice(0, 4).map(m => (
                <div
                  key={m.label}
                  className="sm:px-5 sm:first:pl-0 sm:last:pr-0"
                >
                  <div className="text-[10px] font-semibold uppercase tracking-[0.12em] opacity-50">
                    {m.label}
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span
                      className="font-mono text-[18px] font-semibold tabular-nums"
                      style={{ fontFeatureSettings: '"tnum"' }}
                    >
                      {m.value}
                    </span>
                    {m.delta && (
                      <span className={`text-[11px] font-medium ${TREND_COLOR[m.trend]}`}>
                        {m.delta}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CTAs */}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            {pendingCount > 0 ? (
              <button
                onClick={onReviewApprovals}
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                style={{ background: "var(--brand)" }}
              >
                Review {pendingCount} approval{pendingCount === 1 ? "" : "s"}
                {oldestApprovalAge && (
                  <span className="opacity-80">· oldest {oldestApprovalAge}</span>
                )}
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={onViewActivity}
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                style={{ background: "var(--brand)" }}
              >
                See live activity
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={onViewActivity}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-[13px] font-medium transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              <Activity className="h-4 w-4 opacity-80" />
              Activity feed
            </button>
          </div>
        </div>

        {/* Brain beacon — large concentric ping rings + brand mark.
            Holds the right edge of the hero so the panel feels balanced
            instead of left-heavy. Hidden under lg to keep tablet/mobile
            from feeling cramped. */}
        <div className="relative hidden h-[260px] w-[260px] shrink-0 items-center justify-center lg:flex">
          <RingPing delay="0s" duration="3.6s" inset={0} />
          <RingPing delay="0.6s" duration="3s" inset={32} />
          <RingPing delay="1.2s" duration="2.4s" inset={64} />
          <RingPing delay="1.8s" duration="2s" inset={96} />
          <div
            className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full shadow-[0_12px_36px_rgba(8,129,255,0.55)]"
            style={{ background: "var(--brand)" }}
          >
            <span className="text-[28px] font-bold text-white">M</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * RingPing — single border ring with a CSS ping animation. Each ring
 * has its own duration + delay so they cascade out from center like a
 * radar sweep instead of pulsing in unison. Disabled under
 * prefers-reduced-motion via the motion-safe: prefix.
 */
function RingPing({
  inset, duration, delay,
}: { inset: number; duration: string; delay: string }) {
  return (
    <span
      aria-hidden
      className="absolute rounded-full border border-white/20 opacity-60 motion-safe:animate-ping"
      style={{
        top: inset, left: inset, right: inset, bottom: inset,
        animationDelay: delay,
        animationDuration: duration,
      }}
    />
  );
}
