interface AutopilotBannerProps {
  agentCount: number;
  lastActions: string[];
  postsThisMonth: number;
  goalCoverage: number;
  onViewDetails: () => void;
}

/**
 * AutopilotBanner — the "AI status" header on the dashboard home.
 *
 * Rebuilt May 2026: dropped the hardcoded dark blue gradient
 * (#0A0E24 → #0F1834) + brand-color rotational logo (which used the
 * old purple-leaning palette #3B82F6 → #A855F7). Now uses the brand
 * surface tokens so the banner inherits light/dark mode + the new
 * #0881FF brand color from src/styles/tokens.css.
 *
 * Visual rationale:
 *   - On light mode: deep ink-700 background (foreground tokens) with
 *     a subtle brand-tint inner border — premium without being noisy.
 *   - On dark mode: ink-900 surface with a brand-tinted glow — the
 *     "your AI is running" beacon.
 *   - Brand pip (M logo) uses brand color directly, not a gradient,
 *     keeping the brand consistent with the landing page.
 */
export default function AutopilotBanner({
  agentCount,
  lastActions,
  postsThisMonth,
  goalCoverage,
  onViewDetails,
}: AutopilotBannerProps) {
  const subtitle = lastActions.length > 0
    ? lastActions.slice(0, 3).join(" — ")
    : "Your AI team is warming up. First actions in ~90 seconds.";

  return (
    <div
      className="
        mb-8 overflow-hidden rounded-[20px] px-6 py-6 md:px-8
        bg-foreground text-background
        relative
      "
    >
      {/* Brand-tint atmosphere — a single soft radial glow in the
          top-right corner so the dark surface doesn't feel flat. */}
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--brand), transparent 70%)" }}
        aria-hidden="true"
      />

      <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        {/* Left — agent status */}
        <div className="flex items-start gap-4">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg shadow-sm"
            style={{ background: "var(--brand)" }}
          >
            <span className="text-lg font-bold text-white">M</span>
          </div>
          <div className="min-w-0">
            <div className="text-[18px] font-semibold">
              Autopilot is running · {agentCount} agent{agentCount !== 1 ? "s" : ""} active
            </div>
            <div className="mt-1 max-w-[480px] text-sm leading-relaxed opacity-70 line-clamp-2">
              {subtitle}
            </div>
          </div>
        </div>

        {/* Right — month stats + details CTA */}
        <div className="flex shrink-0 flex-wrap items-center gap-6">
          <div className="flex gap-6">
            <div>
              <div
                className="font-mono text-2xl font-semibold tabular-nums"
                style={{ fontFeatureSettings: '"tnum"' }}
              >
                {postsThisMonth}
              </div>
              <div className="text-[12px] opacity-60">posts this month</div>
            </div>
            <div>
              <div
                className="font-mono text-2xl font-semibold tabular-nums"
                style={{ fontFeatureSettings: '"tnum"' }}
              >
                {goalCoverage}%
              </div>
              <div className="text-[12px] opacity-60">goal coverage</div>
            </div>
          </div>
          <button
            onClick={onViewDetails}
            className="
              rounded-full border border-white/15 px-4 py-2 text-[13px] font-medium
              transition-colors hover:bg-white/10
            "
          >
            View details →
          </button>
        </div>
      </div>
    </div>
  );
}
