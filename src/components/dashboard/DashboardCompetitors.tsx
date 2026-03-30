import { useEffect, useState } from "react";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";
import { Search, RefreshCw, Loader2, Trophy, Target, Lightbulb, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Insight {
  id: string; competitor_doing_well: string | null; gap_opportunity: string | null;
  content_to_steal: string | null; positioning_tip: string | null; recorded_at: string;
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 1) return "Just now";
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function DashboardCompetitors() {
  const { businessId, isReady } = useAuth();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [competitors, setCompetitors] = useState("");
  const [savingComp, setSavingComp] = useState(false);

  const fetchInsights = async () => {
    if (!businessId || !isReady) return;
    setLoading(true);
    const { data } = await externalSupabase.from("competitor_insights").select("*").eq("business_id", businessId).order("recorded_at", { ascending: false });
    setInsights((data as Insight[]) ?? []);
    const { data: biz } = await externalSupabase.from("businesses").select("competitors").eq("id", businessId).maybeSingle();
    setCompetitors(biz?.competitors || "");
    setLoading(false);
  };

  useEffect(() => { fetchInsights(); }, [businessId, isReady]);

  const handleRefresh = async () => {
    if (!businessId) return;
    setRefreshing(true);
    try {
      await fetch("https://maroa-api-production.up.railway.app/webhook/competitor-check", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: businessId }),
      });
      toast.success("Competitor analysis triggered! Results appear within a few minutes.");
      setTimeout(() => fetchInsights(), 15000);
    } catch { toast.error("Failed to trigger analysis"); }
    finally { setRefreshing(false); }
  };

  const handleSaveCompetitors = async () => {
    if (!businessId) return;
    setSavingComp(true);
    await externalSupabase.from("businesses").update({ competitors }).eq("id", businessId);
    setSavingComp(false);
    toast.success("Competitors saved! Running analysis...");
    handleRefresh();
  };

  const latest = insights[0];
  const history = insights.slice(1);

  if (loading) return <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-32 rounded-2xl border border-border bg-card animate-pulse" />)}</div>;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">AI-powered insights on what your competitors are doing.</p>
          {latest && <p className="text-[10px] text-muted-foreground mt-1">Last updated: {timeAgo(latest.recorded_at)}</p>}
        </div>
        <Button size="sm" variant="outline" className="h-9 text-xs" onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Analyzing...</> : <><RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh Analysis</>}
        </Button>
      </div>

      {/* Add competitors */}
      {!competitors && insights.length === 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-card-foreground mb-2">Add Your Competitors</h3>
          <p className="text-xs text-muted-foreground mb-3">Type competitor names separated by commas.</p>
          <div className="flex gap-2">
            <Input placeholder="e.g. Joe's Bakery, Sweet Flour, The Cake Shop" value={competitors} onChange={e => setCompetitors(e.target.value)} className="flex-1" />
            <Button size="sm" onClick={handleSaveCompetitors} disabled={savingComp || !competitors.trim()}>{savingComp ? "Saving..." : "Save & Analyze"}</Button>
          </div>
        </div>
      )}

      {insights.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10"><Search className="h-7 w-7 text-primary" /></div>
          <h3 className="mt-5 text-lg font-semibold text-foreground">Add your top 3 competitors in Settings</h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
            Every Friday maroa.ai searches what they posted, finds your gaps, and tells you exactly what content to create to beat them.
          </p>
          <Button className="mt-4" size="sm" onClick={handleRefresh} disabled={refreshing}>{refreshing ? "Analyzing..." : "Run Analysis Now"}</Button>
        </div>
      ) : (
        <>
          {/* Featured latest insight */}
          {latest && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                {latest.competitor_doing_well && (
                  <div className="rounded-xl bg-muted/50 p-4">
                    <div className="flex items-center gap-2 mb-2"><Trophy className="h-4 w-4 text-amber-500" /><p className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">What They're Doing Well</p></div>
                    <p className="text-sm text-card-foreground leading-relaxed">{latest.competitor_doing_well}</p>
                  </div>
                )}
                {latest.gap_opportunity && (
                  <div className="rounded-xl bg-primary/5 p-4">
                    <div className="flex items-center gap-2 mb-2"><Target className="h-4 w-4 text-primary" /><p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Your Gap Opportunity</p></div>
                    <p className="text-sm text-card-foreground leading-relaxed">{latest.gap_opportunity}</p>
                  </div>
                )}
                {latest.content_to_steal && (
                  <div className="rounded-xl bg-muted/50 p-4">
                    <div className="flex items-center gap-2 mb-2"><Lightbulb className="h-4 w-4 text-amber-500" /><p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Content to Steal</p></div>
                    <p className="text-sm text-card-foreground leading-relaxed">{latest.content_to_steal}</p>
                  </div>
                )}
                {latest.positioning_tip && (
                  <div className="rounded-xl bg-muted/50 p-4">
                    <div className="flex items-center gap-2 mb-2"><Compass className="h-4 w-4 text-primary" /><p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Your Counter Move</p></div>
                    <p className="text-sm text-card-foreground leading-relaxed">{latest.positioning_tip}</p>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mt-4">Updated {timeAgo(latest.recorded_at)}</p>
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-card-foreground">Previous Analyses</h3>
              {history.map(ins => (
                <div key={ins.id} className="rounded-2xl border border-border bg-card p-4 transition-all hover:shadow-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">{new Date(ins.recorded_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  </div>
                  <p className="text-sm text-card-foreground line-clamp-2">{ins.gap_opportunity || ins.competitor_doing_well || ins.positioning_tip || "Analysis"}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* How this works */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-card-foreground mb-2">How This Works</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          maroa.ai tracks competitor activity every Friday using search data. It finds what's working for them, identifies gaps you can exploit, and generates specific content recommendations to position you as the better choice.
        </p>
      </div>
    </div>
  );
}
