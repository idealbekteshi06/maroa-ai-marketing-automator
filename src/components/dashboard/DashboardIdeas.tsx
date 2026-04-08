import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Lightbulb, Loader2, Bookmark, Archive, Sparkles } from "lucide-react";

const API_BASE = "https://maroa-api-production.up.railway.app";

interface Idea {
  id: string;
  title: string;
  description: string;
  category: string;
  status: "new" | "saved" | "archived";
  created_at: string;
}

export default function DashboardIdeas() {
  const { businessId, isReady } = useAuth();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!businessId || !isReady) { setLoading(false); return; }
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/ideas/${businessId}`);
        if (res.ok) {
          const data = await res.json();
          setIdeas(Array.isArray(data) ? data : data?.items || data?.data || []);
        }
      } catch { /* empty */ }
      setLoading(false);
    };
    load();
  }, [businessId, isReady]);

  const handleGenerate = async () => {
    if (!businessId) return;
    setGenerating(true);
    try {
      const res = await fetch(`${API_BASE}/api/ideas/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: businessId }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const newIdeas = Array.isArray(data) ? data : [data];
      setIdeas(prev => [...newIdeas, ...prev]);
      toast.success(`${newIdeas.length} new idea${newIdeas.length !== 1 ? "s" : ""} generated!`);
    } catch {
      toast.error("Failed to generate ideas");
    } finally {
      setGenerating(false);
    }
  };

  const handleAction = async (ideaId: string, action: "saved" | "archived") => {
    try {
      const res = await fetch(`${API_BASE}/api/ideas/${ideaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action }),
      });
      if (!res.ok) throw new Error();
      setIdeas(prev => prev.map(i => i.id === ideaId ? { ...i, status: action } : i));
      toast.success(action === "saved" ? "Idea saved!" : "Idea archived");
    } catch {
      toast.error("Failed to update idea");
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 rounded-lg border border-border bg-card animate-pulse" />
        ))}
      </div>
    );
  }

  if (ideas.length === 0 && !generating) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <Lightbulb className="mx-auto h-10 w-10 text-muted-foreground/30" />
        <h3 className="mt-4 text-sm font-semibold text-foreground">Generate marketing ideas</h3>
        <p className="mt-1.5 text-xs text-muted-foreground max-w-xs mx-auto">
          Let AI brainstorm creative marketing ideas tailored to your business.
        </p>
        <Button size="sm" className="mt-4" onClick={handleGenerate} disabled={generating}>
          {generating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1.5 h-3.5 w-3.5" />}
          Generate Ideas
        </Button>
      </div>
    );
  }

  const activeIdeas = (ideas || []).filter(i => i.status !== "archived");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{activeIdeas.length} idea{activeIdeas.length !== 1 ? "s" : ""}</p>
        <Button size="sm" className="h-9 text-xs" onClick={handleGenerate} disabled={generating}>
          {generating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1.5 h-3.5 w-3.5" />}
          Generate More
        </Button>
      </div>

      {generating && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <p className="text-sm font-medium text-primary">Generating fresh ideas...</p>
        </div>
      )}

      <div className="space-y-3">
        {(activeIdeas || []).map(idea => (
          <div key={idea.id} className={`rounded-lg border bg-card p-5 ${idea.status === "saved" ? "border-primary/20" : "border-border"}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="inline-flex items-center rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{idea.category}</span>
                  {idea.status === "saved" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      <Bookmark className="h-2.5 w-2.5" /> Saved
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-foreground">{idea.title}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{idea.description}</p>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                {idea.status !== "saved" && (
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleAction(idea.id, "saved")}>
                    <Bookmark className="mr-1 h-3 w-3" /> Save
                  </Button>
                )}
                <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => handleAction(idea.id, "archived")}>
                  <Archive className="mr-1 h-3 w-3" /> Archive
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
