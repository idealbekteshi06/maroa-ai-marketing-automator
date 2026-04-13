import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Bot, Loader2, Play, CheckCircle2, XCircle, Clock, Mail, Search, Share2, Megaphone, BarChart3 } from "lucide-react";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/lib/errorMessages";
import { apiGet, apiPost } from "@/lib/apiClient";

interface LogEntry {
  id: string;
  action_type: string;
  description: string;
  status: "success" | "failed" | "running";
  timestamp: string;
  result: string | null;
}

const actionIcons: Record<string, typeof Mail> = {
  email: Mail,
  seo: Search,
  social: Share2,
  ads: Megaphone,
  analytics: BarChart3,
};

const statusConfig: Record<string, { icon: typeof CheckCircle2; class: string }> = {
  success: { icon: CheckCircle2, class: "bg-success/10 text-success" },
  failed: { icon: XCircle, class: "bg-destructive/10 text-destructive" },
  running: { icon: Clock, class: "bg-primary/10 text-primary" },
};

export default function DashboardOrchestrator() {
  const { businessId, user, isReady } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!businessId || !isReady) { setLoading(false); return; }
    const load = async () => {
      setLoading(true);
      try {
        const data = await apiGet<{ logs?: LogEntry[] }>(`/api/orchestrator/log/${businessId}`);
        setLogs(data.logs ?? []);
      } catch { /* empty */ }
      finally { setLoading(false); }
    };
    load();
  }, [businessId, isReady]);

  const handleRun = async () => {
    if (!businessId) return;
    setRunning(true);
    toast("Running full AI cycle...", { description: "This may take a few minutes" });
    try {
      const data = await apiPost<{ logs?: LogEntry[]; error?: string }>(`/api/orchestrator/run/${businessId}`, {
        user_id: user?.id ?? "", // server expects user_id — this is auth.user.id = businesses.id
        business_id: businessId,
      });
      setLogs(data.logs ?? []);
      toast.success(SUCCESS_MESSAGES.GENERATED);
    } catch { toast.error(ERROR_MESSAGES.GENERATION_FAILED); }
    finally { setRunning(false); }
  };

  const totalActions = logs.length;
  const successCount = (logs || []).filter(l => l.status === "success").length;
  const successRate = totalActions > 0 ? Math.round((successCount / totalActions) * 100) : 0;
  const lastRun = logs.length > 0 ? logs[0].timestamp : null;

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 rounded-lg border border-border bg-card animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          {lastRun && <span className="text-xs text-muted-foreground">Last run: {new Date(lastRun).toLocaleString()}</span>}
        </div>
        <Button size="sm" className="h-9 text-xs" onClick={handleRun} disabled={running}>
          {running ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Play className="mr-1.5 h-3.5 w-3.5" />}
          {running ? "Running..." : "Run Full AI Cycle"}
        </Button>
      </div>

      {logs.length > 0 && (
        <div className="grid gap-3 grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-3 text-center">
            <p className="text-xl font-bold text-foreground">{totalActions}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Total Actions</p>
          </div>
          <div className="rounded-lg border border-success/20 bg-success/5 p-3 text-center">
            <p className="text-xl font-bold text-success">{successRate}%</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Success Rate</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3 text-center">
            <p className="text-sm font-bold text-foreground">{lastRun ? new Date(lastRun).toLocaleDateString() : "N/A"}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Last Run</p>
          </div>
        </div>
      )}

      {running && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <div>
            <p className="text-sm font-medium text-primary">AI orchestrator is running...</p>
            <p className="text-xs text-muted-foreground">Processing email, SEO, social, ads, and analytics tasks.</p>
          </div>
        </div>
      )}

      {logs.length === 0 && !running ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <Bot className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <h3 className="mt-4 text-sm font-semibold text-foreground">Your AI orchestrator handles everything automatically</h3>
          <p className="mt-1.5 text-xs text-muted-foreground max-w-xs mx-auto">Run a full AI cycle to see all automated actions and their results.</p>
          <Button size="sm" className="mt-4" onClick={handleRun}>Run Full AI Cycle</Button>
        </div>
      ) : (
        <div className="space-y-2">
          {(logs || []).map(entry => {
            const ActionIcon = actionIcons[entry.action_type] || Bot;
            const sConfig = statusConfig[entry.status] || statusConfig.running;
            const StatusIcon = sConfig.icon;
            return (
              <div key={entry.id} className="rounded-lg border border-border bg-card px-4 py-3 flex items-center gap-3">
                <div className="rounded-lg bg-muted p-1.5 shrink-0">
                  <ActionIcon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{entry.description}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(entry.timestamp).toLocaleString()}</p>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold shrink-0 ${sConfig.class}`}>
                  <StatusIcon className="h-3 w-3" />
                  {entry.status}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
