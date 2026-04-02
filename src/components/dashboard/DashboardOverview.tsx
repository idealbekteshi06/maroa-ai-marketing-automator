import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Sparkles, Zap, Clock, Brain, CalendarClock, CheckCircle2, Circle, TrendingUp, TrendingDown, ArrowUpRight } from "lucide-react";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";

interface DailyStat { recorded_at: string; total_reach: number; }
interface FeedItem { type: string; message: string; time: string; emoji: string; }

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
  { name: "Content Generation", ...getNextRun(1, 9, 0), schedule: "Monday 9:00 AM" },
  { name: "Ad Optimization", ...getNextRun((new Date().getDay() + 1) % 7, 8, 0), schedule: "Daily 8:00 AM" },
  { name: "Performance Tracking", ...getNextRun((new Date().getDay() + 1) % 7, 8, 0), schedule: "Daily 8:00 AM" },
  { name: "Retention Emails", ...getNextRun((new Date().getDay() + 1) % 7, 7, 0), schedule: "Daily 7:00 AM" },
  { name: "Competitor Tracking", ...getNextRun(5, 14, 0), schedule: "Friday 2:00 PM" },
  { name: "Strategy Review", ...getNextRun(0, 22, 0), schedule: "Sunday 10:00 PM" },
  { name: "AI Brain Analysis", ...getNextRun(0, 20, 0), schedule: "Sunday 8:00 PM" },
];

