import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Wrench, Loader2, Calculator, HelpCircle, CheckSquare, Sparkles } from "lucide-react";

interface FreeTool {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  expected_leads: number;
  created_at: string;
}

const categoryIcon: Record<string, typeof Calculator> = {
  calculator: Calculator,
  quiz: HelpCircle,
  checker: CheckSquare,
  generator: Sparkles,
};

const difficultyBadge: Record<string, string> = {
  easy: "bg-success/10 text-success",
  medium: "bg-warning/10 text-warning",
  hard: "bg-destructive/10 text-destructive",
};

const API_BASE = "https://maroa-api-production.up.railway.app";

export default function DashboardFreeTools() {
  const { businessId, isReady } = useAuth();
  const [tools, setTools] = useState<FreeTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [suggesting, setSuggesting] = useState(false);

  useEffect(() => {
    if (!businessId || !isReady) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/tools/${businessId}`);
        const data = await res.json();
        if (res.ok) setTools(data.tools ?? []);
      } catch { /* empty */ }
      finally { setLoading(false); }
    };
    load();
  }, [businessId, isReady]);

  const handleSuggest = async () => {
    if (!businessId) return;
    setSuggesting(true);
    try {
      const res = await fetch(`${API_BASE}/api/tools/suggest`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: businessId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setTools(data.tools ?? []);
      toast.success("Tool suggestions generated");
    } catch { toast.error("Failed to generate suggestions"); }
    finally { setSuggesting(false); }
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button size="sm" className="h-9 text-xs" onClick={handleSuggest} disabled={suggesting}>
          {suggesting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1.5 h-3.5 w-3.5" />}
          Suggest Tools
        </Button>
      </div>

      {tools.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <Wrench className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <h3 className="mt-4 text-sm font-semibold text-foreground">Discover free tools to generate leads</h3>
          <p className="mt-1.5 text-xs text-muted-foreground max-w-xs mx-auto">AI will suggest calculators, quizzes, and other tools your audience will love.</p>
          <Button size="sm" className="mt-4" onClick={handleSuggest}>Get Suggestions</Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {tools.map(tool => {
            const Icon = categoryIcon[tool.category] || Wrench;
            return (
              <div key={tool.id} className="rounded-lg border border-border bg-card p-5">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-muted p-2">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-foreground">{tool.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{tool.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex items-center rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{tool.category}</span>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${difficultyBadge[tool.difficulty] || difficultyBadge.medium}`}>{tool.difficulty}</span>
                      <span className="text-[10px] text-success font-medium">~{tool.expected_leads} leads/mo</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
