import { useCallback, useEffect, useState } from "react";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";
import { Megaphone, Plus, Loader2, TrendingUp, BarChart3, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/lib/errorMessages";
import { apiFireAndForget } from "@/lib/apiClient";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";

interface Campaign {
  id: string; campaign_name: string | null; business_name: string; meta_campaign_id: string | null;
  status: string; daily_budget: number; objective: string | null;
  last_decision: string | null; last_optimized_at: string | null;
}
interface PerfLog { spend: number; ctr: number; roas: number; clicks: number; impressions: number; reach: number; conversions: number; }

const safeNum = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };

function timeAgo(d: string | null) {
  if (!d) return "—";
  const diff = Date.now() - new Date(d).getTime();
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 1) return "Just now";
  if (hrs < 24) return `${hrs} hours ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? "Yesterday" : `${days} days ago`;
}

const statusBadge = (s: string) => {
  if (s === "active") return { bg: "bg-success/10", text: "text-success", dot: "bg-success", label: "Active" };
  if (s === "paused") return { bg: "bg-muted", text: "text-muted-foreground", dot: "bg-muted-foreground", label: "Paused" };
  if (s === "failed") return { bg: "bg-destructive/10", text: "text-destructive", dot: "bg-destructive", label: "Failed" };
  return { bg: "bg-warning/10", text: "text-warning", dot: "bg-warning", label: "Draft" };
};

export default function DashboardAds() {
  const { businessId, user, isReady } = useAuth();
  const [campaigns, setCampaigns] = useState<(Campaign & { perf?: PerfLog })[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [budgetValue, setBudgetValue] = useState([300]);

  useEffect(() => {
    if (!businessId || !isReady) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      const { data: camps } = await externalSupabase.from("ad_campaigns").select("*").eq("business_id", businessId).order("last_optimized_at", { ascending: false });
      const list = (camps ?? []) as Campaign[];
      const withPerf = await Promise.all(list.map(async c => {
        const { data: perf } = await externalSupabase.from("ad_performance_logs").select("spend, ctr, roas, clicks, impressions, reach, conversions").eq("campaign_id", c.id).order("logged_at", { ascending: false }).limit(1).maybeSingle();
        return { ...c, perf: perf as PerfLog | undefined };
      }));
      setCampaigns(withPerf);
      setLoading(false);
    })();
  }, [businessId, isReady]);

  const activeCampaigns = campaigns.filter(c => c.status === "active");
  const activeCount = activeCampaigns.length;
  const activeBudget = activeCampaigns.reduce((s, c) => s + safeNum(c.daily_budget), 0);
  const activeWithRoas = activeCampaigns.filter(c => c.perf && safeNum(c.perf.roas) > 0);
  const avgRoas = activeWithRoas.length > 0 ? activeWithRoas.reduce((s, c) => s + safeNum(c.perf!.roas), 0) / activeWithRoas.length : 0;
  const hasDraftOnly = campaigns.length > 0 && activeCount === 0;

  const handleCreateCampaign = async () => {
    if (!businessId) return;
    setCreating(true);
    try {
      const { data: biz } = await externalSupabase.from("businesses").select("business_name, email, daily_budget, target_audience, industry, location").eq("id", businessId).maybeSingle();
      toast("🤖 AI is building your campaigns...");
      apiFireAndForget("/webhook/create-campaigns", {
        user_id: user?.id ?? "", // server expects user_id — this is auth.user.id = businesses.id
        business_id: businessId,
        email: biz?.email || user?.email,
        business_name: biz?.business_name,
        daily_budget: budgetValue[0] / 30,
        target_audience: biz?.target_audience,
        industry: biz?.industry,
        location: biz?.location,
      });
      toast.success(SUCCESS_MESSAGES.GENERATED);
      setTimeout(async () => {
        const { data } = await externalSupabase.from("ad_campaigns").select("*").eq("business_id", businessId).order("last_optimized_at", { ascending: false });
        setCampaigns((data ?? []) as Campaign[]);
      }, 15000);
    } catch { toast.error(ERROR_MESSAGES.GENERATION_FAILED); }
    finally { setCreating(false); setCreateOpen(false); }
  };

  const navTo = (tab: string) => window.dispatchEvent(new CustomEvent("dashboard-navigate", { detail: tab }));

  if (loading) return <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 rounded-lg skeleton" />)}</div>;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-1"><BarChart3 className="h-4 w-4 text-muted-foreground" /><span className="text-xs text-muted-foreground">Active Campaigns</span></div>
          <p className="text-xl font-bold text-foreground">{activeCount}</p>
          {activeCount === 0 && <p className="text-[11px] text-muted-foreground">No active campaigns</p>}
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-1"><TrendingUp className="h-4 w-4 text-muted-foreground" /><span className="text-xs text-muted-foreground">Daily Budget (Active)</span></div>
          <p className="text-xl font-bold text-foreground">${activeBudget.toLocaleString()}</p>
          {activeBudget === 0 && <p className="text-[11px] text-muted-foreground">No active campaigns</p>}
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-1"><Users className="h-4 w-4 text-muted-foreground" /><span className="text-xs text-muted-foreground">Avg ROAS</span></div>
          <p className="text-xl font-bold text-foreground">{avgRoas > 0 ? `${avgRoas.toFixed(1)}x` : "—"}</p>
          {avgRoas === 0 && <p className="text-[11px] text-muted-foreground">No data yet</p>}
        </div>
      </div>

      {/* Action button */}
      <Button size="sm" className="h-9 text-xs" onClick={() => setCreateOpen(true)} disabled={creating}>
        <Plus className="mr-1.5 h-3.5 w-3.5" /> Launch AI Campaign
      </Button>

      {/* Campaign table or empty */}
      {campaigns.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <Megaphone className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <h3 className="mt-4 text-sm font-semibold text-foreground">No campaigns yet</h3>
          <p className="mt-1.5 text-xs text-muted-foreground max-w-xs mx-auto">Your AI creates and manages ad campaigns automatically. Connect your Meta Ads account to get started.</p>
          <div className="mt-4 space-y-2 text-left max-w-xs mx-auto">
            {["Connect Meta Ads in Settings", "Come back and click Launch", "AI creates, targets, and optimizes your ads"].map((step, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">{i + 1}</span>
                <span className="text-xs text-muted-foreground">{step}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-center gap-2">
            <Button size="sm" variant="outline" onClick={() => navTo("settings")}>Go to Settings</Button>
            <Button size="sm" onClick={() => setCreateOpen(true)}>Launch AI Campaign</Button>
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-border bg-card shadow-meta overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="text-xs font-semibold min-w-[180px]">Campaign</TableHead>
                  <TableHead className="text-xs font-semibold min-w-[100px]">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Budget</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Reach</TableHead>
                  <TableHead className="text-xs font-semibold text-right">CTR</TableHead>
                  <TableHead className="text-xs font-semibold text-right">ROAS</TableHead>
                  <TableHead className="text-xs font-semibold text-right min-w-[100px]">Spend</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((c, i) => {
                  const badge = statusBadge(c.status);
                  const isDraft = c.status !== "active" && c.status !== "scaling";
                  const spend = safeNum(c.perf?.spend);
                  const roas = safeNum(c.perf?.roas);
                  const reach = safeNum(c.perf?.reach);
                  const ctr = safeNum(c.perf?.ctr);
                  return (
                    <TableRow key={c.id} className={i % 2 === 0 ? "" : "bg-muted/20"}>
                      <TableCell>
                        <p className="text-[13px] font-medium text-foreground">{c.campaign_name || `AI Campaign${c.objective ? ` — ${c.objective}` : ""}`}</p>
                        {c.objective && <span className="inline-block mt-0.5 text-[10px] rounded bg-muted px-1.5 py-0.5 text-muted-foreground capitalize">{c.objective}</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <div className={`h-2 w-2 rounded-full ${badge.dot}`} />
                          <span className={`text-xs font-medium ${badge.text}`}>{badge.label}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-[13px]">{c.daily_budget ? `$${c.daily_budget}/day` : "—"}</TableCell>
                      <TableCell className="text-right text-[13px]">{isDraft && reach === 0 ? "—" : reach.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-[13px]">{isDraft && ctr === 0 ? "—" : ctr > 0 ? `${ctr.toFixed(2)}%` : "—"}</TableCell>
                      <TableCell className="text-right text-[13px] font-medium">{roas > 0 ? `${roas.toFixed(1)}x` : "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="text-[13px]">{spend > 0 ? `$${spend.toLocaleString()}` : isDraft ? "—" : "$0"}</div>
                        {!isDraft && c.daily_budget > 0 && spend > 0 && (() => {
                          const pct = Math.min(Math.round((spend / c.daily_budget) * 100), 100);
                          const barColor = pct >= 91 ? "bg-destructive" : pct >= 76 ? "bg-orange-500" : pct >= 51 ? "bg-warning" : "bg-success";
                          return (
                            <div className="mt-1">
                              <div className="h-1 w-full rounded-full bg-border overflow-hidden">
                                <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-[9px] text-muted-foreground">{pct}% used</span>
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="text-right text-[11px] text-muted-foreground">{timeAgo(c.last_optimized_at)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Draft guidance */}
          {hasDraftOnly && (
            <div className="rounded-lg border border-warning/30 bg-warning/5 p-5">
              <h4 className="text-sm font-semibold text-foreground">Your campaign is ready to launch</h4>
              <div className="mt-3 space-y-2">
                {["Connect Meta Ads account in Settings", "Come back and click Activate", "AI will optimize it daily"].map((step, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-warning/20 text-[10px] font-bold text-warning">{i + 1}</span>
                    <span className="text-xs text-foreground">{step}</span>
                  </div>
                ))}
              </div>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => navTo("settings")}>Connect Meta Ads</Button>
            </div>
          )}
        </>
      )}

      {/* Create Campaign Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Launch AI Campaign</DialogTitle>
            <DialogDescription>AI creates, targets, and optimizes your ads automatically.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 mt-4">
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Monthly ad budget</p>
              <div className="text-center mb-3">
                <span className="text-3xl font-bold text-foreground">${budgetValue[0]}</span>
                <span className="text-sm text-muted-foreground">/month</span>
                <p className="text-xs text-muted-foreground mt-0.5">≈ ${Math.round(budgetValue[0] / 30)}/day</p>
              </div>
              <Slider value={budgetValue} onValueChange={setBudgetValue} min={50} max={3000} step={50} />
              <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>$50</span><span>$3,000</span></div>
              <div className="flex gap-2 justify-center mt-3">
                {[100, 300, 500, 1000].map(v => (
                  <button key={v} onClick={() => setBudgetValue([v])} className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors ${budgetValue[0] === v ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>${v}</button>
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">AI creates awareness, engagement, and retargeting campaigns. Optimized daily at 8am.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateCampaign} disabled={creating}>
                {creating ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Creating...</> : "Launch Campaign"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
