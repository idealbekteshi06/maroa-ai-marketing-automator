import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type AgentStep = {
  id: string;
  label: string;
  detail?: string;
  durationMs?: number;
};

interface LiveAgentActivityFeedProps {
  steps?: AgentStep[];
  onComplete?: () => void;
  ctaLabel?: string;
  className?: string;
  autoStart?: boolean;
}

const DEFAULT_STEPS: AgentStep[] = [
  { id: "reviews", label: "Reading your Google reviews", detail: "Found 23 reviews · avg 4.7★", durationMs: 1800 },
  { id: "voice", label: "Listening to how customers talk about you", detail: 'Top phrase: "worth the drive" (mentioned 8×)', durationMs: 2200 },
  { id: "brand", label: "Locking in your brand voice", detail: "Warm · family-owned · understated confidence", durationMs: 1600 },
  { id: "competitors", label: "Mapping your top 3 competitors", detail: "Identified gaps in evening posting + reels", durationMs: 2000 },
  { id: "strategy", label: "Drafting your 30-day strategy", detail: "12 posts · 4 ad variants · 2 emails", durationMs: 2400 },
  { id: "psychology", label: "Applying marketing psychology layer", detail: "Social proof · loss aversion · reciprocity", durationMs: 1500 },
  { id: "captions", label: "Writing your first 3 captions", detail: "Voice-polished · slop-checked · ready to ship", durationMs: 2800 },
];

export default function LiveAgentActivityFeed({
  steps = DEFAULT_STEPS,
  onComplete,
  ctaLabel = "Review what your AI built",
  className,
  autoStart = true,
}: LiveAgentActivityFeedProps) {
  const [currentIndex, setCurrentIndex] = useState(autoStart ? 0 : -1);
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (currentIndex < 0 || currentIndex >= steps.length) return;
    const step = steps[currentIndex];
    const t = setTimeout(() => {
      setDoneIds((prev) => {
        const next = new Set(prev);
        next.add(step.id);
        return next;
      });
      if (currentIndex + 1 < steps.length) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setFinished(true);
      }
    }, step.durationMs ?? 1800);
    return () => clearTimeout(t);
  }, [currentIndex, steps]);

  const visible = useMemo(
    () => steps.slice(0, Math.max(currentIndex + 1, doneIds.size)),
    [steps, currentIndex, doneIds]
  );

  const allDone = finished && doneIds.size === steps.length;

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-6 shadow-sm",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <header className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            {allDone ? "Your AI marketing team is ready" : "Your AI marketing team is working"}
          </p>
          <p className="text-xs text-muted-foreground">
            {allDone
              ? `Completed ${steps.length} steps · live updates from the system`
              : `Step ${Math.min(currentIndex + 1, steps.length)} of ${steps.length} · live updates from the system`}
          </p>
        </div>
      </header>

      <ol className="space-y-3" aria-label="AI agent activity">
        {visible.map((step) => {
          const isDone = doneIds.has(step.id);
          const isActive = !isDone && step.id === steps[currentIndex]?.id;
          return (
            <li
              key={step.id}
              className="flex items-start gap-3 rounded-lg border border-border/50 bg-background/40 p-3 animate-in fade-in slide-in-from-bottom-1 duration-500"
            >
              <div
                className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                  isDone && "bg-success/15 text-success",
                  isActive && "bg-primary/15 text-primary",
                  !isDone && !isActive && "bg-muted text-muted-foreground"
                )}
                aria-hidden
              >
                {isDone ? (
                  <Check className="h-3 w-3" strokeWidth={3} />
                ) : isActive ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <span className="block h-1.5 w-1.5 rounded-full bg-current opacity-50" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-sm font-medium leading-tight",
                    isDone ? "text-foreground" : "text-foreground/90"
                  )}
                >
                  {step.label}
                  {isActive && (
                    <span className="ml-1 inline-flex gap-0.5 align-middle text-primary">
                      <span className="h-1 w-1 animate-pulse rounded-full bg-current" style={{ animationDelay: "0ms" }} />
                      <span className="h-1 w-1 animate-pulse rounded-full bg-current" style={{ animationDelay: "200ms" }} />
                      <span className="h-1 w-1 animate-pulse rounded-full bg-current" style={{ animationDelay: "400ms" }} />
                    </span>
                  )}
                </p>
                {step.detail && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{step.detail}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {allDone && (
        <div className="mt-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <Button
            onClick={() => onComplete?.()}
            className="w-full h-11 group"
          >
            {ctaLabel}
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Nothing is published yet. Everything waits for your approval.
          </p>
        </div>
      )}
    </div>
  );
}