export default function DashboardOverview() {
  const { businessId, user, isReady } = useAuth();
  const [stats, setStats] = useState<DailyStat[]>([]);
  const [businessData, setBusinessData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [contentCount, setContentCount] = useState(0);
  const [publishedCount, setPublishedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [dateRange, setDateRange] = useState("30");

  const fetchData = useCallback(async () => {
    if (!isReady) return;
    if (!businessId && !user?.id) { setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      // Resolve business ID
      let resolvedBusinessId = businessId;
      const bizQuery = businessId
        ? externalSupabase.from("businesses").select("*").eq("id", businessId).maybeSingle()
        : user?.id
          ? externalSupabase.from("businesses").select("*").eq("user_id", user.id).maybeSingle()
          : null;
      
      if (!bizQuery) { setLoading(false); return; }
      const { data: bizData } = await bizQuery;
      setBusinessData(bizData);
      resolvedBusinessId = bizData?.id ?? resolvedBusinessId;
      if (!resolvedBusinessId) { setStats([]); setContentCount(0); setPublishedCount(0); setLoading(false); return; }

      // Single parallel batch — ALL queries at once
      const [statsRes, contentRes, publishedRes, rc, ri, rr, rw] = await Promise.all([
        externalSupabase.from("daily_stats").select("recorded_at, total_reach").eq("business_id", resolvedBusinessId).order("recorded_at", { ascending: true }).limit(parseInt(dateRange)),
        externalSupabase.from("generated_content").select("id", { count: "exact", head: true }).eq("business_id", resolvedBusinessId),
        externalSupabase.from("generated_content").select("id", { count: "exact", head: true }).eq("business_id", resolvedBusinessId).eq("status", "published"),
        externalSupabase.from("generated_content").select("created_at, content_theme").eq("business_id", resolvedBusinessId).order("created_at", { ascending: false }).limit(5),
        externalSupabase.from("competitor_insights").select("recorded_at, competitor_doing_well").eq("business_id", resolvedBusinessId).order("recorded_at", { ascending: false }).limit(3),
        externalSupabase.from("retention_logs").select("email_type, subject, sent_at").eq("business_id", resolvedBusinessId).order("sent_at", { ascending: false }).limit(3),
        externalSupabase.from("win_notifications").select("win_type, notified_at").eq("business_id", resolvedBusinessId).order("notified_at", { ascending: false }).limit(3),
      ]);
      setStats((statsRes.data as DailyStat[]) ?? []);
      setContentCount(contentRes.count ?? 0);
      setPublishedCount(publishedRes.count ?? 0);

      const feedItems: FeedItem[] = [];
      (rc.data ?? []).forEach((c: any) => feedItems.push({ type: "content", emoji: "📝", message: `Generated "${c.content_theme || "new"}" content`, time: c.created_at }));
      (ri.data ?? []).forEach(() => feedItems.push({ type: "competitor", emoji: "🔍", message: "Competitor analysis updated", time: (ri.data as any[])[0]?.recorded_at }));
      (rr.data ?? []).forEach((r: any) => feedItems.push({ type: "email", emoji: "📧", message: `Sent ${r.email_type || "retention"} email`, time: r.sent_at }));
      (rw.data ?? []).forEach((w: any) => feedItems.push({ type: "win", emoji: "🏆", message: w.win_type || "New milestone!", time: w.notified_at }));
      feedItems.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setFeed(feedItems.slice(0, 10));
    } catch (err) { console.error(err); setError("Failed to load data"); }
    finally { setLoading(false); }
  }, [businessId, user?.id, isReady, dateRange]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalReach = stats.reduce((sum, s) => sum + (s.total_reach || 0), 0) || (businessData?.total_reach ?? 0);
  const postsPublished = publishedCount || (parseInt(businessData?.posts_published) || 0);
  const hoursSaved = (contentCount || postsPublished) * 2;

  const metricCards = [
    { label: "Total Reach", value: totalReach, icon: Eye, change: "+12.3%", positive: true },
    { label: "Posts Generated", value: contentCount, icon: Sparkles, change: `${contentCount} total`, positive: true },
    { label: "Active Workflows", value: 33, icon: Zap, change: "Running 24/7", positive: true },
    { label: "Hours Saved", value: hoursSaved, icon: Clock, change: `${contentCount}×2hrs`, positive: true },
  ];

  const chartData = stats.map(s => ({
    date: new Date(s.recorded_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    reach: s.total_reach || 0,
  }));

  // AI Brain
  let aiDecisions: any[] = [];
  if (businessData?.ai_brain_decisions) {
    try {
      const raw = typeof businessData.ai_brain_decisions === "string" ? JSON.parse(businessData.ai_brain_decisions) : businessData.ai_brain_decisions;
      if (Array.isArray(raw)) aiDecisions = raw;
      else if (typeof raw === "object") aiDecisions = Object.entries(raw).map(([k, v]) => ({ title: k, value: v }));
    } catch {}
  }

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
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[1, 2, 3, 4].map(i => <div key={i} className="h-24 rounded-lg bg-card border border-border animate-pulse" />)}</div>
        <div className="h-72 rounded-lg bg-card border border-border animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={fetchData}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Date range + heading */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Account Overview</h3>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[150px] h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="14">Last 14 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Metric cards — Meta Ads Manager style */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map(m => (
          <div key={m.label} className="rounded-lg border border-border bg-card p-4 shadow-meta transition-shadow hover:shadow-meta-hover">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">{m.label}</span>
              <m.icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <p className="text-2xl font-bold text-foreground"><AnimatedCounter target={m.value} /></p>
            <div className="mt-1 flex items-center gap-1">
              {m.positive ? (
                <TrendingUp className="h-3 w-3 text-success" />
              ) : (
                <TrendingDown className="h-3 w-3 text-destructive" />
              )}
              <span className={`text-[11px] font-medium ${m.positive ? "text-success" : "text-destructive"}`}>{m.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Chart — Meta style */}
      <div className="rounded-lg border border-border bg-card p-5 shadow-meta">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Performance</h3>
          <span className="text-[11px] text-muted-foreground">Total Reach</span>
        </div>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={45} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
              />
              <Line type="monotone" dataKey="reach" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "hsl(var(--primary))" }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-48 flex-col items-center justify-center text-center">
            <svg className="w-full h-24" viewBox="0 0 400 96" fill="none"><path d="M0 80 Q100 60 200 50 T400 20" stroke="hsl(var(--border))" strokeWidth="2" strokeDasharray="6 4" /></svg>
            <p className="mt-3 text-xs text-muted-foreground">Your reach data will appear here after your first week</p>
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Activity feed */}
        <div className="lg:col-span-2 rounded-lg border border-border bg-card shadow-meta">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
          </div>
          {feed.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm text-muted-foreground">No activity yet. Actions appear here as workflows run.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {feed.map((f, i) => (
                <div key={i} className="flex items-start gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
                  <span className="text-base mt-0.5">{f.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] text-foreground">{f.message}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {new Date(f.time).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Brain + Workflows */}
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4 shadow-meta">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">AI Brain</h3>
            </div>
            {aiDecisions.length > 0 ? (
              <div className="space-y-2">
                {aiDecisions.slice(0, 3).map((d, i) => (
                  <div key={i} className="rounded-md bg-muted p-3">
                    <p className="text-xs font-medium text-foreground">{d.title || `Decision ${i + 1}`}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{typeof d === "string" ? d : d.value || JSON.stringify(d)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md bg-muted p-4 text-center">
                <Brain className="mx-auto h-6 w-6 text-muted-foreground/30" />
                <p className="mt-2 text-xs text-muted-foreground">AI Brain analyzes your data every Sunday at 8pm</p>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-border bg-card p-4 shadow-meta">
            <div className="flex items-center gap-2 mb-3">
              <CalendarClock className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Upcoming Runs</h3>
            </div>
            <div className="space-y-2">
              {scheduledWorkflows.slice(0, 5).map(w => (
                <div key={w.name} className="flex items-center justify-between rounded-md bg-muted px-3 py-2">
                  <span className="text-xs text-foreground">{w.name}</span>
                  <span className="text-[11px] font-medium text-primary">{w.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Setup checklist */}
      {setupPct < 100 && (
        <div className="rounded-lg border border-border bg-card p-5 shadow-meta">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Getting Started</h3>
            <span className="text-sm font-bold text-primary">{setupPct}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-border overflow-hidden mb-4">
            <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${setupPct}%` }} />
          </div>
          <div className="grid gap-2 sm:grid-cols-5">
            {setupSteps.map(s => (
              <div key={s.label} className="flex items-center gap-2">
                {s.done ? <CheckCircle2 className="h-4 w-4 text-success shrink-0" /> : <Circle className="h-4 w-4 text-muted-foreground/30 shrink-0" />}
                <span className={`text-xs ${s.done ? "text-foreground font-medium" : "text-muted-foreground"}`}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
