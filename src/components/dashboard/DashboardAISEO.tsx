import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Search, Loader2, CheckCircle2, AlertTriangle, Tag, Globe } from "lucide-react";

const API_BASE = "https://maroa-api-production.up.railway.app";

interface Suggestion {
  type: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

interface KeywordAnalysis {
  keyword: string;
  density: number;
  recommendation: string;
}

interface OptimizationResult {
  score: number;
  suggestions: Suggestion[];
  keywords: KeywordAnalysis[];
}

const priorityColor: Record<string, string> = {
  high: "text-destructive",
  medium: "text-warning",
  low: "text-muted-foreground",
};

export default function DashboardAISEO() {
  const { businessId } = useAuth();
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleOptimize = async () => {
    if (!businessId || !url.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/ai-seo/optimize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: businessId, url: url.trim() }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setResult({ ...data, suggestions: data.suggestions || [], keywords: data.keywords || [] });
      toast.success("Optimization analysis complete!");
    } catch {
      toast.error("Failed to optimize content");
    } finally {
      setLoading(false);
    }
  };

  if (!result && !loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <Search className="mx-auto h-10 w-10 text-muted-foreground/30" />
        <h3 className="mt-4 text-sm font-semibold text-foreground">Optimize your content for search</h3>
        <p className="mt-1.5 text-xs text-muted-foreground max-w-xs mx-auto">
          Enter a URL to get AI-powered SEO optimization suggestions.
        </p>
        <div className="max-w-sm mx-auto mt-4 flex gap-2">
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://yoursite.com/page"
            className="flex-1 h-9 rounded-md border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground"
            onKeyDown={e => e.key === "Enter" && handleOptimize()}
          />
          <Button size="sm" className="h-9 text-xs" onClick={handleOptimize} disabled={!url.trim()}>
            <Search className="mr-1.5 h-3.5 w-3.5" /> Optimize
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-8 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
        <p className="mt-3 text-sm font-medium text-primary">Analyzing "{url}"...</p>
        <p className="text-xs text-muted-foreground mt-1">Checking content, keywords, and structure</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground truncate max-w-[200px]">{url}</span>
        </div>
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            className="h-9 rounded-md border border-border bg-card px-3 text-xs text-foreground w-48"
            onKeyDown={e => e.key === "Enter" && handleOptimize()}
          />
          <Button size="sm" className="h-9 text-xs" onClick={handleOptimize}>
            <Search className="mr-1.5 h-3.5 w-3.5" /> Re-analyze
          </Button>
        </div>
      </div>

      {result && (
        <>
          <div className="rounded-lg border border-border bg-card p-5 text-center">
            <p className="text-3xl font-bold text-foreground">{result.score}<span className="text-lg text-muted-foreground">/100</span></p>
            <p className="text-[10px] text-muted-foreground mt-0.5">SEO Score</p>
          </div>

          {(result.suggestions || []).length > 0 && (
            <div className="rounded-lg border border-border bg-card p-5">
              <h4 className="text-xs font-semibold text-foreground mb-3">Optimization Suggestions</h4>
              <div className="space-y-3">
                {(result.suggestions || []).map((s, i) => (
                  <div key={i} className="flex items-start gap-3">
                    {s.priority === "high" ? <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" /> : <CheckCircle2 className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />}
                    <div>
                      <p className={`text-xs font-medium ${priorityColor[s.priority]}`}>{s.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{s.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(result.keywords || []).length > 0 && (
            <div className="rounded-lg border border-border bg-card p-5">
              <h4 className="text-xs font-semibold text-foreground mb-3">Keyword Analysis</h4>
              <div className="space-y-2">
                {(result.keywords || []).map((k, i) => (
                  <div key={i} className="flex items-center justify-between rounded bg-muted px-3 py-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
                      <Tag className="h-3 w-3 text-primary" /> {k.keyword}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{k.density}% density</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
