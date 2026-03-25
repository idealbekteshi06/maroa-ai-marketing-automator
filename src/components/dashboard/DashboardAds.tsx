import { useEffect, useState } from "react";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";

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
  active: "bg-primary/10 text-primary",
  scaling: "bg-success/10 text-success",
  paused: "bg-destructive/10 text-destructive",
};

export default function DashboardAds() {
  const { businessId } = useAuth();
  const [campaigns, setCampaigns] = useState<(Campaign & { perf?: PerfLog })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessId) return;
    const fetchData = async () => {
      setLoading(true);
      const { data: camps } = await externalSupabase
        .from("ad_campaigns")
        .select("*")
        .eq("business_id", businessId)
        .order("last_optimized_at", { ascending: false });

      const campaignList = (camps ?? []) as Campaign[];

      // Fetch latest perf log per campaign
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
  }, [businessId]);

  if (loading) {
    return (
      <div className="space-y-3 pb-20 md:pb-0">
        {[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <p className="text-sm text-muted-foreground">Your AI-managed ad campaigns.</p>

      {campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-medium text-foreground">No campaigns yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Campaigns will appear here once your ads start running.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <div key={c.id} className="grid grid-cols-2 gap-4 rounded-2xl bg-card p-5 sm:grid-cols-5 sm:items-center">
              <div className="col-span-2 sm:col-span-1">
                <p className="font-medium text-card-foreground">{c.business_name}</p>
                <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusBadge[c.status] ?? statusBadge.active}`}>{c.status}</span>
                {c.last_decision && <p className="mt-1 text-[10px] text-muted-foreground">{c.last_decision}</p>}
              </div>
              <div><p className="text-xs text-muted-foreground">Spend</p><p className="font-medium text-card-foreground">${c.perf?.spend ?? c.daily_budget}</p></div>
              <div><p className="text-xs text-muted-foreground">CTR</p><p className="font-medium text-card-foreground">{c.perf?.ctr ?? 0}%</p></div>
              <div><p className="text-xs text-muted-foreground">ROAS</p><p className="font-medium text-card-foreground">{c.perf?.roas ?? 0}x</p></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
