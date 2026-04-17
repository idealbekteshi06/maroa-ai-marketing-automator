import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, Brain, Zap, Trophy, Globe, Activity } from "lucide-react";
import { apiGet, apiPost, createAbortController } from "@/lib/apiClient";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/lib/errorMessages";

interface LogEntry {
  id?: string;
  type?: string;
  description?: string;
  message?: string;
  action?: string;
  timestamp?: string;
  created_at?: string;
}
const typeColors: Record<string, { bg: string; text: string; icon: string }> = {
  content: { bg: "bg-primary/10", text: "text-primary", icon: "📝" },
  seo: { bg: "bg-orange-500/10", text: "text-orange-500", icon: "🔍" },
  competitor: { bg: "bg-purple-500/10", text: "text-purple-500", icon: "🎯" },
  email: { bg: "bg-teal-500/10", text: "text-teal-500", icon: "📧" },
  ad: { bg: "bg-pink-500/10", text: "text-pink-500", icon: "📣" },
  campaign: { bg: "bg-yellow-500/10", text: "text-yellow-600", icon: "🚀" },
  review: { bg: "bg-green-500/10", text: "text-green-600", icon: "⭐" },
  analysis: { bg: "bg-indigo-500/10", text: "text-indigo-500", icon: "📊" },
  default: { bg: "bg-muted", text: "text-muted-foreground", icon: "🤖" },
};

const skillCategories = [
  "Content Strategy", "SEO Optimization", "Social Media", "Email Marketing",
  "Ad Campaigns", "Competitor Analysis", "Brand Voice", "Lead Generation",
  "Review Management", "Analytics", "Video Scripts", "Landing Pages",
  "CRM Automation", "A/B Testing", "Audience Targeting", "Retention",
];

function formatTimeAgo(date: string) {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs === 1) return "1 hour ago";
  if (hrs < 24) return `${hrs} hours ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export default function DashboardAIBrain() {
  const { businessId, isReady } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [runMessage, setRunMessage] = useState("");
  const [totalSignals, setTotalSignals] = useState(0);
  const [contentWins, setContentWins] = useState(0);

  const fetchLogs = useCallback(async (signal?: AbortSignal): Promise<void> => {
    if (!businessId || !isReady) { setLoading(false); return; }
    try {
      setLoading(true);
      try {
        const data = await apiGet<Record<string, unknown> | LogEntry[]>(`/api/orchestrator/log/${businessId}`, signal);
        const parsed: LogEntry[] = Array.isArray(data) ? data : data?.logs || [];
        setLogs(parsed.slice(0, 10));
        setTotalSignals(parsed.length);
        setContentWins(parsed.filter((l) => l.type === "content" || l.action === "content_published").length);
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        console.error("Failed to load AI Brain logs:", err);
        toast.error(ERROR_MESSAGES.LOAD_FAILED);
        setLogs([]);
        setTotalSignals(0);
        setContentWins(0);
      }
    } finally {
      setLoading(false);
    }
  }, [businessId, isReady]);

  useEffect(() => {
    const controller = createAbortController();
    void fetchLogs(controller.signal);
    return () => controller.abort();
  }, [fetchLogs]);

  const handleRunAI = useCallback(async (): Promise<void> => {
    if (!businessId) return;
    setRunning(true);
    setRunMessage("Analyzing intelligence...");
    try {
      const msgs = ["Analyzing intelligence...", "Scanning competitors...", "Creating content...", "Optimizing campaigns..."];
      let i = 0;
      const interval: ReturnType<typeof setInterval> = setInterval(() => {
        i++;
        if (i < msgs.length) setRunMessage(msgs[i]);
      }, 3000);

      await apiPost(`/api/orchestrator/run/${businessId}`, {});

      clearInterval(interval);
      toast.success(SUCCESS_MESSAGES.GENERATED);
      void fetchLogs();
    } catch {
      toast.error(ERROR_MESSAGES.GENERATION_FAILED);
    } finally {
      setRunning(false);
      setRunMessage("");
    }
  }, [businessId, fetchLogs]);

  const getLogType = (log: LogEntry) => {
    const t = (log.type || log.action || "default").toLowerCase();
    for (const key of Object.keys(typeColors)) {
      if (t.includes(key)) return typeColors[key];
    }
    return typeColors.default;
  };

  const getLogText = (log: LogEntry) =>
    log.description || log.message || log.action || "AI action executed";

  const getLogTime = (log: LogEntry) =>
    log.timestamp || log.created_at || "";

  const statCards = [
    { label: "Total Signals", value: totalSignals, icon: Activity, color: "text-primary bg-primary/10" },
    { label: "Content Wins", value: contentWins, icon: Trophy, color: "text-success bg-success/10" },
    { label: "Modules Active", value: 28, icon: Zap, color: "text-purple-500 bg-purple-500/10" },
    { label: "Countries Supported", value: 22, icon: Globe, color: "text-orange-500 bg-orange-500/10" },
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-14 rounded-lg skeleton" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 rounded-lg skeleton" />)}
        </div>
        <div className="h-48 rounded-lg skeleton" />
      </div>
    );
  }

  return (
    <div className="space-y-5 page-enter">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">AI Brain — Your Autonomous Marketing Manager</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                </span>
                <span className="text-xs font-medium text-green-600">Active — Running 24/7</span>
              </div>
            </div>
          </div>
        </div>
        <Button className="h-9 text-sm px-5" onClick={handleRunAI} disabled={running}>
          {running ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {runMessage}</> : <><Zap className="mr-2 h-4 w-4" /> Run AI Now</>}
        </Button>
      </div>

      {/* Running progress */}
      {running && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <div>
            <p className="text-sm font-medium text-primary">{runMessage}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">This may take up to 60 seconds</p>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.color}`}>
                <s.icon className="h-4 w-4" />
              </div>
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Decisions */}
      <div className="rounded-lg border border-border bg-card shadow-meta">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
          <h3 className="text-sm font-semibold text-foreground">Recent AI Decisions</h3>
        </div>
        {logs.length === 0 ? (
          <div className="p-8 text-center">
            <Brain className="mx-auto h-10 w-10 text-muted-foreground/20" />
            <p className="mt-4 text-sm font-medium text-foreground">No decisions logged yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Run the AI Brain to start generating marketing decisions</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {logs.map((log, i) => {
              const style = getLogType(log);
              return (
                <div key={log.id || i} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/20 transition-colors">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm shrink-0 ${style.bg}`}>
                    {style.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-foreground truncate">{getLogText(log)}</p>
                    {getLogTime(log) && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">{formatTimeAgo(getLogTime(log))}</p>
                    )}
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${style.bg} ${style.text}`}>
                    {(log.type || log.action || "action").replace(/_/g, " ")}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Knowledge Base */}
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Knowledge Base</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">35 Marketing Frameworks Active</p>
          </div>
          <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">All Systems Go</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {skillCategories.map((skill) => (
            <span key={skill} className="rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs text-foreground">
              {skill}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
