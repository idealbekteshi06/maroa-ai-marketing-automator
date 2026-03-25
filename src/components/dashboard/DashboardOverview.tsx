import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Eye, DollarSign, TrendingUp, ArrowRight } from "lucide-react";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";

interface DailyStat {
  date: string;
  total_reach: number;
  posts_published: number;
  ad_spend: number;
  roas: number;
}

export default function DashboardOverview() {
  const { businessId } = useAuth();
  const [stats, setStats] = useState<DailyStat[]>([]);
  const [activities, setActivities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessId) return;

    const fetchData = async () => {
      setLoading(true);
      const { data } = await externalSupabase
        .from("daily_stats")
        .select("*")
        .eq("business_id", businessId)
        .order("date", { ascending: false })
        .limit(30);

      setStats(data ?? []);
      setLoading(false);
    };

    fetchData();
  }, [businessId]);

  const latest = stats[0];
  const summaryCards = [
    { label: "Total Reach", value: latest?.total_reach?.toLocaleString() ?? "—", icon: Eye },
    { label: "Posts Published", value: latest?.posts_published?.toString() ?? "—", icon: Sparkles },
    { label: "Ad Spend", value: latest ? `$${latest.ad_spend}` : "—", icon: DollarSign },
    { label: "ROAS", value: latest ? `${latest.roas}x` : "—", icon: TrendingUp },
  ];

  if (loading) {
    return (
      <div className="space-y-8 pb-20 md:pb-0">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 md:pb-0">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((s) => (
          <div key={s.label} className="rounded-2xl bg-card p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-bold text-card-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-card p-6">
        <h3 className="font-semibold text-card-foreground">Reach — Last 30 Days</h3>
        <div className="mt-4 flex h-48 items-end gap-1">
          {stats.length > 0 ? (
            [...stats].reverse().map((s, i) => {
              const max = Math.max(...stats.map((d) => d.total_reach || 1));
              const height = ((s.total_reach || 0) / max) * 100;
              return (
                <div key={i} className="flex-1 rounded-t bg-primary/20 transition-all hover:bg-primary/40" style={{ height: `${height}%` }} title={`${s.date}: ${s.total_reach}`} />
              );
            })
          ) : (
            <p className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">No data yet</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-card p-6">
          <h3 className="font-semibold text-card-foreground">Quick Actions</h3>
          <div className="mt-4 space-y-3">
            <Button variant="outline" className="w-full justify-between">Generate content now <ArrowRight className="h-4 w-4" /></Button>
            <Button variant="outline" className="w-full justify-between">View this week's posts <ArrowRight className="h-4 w-4" /></Button>
            <Button variant="outline" className="w-full justify-between">Check ad performance <ArrowRight className="h-4 w-4" /></Button>
          </div>
        </div>

        <div className="rounded-2xl bg-card p-6">
          <h3 className="font-semibold text-card-foreground">Recent Activity</h3>
          <div className="mt-4 space-y-3">
            {stats.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity yet.</p>
            ) : (
              stats.slice(0, 5).map((s, i) => (
                <div key={i} className="flex items-start gap-3 border-b border-border pb-3 last:border-0">
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <p className="text-sm text-muted-foreground">
                    {s.date}: Reached {s.total_reach?.toLocaleString() ?? 0} people, {s.posts_published ?? 0} posts published
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
