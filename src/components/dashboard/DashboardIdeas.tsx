import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Lightbulb, Loader2, Sparkles, ChevronDown, ArrowRight, Check } from "lucide-react";
import { DEMO_IDEAS } from "@/lib/demoData";
import { apiGet, apiPost, createAbortController } from "@/lib/apiClient";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/lib/errorMessages";
import type { MarketingIdea } from "@/types";

interface IdeasResponse { ideas?: MarketingIdea[]; items?: MarketingIdea[]; data?: MarketingIdea[]; }

const priorityColors: Record<string, string> = {
  high: "bg-destructive/10 text-destructive",
  urgent: "bg-destructive/10 text-destructive",
  medium: "bg-warning/10 text-warning",
  low: "bg-muted text-muted-foreground",
};

const columns = [
  { id: "new", title: "New Ideas", color: "border-primary/30" },
  { id: "in_progress", title: "In Progress", color: "border-warning/30" },
  { id: "completed", title: "Completed", color: "border-success/30" },
];

export default function DashboardIdeas() {
  const { businessId, isReady } = useAuth();
  const [ideas, setIdeas] = useState<MarketingIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    if (!businessId || !isReady) { setLoading(false); return; }
    const controller = createAbortController();
    const fetchIdeas = async (): Promise<void> => {
      setLoading(true);
      try {
        const data = await apiGet<IdeasResponse | MarketingIdea[]>(`/api/ideas/${businessId}`, controller.signal);
        const items = Array.isArray(data) ? data : data?.items || data?.ideas || data?.data || [];
        if (items.length > 0) { setIdeas(items); setIsDemo(false); }
        else { setIdeas(DEMO_IDEAS as MarketingIdea[]); setIsDemo(true); }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setIdeas(DEMO_IDEAS as MarketingIdea[]);
        setIsDemo(true);
      } finally {
        setLoading(false);
      }
    };
    void fetchIdeas();
    return () => controller.abort();
  }, [businessId, isReady]);

  const handleGenerate = useCallback(async (): Promise<void> => {
    if (!businessId) { toast.error(ERROR_MESSAGES.NO_BUSINESS_ID); return; }
    setGenerating(true);
    try {
      const data = await apiPost<IdeasResponse | MarketingIdea[]>("/api/ideas/generate", { userId: businessId });
      const newIdeas = Array.isArray(data) ? data : data?.ideas || data?.items || [];
      if (newIdeas.length > 0) { setIdeas(newIdeas); setIsDemo(false); }
      toast.success(SUCCESS_MESSAGES.GENERATED);
    } catch { toast.error(ERROR_MESSAGES.GENERATION_FAILED); }
    finally { setGenerating(false); }
  }, [businessId]);

  const moveIdea = (id: string, newStatus: "new" | "in_progress" | "completed"): void => {
    setIdeas(prev => (prev || []).map(i => i.id === id ? { ...i, status: newStatus } : i));
    if (!isDemo && businessId) {
      fetch(`https://maroa-api-production.up.railway.app/api/ideas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      }).catch(() => {});
    }
  };

  if (loading) return (
    <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-24 rounded-lg skeleton" />)}</div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          {isDemo && (
            <span className="inline-block rounded-full bg-muted px-2.5 py-0.5 text-[10px] text-muted-foreground mb-2">
              Sample data — generate real ideas to replace
            </span>
          )}
        </div>
        <Button onClick={handleGenerate} disabled={generating} className="h-9 text-sm">
          {generating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : <><Sparkles className="mr-2 h-4 w-4" /> Generate Ideas</>}
        </Button>
      </div>

      {/* Kanban — 3 columns on desktop, stacked on mobile */}
      <div className="grid gap-4 lg:grid-cols-3">
        {columns.map(col => {
          const colIdeas = (ideas || []).filter(i => i.status === col.id);
          return (
            <div key={col.id} className={`rounded-xl border-t-2 ${col.color} border border-border bg-card/50 p-3 min-h-[200px]`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{col.title}</h3>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{colIdeas.length}</span>
              </div>
              <div className="space-y-2">
                {colIdeas.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">No ideas here yet</p>
                )}
                {colIdeas.map(idea => {
                  const expanded = expandedId === idea.id;
                  const pColor = priorityColors[idea.priority] || priorityColors.medium;
                  return (
                    <div key={idea.id} className="rounded-lg border border-border bg-card p-3 transition-shadow hover:shadow-md">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${pColor}`}>{idea.priority}</span>
                            <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">{idea.category}</span>
                          </div>
                          <p className={`text-xs font-medium text-foreground leading-relaxed ${expanded ? "" : "line-clamp-2"}`}>{idea.idea}</p>
                        </div>
                        <button onClick={() => setExpandedId(expanded ? null : idea.id)} className="shrink-0 p-1 text-muted-foreground hover:text-foreground">
                          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
                        </button>
                      </div>

                      {expanded && (
                        <div className="mt-3 space-y-2 border-t border-border pt-3">
                          <div className="flex gap-3 text-[10px] text-muted-foreground">
                            <span>💰 {idea.budget_required}</span>
                            <span>⏱ {idea.time_to_results}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">{idea.estimated_impact}</p>
                          <div className="rounded-lg bg-muted/50 p-2.5">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">How to execute</p>
                            <p className="text-[11px] text-foreground whitespace-pre-line leading-relaxed">{idea.how_to_execute}</p>
                          </div>
                          <div className="flex gap-1.5">
                            {col.id === "new" && (
                              <Button size="sm" variant="outline" className="h-7 text-[10px] flex-1" onClick={() => moveIdea(idea.id, "in_progress")}>
                                <ArrowRight className="mr-1 h-3 w-3" /> Execute
                              </Button>
                            )}
                            {col.id === "in_progress" && (
                              <Button size="sm" className="h-7 text-[10px] flex-1" onClick={() => moveIdea(idea.id, "completed")}>
                                <Check className="mr-1 h-3 w-3" /> Done
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
