import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Rocket, Eye, DollarSign, TrendingUp, ArrowRight, Sparkles, Zap, Clock } from "lucide-react";
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

interface FeedItem {
  type: string;
  message: string;
  time: string;
}

function SkeletonCard() {
  return <div className="h-[120px] rounded-2xl border border-border bg-card animate-pulse-soft" />;
}

function AnimatedCounter({ target, prefix = "", suffix = "" }: { target: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  
  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    const duration = 1200;
    const steps = 40;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target]);

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
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

const feedIcons: Record<string, string> = {
  content: "📝",
  ads: "📊",
  competitor: "🔍",
  email: "📧",
  strategy: "🎯",
  notification: "🔔",
};

export default function DashboardOverview() {
  const { businessId, user, isReady } = useAuth();
  const [stats, setStats] = useState<DailyStat[]>([]);
  const [businessData, setBusinessData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [photoCount, setPhotoCount] = useState(0);
  const [contentCount, setContentCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [publishedCount, setPublishedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [feed, setFeed] = useState<FeedItem[]>([]);

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
        setStats([]); setPhotoCount(0); setContentCount(0); setApprovedCount(0); setPublishedCount(0); setLoading(false);
        return;
      }

      const [statsRes, photosRes, contentRes, approvedRes, publishedRes] = await Promise.all([
        queryWithRetry<DailyStat[]>(() =>
          externalSupabase.from("daily_stats").select("*").eq("business_id", resolvedBusinessId).order("recorded_at", { ascending: false }).limit(30) as unknown as Promise<{ data: DailyStat[] | null; error: any }>
        ),
        externalSupabase.from("business_photos").select("id", { count: "exact", head: true }).eq("business_id", resolvedBusinessId),
        externalSupabase.from("generated_content").select("id", { count: "exact", head: true }).eq("business_id", resolvedBusinessId),
        externalSupabase.from("generated_content").select("id", { count: "exact", head: true }).eq("business_id", resolvedBusinessId).eq("status", "approved"),
        externalSupabase.from("generated_content").select("id", { count: "exact", head: true }).eq("business_id", resolvedBusinessId).eq("status", "published"),
      ]);

      setStats((statsRes.data as DailyStat[]) ?? []);
      setPhotoCount(photosRes.count ?? 0);
      setContentCount(contentRes.count ?? 0);
      setApprovedCount(approvedRes.count ?? 0);
      setPublishedCount(publishedRes.count ?? 0);

      // Build automation feed
      const feedItems: FeedItem[] = [];

      // Content generated
      const { data: recentContent } = await externalSupabase
        .from("generated_content")
        .select("created_at, content_theme")
        .eq("business_id", resolvedBusinessId)
        .order("created_at", { ascending: false })
        .limit(5);
      (recentContent ?? []).forEach((c: any) => {
        feedItems.push({
          type: "content",
          message: `Generated weekly content: ${c.content_theme || "New posts"}`,
          time: c.created_at,
        });
      });

      // Competitor insights
      const { data: recentInsights } = await externalSupabase
        .from("competitor_insights")
        .select("recorded_at")
        .eq("business_id", resolvedBusinessId)
        .order("recorded_at", { ascending: false })
        .limit(3);
      (recentInsights ?? []).forEach((i: any) => {
        feedItems.push({
          type: "competitor",
          message: "Detected a competitor move and updated your strategy",
          time: i.recorded_at,
        });
      });

      // Retention logs
      const { data: recentRetention } = await externalSupabase
        .from("retention_logs")
        .select("email_type, subject, sent_at")
        .eq("business_id", resolvedBusinessId)
        .order("sent_at", { ascending: false })
        .limit(3);
      (recentRetention ?? []).forEach((r: any) => {
        feedItems.push({
          type: "email",
          message: `Sent ${r.email_type || "retention"} email: ${r.subject || "Check-in"}`,
          time: r.sent_at,
        });
      });

      // Sort by time desc, take 10
      feedItems.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setFeed(feedItems.slice(0, 10));

    } catch (err) {
      console.error("Dashboard data fetch error:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [businessId, user?.id, isReady]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalReach = stats.reduce((sum, s) => sum + (s.total_reach || 0), 0) || (businessData?.total_reach ?? 0);
  const postsPublished = publishedCount || (parseInt(businessData?.posts_published) || 0);
  const hoursSaved = postsPublished * 2;

  const summaryCards = [
    { label: "Total Reach", target: totalReach, icon: Eye, change: "From daily_stats", prefix: "" },
    { label: "Posts Published", target: postsPublished, icon: Sparkles, change: "AI generated" },
    { label: "Active Workflows", target: 28, icon: Zap, change: "Running for you" },
    { label: "Hours Saved", target: hoursSaved, icon: Clock, change: `${postsPublished} posts × 2hrs` },
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

  return (
    <div className="space-y-5">
      <SetupProgress business={businessData} photoCount={photoCount} contentCount={contentCount} approvedCount={approvedCount} />

      {/* Animated stat widgets */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-card-hover">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/8">
                <s.icon className="h-4 w-4 text-primary" strokeWidth={1.5} />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold text-card-foreground">
              <AnimatedCounter target={s.target} prefix={s.prefix} />
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">{s.change}</p>
          </div>
        ))}
      </div>

      <ROICalculator postsPublished={postsPublished} />

      {!hasData ? (
        <EmptyOverview />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Chart + Quick Actions */}
          <div className="lg:col-span-2 space-y-4">
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
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold text-card-foreground">Quick Actions</h3>
              <div className="mt-4 space-y-2">
                <Button variant="outline" className="w-full justify-between text-sm h-10">Generate content now <ArrowRight className="h-3.5 w-3.5" /></Button>
                <Button variant="outline" className="w-full justify-between text-sm h-10">View this week's posts <ArrowRight className="h-3.5 w-3.5" /></Button>
                <Button variant="outline" className="w-full justify-between text-sm h-10">Check ad performance <ArrowRight className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          </div>

          {/* Live Automation Feed */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <h3 className="text-sm font-semibold text-card-foreground">Live Automation Feed</h3>
            </div>
            {feed.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No automation activity yet. Actions will appear here as maroa.ai works for you.</p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {feed.map((f, i) => (
                  <div key={i} className="flex items-start gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                    <span className="text-base mt-0.5">{feedIcons[f.type] ?? "⚡"}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-card-foreground leading-relaxed">maroa.ai {f.message.toLowerCase()}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(f.time).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
