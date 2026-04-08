import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Search, Loader2, TrendingUp, Quote, Lightbulb } from "lucide-react";

const API_BASE = "https://maroa-api-production.up.railway.app";

interface ResearchResult {
  insights: string[];
  quotes: string[];
  trends: string[];
}

const topicSuggestions = [
  "Customer pain points",
  "Market trends 2026",
  "Competitor positioning",
  "Pricing sentiment",
  "Product feedback themes",
];

export default function DashboardResearch() {
  const { businessId } = useAuth();
  const [topic, setTopic] = useState("");
  const [results, setResults] = useState<ResearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async (researchTopic?: string) => {
    const t = researchTopic || topic;
    if (!businessId || !t.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/research/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: businessId, topic: t.trim() }),
      });
      if (!res.ok) throw new Error();
      setResults(await res.json());
      toast.success("Research complete!");
    } catch {
      toast.error("Failed to analyze topic");
    } finally {
      setLoading(false);
    }
  };

  if (!results && !loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <Search className="mx-auto h-10 w-10 text-muted-foreground/30" />
        <h3 className="mt-4 text-sm font-semibold text-foreground">Research your market</h3>
        <p className="mt-1.5 text-xs text-muted-foreground max-w-xs mx-auto">
          Get AI-powered insights on any topic related to your business.
        </p>
        <div className="max-w-sm mx-auto mt-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="Enter a research topic..."
              className="flex-1 h-9 rounded-md border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground"
              onKeyDown={e => e.key === "Enter" && handleAnalyze()}
            />
            <Button size="sm" className="h-9 text-xs" onClick={() => handleAnalyze()} disabled={!topic.trim()}>
              <Search className="mr-1.5 h-3.5 w-3.5" /> Research
            </Button>
          </div>
          <div className="flex flex-wrap justify-center gap-1.5 mt-3">
            {topicSuggestions.map(s => (
              <button key={s} onClick={() => { setTopic(s); handleAnalyze(s); }} className="rounded-full bg-muted px-2.5 py-1 text-[10px] text-muted-foreground hover:bg-muted/80 transition-colors">
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-8 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
        <p className="mt-3 text-sm font-medium text-primary">Researching "{topic}"...</p>
        <p className="text-xs text-muted-foreground mt-1">AI is analyzing data sources</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">Results for: <span className="font-medium text-foreground">{topic}</span></p>
        <div className="flex gap-2">
          <input
            type="text"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            className="h-9 rounded-md border border-border bg-card px-3 text-xs text-foreground w-48"
            onKeyDown={e => e.key === "Enter" && handleAnalyze()}
          />
          <Button size="sm" className="h-9 text-xs" onClick={() => handleAnalyze()}>
            <Search className="mr-1.5 h-3.5 w-3.5" /> Research
          </Button>
        </div>
      </div>

      {results?.insights && results.insights.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-4 w-4 text-primary" />
            <h4 className="text-xs font-semibold text-foreground">Key Insights</h4>
          </div>
          {results.insights.map((insight, i) => (
            <p key={i} className="text-xs text-foreground leading-relaxed mb-2">{insight}</p>
          ))}
        </div>
      )}

      {results?.quotes && results.quotes.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Quote className="h-4 w-4 text-primary" />
            <h4 className="text-xs font-semibold text-foreground">Notable Quotes</h4>
          </div>
          {results.quotes.map((q, i) => (
            <blockquote key={i} className="border-l-2 border-primary/30 pl-3 text-xs text-muted-foreground italic mb-2">{q}</blockquote>
          ))}
        </div>
      )}

      {results?.trends && results.trends.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h4 className="text-xs font-semibold text-foreground">Trends</h4>
          </div>
          {results.trends.map((t, i) => (
            <p key={i} className="text-xs text-foreground leading-relaxed mb-2">{t}</p>
          ))}
        </div>
      )}
    </div>
  );
}
