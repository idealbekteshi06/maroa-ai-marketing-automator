import { ArrowRight } from "lucide-react";

interface ProfileStrengthWidgetProps {
  percentage: number;
  sectionsRemaining: number;
  onNavigate: () => void;
}

/**
 * ProfileStrengthWidget — sidebar rail card on /dashboard.
 *
 * Rebuilt May 2026: dropped the gamified Bronze/Silver/Gold tier
 * language (felt like a frequent-flyer program, not a marketing tool)
 * and tightened the visual to match the new clean Home — hairline
 * border, shadcn tokens, generous whitespace, a single ring chart
 * and one clear CTA. No decorative chrome.
 */
export default function ProfileStrengthWidget({
  percentage, sectionsRemaining, onNavigate,
}: ProfileStrengthWidgetProps) {
  const r = 48;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - percentage / 100);
  const complete = percentage >= 85;

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="text-[11px] font-semibold uppercase tracking-[0.10em] text-muted-foreground">
        Profile strength
      </div>

      <div className="my-6 flex justify-center">
        <div className="relative h-[120px] w-[120px]">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle
              cx="60" cy="60" r={r}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="6"
            />
            <circle
              cx="60" cy="60" r={r}
              fill="none"
              stroke="var(--brand)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-baseline justify-center gap-0.5">
            <span
              className="font-mono text-[34px] font-semibold tabular-nums text-foreground"
              style={{ fontFeatureSettings: '"tnum"' }}
            >
              {percentage}
            </span>
            <span className="text-[13px] text-muted-foreground">%</span>
          </div>
        </div>
      </div>

      <p className="text-center text-[13px] leading-relaxed text-muted-foreground">
        {complete
          ? "Profile complete. Your AI has everything it needs."
          : sectionsRemaining === 1
          ? "1 section left to give your AI a sharper picture."
          : `${sectionsRemaining} sections left to give your AI a sharper picture.`}
      </p>

      <button
        onClick={onNavigate}
        className="
          mt-5 flex w-full items-center justify-center gap-1.5 rounded-full
          bg-foreground px-4 py-2 text-[13px] font-medium text-background
          transition-opacity hover:opacity-90
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30
        "
      >
        {complete ? "Edit profile" : "Complete profile"}
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
