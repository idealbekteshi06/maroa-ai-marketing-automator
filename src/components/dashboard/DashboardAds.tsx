import { useEffect, useState } from "react";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";
import { Megaphone } from "lucide-react";

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
}

const statusBadge: Record<string, string> = {
  active: "bg-success/10 text-success",
  scaling: "bg-primary/10 text-primary",
  paused: "bg-destructive/10 text-destructive",
};

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
      setLoading(false);
    };
    fetchData();
  }, [businessId, isReady]);

  const maxSpend = Math.max(...campaigns.map((c) => c.perf?.spend ?? 0), 1);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <SkeletonRow key={i} />)}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">Your AI-managed ad campaigns.</p>

      {campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/8">
            <Megaphone className="h-7 w-7 text-primary" />
          </div>
          <h3 className="mt-5 text-lg font-semibold text-foreground">No ad campaigns yet</h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
            Connect your Facebook account and set your budget to activate AI-powered ad management. maroa.ai will create, monitor and optimize your ads daily.
          </p>
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
    </div>
  );
}
