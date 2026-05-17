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
    <div className="group rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</div>
          <div className="mt-2 font-mono text-[36px] font-bold leading-none tracking-[-0.025em] tabular-nums text-foreground" style={{ fontFeatureSettings: '"tnum"' }}>
            {renderedValue}
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className={`text-[13px] font-medium ${TREND_COLOR[trend]}`}>{delta}</span>
            <span className="text-[11px] text-muted-foreground">{deltaContext}</span>
          </div>
          {isEmpty && emptyHelper && (
            <p className="mt-2 text-[11px] leading-[1.4] text-muted-foreground">{emptyHelper}</p>
          )}
        </div>
        {chartData.length >= 2 && (
          <div className="mt-1 h-12 w-20 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              {sparklineType === "bar" ? (
                <BarChart data={chartData}>
                  <Bar dataKey="v" fill={color} radius={[2, 2, 0, 0]} />
                </BarChart>
              ) : sparklineType === "area" ? (
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={0.15} />
                      <stop offset="100%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill="url(#areaFill)" dot={false} isAnimationActive={false} />
                </AreaChart>
              ) : (
                <LineChart data={chartData}>
                  <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
