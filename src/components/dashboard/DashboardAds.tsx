import { useEffect, useState } from "react";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";
import { Megaphone, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

interface Campaign {
  id: string;
  business_name: string;
  meta_campaign_id: string | null;
  status: string;
  daily_budget: number;
  last_decision: string | null;
  last_decision_reason: string | null;
  last_optimized_at: string | null;
}

interface PerfLog {
  spend: number;
  ctr: number;
  roas: number;
  clicks: number;
  impressions: number;
  reach: number;
  conversions: number;
  logged_at?: string;
}

function MiniChart({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="h-1.5 w-16 rounded-full bg-border overflow-hidden">
      <div className="h-full rounded-full bg-primary/50 transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
}

function SkeletonRow() {
  return <div className="h-20 rounded-2xl border border-border bg-card animate-pulse-soft" />;
}

export default function DashboardAds() {
  const { businessId, isReady } = useAuth();
  const [campaigns, setCampaigns] = useState<(Campaign & { perf?: PerfLog })[]>([]);
  const [loading, setLoading] = useState(true);
  const [budgetInput, setBudgetInput] = useState("");
  const [budgetSaving, setBudgetSaving] = useState(false);
  const [perfHistory, setPerfHistory] = useState<PerfLog[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", budget: "", audience: "" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!businessId || !isReady) return;
    const fetchData = async () => {
      setLoading(true);
      const { data: camps } = await externalSupabase
        .from("ad_campaigns")
        .select("*")
        .eq("business_id", businessId)
        .order("last_optimized_at", { ascending: false });

      const campaignList = (camps ?? []) as Campaign[];

      const withPerf = await Promise.all(
        campaignList.map(async (c) => {
          const { data: perf } = await externalSupabase
            .from("ad_performance_logs")
            .select("spend, ctr, roas, clicks, impressions, reach, conversions")
            .eq("campaign_id", c.id)
            .order("logged_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          return { ...c, perf: perf as PerfLog | undefined };
        })
      );

      setCampaigns(withPerf);

      // Fetch 30-day performance history for chart
      const { data: historyData } = await externalSupabase
        .from("ad_performance_logs")
        .select("ctr, roas, logged_at")
        .eq("business_id", businessId)
        .order("logged_at", { ascending: true })
        .limit(30);
      setPerfHistory((historyData as PerfLog[]) ?? []);

      setLoading(false);
    };
    fetchData();
  }, [businessId, isReady]);

  const maxSpend = Math.max(...campaigns.map((c) => c.perf?.spend ?? 0), 1);

  const handleSetBudget = async () => {
    const budget = Number(budgetInput);
    if (!businessId || isNaN(budget) || budget < 0) { toast.error("Enter a valid budget"); return; }
    setBudgetSaving(true);
    const { error } = await externalSupabase.from("businesses").update({ daily_budget: budget }).eq("id", businessId);
    if (error) { toast.error("Failed to update budget"); setBudgetSaving(false); return; }
    void fetch("https://ideal.app.n8n.cloud/webhook/budget-updated", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ business_id: businessId, daily_budget: budget }),
    }).catch(console.warn);
    toast.success(`Daily budget set to $${budget}`);
    setBudgetSaving(false);
  };

  const handleCreateCampaign = async () => {
    if (!businessId || !createForm.name.trim()) { toast.error("Campaign name is required"); return; }
    setCreating(true);
    const { data: biz } = await externalSupabase.from("businesses").select("business_name").eq("id", businessId).maybeSingle();
    const { error } = await externalSupabase.from("ad_campaigns").insert({
      business_id: businessId,
      business_name: biz?.business_name ?? createForm.name,
      status: "active",
      daily_budget: Number(createForm.budget) || 10,
      last_decision: `Targeting: ${createForm.audience || "Broad audience"}`,
    });
    setCreating(false);
    if (error) { toast.error("Failed to create campaign: " + error.message); return; }
    toast.success("Campaign created!");
    setCreateOpen(false);
    setCreateForm({ name: "", budget: "", audience: "" });
    // Refresh
    const { data: camps } = await externalSupabase.from("ad_campaigns").select("*").eq("business_id", businessId).order("last_optimized_at", { ascending: false });
    setCampaigns((camps ?? []) as Campaign[]);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <SkeletonRow key={i} />)}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <p className="text-sm text-muted-foreground">Your AI-managed ad campaigns.</p>
        <div className="flex items-center gap-2 flex-wrap">
          <Input type="number" placeholder="Daily budget ($)" value={budgetInput} onChange={(e) => setBudgetInput(e.target.value)} className="w-36 h-9 text-sm" />
          <Button size="sm" className="h-9 text-xs" onClick={handleSetBudget} disabled={budgetSaving}>{budgetSaving ? "Saving..." : "Set Budget"}</Button>
          <Button size="sm" className="h-9 text-xs" variant="outline" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> New Campaign
          </Button>
        </div>
      </div>

      {/* Performance Chart */}
      {perfHistory.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">CTR & ROAS — Last 30 Days</h3>
          <div className="flex h-32 items-end gap-1">
            {perfHistory.map((p, i) => {
              const maxCtr = Math.max(...perfHistory.map(h => Number(h.ctr) || 0), 1);
              const height = ((Number(p.ctr) || 0) / maxCtr) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="w-full rounded-t bg-primary/20 transition-all hover:bg-primary/40" style={{ height: `${height}%` }} title={`CTR: ${Number(p.ctr).toFixed(2)}% | ROAS: ${Number(p.roas).toFixed(1)}x`} />
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex items-center gap-4 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary/40" /> CTR %</span>
          </div>
        </div>
      )}

      {campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/8">
            <Megaphone className="h-7 w-7 text-primary" />
          </div>
          <h3 className="mt-5 text-lg font-semibold text-foreground">No ad campaigns yet</h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
            Connect your Facebook account and set your budget to activate AI-powered ad management.
          </p>
          <Button className="mt-4" size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Create Campaign
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => {
            const badge = c.status === "active"
              ? "bg-success/10 text-success"
              : c.status === "paused"
              ? "bg-destructive/10 text-destructive"
              : c.status === "scaling"
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground";

            return (
              <div key={c.id} className="grid grid-cols-2 gap-4 rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-card sm:grid-cols-5 sm:items-center">
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-sm font-semibold text-card-foreground">{c.business_name}</p>
                  <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ${badge}`}>{c.status}</span>
                  {c.last_decision && <p className="mt-1 text-[10px] text-muted-foreground">{c.last_decision}</p>}
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Spend</p>
                  <p className="text-sm font-semibold text-card-foreground">${c.perf?.spend ?? c.daily_budget}</p>
                  <MiniChart value={c.perf?.spend ?? 0} max={maxSpend} />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">CTR</p>
                  <p className="text-sm font-semibold text-card-foreground">{c.perf?.ctr != null ? `${Number(c.perf.ctr).toFixed(2)}%` : "0%"}</p>
                  <MiniChart value={c.perf?.ctr ?? 0} max={10} />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">ROAS</p>
                  <p className="text-sm font-semibold text-card-foreground">{c.perf?.roas != null ? `${Number(c.perf.roas).toFixed(1)}x` : "0x"}</p>
                  <MiniChart value={c.perf?.roas ?? 0} max={10} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Campaign Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Campaign</DialogTitle>
            <DialogDescription>Set up a new AI-managed ad campaign.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div><Label>Campaign Name</Label><Input value={createForm.name} onChange={(e) => setCreateForm(f => ({ ...f, name: e.target.value }))} className="mt-1" placeholder="e.g. Spring Promotion" /></div>
            <div><Label>Daily Budget ($)</Label><Input type="number" value={createForm.budget} onChange={(e) => setCreateForm(f => ({ ...f, budget: e.target.value }))} className="mt-1" placeholder="10" /></div>
            <div><Label>Target Audience</Label><Textarea value={createForm.audience} onChange={(e) => setCreateForm(f => ({ ...f, audience: e.target.value }))} className="mt-1" rows={2} placeholder="e.g. Women 25-45 in Brooklyn interested in bakeries" /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateCampaign} disabled={creating}>{creating ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Creating...</> : "Create Campaign"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
