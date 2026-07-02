import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Lightbulb, Loader2, Sparkles, ChevronDown, ArrowRight, Check } from "lucide-react";
import { apiGet, apiPost, apiPatch, createAbortController } from "@/lib/apiClient";
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
  const { businessId, user, isReady } = useAuth();
  const [ideas, setIdeas] = useState<MarketingIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchIdeasList = useCallback(async (signal?: AbortSignal): Promise<MarketingIdea[]> => {
    if (!user?.id) return [];
    const data = await apiGet<IdeasResponse | MarketingIdea[]>(`/api/ideas/${user.id}`, signal);
    return Array.isArray(data) ? data : data?.items || data?.ideas || data?.data || [];
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !isReady) { setLoading(false); return; }
    const controller = createAbortController();
    const fetchIdeas = async (): Promise<void> => {
      setLoading(true);
      setLoadError(null);
      try {
        const items = await fetchIdeasList(controller.signal);
        setIdeas(items);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setIdeas([]);
        setLoadError(ERROR_MESSAGES.LOAD_FAILED);
      } finally {
        setLoading(false);
      }
    };
    void fetchIdeas();
    return () => controller.abort();
  }, [user?.id, isReady, fetchIdeasList]);

  const handleGenerate = useCallback(async (): Promise<void> => {
    if (!user?.id) { toast.error(ERROR_MESSAGES.NO_BUSINESS_ID); return; }
    setGenerating(true);
    try {
      await apiPost<{ received?: boolean; message?: string }>("/api/ideas/generate", {
        userId: user.id,
      });
      toast.success("Generating ideas — this takes about 30 seconds.");
      await new Promise((r) => setTimeout(r, 8000));
      const items = await fetchIdeasList();
      setIdeas(items);
      if (items.length === 0) {
        toast.message("Still working — hit refresh in a moment if ideas don't appear.");
      } else {
        toast.success(SUCCESS_MESSAGES.GENERATED);
      }
    } catch { toast.error(ERROR_MESSAGES.GENERATION_FAILED); }
    finally { setGenerating(false); }
  }, [user?.id, fetchIdeasList]);

  const moveIdea = (id: string, newStatus: "new" | "in_progress" | "completed"): void => {
    const previous = ideas;
    setIdeas(prev => (prev || []).map(i => i.id === id ? { ...i, status: newStatus } : i));
    if (businessId) {
      // Optimistic update with rollback — the old silent .catch(() => {})
      // let the server reject the move while the UI claimed it stuck,
      // losing the change on next refresh (audit §5).
      apiPatch(`/api/ideas/${id}`, { status: newStatus }).catch(() => {
        setIdeas(previous);
        toast.error("Couldn't save that move — reverted", { id: "ideas-move" });
      });
    }
  };

  if (loading) return (
    <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-24 rounded-lg skeleton" />)}</div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          {loadError && (
            <p className="text-xs text-destructive mb-2">{loadError}</p>
          )}
          {!loadError && ideas.length === 0 && (
            <p className="text-xs text-muted-foreground mb-2">No ideas yet — generate your first batch below.</p>
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
