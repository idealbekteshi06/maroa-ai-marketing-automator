interface ProfileStrengthWidgetProps {
  percentage: number;
  sectionsRemaining: number;
  onNavigate: () => void;
}

export default function ProfileStrengthWidget({ percentage, sectionsRemaining, onNavigate }: ProfileStrengthWidgetProps) {
  const tier = percentage >= 85 ? "Gold" : percentage >= 60 ? "Silver" : percentage >= 30 ? "Bronze" : "Starter";
  const tierColor = percentage >= 85 ? "bg-amber-100 text-amber-700" : percentage >= 60 ? "bg-gray-100 text-gray-600" : percentage >= 30 ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-500";
  const nextTier = percentage >= 85 ? null : percentage >= 60 ? "Gold" : percentage >= 30 ? "Silver" : "Bronze";
  const r = 52;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - percentage / 100);

  return (
    <div className="rounded-2xl border border-[var(--border-default)] bg-white p-6">
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Profile strength</div>

      <div className="my-5 flex justify-center">
        <div className="relative h-[120px] w-[120px]">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle cx="60" cy="60" r={r} fill="none" stroke="var(--border-default)" strokeWidth="8" />
            <circle
              cx="60" cy="60" r={r} fill="none"
              stroke="var(--brand)" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono text-[36px] font-bold" style={{ fontFeatureSettings: '"tnum"' }}>{percentage}</span>
            <span className="text-sm text-muted-foreground">%</span>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${tierColor}`}>{tier} tier</span>
      </div>

      {nextTier && (
        <p className="mt-4 text-center text-[13px] leading-relaxed text-muted-foreground">
          Complete {sectionsRemaining} more section{sectionsRemaining !== 1 ? "s" : ""} to unlock {nextTier} and let the AI run fully autonomous.
        </p>
      )}

      <button
        onClick={onNavigate}
        className="mt-4 w-full text-center text-[13px] font-medium text-[var(--brand)] transition-colors hover:underline"
      >
        Improve your AI →
      </button>
    </div>
  );
}
