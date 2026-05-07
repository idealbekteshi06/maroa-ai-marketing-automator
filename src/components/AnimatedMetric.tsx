import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import Sparkline from "@/components/Sparkline";
import { cn } from "@/lib/utils";

interface AnimatedMetricProps {
  label: string;
  value: number;
  previousValue?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  sparkline?: number[];
  sparklineColor?: string;
  hint?: string;
  durationMs?: number;
  className?: string;
  size?: "sm" | "md" | "lg";
  /** Override delta calculation (e.g. when comparing periods) */
  deltaPercent?: number | null;
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

function formatNumber(n: number, decimals: number) {
  if (decimals === 0) return Math.round(n).toLocaleString();
  return n.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export default function AnimatedMetric({
  label,
  value,
  previousValue,
  prefix,
  suffix,
  decimals = 0,
  sparkline,
  sparklineColor,
  hint,
  durationMs = 1100,
  className,
  size = "md",
  deltaPercent,
}: AnimatedMetricProps) {
  const [display, setDisplay] = useState<number>(previousValue ?? 0);
  const rafRef = useRef<number | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      setDisplay(value);
      return;
    }
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setDisplay(value);
      return;
    }
    const from = startedRef.current ? display : (previousValue ?? 0);
    startedRef.current = true;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / durationMs);
      const eased = easeOutCubic(t);
      setDisplay(from + (value - from) * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, durationMs]);

  const delta = (() => {
    if (deltaPercent !== undefined && deltaPercent !== null) return deltaPercent;
    if (previousValue === undefined || previousValue === 0) return null;
    return ((value - previousValue) / previousValue) * 100;
  })();

  const direction: "up" | "down" | "flat" =
    delta === null || Math.abs(delta) < 0.01 ? "flat" : delta > 0 ? "up" : "down";

  const valueClass = size === "lg" ? "text-3xl" : size === "sm" ? "text-lg" : "text-2xl";
  const labelClass = size === "sm" ? "text-[11px]" : "text-xs";

  return (
    <div className={cn("rounded-xl border border-border bg-card p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className={cn("uppercase tracking-wide text-muted-foreground", labelClass)}>{label}</p>
          <p className={cn("mt-1 font-semibold tabular-nums text-foreground", valueClass)}>
            {prefix}
            {formatNumber(display, decimals)}
            {suffix}
          </p>
          {(delta !== null || hint) && (
            <div className="mt-1 flex items-center gap-2 text-xs">
              {delta !== null && (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium",
                    direction === "up" && "bg-success/15 text-success",
                    direction === "down" && "bg-destructive/15 text-destructive",
                    direction === "flat" && "bg-muted text-muted-foreground"
                  )}
                >
                  {direction === "up" && <ArrowUpRight className="h-3 w-3" />}
                  {direction === "down" && <ArrowDownRight className="h-3 w-3" />}
                  {direction === "flat" && <Minus className="h-3 w-3" />}
                  {Math.abs(delta).toFixed(1)}%
                </span>
              )}
              {hint && <span className="truncate text-muted-foreground">{hint}</span>}
            </div>
          )}
        </div>
        {sparkline && sparkline.length > 1 && (
          <div className="shrink-0">
            <Sparkline data={sparkline} color={sparklineColor} width={64} height={28} />
          </div>
        )}
      </div>
    </div>
  );
}
