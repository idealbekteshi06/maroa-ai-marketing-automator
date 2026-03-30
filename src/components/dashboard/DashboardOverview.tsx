import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Rocket, Eye, Sparkles, Zap, Clock, Brain, CalendarClock, CheckCircle2, Circle } from "lucide-react";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";
import { queryWithRetry } from "@/lib/queryWithRetry";
import ROICalculator from "@/components/dashboard/ROICalculator";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface DailyStat { recorded_at: string; total_reach: number; }
interface FeedItem { type: string; message: string; time: string; emoji: string; }

function SkeletonCard() {
  return <div className="h-[120px] rounded-2xl border border-border bg-card animate-pulse" />;
}

function AnimatedCounter({ target, prefix = "", suffix = "" }: { target: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    const duration = 1200;
    const steps = 40;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target]);
  return <span>{prefix}{count.toLocaleString()}{suffix}</span>;
}

function getNextRun(dayOfWeek: number, hour: number, minute: number) {
  const now = new Date();
  const target = new Date(now);
  target.setHours(hour, minute, 0, 0);
  const diff = (dayOfWeek - now.getDay() + 7) % 7;
  target.setDate(now.getDate() + (diff === 0 && target <= now ? 7 : diff));
  const ms = target.getTime() - now.getTime();
  const hours = Math.floor(ms / 3600000);
  const days = Math.floor(hours / 24);
  const remainHours = hours % 24;
  return { date: target, label: days > 0 ? `${days}d ${remainHours}h` : `${remainHours}h` };
}

const scheduledWorkflows = [
  { name: "Content Generation", emoji: "📝", ...getNextRun(1, 9, 0), schedule: "Monday 9:00 AM" },
  { name: "Ad Optimization", emoji: "📊", ...getNextRun((new Date().getDay() + 1) % 7, 8, 0), schedule: "Daily 8:00 AM" },
  { name: "Performance Tracking", emoji: "📈", ...getNextRun((new Date().getDay() + 1) % 7, 8, 0), schedule: "Daily 8:00 AM" },
  { name: "Retention Emails", emoji: "📧", ...getNextRun((new Date().getDay() + 1) % 7, 7, 0), schedule: "Daily 7:00 AM" },
  { name: "Competitor Tracking", emoji: "🔍", ...getNextRun(5, 14, 0), schedule: "Friday 2:00 PM" },
  { name: "Strategy Review", emoji: "🎯", ...getNextRun(0, 22, 0), schedule: "Sunday 10:00 PM" },
  { name: "AI Brain Analysis", emoji: "🧠", ...getNextRun(0, 20, 0), schedule: "Sunday 8:00 PM" },
];

