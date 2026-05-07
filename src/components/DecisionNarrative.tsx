import { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  ChevronDown,
  ChevronUp,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type DecisionVerdict = "scale" | "keep" | "pause" | "kill" | "info" | "warn";

export type DecisionEvidence = {
  label: string;
  value: string | number;
  trend?: "up" | "down" | "flat";
};

export type DecisionAlternative = {
  label: string;
  rejectedBecause: string;
};

interface DecisionNarrativeProps {
  verdict: DecisionVerdict;
  headline: string;
  /** 1-3 sentence plain-language explanation */
  summary: string;
  /** The reasoning chain — short bullets, ordered by importance */
  reasoning?: string[];
  /** Concrete data points that drove the decision */
  evidence?: DecisionEvidence[];
  /** Other paths considered + why rejected */
  alternatives?: DecisionAlternative[];
  /** Optional confidence 0-100 */
  confidence?: number;
  /** Optional source skill/tool that produced this decision */
  source?: string;
  className?: string;
  defaultExpanded?: boolean;
}

const VERDICT_STYLE: Record<
  DecisionVerdict,
  { icon: typeof CheckCircle2; label: string; bg: string; ring: string; text: string; dot: string }
> = {
  scale: { icon: TrendingUp, label: "Scaling", bg: "bg-success/10", ring: "ring-success/20", text: "text-success", dot: "bg-success" },
  keep: { icon: CheckCircle2, label: "Keep", bg: "bg-primary/10", ring: "ring-primary/20", text: "text-primary", dot: "bg-primary" },
  pause: { icon: AlertTriangle, label: "Pause", bg: "bg-amber-500/10", ring: "ring-amber-500/20", text: "text-amber-600 dark:text-amber-300", dot: "bg-amber-500" },
  kill: { icon: XCircle, label: "Stop", bg: "bg-destructive/10", ring: "ring-destructive/20", text: "text-destructive", dot: "bg-destructive" },
  info: { icon: Info, label: "Info", bg: "bg-muted", ring: "ring-border", text: "text-foreground", dot: "bg-muted-foreground" },
  warn: { icon: AlertTriangle, label: "Warning", bg: "bg-amber-500/10", ring: "ring-amber-500/20", text: "text-amber-600 dark:text-amber-300", dot: "bg-amber-500" },
};

export default function DecisionNarrative({
  verdict,
  headline,
  summary,
  reasoning,
  evidence,
  alternatives,
  confidence,
  source,
  className,
  defaultExpanded = false,
}: DecisionNarrativeProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const style = VERDICT_STYLE[verdict];
  const Icon = style.icon;

  const hasDetails = (reasoning && reasoning.length > 0) || (evidence && evidence.length > 0) || (alternatives && alternatives.length > 0);

  return (
    <div className={cn("rounded-xl border border-border bg-card p-4", className)}>
      <header className="flex items-start gap-3">
        <div
          className={cn(
            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1",
            style.bg,
            style.ring
          )}
        >
          <Icon className={cn("h-4 w-4", style.text)} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide",
                style.bg,
                style.text
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
              {style.label}
            </span>
            {source && (
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                via {source}
              </span>
            )}
            {typeof confidence === "number" && (
              <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <span className="font-medium tabular-nums text-foreground">
                  {Math.round(confidence)}%
                </span>
                confidence
              </span>
            )}
          </div>
          <h3 className="mt-1.5 text-sm font-semibold leading-snug text-foreground">{headline}</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{summary}</p>
        </div>
      </header>

      {hasDetails && (
        <>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            aria-expanded={expanded}
          >
            {expanded ? "Hide reasoning" : "Show reasoning"}
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>

          {expanded && (
            <div className="mt-3 space-y-3 border-t border-border/60 pt-3 animate-in fade-in slide-in-from-top-1 duration-300">
              {reasoning && reasoning.length > 0 && (
                <section>
                  <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Reasoning
                  </p>
                  <ol className="space-y-1.5">
                    {reasoning.map((step, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-foreground/90">
                        <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                          {i + 1}
                        </span>
                        <span className="leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              {evidence && evidence.length > 0 && (
                <section>
                  <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Evidence
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {evidence.map((e, i) => (
                      <div
                        key={i}
                        className="rounded-md border border-border/60 bg-background/40 px-2 py-1.5"
                      >
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          {e.label}
                        </p>
                        <p
                          className={cn(
                            "mt-0.5 text-sm font-semibold tabular-nums",
                            e.trend === "up" && "text-success",
                            e.trend === "down" && "text-destructive",
                            !e.trend && "text-foreground"
                          )}
                        >
                          {e.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {alternatives && alternatives.length > 0 && (
                <section>
                  <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Alternatives considered
                  </p>
                  <ul className="space-y-1.5">
                    {alternatives.map((alt, i) => (
                      <li key={i} className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground/80">{alt.label}</span>
                        {" — "}
                        {alt.rejectedBecause}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
