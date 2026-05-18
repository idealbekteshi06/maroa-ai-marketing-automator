import { ArrowDownRight, ArrowUpRight } from "lucide-react";

interface Props {
  label: string;
  value: string;
  delta?: number; // percent, signed
  loading?: boolean;
  sublabel?: string;
}

export function KpiCard({ label, value, delta, loading, sublabel }: Props) {
  return (
    <div
      className="rounded-2xl p-6 transition-all duration-300 m-glass"
      style={{ boxShadow: "var(--m-shadow-sm)" }}
    >
      <div
        className="text-caption uppercase tracking-wider"
        style={{ color: "hsl(var(--m-muted-foreground))" }}
      >
        {label}
      </div>
      {loading ? (
        <div
          className="mt-3 h-9 w-32 rounded-lg animate-pulse"
          style={{ background: "hsl(var(--m-border-subtle))" }}
        />
      ) : (
        <div className="mt-2 text-title-1 m-tnum">{value}</div>
      )}
      {!loading && (delta !== undefined || sublabel) && (
        <div className="mt-2 flex items-center gap-2 text-footnote">
          {delta !== undefined && (
            <span
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5"
              style={{
                color:
                  delta >= 0
                    ? "hsl(var(--m-success))"
                    : "hsl(var(--m-destructive))",
                background:
                  delta >= 0
                    ? "hsl(var(--m-success) / 0.1)"
                    : "hsl(var(--m-destructive) / 0.1)",
              }}
            >
              {delta >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {Math.abs(delta).toFixed(1)}%
            </span>
          )}
          {sublabel && (
            <span style={{ color: "hsl(var(--m-muted-foreground))" }}>{sublabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
