import { useEffect, useState } from "react";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";
import { Megaphone, Plus, Loader2, DollarSign, TrendingUp, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";

interface Campaign {
  id: string; business_name: string; meta_campaign_id: string | null; status: string;
  daily_budget: number; last_decision: string | null; last_decision_reason: string | null; last_optimized_at: string | null;
}
interface PerfLog { spend: number; ctr: number; roas: number; clicks: number; impressions: number; reach: number; conversions: number; }

function timeAgo(d: string | null) {
  if (!d) return "Never";
  const diff = Date.now() - new Date(d).getTime();
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 1) return "Just now";
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function DashboardAds() {
  const { businessId, user, isReady } = useAuth();
  const [campaigns, setCampaigns] = useState<(Campaign & { perf?: PerfLog })[]>([]);
  const [loading, setLoading] = useState(true);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [budgetValue, setBudgetValue] = useState([15]);
  const [budgetSaving, setBudgetSaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!businessId || !isReady) return;
    const fetchData = async () => {
      setLoading(true);
      const { data: camps } = await externalSupabase.from("ad_campaigns").select("*").eq("business_id", businessId).order("last_optimized_at", { ascending: false });
      const list = (camps ?? []) as Campaign[];
      const withPerf = await Promise.all(list.map(async c => {
        const { data: perf } = await externalSupabase.from("ad_performance_logs").select("spend, ctr, roas, clicks, impressions, reach, conversions").eq("campaign_id", c.id).order("logged_at", { ascending: false }).limit(1).maybeSingle();
        return { ...c, perf: perf as PerfLog | undefined };
      }));
      setCampaigns(withPerf);
      setLoading(false);
    };
    fetchData();
  }, [businessId, isReady]);

  const activeCampaigns = campaigns.filter(c => c.status === "active").length;
  const totalBudget = campaigns.reduce((s, c) => s + (c.daily_budget || 0), 0);
  const avgRoas = campaigns.length > 0 ? campaigns.reduce((s, c) => s + (c.perf?.roas || 0), 0) / campaigns.length : 0;

  const handleSetBudget = async () => {
    if (!businessId) return;
    setBudgetSaving(true);
    await externalSupabase.from("businesses").update({ daily_budget: budgetValue[0] }).eq("id", businessId);
    void fetch("https://maroa-api-production.up.railway.app/webhook/budget-updated", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ business_id: businessId, daily_budget: budgetValue[0] }),
    }).catch(console.warn);
    toast.success(`Daily budget set to $${budgetValue[0]}`);
    setBudgetSaving(false);
    setBudgetOpen(false);
  };

  const handleCreateCampaign = async () => {
    if (!businessId) return;
    setCreating(true);
    try {
      const { data: biz } = await externalSupabase.from("businesses").select("business_name, email, daily_budget, target_audience, industry, location").eq("id", businessId).maybeSingle();
      await fetch("https://maroa-api-production.up.railway.app/webhook/create-campaigns", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: businessId, email: biz?.email || user?.email, business_name: biz?.business_name, daily_budget: biz?.daily_budget, target_audience: biz?.target_audience, industry: biz?.industry, location: biz?.location }),
      });
      toast.success("Campaign creation triggered! It'll appear within 20 seconds.");
      setTimeout(async () => {
        const { data } = await externalSupabase.from("ad_campaigns").select("*").eq("business_id", businessId).order("last_optimized_at", { ascending: false });
        setCampaigns((data ?? []) as Campaign[]);
      }, 20000);
    } catch { toast.error("Failed to create campaign"); }
    finally { setCreating(false); setCreateOpen(false); }
  };

  const badgeColor = (status: string) => {
    if (status === "active") return "bg-green-500/10 text-green-600 dark:text-green-400";
    if (status === "paused") return "bg-destructive/10 text-destructive";
    if (status === "scaling") return "bg-primary/10 text-primary";
    return "bg-amber-500/10 text-amber-600";
  };

  if (loading) return <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl border border-border bg-card animate-pulse" />)}</div>;

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Active Campaigns</span></div>
          <p className="mt-2 text-2xl font-bold text-card-foreground">{activeCampaigns}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Total Daily Budget</span></div>
          <p className="mt-2 text-2xl font-bold text-card-foreground">${totalBudget}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Average ROAS</span></div>
          <p className="mt-2 text-2xl font-bold text-card-foreground">{avgRoas.toFixed(1)}x</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button size="sm" className="h-9 text-xs" onClick={() => setBudgetOpen(true)}><DollarSign className="mr-1.5 h-3.5 w-3.5" /> Set Budget</Button>
        <Button size="sm" className="h-9 text-xs" variant="outline" onClick={() => setCreateOpen(true)} disabled={creating}>
          {creating ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Creating...</> : <><Plus className="mr-1.5 h-3.5 w-3.5" /> Create Campaigns</>}
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10"><Megaphone className="h-7 w-7 text-primary" /></div>
          <h3 className="mt-5 text-lg font-semibold text-foreground">Your first ad campaigns will appear here</h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
            Once you connect Facebook and set a budget, maroa.ai creates awareness, engagement and retargeting campaigns automatically and optimizes them every day at 8am.
          </p>
          <Button className="mt-5" onClick={() => setCreateOpen(true)}><Plus className="mr-2 h-4 w-4" /> Create Campaign</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map(c => (
            <div key={c.id} className="rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-md">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-card-foreground">{c.business_name}</p>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium capitalize ${badgeColor(c.status)}`}>{c.status}</span>
                  </div>
                  {c.last_decision && <p className="mt-1 text-xs text-muted-foreground">{c.last_decision}</p>}
                  <p className="text-[10px] text-muted-foreground mt-0.5">Optimized {timeAgo(c.last_optimized_at)}</p>
                </div>
                <div className="flex gap-4 text-center">
                  <div><p className="text-[10px] text-muted-foreground">Budget</p><p className="text-sm font-semibold text-card-foreground">${c.daily_budget}/day</p></div>
                  <div><p className="text-[10px] text-muted-foreground">CTR</p><p className="text-sm font-semibold text-card-foreground">{c.perf?.ctr != null ? `${Number(c.perf.ctr).toFixed(2)}%` : "—"}</p></div>
                  <div><p className="text-[10px] text-muted-foreground">ROAS</p><p className="text-sm font-semibold text-card-foreground">{c.perf?.roas != null ? `${Number(c.perf.roas).toFixed(1)}x` : "—"}</p></div>
                  <div><p className="text-[10px] text-muted-foreground">Spend</p><p className="text-sm font-semibold text-card-foreground">${c.perf?.spend ?? 0}</p></div>
                  <div><p className="text-[10px] text-muted-foreground">Impressions</p><p className="text-sm font-semibold text-card-foreground">{(c.perf?.impressions ?? 0).toLocaleString()}</p></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Budget slider dialog */}
      <Dialog open={budgetOpen} onOpenChange={setBudgetOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Set Daily Budget</DialogTitle><DialogDescription>Your ads will spend up to this amount per day.</DialogDescription></DialogHeader>
          <div className="space-y-6 mt-4">
            <div className="text-center">
              <span className="text-4xl font-bold text-foreground">${budgetValue[0]}</span>
              <span className="text-lg text-muted-foreground">/day</span>
            </div>
            <Slider value={budgetValue} onValueChange={setBudgetValue} min={5} max={500} step={5} />
            <div className="flex justify-between text-xs text-muted-foreground"><span>$5</span><span>$500</span></div>
            <div className="flex gap-2 justify-center">
              {[5, 10, 15, 30].map(v => (
                <button key={v} onClick={() => setBudgetValue([v])} className={`rounded-xl px-4 py-2 text-sm font-medium border transition-colors ${budgetValue[0] === v ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>${v}</button>
              ))}
            </div>
            <Button className="w-full" onClick={handleSetBudget} disabled={budgetSaving}>{budgetSaving ? "Saving..." : "Save Budget"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create campaign confirmation */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Create Ad Campaigns</DialogTitle><DialogDescription>Claude will analyze your business and create awareness, engagement and retargeting campaigns automatically.</DialogDescription></DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">This will create optimized campaigns based on your business profile, target audience, and budget. Campaigns are optimized daily at 8am.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateCampaign} disabled={creating}>{creating ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Creating...</> : "Create Campaigns"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
