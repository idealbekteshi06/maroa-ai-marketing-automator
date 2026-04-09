import { useState, useEffect, useRef, useCallback } from "react";
import { X, Rocket, Flame, AlertTriangle, TrendingUp, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  type: "viral" | "hot_lead" | "competitor" | "campaign" | "report";
  message: string;
  action?: { label: string; tab: string };
  dismissAfter: number; // ms, 0 = manual
}

const alertConfig: Record<string, { icon: React.ReactNode; gradient: string }> = {
  viral: { icon: <Rocket className="h-4 w-4" />, gradient: "from-emerald-500/90 to-green-600/90" },
  hot_lead: { icon: <Flame className="h-4 w-4" />, gradient: "from-orange-500/90 to-amber-600/90" },
  competitor: { icon: <AlertTriangle className="h-4 w-4" />, gradient: "from-purple-500/90 to-violet-600/90" },
  campaign: { icon: <TrendingUp className="h-4 w-4" />, gradient: "from-blue-500/90 to-indigo-600/90" },
  report: { icon: <FileText className="h-4 w-4" />, gradient: "from-primary/90 to-blue-600/90" },
};

interface PerformanceAlertProps {
  businessId: string | null;
  onNavigate?: (tab: string) => void;
}

export default function PerformanceAlert({ businessId, onNavigate }: PerformanceAlertProps) {
  const [queue, setQueue] = useState<Alert[]>([]);
  const [current, setCurrent] = useState<Alert | null>(null);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const addAlert = useCallback((alert: Alert) => {
    setQueue(prev => [...prev, alert]);
  }, []);

  // Show next alert from queue
  useEffect(() => {
    if (current || queue.length === 0) return;
    const next = queue[0];
    setQueue(prev => prev.slice(1));
    setCurrent(next);
    setVisible(true);

    if (next.dismissAfter > 0) {
      timerRef.current = setTimeout(() => dismiss(), next.dismissAfter);
    }
  }, [queue, current]);

  const dismiss = () => {
    setVisible(false);
    clearTimeout(timerRef.current);
    setTimeout(() => setCurrent(null), 300); // wait for slide-out animation
  };

  // Supabase subscriptions
  useEffect(() => {
    if (!businessId) return;

    const channel = externalSupabase
      .channel(`perf-alerts-${businessId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public",
        table: "contacts",
        filter: `business_id=eq.${businessId}`,
      }, (payload: { new?: Record<string, unknown>; old?: Record<string, unknown> }) => {
        const score = payload.new?.lead_score;
        if (score && score >= 80) {
          addAlert({
            id: `lead-${Date.now()}`,
            type: "hot_lead",
            message: `Hot lead! ${payload.new.first_name || "Someone"} scored ${score}/100`,
            action: { label: "View Lead", tab: "crm" },
            dismissAfter: 20000,
          });
        }
      })
      .on("postgres_changes", {
        event: "INSERT", schema: "public",
        table: "competitor_reports",
        filter: `business_id=eq.${businessId}`,
      }, (payload: { new?: Record<string, unknown>; old?: Record<string, unknown> }) => {
        addAlert({
          id: `comp-${Date.now()}`,
          type: "competitor",
          message: `Competitor alert: ${payload.new?.recommendation?.slice(0, 60) || "New intelligence available"}`,
          action: { label: "See Intel", tab: "competitors" },
          dismissAfter: 30000,
        });
      })
      .subscribe();

    return () => { externalSupabase.removeChannel(channel); clearTimeout(timerRef.current); };
  }, [businessId, addAlert]);

  if (!current) return null;

  const config = alertConfig[current.type] || alertConfig.campaign;

  return (
    <div className={cn(
      "flex items-center justify-center gap-3 px-4 py-2.5 text-white text-xs font-medium transition-all duration-300",
      `bg-gradient-to-r ${config.gradient}`,
      visible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
    )}>
      {config.icon}
      <span className="flex-1">{current.message}</span>
      {current.action && onNavigate && (
        <Button
          variant="secondary"
          size="sm"
          className="h-6 text-[10px] bg-white/20 hover:bg-white/30 text-white border-0"
          onClick={() => { onNavigate(current.action!.tab); dismiss(); }}
        >
          {current.action.label}
        </Button>
      )}
      <button onClick={dismiss} className="shrink-0 rounded p-0.5 hover:bg-white/20" aria-label="Dismiss">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
