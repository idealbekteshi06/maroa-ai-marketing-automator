import { Brain, Shield, Heart, Eye, Zap, Target, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export type PsychologyPrinciple = {
  id?: string;
  name: string;
  family?:
    | "cialdini"
    | "kahneman"
    | "ariely"
    | "pricing"
    | "attention"
    | "trust"
    | "urgency"
    | "motivation"
    | "decision"
    | "emotion"
    | string;
  description?: string;
  ethical_risk?: number;
};

interface PsychologyBadgeProps {
  principles: PsychologyPrinciple[] | null | undefined;
  max?: number;
  size?: "sm" | "md";
  className?: string;
  showLabel?: boolean;
}

const FAMILY_STYLE: Record<
  string,
  { icon: typeof Brain; bg: string; ring: string; text: string }
> = {
  cialdini: { icon: Shield, bg: "bg-primary/10", ring: "ring-primary/20", text: "text-primary" },
  kahneman: { icon: Brain, bg: "bg-purple-500/10", ring: "ring-purple-500/20", text: "text-purple-600 dark:text-purple-300" },
  ariely: { icon: Eye, bg: "bg-blue-500/10", ring: "ring-blue-500/20", text: "text-blue-600 dark:text-blue-300" },
  pricing: { icon: Target, bg: "bg-emerald-500/10", ring: "ring-emerald-500/20", text: "text-emerald-600 dark:text-emerald-300" },
  attention: { icon: Eye, bg: "bg-amber-500/10", ring: "ring-amber-500/20", text: "text-amber-600 dark:text-amber-300" },
  trust: { icon: Shield, bg: "bg-sky-500/10", ring: "ring-sky-500/20", text: "text-sky-600 dark:text-sky-300" },
  urgency: { icon: Zap, bg: "bg-rose-500/10", ring: "ring-rose-500/20", text: "text-rose-600 dark:text-rose-300" },
  motivation: { icon: Zap, bg: "bg-orange-500/10", ring: "ring-orange-500/20", text: "text-orange-600 dark:text-orange-300" },
  decision: { icon: Brain, bg: "bg-indigo-500/10", ring: "ring-indigo-500/20", text: "text-indigo-600 dark:text-indigo-300" },
  emotion: { icon: Heart, bg: "bg-pink-500/10", ring: "ring-pink-500/20", text: "text-pink-600 dark:text-pink-300" },
};

const DEFAULT_STYLE = {
  icon: Brain,
  bg: "bg-muted",
  ring: "ring-border",
  text: "text-muted-foreground",
};

export default function PsychologyBadge({
  principles,
  max = 6,
  size = "sm",
  className,
  showLabel = true,
}: PsychologyBadgeProps) {
  if (!principles || principles.length === 0) return null;

  const visible = principles.slice(0, max);
  const overflow = principles.length - visible.length;

  const padding = size === "md" ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-[11px]";
  const iconSize = size === "md" ? "h-3.5 w-3.5" : "h-3 w-3";

  return (
    <TooltipProvider delayDuration={150}>
      <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
        {showLabel && (
          <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wide text-muted-foreground">
            <Brain className="h-3 w-3" />
            Psychology
          </span>
        )}
        {visible.map((p, i) => {
          const style = FAMILY_STYLE[p.family || ""] || DEFAULT_STYLE;
          const Icon = style.icon;
          const highRisk = (p.ethical_risk ?? 0) >= 7;
          const tooltipText =
            p.description ||
            (p.family ? `${p.family.charAt(0).toUpperCase() + p.family.slice(1)} principle` : p.name);
          return (
            <Tooltip key={`${p.id || p.name}-${i}`}>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full ring-1 font-medium",
                    padding,
                    style.bg,
                    style.ring,
                    style.text
                  )}
                >
                  <Icon className={iconSize} aria-hidden />
                  <span className="leading-none">{p.name}</span>
                  {highRisk && (
                    <AlertTriangle className={cn(iconSize, "text-amber-500")} aria-label="High ethical risk — review" />
                  )}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="text-xs">{tooltipText}</p>
                {highRisk && (
                  <p className="mt-1 text-[11px] text-amber-500">
                    Ethical risk {p.ethical_risk}/10 — Maroa flags but does not auto-apply.
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          );
        })}
        {overflow > 0 && (
          <span className="text-[11px] text-muted-foreground">+{overflow} more</span>
        )}
      </div>
    </TooltipProvider>
  );
}
