import { useMemo } from "react";
import { ArrowRight, Activity, Sparkles } from "lucide-react";

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
  pendingCount,
  oldestApprovalAge,
  onReviewApprovals,
  onViewActivity,
}: HomeHeroProps) {
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
  }, [latestActivity]);

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
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.04] px-3 py-1 text-[12px] opacity-90"
                >
                  <Sparkles className="h-3 w-3 opacity-70" aria-hidden />
                  {w}
                </span>
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

        {/* Brain orb — concentric rings, gentle pulse */}
        <div className="relative hidden h-[180px] w-[180px] shrink-0 items-center justify-center lg:flex">
          <RingPulse delay="0s" size={180} />
          <RingPulse delay="0.6s" size={140} />
          <RingPulse delay="1.2s" size={100} />
          <div
            className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full shadow-lg"
            style={{ background: "var(--brand)" }}
          >
            <span className="text-2xl font-bold text-white">M</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function RingPulse({ size, delay }: { size: number; delay: string }) {
  return (
    <span
      aria-hidden
      className="absolute inset-0 m-auto rounded-full border opacity-30 motion-safe:animate-pulse"
      style={{
        width: size,
        height: size,
        borderColor: "var(--brand)",
        animationDelay: delay,
        animationDuration: "3.4s",
      }}
    />
  );
}
