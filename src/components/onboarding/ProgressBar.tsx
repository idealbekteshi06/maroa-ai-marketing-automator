interface ProgressBarProps {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const pct = Math.round(((current + 1) / total) * 100);

  return (
    <div className="sticky top-0 z-40 bg-white">
      <div className="h-[3px] w-full bg-[var(--bg-muted)]">
        <div
          className="h-full bg-[var(--brand)] transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mx-auto flex max-w-[640px] items-center justify-between px-6 py-3">
        <span className="text-[13px] font-medium text-muted-foreground">
          Step {current + 1} of {total}
        </span>
        <span className="text-[13px] tabular-nums text-muted-foreground">{pct}%</span>
      </div>
    </div>
  );
}
