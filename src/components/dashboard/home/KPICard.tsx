import { LineChart, Line, BarChart, Bar, AreaChart, Area, ResponsiveContainer } from "recharts";
import { useCountUp, formatCountValue } from "@/hooks/useCountUp";

export interface KPICardProps {
  label: string;
  value: string;
  delta: string;
  deltaContext: string;
  trend: "up" | "down" | "neutral";
  sparklineData: number[];
  sparklineType?: "line" | "area" | "bar";
  emptyHelper?: string;
  /** When provided, the value is animated via useCountUp; `value` is used as a fallback string. */
  numericValue?: number;
  /** Render-time prefix (e.g. currency symbol). */
  valuePrefix?: string;
  /** Render-time suffix (e.g. "%"). */
  valueSuffix?: string;
  /** Decimal places for the animated number. */
  valueDecimals?: number;
}

const TREND_COLOR = { up: "text-[var(--success,#22C55E)]", down: "text-red-500", neutral: "text-muted-foreground" };

export default function KPICard({
  label, value, delta, deltaContext, trend, sparklineData, sparklineType = "line", emptyHelper,
  numericValue, valuePrefix, valueSuffix, valueDecimals = 0,
}: KPICardProps) {
  const chartData = sparklineData.map((v, i) => ({ i, v }));
  const color = trend === "down" ? "#EF4444" : "var(--brand)";
  const animated = useCountUp(numericValue ?? 0, { enabled: typeof numericValue === "number" });
  const renderedValue =
    typeof numericValue === "number"
      ? `${valuePrefix ?? ""}${formatCountValue(animated, valueDecimals)}${valueSuffix ?? ""}`
      : value;
  const isEmpty = renderedValue === "0" || renderedValue === "€0" || renderedValue === "$0";

  return (
    <div className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
      <div className="text-[11px] font-semibold uppercase tracking-[0.10em] text-muted-foreground">
        {label}
      </div>
      <div
        className="mt-3 font-mono text-[36px] font-semibold leading-none tracking-[-0.02em] tabular-nums text-foreground"
        style={{ fontFeatureSettings: '"tnum"' }}
      >
        {renderedValue}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className={`text-[12px] font-medium ${TREND_COLOR[trend]}`}>{delta}</span>
        <span className="text-[11px] text-muted-foreground">{deltaContext}</span>
      </div>

      {/* Full-width sparkline beneath the number — gives the trend its
          own visual real estate instead of cramming it in the corner. */}
      {chartData.length >= 2 ? (
        <div className="mt-4 h-10 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {sparklineType === "bar" ? (
              <BarChart data={chartData}>
                <Bar dataKey="v" fill={color} radius={[2, 2, 0, 0]} />
              </BarChart>
            ) : sparklineType === "area" ? (
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id={`kpi-${label.replace(/\s/g, "")}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.75} fill={`url(#kpi-${label.replace(/\s/g, "")})`} dot={false} isAnimationActive={false} />
              </AreaChart>
            ) : (
              <LineChart data={chartData}>
                <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.75} dot={false} isAnimationActive={false} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="mt-4 h-10 w-full" aria-hidden />
      )}

      {isEmpty && emptyHelper && (
        <p className="mt-2 text-[11px] leading-[1.4] text-muted-foreground">{emptyHelper}</p>
      )}
    </div>
  );
}
