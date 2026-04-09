import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DollarSign, Loader2, TrendingUp, TrendingDown, BarChart3, ArrowUpRight } from "lucide-react";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/lib/errorMessages";

const API_BASE = "https://maroa-api-production.up.railway.app";

interface PricingRecommendation {
  product: string;
  current_price: number;
  recommended_price: number;
  change_percent: number;
  reasoning: string;
}

interface CompetitorPrice {
  competitor: string;
  price: number;
  difference: string;
}

interface PricingAnalysis {
  recommendations: PricingRecommendation[];
  competitor_prices: CompetitorPrice[];
  elasticity_score: number;
  summary: string;
}

export default function DashboardPricing() {
  const { businessId, isReady } = useAuth();
  const [analysis, setAnalysis] = useState<PricingAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (!businessId || !isReady) { setLoading(false); return; }
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/pricing/${businessId}`);
        if (res.ok) {
          const data = await res.json();
          setAnalysis({ ...data, recommendations: data.recommendations || [], competitor_prices: data.competitor_prices || [] });
        }
      } catch { /* empty */ }
      setLoading(false);
    };
    load();
  }, [businessId, isReady]);

  const handleAnalyze = async () => {
    if (!businessId) return;
    setAnalyzing(true);
    try {
      const res = await fetch(`${API_BASE}/api/pricing/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: businessId }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAnalysis({ ...data, recommendations: data.recommendations || [], competitor_prices: data.competitor_prices || [] });
      toast.success(SUCCESS_MESSAGES.GENERATED);
    } catch {
      toast.error(ERROR_MESSAGES.GENERATION_FAILED);
    } finally {
      setAnalyzing(false);
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

  if (!analysis) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <DollarSign className="mx-auto h-10 w-10 text-muted-foreground/30" />
        <h3 className="mt-4 text-sm font-semibold text-foreground">Analyze your pricing strategy</h3>
        <p className="mt-1.5 text-xs text-muted-foreground max-w-xs mx-auto">
          Get AI-powered pricing recommendations based on market data and competitor analysis.
        </p>
        <Button size="sm" className="mt-4" onClick={handleAnalyze} disabled={analyzing}>
          {analyzing ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <BarChart3 className="mr-1.5 h-3.5 w-3.5" />}
          {analyzing ? "Analyzing..." : "Analyze Pricing"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Pricing Analysis</p>
        <Button size="sm" className="h-9 text-xs" onClick={handleAnalyze} disabled={analyzing}>
          {analyzing ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <BarChart3 className="mr-1.5 h-3.5 w-3.5" />}
          Re-analyze
        </Button>
      </div>

      <div className="grid gap-3 grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <p className="text-xl font-bold text-foreground">{(analysis.recommendations || []).length}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Recommendations</p>
        </div>
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-center">
          <p className="text-xl font-bold text-primary">{analysis.elasticity_score}<span className="text-sm">/10</span></p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Elasticity Score</p>
        </div>
      </div>

      {analysis.summary && (
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-xs text-foreground leading-relaxed">{analysis.summary}</p>
        </div>
      )}

      {(analysis.recommendations || []).length > 0 && (
        <div className="rounded-lg border border-border bg-card p-5">
          <h4 className="text-xs font-semibold text-foreground mb-3">Price Recommendations</h4>
          <div className="space-y-3">
            {(analysis.recommendations || []).map((r, i) => (
              <div key={i} className="flex items-center justify-between rounded bg-muted px-3 py-2.5">
                <div>
                  <p className="text-xs font-medium text-foreground">{r.product}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{r.reasoning}</p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-xs text-muted-foreground line-through">${r.current_price}</p>
                  <p className="text-sm font-bold text-foreground">${r.recommended_price}</p>
                  <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium ${r.change_percent >= 0 ? "text-success" : "text-destructive"}`}>
                    {r.change_percent >= 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                    {r.change_percent > 0 ? "+" : ""}{r.change_percent}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(analysis.competitor_prices || []).length > 0 && (
        <div className="rounded-lg border border-border bg-card p-5">
          <h4 className="text-xs font-semibold text-foreground mb-3">Competitor Prices</h4>
          <div className="space-y-2">
            {(analysis.competitor_prices || []).map((c, i) => (
              <div key={i} className="flex items-center justify-between rounded bg-muted px-3 py-2">
                <span className="text-xs font-medium text-foreground">{c.competitor}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-foreground font-medium">${c.price}</span>
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                    <ArrowUpRight className="h-2.5 w-2.5" /> {c.difference}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
