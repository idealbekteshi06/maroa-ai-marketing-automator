import { useEffect, useState } from "react";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";
import { Search, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Insight {
  id: string;
  competitor_doing_well: string | null;
  gap_opportunity: string | null;
  content_to_steal: string | null;
  positioning_tip: string | null;
  recorded_at: string;
}

function SkeletonRow() {
  return <div className="h-32 rounded-2xl border border-border bg-card animate-pulse-soft" />;
}

export default function DashboardCompetitors() {
  const { businessId, isReady } = useAuth();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInsights = async () => {
    if (!businessId || !isReady) return;
    setLoading(true);
    const { data } = await externalSupabase
      .from("competitor_insights")
      .select("*")
      .eq("business_id", businessId)
      .order("recorded_at", { ascending: false });
    setInsights((data as Insight[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchInsights(); }, [businessId, isReady]);

  const handleRefresh = async () => {
    if (!businessId) return;
    setRefreshing(true);
    try {
      await fetch("https://ideal.app.n8n.cloud/webhook/competitor-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: businessId }),
      });
      toast.success("Competitor analysis triggered! Results will appear within a few minutes.");
      setTimeout(() => fetchInsights(), 15000);
    } catch {
      toast.error("Failed to trigger competitor check");
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <SkeletonRow key={i} />)}
      </div>
    );
  }

  const lastUpdated = insights[0]?.recorded_at
    ? new Date(insights[0].recorded_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">AI-powered insights on what your competitors are doing.</p>
          {lastUpdated && (
            <p className="text-[10px] text-muted-foreground mt-1">Last updated: {lastUpdated}</p>
          )}
        </div>
        <Button size="sm" variant="outline" className="h-9 text-xs" onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Analyzing...</> : <><RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh Analysis</>}
        </Button>
      </div>

      {insights.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/8">
            <Search className="h-7 w-7 text-primary" />
          </div>
          <h3 className="mt-5 text-lg font-semibold text-foreground">Competitor tracking activates after your first week</h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
            Add your competitors in Settings and maroa.ai will monitor them every Friday.
          </p>
          <Button className="mt-4" size="sm" onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? "Analyzing..." : "Run Analysis Now"}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {insights.map((ins) => (
            <div key={ins.id} className="rounded-2xl border border-border bg-card p-6 space-y-4 transition-all hover:shadow-card">
              {ins.competitor_doing_well && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">🏆 Competitor Doing Well</p>
                  <p className="mt-1.5 text-sm text-card-foreground leading-relaxed">{ins.competitor_doing_well}</p>
                </div>
              )}
              {ins.gap_opportunity && (
                <div className="rounded-xl bg-primary/5 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">🎯 Gap Opportunity</p>
                  <p className="mt-1.5 text-sm text-card-foreground leading-relaxed">{ins.gap_opportunity}</p>
                </div>
              )}
              {ins.content_to_steal && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">💡 Recommended Action</p>
                  <p className="mt-1.5 text-sm text-card-foreground leading-relaxed">{ins.content_to_steal}</p>
                </div>
              )}
              {ins.positioning_tip && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">📍 Positioning Tip</p>
                  <p className="mt-1.5 text-sm text-card-foreground leading-relaxed">{ins.positioning_tip}</p>
                </div>
              )}
              <p className="text-[10px] text-muted-foreground pt-2 border-t border-border">
                {new Date(ins.recorded_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
