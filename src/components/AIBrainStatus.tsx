import { useState, useEffect, useRef } from "react";
import { Brain, Loader2 } from "lucide-react";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { cn } from "@/lib/utils";

type BrainState = "idle" | "analyzing" | "deciding" | "planning" | "executing" | "complete";

const stateMessages: Record<BrainState, string> = {
  idle: "AI Brain is monitoring your business",
  analyzing: "Reading your last 7 days of analytics...",
  deciding: "Comparing against competitor activity...",
  planning: "Building this week's content strategy...",
  executing: "Scheduling actions...",
  complete: "Strategy updated ✓",
};

interface AIBrainStatusProps {
  businessId: string | null;
  aiDecisions?: Array<Record<string, unknown>>;
}

/* Gradient border wrapper — uses React state for guaranteed animation */
function GradientBorderCard({ children }: { children: React.ReactNode }) {
  const [angle, setAngle] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setAngle(a => (a + 1.5) % 360), 40);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{
      borderRadius: 16,
      padding: 2,
      background: `conic-gradient(from ${angle}deg, #0A84FF, #BF5AF2, #30D158, #FF9F0A, #FF375F, #0A84FF)`,
    }}>
      <div style={{ borderRadius: 14, background: "hsl(var(--card))", padding: 20 }}>
        {children}
      </div>
    </div>
  );
}

export default function AIBrainStatus({ businessId, aiDecisions = [] }: AIBrainStatusProps) {
  const [state, setState] = useState<BrainState>("idle");
  const [lastDecision, setLastDecision] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const triggerThinkingAnimation = (decision: string) => {
    timerRef.current.forEach(clearTimeout);
    timerRef.current = [];
    const steps: { state: BrainState; delay: number }[] = [
      { state: "analyzing", delay: 0 },
      { state: "deciding", delay: 1000 },
      { state: "planning", delay: 3000 },
      { state: "executing", delay: 5000 },
      { state: "complete", delay: 6000 },
      { state: "idle", delay: 11000 },
    ];
    steps.forEach(({ state: s, delay }) => {
      const t = setTimeout(() => { setState(s); if (s === "complete") setLastDecision(decision); }, delay);
      timerRef.current.push(t);
    });
  };

  useEffect(() => {
    if (!businessId) return;
    const channel = externalSupabase
      .channel(`brain-${businessId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "businesses", filter: `id=eq.${businessId}` },
        (payload: { new?: Record<string, unknown> }) => {
          if (payload.new?.last_decision && payload.new.last_decision !== payload.old?.last_decision) {
            triggerThinkingAnimation(payload.new.last_decision);
          }
        })
      .subscribe();
    return () => { externalSupabase.removeChannel(channel); timerRef.current.forEach(clearTimeout); };
  }, [businessId]);

  const isActive = state !== "idle" && state !== "complete";

  return (
    <GradientBorderCard>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", isActive ? "bg-primary/20" : "bg-primary/10")}>
            <Brain className={cn("h-5 w-5 text-primary", isActive && "animate-pulse")} />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-foreground">AI Brain</h3>
            <p className="text-[11px] text-muted-foreground">Running 24/7</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={cn("h-2.5 w-2.5 rounded-full", isActive ? "bg-primary animate-pulse" : "bg-success")} />
          <span className={cn("text-xs font-medium", isActive ? "text-primary" : "text-success")}>{isActive ? "Working..." : "Active"}</span>
        </div>
      </div>

      <div className="rounded-lg bg-muted p-3.5 mb-3">
        <div className="flex items-center gap-2">
          {isActive && <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />}
          <p className="text-[13px] text-foreground font-medium">{stateMessages[state]}</p>
        </div>
        {isActive && (
          <div className="flex gap-1 mt-2">
            {[0, 1, 2].map(i => (
              <span key={i} style={{
                width: 6, height: 6, borderRadius: "50%", background: "hsl(var(--primary))",
                opacity: 0.3, animation: `none`,
              }} ref={el => {
                if (!el) return;
                let frame = 0;
                const interval = setInterval(() => {
                  frame = (frame + 1) % 30;
                  const offset = i * 5;
                  const pos = (frame + offset) % 30;
                  el.style.opacity = pos < 10 ? "1" : "0.3";
                }, 80);
                return () => clearInterval(interval);
              }} />
            ))}
          </div>
        )}
        {state === "complete" && lastDecision && (
          <p className="mt-2 text-[12px] text-muted-foreground">{lastDecision.slice(0, 120)}</p>
        )}
      </div>

      {aiDecisions.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Recent decisions</p>
          {aiDecisions.slice(0, 3).map((d, i: number) => (
            <div key={i} className="flex items-start gap-2.5 pb-2 last:pb-0">
              <div className="flex flex-col items-center">
                <div className="h-2 w-2 rounded-full bg-success shrink-0 mt-1" />
                {i < Math.min(aiDecisions.length, 3) - 1 && <div className="w-px flex-1 bg-border mt-1" />}
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {typeof d === "string" ? d.slice(0, 80) : (d.title || d.value || JSON.stringify(d)).toString().slice(0, 80)}
              </p>
            </div>
          ))}
        </div>
      )}
    </GradientBorderCard>
  );
}
