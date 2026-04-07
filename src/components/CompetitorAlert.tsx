import { useState, useEffect, useRef } from "react";
import { X, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { cn } from "@/lib/utils";

interface CompReport {
  competitor_name?: string;
  alert_level?: string;
  recommendation?: string;
}

interface CompetitorAlertProps {
  businessId: string | null;
  onNavigate?: (tab: string) => void;
}

export default function CompetitorAlert({ businessId, onNavigate }: CompetitorAlertProps) {
  const [alert, setAlert] = useState<CompReport | null>(null);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const [progress, setProgress] = useState(100);
  const startRef = useRef(0);
  const frameRef = useRef<number>();
  const DURATION = 30000;

  const showAlert = (data: CompReport) => {
    setAlert(data);
    setVisible(true);
    startRef.current = Date.now();

    // Countdown
    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      const remaining = Math.max(0, 100 - (elapsed / DURATION) * 100);
      setProgress(remaining);
      if (remaining <= 0) { dismiss(); return; }
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
  };

  const dismiss = () => {
    setVisible(false);
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    clearTimeout(timerRef.current);
    setTimeout(() => setAlert(null), 400);
  };

  useEffect(() => {
    if (!businessId) return;
    const channel = externalSupabase
      .channel(`comp-alert-${businessId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public",
        table: "competitor_reports",
        filter: `business_id=eq.${businessId}`,
      }, (payload: any) => {
        showAlert({
          competitor_name: payload.new?.competitor_name,
          alert_level: payload.new?.alert_level || "medium",
          recommendation: payload.new?.recommendation,
        });
      })
      .subscribe();

    return () => {
      externalSupabase.removeChannel(channel);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [businessId]);

  if (!alert) return null;

  const levelColor = alert.alert_level === "high" ? "bg-destructive text-destructive-foreground"
    : alert.alert_level === "medium" ? "bg-warning text-warning-foreground"
    : "bg-muted text-muted-foreground";

  return (
    <div className={cn(
      "fixed right-4 top-20 z-50 w-80 rounded-xl border border-border bg-card shadow-xl transition-all duration-400",
      visible ? "translate-x-0 opacity-100" : "translate-x-[120%] opacity-0"
    )} style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-purple-500" />
            <span className="text-xs font-semibold text-foreground">Competitor Intel</span>
          </div>
          <button onClick={dismiss} className="text-muted-foreground hover:text-foreground" aria-label="Dismiss">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        {alert.competitor_name && (
          <p className="text-sm font-medium text-foreground">{alert.competitor_name}</p>
        )}
        <span className={cn("inline-block mt-1 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded", levelColor)}>
          {alert.alert_level || "update"}
        </span>
        {alert.recommendation && (
          <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{alert.recommendation}</p>
        )}
        <Button
          size="sm" variant="outline" className="mt-3 w-full h-8 text-xs"
          onClick={() => { onNavigate?.("competitors"); dismiss(); }}
        >
          View Full Report
        </Button>
      </div>
      {/* Countdown bar */}
      <div className="h-0.5 w-full bg-border rounded-b-xl overflow-hidden">
        <div className="h-full bg-purple-500 transition-none" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
