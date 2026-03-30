import { useEffect, useState } from "react";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";
import { Megaphone, Plus, Loader2, DollarSign, TrendingUp, BarChart3, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";

interface Campaign {
  id: string; business_name: string; meta_campaign_id: string | null; status: string;
  daily_budget: number; last_decision: string | null; last_decision_reason: string | null; last_optimized_at: string | null;
}
interface PerfLog { spend: number; ctr: number; roas: number; clicks: number; impressions: number; reach: number; conversions: number; }

function timeAgo(d: string | null) {
  if (!d) return "—";
  const diff = Date.now() - new Date(d).getTime();
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 1) return "Just now";
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const statusBadge = (s: string) => {
  if (s === "active") return { bg: "bg-success/10", text: "text-success", dot: "bg-success" };
  if (s === "paused") return { bg: "bg-destructive/10", text: "text-destructive", dot: "bg-destructive" };
  if (s === "scaling") return { bg: "bg-primary/10", text: "text-primary", dot: "bg-primary" };
  return { bg: "bg-warning/10", text: "text-warning", dot: "bg-warning" };
};

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
    setBudgetSaving(false); setBudgetOpen(false);
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
      toast.success("Campaign creation triggered!");
      setTimeout(async () => {
        const { data } = await externalSupabase.from("ad_campaigns").select("*").eq("business_id", businessId).order("last_optimized_at", { ascending: false });
        setCampaigns((data ?? []) as Campaign[]);
      }, 20000);
    } catch { toast.error("Failed to create"); }
    finally { setCreating(false); setCreateOpen(false); }
  };

  if (loading) return <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 rounded-lg border border-border bg-card animate-pulse" />)}</div>;

  return (
    <div className="space-y-4">
      {/* Stat row */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Active Campaigns", value: activeCampaigns, icon: BarChart3 },
          { label: "Daily Budget", value: `$${totalBudget}`, icon: DollarSign },
          { label: "Avg ROAS", value: `${avgRoas.toFixed(1)}x`, icon: TrendingUp },
        ].map(s => (
          <div key={s.label} className="rounded-lg border border-border bg-card p-4 shadow-meta">
            <div className="flex items-center gap-2 mb-1"><s.icon className="h-4 w-4 text-muted-foreground" /><span className="text-xs text-muted-foreground">{s.label}</span></div>
            <p className="text-xl font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button size="sm" className="h-9 text-xs" onClick={() => setCreateOpen(true)} disabled={creating}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Create Campaign
        </Button>
        <Button size="sm" variant="outline" className="h-9 text-xs" onClick={() => setBudgetOpen(true)}>
          <DollarSign className="mr-1.5 h-3.5 w-3.5" /> Set Budget
        </Button>
      </div>

      {/* Campaigns table — Meta Ads Manager style */}
      {campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card py-16 text-center shadow-meta">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Megaphone className="h-6 w-6 text-primary" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-foreground">Your first ad campaigns will appear here</h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">Connect Facebook and set a budget. maroa.ai creates and optimizes campaigns daily at 8am.</p>
          <Button className="mt-4" onClick={() => setCreateOpen(true)}><Plus className="mr-2 h-4 w-4" /> Create Campaign</Button>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card shadow-meta overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="text-xs font-semibold">Campaign</TableHead>
                <TableHead className="text-xs font-semibold">Status</TableHead>
                <TableHead className="text-xs font-semibold text-right">Budget</TableHead>
                <TableHead className="text-xs font-semibold text-right">Reach</TableHead>
                <TableHead className="text-xs font-semibold text-right">Impressions</TableHead>
                <TableHead className="text-xs font-semibold text-right">CTR</TableHead>
                <TableHead className="text-xs font-semibold text-right">ROAS</TableHead>
                <TableHead className="text-xs font-semibold text-right">Spend</TableHead>
                <TableHead className="text-xs font-semibold text-right">Optimized</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((c, i) => {
                const badge = statusBadge(c.status);
                return (
                  <TableRow key={c.id} className={i % 2 === 0 ? "" : "bg-muted/20"}>
                    <TableCell>
                      <div>
                        <p className="text-[13px] font-medium text-foreground">{c.business_name}</p>
                        {c.last_decision && <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{c.last_decision}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <div className={`h-2 w-2 rounded-full ${badge.dot}`} />
                        <span className={`text-xs font-medium capitalize ${badge.text}`}>{c.status}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-[13px] font-medium">${c.daily_budget}/day</TableCell>
                    <TableCell className="text-right text-[13px]">{(c.perf?.reach ?? 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right text-[13px]">{(c.perf?.impressions ?? 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right text-[13px]">{c.perf?.ctr != null ? `${Number(c.perf.ctr).toFixed(2)}%` : "—"}</TableCell>
                    <TableCell className="text-right text-[13px] font-medium">{c.perf?.roas != null ? `${Number(c.perf.roas).toFixed(1)}x` : "—"}</TableCell>
                    <TableCell className="text-right text-[13px]">${c.perf?.spend ?? 0}</TableCell>
                    <TableCell className="text-right text-[11px] text-muted-foreground">{timeAgo(c.last_optimized_at)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Budget dialog */}
      <Dialog open={budgetOpen} onOpenChange={setBudgetOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Set Daily Budget</DialogTitle><DialogDescription>Your ads spend up to this amount per day.</DialogDescription></DialogHeader>
          <div className="space-y-6 mt-4">
            <div className="text-center"><span className="text-4xl font-bold text-foreground">${budgetValue[0]}</span><span className="text-lg text-muted-foreground">/day</span></div>
            <Slider value={budgetValue} onValueChange={setBudgetValue} min={5} max={500} step={5} />
            <div className="flex justify-between text-xs text-muted-foreground"><span>$5</span><span>$500</span></div>
            <div className="flex gap-2 justify-center">
              {[5, 10, 15, 30].map(v => (
                <button key={v} onClick={() => setBudgetValue([v])} className={`rounded-lg px-4 py-2 text-sm font-medium border transition-colors ${budgetValue[0] === v ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>${v}</button>
              ))}
            </div>
            <Button className="w-full" onClick={handleSetBudget} disabled={budgetSaving}>{budgetSaving ? "Saving..." : "Save Budget"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Create Ad Campaigns</DialogTitle><DialogDescription>AI will build optimized campaigns for your business.</DialogDescription></DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">Creates awareness, engagement and retargeting campaigns. Optimized daily at 8am.</p>
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
