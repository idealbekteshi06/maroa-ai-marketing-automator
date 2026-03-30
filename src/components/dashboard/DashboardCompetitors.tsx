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
      toast.success("Analysis triggered!");
      setTimeout(() => fetchInsights(), 15000);
    } catch { toast.error("Failed"); }
    finally { setRefreshing(false); }
  };

  const handleSaveCompetitors = async () => {
    if (!businessId) return;
    setSavingComp(true);
    await externalSupabase.from("businesses").update({ competitors }).eq("id", businessId);
    setSavingComp(false);
    toast.success("Saved! Running analysis...");
    handleRefresh();
  };

  const latest = insights[0];
  const history = insights.slice(1);

  if (loading) return <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-24 rounded-lg border border-border bg-card animate-pulse" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">AI-powered competitor analysis</p>
          {latest && <p className="text-[11px] text-muted-foreground mt-0.5">Updated {timeAgo(latest.recorded_at)}</p>}
        </div>
        <Button size="sm" variant="outline" className="h-9 text-xs" onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Analyzing...</> : <><RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh</>}
        </Button>
      </div>

      {!competitors && insights.length === 0 && (
        <div className="rounded-lg border border-border bg-card p-5 shadow-meta">
          <h3 className="text-sm font-semibold text-foreground mb-2">Add Your Competitors</h3>
          <p className="text-xs text-muted-foreground mb-3">Separate names with commas.</p>
          <div className="flex gap-2">
            <Input placeholder="e.g. Joe's Bakery, Sweet Flour" value={competitors} onChange={e => setCompetitors(e.target.value)} className="flex-1" />
            <Button size="sm" onClick={handleSaveCompetitors} disabled={savingComp || !competitors.trim()}>{savingComp ? "Saving..." : "Save & Analyze"}</Button>
          </div>
        </div>
      )}

      {insights.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card py-16 text-center shadow-meta">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10"><Search className="h-6 w-6 text-primary" /></div>
          <h3 className="mt-4 text-base font-semibold text-foreground">Add competitors in Settings</h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">Every Friday, AI analyzes what competitors post and tells you how to beat them.</p>
          <Button className="mt-4" size="sm" onClick={handleRefresh} disabled={refreshing}>Run Analysis</Button>
        </div>
      ) : (
        <>
          {latest && (
            <div className="rounded-lg border border-border bg-card shadow-meta overflow-hidden">
              <div className="grid gap-0 sm:grid-cols-2">
                {[
                  { icon: Trophy, color: "text-warning", label: "What They Do Well", value: latest.competitor_doing_well },
                  { icon: Target, color: "text-primary", label: "Your Gap Opportunity", value: latest.gap_opportunity },
                  { icon: Lightbulb, color: "text-warning", label: "Content to Steal", value: latest.content_to_steal },
                  { icon: Compass, color: "text-primary", label: "Your Counter Move", value: latest.positioning_tip },
                ].filter(s => s.value).map((s, i) => (
                  <div key={i} className="p-5 border-b border-r border-border last:border-0 [&:nth-child(2)]:border-r-0 [&:nth-child(4)]:border-r-0 [&:nth-child(3)]:border-b-0 [&:nth-child(4)]:border-b-0">
                    <div className="flex items-center gap-2 mb-2">
                      <s.icon className={`h-4 w-4 ${s.color}`} />
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</span>
                    </div>
                    <p className="text-[13px] text-foreground leading-relaxed">{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="px-5 py-2 border-t border-border bg-muted/30">
                <p className="text-[11px] text-muted-foreground">Updated {timeAgo(latest.recorded_at)}</p>
              </div>
            </div>
          )}

          {history.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Previous Analyses</h3>
              {history.map(ins => (
                <div key={ins.id} className="rounded-lg border border-border bg-card p-4 shadow-meta hover:shadow-meta-hover transition-shadow">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">{new Date(ins.recorded_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  </div>
                  <p className="text-[13px] text-foreground line-clamp-2">{ins.gap_opportunity || ins.competitor_doing_well || ins.positioning_tip || "Analysis"}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div className="rounded-lg border border-border bg-card p-5 shadow-meta">
        <h3 className="text-sm font-semibold text-foreground mb-2">How This Works</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Every Friday, AI tracks competitor activity, finds what's working, identifies gaps, and generates content recommendations to position you as the better choice.
        </p>
      </div>
    </div>
  );
}
