import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export type QualityGateVerdict = "ship" | "retry" | "reject" | "checking";

export type QualityGateIssue = {
  /** Short rule name. e.g. "ungrounded_claim". */
  rule: string;
  /** Human-readable explanation. */
  message: string;
  /** Severity 0-10 (10 = blocking). */
  severity?: number;
  /** "hard" or "soft" — soft can be auto-retried. */
  blocker?: "hard" | "soft";
};

interface QualityGateChipProps {
  verdict: QualityGateVerdict;
  /** Score 0-100 from the quality gate's deterministic + LLM checks. */
  score?: number;
  issues?: QualityGateIssue[];
  size?: "sm" | "md";
  className?: string;
  /** Hide the score number — useful when space is tight. */
  hideScore?: boolean;
}

const VERDICT_STYLE: Record<
  QualityGateVerdict,
  { icon: typeof ShieldCheck; label: string; bg: string; ring: string; text: string }
> = {
  ship: {
    icon: ShieldCheck,
    label: "Ship-ready",
    bg: "bg-success/10",
    ring: "ring-success/20",
    text: "text-success",
  },
  retry: {
    icon: RefreshCw,
    label: "Auto-retry",
    bg: "bg-amber-500/10",
    ring: "ring-amber-500/20",
    text: "text-amber-600 dark:text-amber-300",
  },
  reject: {
    icon: ShieldX,
    label: "Blocked",
    bg: "bg-destructive/10",
    ring: "ring-destructive/20",
    text: "text-destructive",
  },
  checking: {
    icon: ShieldAlert,
    label: "Checking",
    bg: "bg-muted",
    ring: "ring-border",
    text: "text-muted-foreground",
  },
};

export default function QualityGateChip({
  verdict,
  score,
  issues,
  size = "sm",
  className,
  hideScore = false,
}: QualityGateChipProps) {
  const style = VERDICT_STYLE[verdict];
  const Icon = style.icon;

  const padding = size === "md" ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-[11px]";
  const iconSize = size === "md" ? "h-3.5 w-3.5" : "h-3 w-3";

  const issueCount = issues?.length ?? 0;

  const tooltipBody = (
    <div className="max-w-xs">
      <p className="text-xs font-medium">{style.label}</p>
      {typeof score === "number" && (
        <p className="mt-0.5 text-[11px] text-muted-foreground">Quality score: {Math.round(score)}/100</p>
      )}
      {issueCount > 0 && (
        <ul className="mt-2 space-y-1">
          {issues!.slice(0, 4).map((issue, i) => (
            <li key={i} className="flex items-start gap-1.5 text-[11px]">
              <span
                className={cn(
                  "mt-1 inline-block h-1 w-1 shrink-0 rounded-full",
                  issue.blocker === "hard" ? "bg-destructive" : "bg-amber-500"
                )}
              />
              <span>
                <span className="font-medium">{issue.rule.replace(/_/g, " ")}</span>
                {" — "}
                {issue.message}
              </span>
            </li>
          ))}
          {issues!.length > 4 && (
            <li className="text-[11px] text-muted-foreground">+{issues!.length - 4} more</li>
          )}
        </ul>
      )}
      {verdict === "retry" && (
        <p className="mt-2 text-[11px] italic text-muted-foreground">
          Maroa rewrites the content automatically — soft issues only.
        </p>
      )}
      {verdict === "reject" && (
        <p className="mt-2 text-[11px] italic text-destructive">
          Hard block — content will not ship without your review.
        </p>
      )}
    </div>
  );

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full ring-1 font-medium",
              padding,
              style.bg,
              style.ring,
              style.text,
              className
            )}
          >
            <Icon className={cn(iconSize, verdict === "checking" && "animate-pulse")} aria-hidden />
            <span className="leading-none">{style.label}</span>
            {!hideScore && typeof score === "number" && (
              <span className="ml-1 tabular-nums opacity-80">· {Math.round(score)}</span>
            )}
            {issueCount > 0 && verdict !== "ship" && (
              <span className="ml-1 rounded-full bg-foreground/10 px-1.5 text-[10px] tabular-nums">
                {issueCount}
              </span>
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top">{tooltipBody}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