export default function DashboardOverview() {
  const { businessId, user, isReady } = useAuth();
  const [stats, setStats] = useState<DailyStat[]>([]);
  const [businessData, setBusinessData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [contentCount, setContentCount] = useState(0);
  const [publishedCount, setPublishedCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [photoCount, setPhotoCount] = useState(0);
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
      if (!resolvedBusinessId) { setStats([]); setContentCount(0); setPublishedCount(0); setApprovedCount(0); setPhotoCount(0); setLoading(false); return; }

      const [statsRes, contentRes, publishedRes, approvedRes, photosRes] = await Promise.all([
        queryWithRetry<DailyStat[]>(() =>
          externalSupabase.from("daily_stats").select("recorded_at, total_reach").eq("business_id", resolvedBusinessId).order("recorded_at", { ascending: true }).limit(30) as unknown as Promise<{ data: DailyStat[] | null; error: any }>
        ),
        externalSupabase.from("generated_content").select("id", { count: "exact", head: true }).eq("business_id", resolvedBusinessId),
        externalSupabase.from("generated_content").select("id", { count: "exact", head: true }).eq("business_id", resolvedBusinessId).eq("status", "published"),
        externalSupabase.from("generated_content").select("id", { count: "exact", head: true }).eq("business_id", resolvedBusinessId).eq("status", "approved"),
        externalSupabase.from("business_photos").select("id", { count: "exact", head: true }).eq("business_id", resolvedBusinessId),
      ]);
      setStats((statsRes.data as DailyStat[]) ?? []);
      setContentCount(contentRes.count ?? 0);
      setPublishedCount(publishedRes.count ?? 0);
      setApprovedCount(approvedRes.count ?? 0);
      setPhotoCount(photosRes.count ?? 0);

      // Feed
      const feedItems: FeedItem[] = [];
      const [rc, ri, rr, rw] = await Promise.all([
        externalSupabase.from("generated_content").select("created_at, content_theme").eq("business_id", resolvedBusinessId).order("created_at", { ascending: false }).limit(5),
        externalSupabase.from("competitor_insights").select("recorded_at, competitor_doing_well").eq("business_id", resolvedBusinessId).order("recorded_at", { ascending: false }).limit(3),
        externalSupabase.from("retention_logs").select("email_type, subject, sent_at").eq("business_id", resolvedBusinessId).order("sent_at", { ascending: false }).limit(3),
        externalSupabase.from("win_notifications").select("win_type, notified_at").eq("business_id", resolvedBusinessId).order("notified_at", { ascending: false }).limit(3),
      ]);
      (rc.data ?? []).forEach((c: any) => feedItems.push({ type: "content", emoji: "📝", message: `Generated ${c.content_theme || "new"} content for your business`, time: c.created_at }));
      (ri.data ?? []).forEach((i: any) => feedItems.push({ type: "competitor", emoji: "🔍", message: "Detected a competitor move and updated your strategy", time: i.recorded_at }));
      (rr.data ?? []).forEach((r: any) => feedItems.push({ type: "email", emoji: "📧", message: `Sent ${r.email_type || "retention"} email: ${r.subject || "Check-in"}`, time: r.sent_at }));
      (rw.data ?? []).forEach((w: any) => feedItems.push({ type: "win", emoji: "🏆", message: w.win_type || "New milestone achieved!", time: w.notified_at }));
      feedItems.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setFeed(feedItems.slice(0, 10));
    } catch (err) {
      console.error("Dashboard data fetch error:", err);
      setError("Failed to load dashboard data");
    } finally { setLoading(false); }
  }, [businessId, user?.id, isReady]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalReach = stats.reduce((sum, s) => sum + (s.total_reach || 0), 0) || (businessData?.total_reach ?? 0);
  const postsPublished = publishedCount || (parseInt(businessData?.posts_published) || 0);
  const hoursSaved = (contentCount || postsPublished) * 2;

  const summaryCards = [
    { label: "Total Reach", target: totalReach, icon: Eye, change: "From daily stats" },
    { label: "Posts Generated", target: contentCount, icon: Sparkles, change: "AI generated" },
    { label: "Active Workflows", target: 31, icon: Zap, change: "Running for you" },
    { label: "Hours Saved", target: hoursSaved, icon: Clock, change: `${contentCount} posts × 2hrs` },
  ];

  const chartData = stats.map(s => ({
    date: new Date(s.recorded_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    reach: s.total_reach || 0,
  }));

  // AI Brain decisions
  let aiDecisions: any[] = [];
  if (businessData?.ai_brain_decisions) {
    try {
      const raw = typeof businessData.ai_brain_decisions === "string" ? JSON.parse(businessData.ai_brain_decisions) : businessData.ai_brain_decisions;
      if (Array.isArray(raw)) aiDecisions = raw;
      else if (typeof raw === "object") aiDecisions = Object.entries(raw).map(([k, v]) => ({ title: k, value: v }));
    } catch { /* ignore */ }
  }

  const decisionIcons: Record<string, { icon: string; label: string }> = {
    content_focus: { icon: "✏️", label: "Content Focus" },
    ad_strategy: { icon: "📊", label: "Ad Strategy" },
    competitor_move: { icon: "🎯", label: "Competitor Move" },
    optimal_schedule: { icon: "🕐", label: "Optimal Schedule" },
    big_opportunity: { icon: "💡", label: "Big Opportunity" },
  };

  // Setup checklist
  const setupSteps = [
    { label: "Profile complete", done: !!(businessData?.business_name && businessData?.industry) },
    { label: "Social accounts connected", done: !!businessData?.social_accounts_connected || !!businessData?.meta_access_token },
    { label: "Budget set", done: (businessData?.daily_budget ?? 0) > 0 },
    { label: "First content generated", done: contentCount > 0 },
    { label: "Onboarding complete", done: !!businessData?.onboarding_complete },
  ];
  const setupDone = setupSteps.filter(s => s.done).length;
  const setupPct = Math.round((setupDone / setupSteps.length) * 100);

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}</div>
        <div className="h-64 rounded-2xl border border-border bg-card animate-pulse" />
        <div className="grid gap-4 lg:grid-cols-3">{[1, 2, 3].map(i => <div key={i} className="h-48 rounded-2xl border border-border bg-card animate-pulse" />)}</div>
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

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map(s => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                <s.icon className="h-4 w-4 text-primary" strokeWidth={1.5} />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold text-card-foreground"><AnimatedCounter target={s.target} /></p>
            <p className="mt-1 text-[11px] text-muted-foreground">{s.change}</p>
          </div>
        ))}
      </div>

      {/* Chart + AI Brain + Feed */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* 30-day chart */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">Reach — Last 30 Days</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={40} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
                <Line type="monotone" dataKey="reach" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-48 flex-col items-center justify-center text-center">
              <div className="h-24 w-full border-b border-dashed border-border/50 relative">
                <svg className="w-full h-full" viewBox="0 0 400 96" fill="none"><path d="M0 80 Q100 60 200 50 T400 20" stroke="hsl(var(--border))" strokeWidth="2" strokeDasharray="6 4" /></svg>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Your reach data will appear here after your first week</p>
            </div>
          )}
        </div>

        {/* Live Feed */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <h3 className="text-sm font-semibold text-card-foreground">Live Automation Feed</h3>
          </div>
          {feed.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">No automation activity yet. Actions will appear here as maroa.ai works for you.</p>
          ) : (
            <div className="space-y-3 max-h-[350px] overflow-y-auto">
              {feed.map((f, i) => (
                <div key={i} className="flex items-start gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                  <span className="text-base mt-0.5">{f.emoji}</span>
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

      {/* AI Brain Decisions */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-card-foreground">AI Brain Decisions</h3>
        </div>
        {aiDecisions.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {aiDecisions.slice(0, 5).map((d, i) => {
              const key = d.title?.toLowerCase().replace(/\s+/g, "_") || Object.keys(decisionIcons)[i] || "";
              const meta = decisionIcons[key] || { icon: "🧠", label: d.title || `Decision ${i + 1}` };
              return (
                <div key={i} className="rounded-xl bg-muted/50 p-4">
                  <span className="text-lg">{meta.icon}</span>
                  <p className="mt-1 text-[11px] font-semibold text-card-foreground">{meta.label}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground leading-relaxed">{typeof d === "string" ? d : d.value || d.description || JSON.stringify(d)}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl bg-muted/30 p-6 text-center">
            <Brain className="mx-auto h-8 w-8 text-muted-foreground/30" />
            <p className="mt-3 text-sm font-medium text-foreground">Your AI Brain analyzes all your data every Sunday at 8pm</p>
            <p className="mt-1 text-xs text-muted-foreground">It tells you exactly what to focus on next week — content strategy, ad moves, competitor responses, and big opportunities.</p>
          </div>
        )}
      </div>

      {/* Setup Checklist */}
      {setupPct < 100 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-card-foreground">Getting Started</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {setupPct === 0 ? "Let's get your marketing engine running" : setupPct <= 60 ? "Great start — keep going!" : "Almost there!"}
              </p>
            </div>
            <span className="text-lg font-bold text-primary">{setupPct}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-border overflow-hidden mb-4">
            <div className="h-full rounded-full bg-primary transition-all duration-700 ease-out" style={{ width: `${setupPct}%` }} />
          </div>
          <div className="grid gap-2 sm:grid-cols-5">
            {setupSteps.map(s => (
              <div key={s.label} className="flex items-center gap-2">
                {s.done ? <CheckCircle2 className="h-4 w-4 text-primary shrink-0" /> : <Circle className="h-4 w-4 text-muted-foreground/30 shrink-0" />}
                <span className={`text-xs ${s.done ? "text-primary font-medium" : "text-muted-foreground"}`}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <ROICalculator postsPublished={contentCount || postsPublished} />

      {/* Next Automation Runs */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <CalendarClock className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-card-foreground">Next Automation Runs</h3>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {scheduledWorkflows.map(w => (
            <div key={w.name} className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
              <span className="text-lg">{w.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-card-foreground">{w.name}</p>
                <p className="text-[10px] text-muted-foreground">{w.schedule}</p>
              </div>
              <span className="text-[10px] font-semibold text-primary whitespace-nowrap">{w.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
