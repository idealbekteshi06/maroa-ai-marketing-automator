import { useEffect, useRef, useState } from "react";

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

interface CountUpOptions {
  durationMs?: number;
  decimals?: number;
  /** Number to start the animation from. Defaults to 0. */
  from?: number;
  /** When false the hook bypasses animation and returns the final value immediately. */
  enabled?: boolean;
}

/**
 * Smoothly animate a numeric value toward `target` on mount and whenever
 * `target` changes. Honours `prefers-reduced-motion` automatically.
 *
 * Returns a `number` representing the current frame's value.
 */
export function useCountUp(target: number, options: CountUpOptions = {}): number {
  const { durationMs = 1100, from = 0, enabled = true } = options;
  const [value, setValue] = useState<number>(enabled ? from : target);
  const rafRef = useRef<number | null>(null);
  const lastValueRef = useRef<number>(value);

  useEffect(() => {
    if (!enabled) {
      setValue(target);
      lastValueRef.current = target;
      return;
    }
    if (typeof window === "undefined") {
      setValue(target);
      return;
    }
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setValue(target);
      lastValueRef.current = target;
      return;
    }

    const startValue = lastValueRef.current;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / durationMs);
      const eased = easeOutCubic(t);
      const v = startValue + (target - startValue) * eased;
      setValue(v);
      lastValueRef.current = v;
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, durationMs, enabled]);

  return value;
}

/**
 * Format a number for KPI display while keeping a fixed string layout, so the
 * digits don't reflow during animation. Honours decimals + locale grouping.
 */
export function formatCountValue(value: number, decimals: number = 0): string {
  if (decimals === 0) return Math.round(value).toLocaleString();
  return value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
