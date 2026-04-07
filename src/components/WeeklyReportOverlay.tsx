import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { Check, AlertTriangle, ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReportData {
  id: string;
  score: number;
  headline: string;
  wins: string[];
  concerns: string[];
  recommendations: string[];
  week_start?: string;
  week_end?: string;
}

interface WeeklyReportOverlayProps {
  businessId: string | null;
  onDismiss: () => void;
}

export default function WeeklyReportOverlay({ businessId, onDismiss }: WeeklyReportOverlayProps) {
  const [report, setReport] = useState<ReportData | null>(null);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!businessId) return;
    const fetchReport = async () => {
      const { data } = await externalSupabase
        .from("ai_weekly_reports")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!data) return;

      const lastSeen = localStorage.getItem("last-report-seen");
      if (lastSeen === data.id) return;

      // Parse report data
      let parsed: ReportData;
      try {
        const raw = typeof data.report_data === "string" ? JSON.parse(data.report_data) : data.report_data;
        parsed = {
          id: data.id,
          score: raw?.score || data.score || 0,
          headline: raw?.headline || data.headline || "Your weekly performance report",
          wins: Array.isArray(raw?.wins) ? raw.wins : [],
          concerns: Array.isArray(raw?.concerns) ? raw.concerns : [],
          recommendations: Array.isArray(raw?.recommendations) ? raw.recommendations : [],
          week_start: data.week_start,
          week_end: data.week_end,
        };
      } catch {
        parsed = { id: data.id, score: 0, headline: "Weekly report", wins: [], concerns: [], recommendations: [] };
      }

      setReport(parsed);
      setShow(true);

      // Animate score
      const target = parsed.score;
      if (target > 0) {
        const duration = 1200;
        const steps = target;
        const interval = duration / steps;
        let current = 0;
        const timer = setInterval(() => {
          current++;
          setAnimatedScore(current);
          if (current >= target) clearInterval(timer);
        }, interval);
      }
    };

    fetchReport();
  }, [businessId]);

  const handleDismiss = useCallback(() => {
    if (report) localStorage.setItem("last-report-seen", report.id);
    setShow(false);
    setTimeout(onDismiss, 300);
  }, [report, onDismiss]);

  if (!show || !report) return null;

  const scoreColor = report.score >= 8 ? "text-success" : report.score >= 5 ? "text-warning" : "text-destructive";
  const ringColor = report.score >= 8 ? "stroke-success" : report.score >= 5 ? "stroke-warning" : "stroke-destructive";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-md" onClick={handleDismiss} />
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90dvh] overflow-y-auto">
        <button onClick={handleDismiss} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground" aria-label="Close">
          <X className="h-4 w-4" />
        </button>

        <div className="text-center mb-6">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Weekly AI Report</p>
          {report.week_start && report.week_end && (
            <p className="text-[11px] text-muted-foreground mt-1">
              {new Date(report.week_start).toLocaleDateString()} – {new Date(report.week_end).toLocaleDateString()}
            </p>
          )}

          {/* Score circle */}
          <div className="relative mx-auto mt-4 h-20 w-20">
            <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(var(--border))" strokeWidth="4" />
              <circle cx="40" cy="40" r="34" fill="none" className={ringColor} strokeWidth="4" strokeLinecap="round"
                strokeDasharray={`${(animatedScore / 10) * 213.6} 213.6`}
                style={{ transition: "stroke-dasharray 1.2s ease" }} />
            </svg>
            <span className={cn("absolute inset-0 flex items-center justify-center text-2xl font-bold", scoreColor)}>
              {animatedScore}
            </span>
          </div>

          <h2 className="mt-3 text-lg font-bold text-foreground">{report.headline}</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {report.wins.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-success mb-2">Wins</p>
              {report.wins.slice(0, 3).map((w, i) => (
                <div key={i} className="flex items-start gap-1.5 mb-1.5">
                  <Check className="h-3 w-3 text-success shrink-0 mt-0.5" />
                  <span className="text-xs text-foreground">{w}</span>
                </div>
              ))}
            </div>
          )}
          {report.concerns.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-warning mb-2">Concerns</p>
              {report.concerns.slice(0, 3).map((c, i) => (
                <div key={i} className="flex items-start gap-1.5 mb-1.5">
                  <AlertTriangle className="h-3 w-3 text-warning shrink-0 mt-0.5" />
                  <span className="text-xs text-foreground">{c}</span>
                </div>
              ))}
            </div>
          )}
          {report.recommendations.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-2">Next Steps</p>
              {report.recommendations.slice(0, 3).map((r, i) => (
                <div key={i} className="flex items-start gap-1.5 mb-1.5">
                  <ArrowRight className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                  <span className="text-xs text-foreground">{r}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-[10px] text-muted-foreground">Generated by your AI Brain</p>
        <Button onClick={handleDismiss} className="mt-4 w-full h-11">Got it — show dashboard</Button>
      </div>
    </div>
  );
}
