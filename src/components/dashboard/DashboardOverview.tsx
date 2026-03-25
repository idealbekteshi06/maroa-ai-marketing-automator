import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Eye, DollarSign, TrendingUp, ArrowRight } from "lucide-react";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";

interface DailyStat {
  recorded_at: string;
  total_reach: number;
  ig_reach: number;
  ig_impressions: number;
  ig_followers: number;
  fb_reach: number;
  fb_engaged: number;
  fb_fan_adds: number;
}

function SkeletonCard() {
  return <div className="h-[120px] rounded-2xl border border-border bg-card animate-pulse-soft" />;
}

function EmptyChart() {
  return (
    <div className="flex h-48 flex-col items-center justify-center text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/8">
        <Eye className="h-5 w-5 text-primary" />
      </div>
      <p className="mt-4 text-sm font-medium text-foreground">No reach data yet</p>
      <p className="mt-1 text-xs text-muted-foreground">Data will appear here once maroa.ai starts posting for you.</p>
    </div>
  );
}

export default function DashboardOverview() {
  const { businessId } = useAuth();
  const [stats, setStats] = useState<DailyStat[]>([]);
  const [businessData, setBusinessData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessId) return;

    const fetchData = async () => {
      setLoading(true);
      const [statsRes, bizRes] = await Promise.all([
        externalSupabase
          .from("daily_stats")
          .select("*")
          .eq("business_id", businessId)
          .order("recorded_at", { ascending: false })
          .limit(30),
        externalSupabase
          .from("businesses")
          .select("total_reach, total_spend, avg_roas, posts_published")
          .eq("id", businessId)
          .maybeSingle(),
      ]);
      setStats(statsRes.data ?? []);
      setBusinessData(bizRes.data);
      setLoading(false);
    };
    fetchData();
  }, [businessId]);

  const summaryCards = [
    { label: "Total Reach", value: businessData?.total_reach?.toLocaleString() ?? "—", icon: Eye, change: "+24% this week" },
    { label: "Posts Published", value: businessData?.posts_published?.toString() ?? "—", icon: Sparkles, change: "AI generated" },
    { label: "Total Spend", value: businessData?.total_spend != null ? `$${businessData.total_spend}` : "—", icon: DollarSign, change: "Optimized daily" },
    { label: "Avg ROAS", value: businessData?.avg_roas != null ? `${businessData.avg_roas}x` : "—", icon: TrendingUp, change: "Return on ad spend" },
  ];

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
        <div className="h-64 rounded-2xl border border-border bg-card animate-pulse-soft" />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-48 rounded-2xl border border-border bg-card animate-pulse-soft" />
          <div className="h-48 rounded-2xl border border-border bg-card animate-pulse-soft" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-card-hover">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/8">
                <s.icon className="h-4 w-4 text-primary" strokeWidth={1.5} />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold text-card-foreground">{s.value}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{s.change}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-card-foreground">Reach — Last 30 Days</h3>
        <div className="mt-4">
          {stats.length > 0 ? (
            <div className="flex h-48 items-end gap-1">
              {[...stats].reverse().map((s, i) => {
                const max = Math.max(...stats.map((d) => d.total_reach || 1));
                const height = ((s.total_reach || 0) / max) * 100;
                return (
                  <div
                    key={i}
                    className="flex-1 rounded-t bg-primary/15 transition-all duration-200 hover:bg-primary/30"
                    style={{ height: `${height}%` }}
                    title={`${s.recorded_at}: ${s.total_reach}`}
                  />
                );
              })}
            </div>
          ) : (
            <EmptyChart />
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-card-foreground">Quick Actions</h3>
          <div className="mt-4 space-y-2">
            <Button variant="outline" className="w-full justify-between text-sm h-10">Generate content now <ArrowRight className="h-3.5 w-3.5" /></Button>
            <Button variant="outline" className="w-full justify-between text-sm h-10">View this week's posts <ArrowRight className="h-3.5 w-3.5" /></Button>
            <Button variant="outline" className="w-full justify-between text-sm h-10">Check ad performance <ArrowRight className="h-3.5 w-3.5" /></Button>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-card-foreground">Recent Activity</h3>
          <div className="mt-4 space-y-3">
            {stats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/8">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <p className="mt-3 text-sm font-medium text-foreground">No activity yet</p>
                <p className="mt-1 text-xs text-muted-foreground">Activity will show up as maroa.ai works.</p>
              </div>
            ) : (
              stats.slice(0, 5).map((s, i) => (
                <div key={i} className="flex items-start gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <p className="text-xs text-muted-foreground">
                    {s.recorded_at}: IG reach {s.ig_reach?.toLocaleString() ?? 0}, FB reach {s.fb_reach?.toLocaleString() ?? 0}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
