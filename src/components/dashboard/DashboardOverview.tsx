import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Rocket, Eye, DollarSign, TrendingUp, ArrowRight, Sparkles, CheckCircle2, Circle, Share2, ImageIcon, CreditCard, FileText, CalendarCheck } from "lucide-react";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";
import { queryWithRetry } from "@/lib/queryWithRetry";
import SetupProgress from "@/components/dashboard/SetupProgress";
import ROICalculator from "@/components/dashboard/ROICalculator";

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

function EmptyOverview() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/8">
        <Rocket className="h-7 w-7 text-primary" />
      </div>
      <h3 className="mt-5 text-lg font-semibold text-foreground">Welcome to maroa.ai</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
        Your marketing engine is warming up. Complete your onboarding to activate everything.
      </p>
    </div>
  );
}

export default function DashboardOverview() {
  const { businessId, user, isReady } = useAuth();
  const [stats, setStats] = useState<DailyStat[]>([]);
  const [businessData, setBusinessData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [photoCount, setPhotoCount] = useState(0);
  const [contentCount, setContentCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!isReady) return;
    if (!businessId && !user?.id) { setLoading(false); return; }

    setLoading(true);
    setError(null);

    try {
      let bizData: any = null;
      let resolvedBusinessId = businessId;

      if (businessId) {
        const { data } = await externalSupabase.from("businesses").select("*").eq("id", businessId).maybeSingle();
        bizData = data;
      } else if (user?.id) {
        const { data } = await externalSupabase.from("businesses").select("*").eq("user_id", user.id).maybeSingle();
        bizData = data;
        resolvedBusinessId = data?.id ?? null;
      }

      setBusinessData(bizData);

      if (!resolvedBusinessId) {
        setStats([]); setPhotoCount(0); setContentCount(0); setApprovedCount(0); setLoading(false);
        return;
      }

      const [statsRes, photosRes, contentRes, approvedRes] = await Promise.all([
        queryWithRetry<DailyStat[]>(() =>
          externalSupabase.from("daily_stats").select("*").eq("business_id", resolvedBusinessId).order("recorded_at", { ascending: false }).limit(30) as unknown as Promise<{ data: DailyStat[] | null; error: any }>
        ),
        externalSupabase.from("business_photos").select("id", { count: "exact", head: true }).eq("business_id", resolvedBusinessId),
        externalSupabase.from("generated_content").select("id", { count: "exact", head: true }).eq("business_id", resolvedBusinessId),
        externalSupabase.from("generated_content").select("id", { count: "exact", head: true }).eq("business_id", resolvedBusinessId).eq("status", "approved"),
      ]);

      setStats((statsRes.data as DailyStat[]) ?? []);
      setPhotoCount(photosRes.count ?? 0);
      setContentCount(contentRes.count ?? 0);
      setApprovedCount(approvedRes.count ?? 0);
    } catch (err) {
      console.error("Dashboard data fetch error:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [businessId, user?.id, isReady]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const summaryCards = [
    { label: "Total Reach", value: businessData?.total_reach?.toLocaleString() ?? "0", icon: Eye, change: "+24% this week" },
    { label: "Posts Published", value: businessData?.posts_published?.toString() ?? "0", icon: Sparkles, change: "AI generated" },
    { label: "Total Spend", value: businessData?.total_spend != null ? `$${businessData.total_spend}` : "$0", icon: DollarSign, change: "Optimized daily" },
    { label: "Avg ROAS", value: businessData?.avg_roas != null ? `${businessData.avg_roas}x` : "0x", icon: TrendingUp, change: "Return on ad spend" },
  ];

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-24 rounded-2xl border border-border bg-card animate-pulse-soft" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-16 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={fetchData}>Try again</Button>
      </div>
    );
  }

  const hasData = stats.length > 0 || (businessData?.total_reach && businessData.total_reach > 0);
  const postsPublished = parseInt(businessData?.posts_published) || 0;

  return (
    <div className="space-y-5">
      {/* Setup Progress */}
      <SetupProgress business={businessData} photoCount={photoCount} contentCount={contentCount} approvedCount={approvedCount} />

      {/* Summary cards */}
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

      {/* ROI Calculator */}
      <ROICalculator postsPublished={postsPublished} />

      {!hasData ? (
        <EmptyOverview />
      ) : (
        <>
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-card-foreground">Reach — Last 30 Days</h3>
            <div className="mt-4">
              <div className="flex h-48 items-end gap-1">
                {[...stats].reverse().map((s, i) => {
                  const max = Math.max(...stats.map((d) => d.total_reach || 1));
                  const height = ((s.total_reach || 0) / max) * 100;
                  return (
                    <div key={i} className="flex-1 rounded-t bg-primary/15 transition-all duration-200 hover:bg-primary/30" style={{ height: `${height}%` }} title={`${s.recorded_at}: ${s.total_reach}`} />
                  );
                })}
              </div>
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
                {stats.slice(0, 5).map((s, i) => (
                  <div key={i} className="flex items-start gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                    <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <p className="text-xs text-muted-foreground">
                      {s.recorded_at}: IG reach {s.ig_reach?.toLocaleString() ?? 0}, FB reach {s.fb_reach?.toLocaleString() ?? 0}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
