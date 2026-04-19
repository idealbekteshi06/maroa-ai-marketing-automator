interface AutopilotBannerProps {
  agentCount: number;
  lastActions: string[];
  postsThisMonth: number;
  goalCoverage: number;
  onViewDetails: () => void;
}

export default function AutopilotBanner({ agentCount, lastActions, postsThisMonth, goalCoverage, onViewDetails }: AutopilotBannerProps) {
  const subtitle = lastActions.length > 0
    ? lastActions.slice(0, 3).join(" — ")
    : "Your AI team is warming up. First actions in ~90 seconds.";

  return (
    <div
      className="mb-8 overflow-hidden rounded-[20px] px-6 py-6 md:px-8"
      style={{ background: "linear-gradient(180deg, #0A0E24 0%, #0F1834 100%)" }}
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        {/* Left */}
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background: "linear-gradient(135deg, #3B82F6, #A855F7)" }}>
            <span className="text-lg font-bold text-white">M</span>
          </div>
          <div>
            <div className="text-[18px] font-semibold text-white">
              Autopilot is running · {agentCount} agent{agentCount !== 1 ? "s" : ""} active
            </div>
            <div className="mt-1 max-w-[480px] text-sm leading-relaxed text-white/70">
              {subtitle}
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="flex shrink-0 items-center gap-6">
          <div className="flex gap-6">
            <div>
              <div className="font-mono text-2xl font-semibold text-white" style={{ fontFeatureSettings: '"tnum"' }}>{postsThisMonth}</div>
              <div className="text-[12px] text-white/50">posts this month</div>
            </div>
            <div>
              <div className="font-mono text-2xl font-semibold text-white" style={{ fontFeatureSettings: '"tnum"' }}>{goalCoverage}%</div>
              <div className="text-[12px] text-white/50">goal coverage</div>
            </div>
          </div>
          <button
            onClick={onViewDetails}
            className="rounded-full border border-white/15 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-white/[0.08]"
          >
            View details →
          </button>
        </div>
      </div>
    </div>
  );
}
