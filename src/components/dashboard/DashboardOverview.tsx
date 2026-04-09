import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Send, Users, Zap, CalendarClock, CheckCircle2, Circle, Loader2, BarChart2 } from "lucide-react";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import PendingApprovals from "@/components/PendingApprovals";
import Sparkline from "@/components/Sparkline";
import AIBrainStatus from "@/components/AIBrainStatus";
import ProfileScore from "@/components/dashboard/ProfileScore";
import { apiPost } from "@/lib/apiClient";
import { ERROR_MESSAGES } from "@/lib/errorMessages";
import type { BusinessProfile } from "@/types";

interface DailyStat { recorded_at: string; total_reach: number; }
interface FeedItem { type: string; message: string; time: string; emoji: string; }
interface SnapshotItem { total_reach?: number | null; }
interface GeneratedContentRow { created_at: string; platform?: string | null; }
interface CompetitorInsightRow { recorded_at: string; }
interface RetentionLogRow { sent_at: string; email_type?: string | null; }
interface WinNotificationRow { notified_at: string; message?: string | null; win_type?: string | null; }
interface AIDecision { title: string; value: unknown; }
interface RealtimePayload {
  new?: { platform?: string | null; first_name?: string | null };
}

/* ── FIX 1: Name capitalization ── */
function capitalizeName(name: string): string {
  if (!name) return "";
  return name.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}

type AuthUser = { email?: string; id?: string; user_metadata?: Record<string, unknown> };
function getFirstName(user: AuthUser | null, businessData: BusinessProfile | null): string {
  const raw =
    (user?.user_metadata?.first_name as string | undefined) ||
    (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ||
    (user?.user_metadata?.name as string | undefined)?.split(" ")[0] ||
    businessData?.first_name ||
    businessData?.business_name?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "";
  return capitalizeName(raw);
}

/* ── Helpers ── */
function AnimatedCounter({ target }: { target: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    let current = 0;
    const increment = target / 40;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, 30);
    return () => clearInterval(timer);
  }, [target]);
  return <span>{count.toLocaleString()}</span>;
}

/* ── FIX 10.2: Human-readable time format ── */
function formatTimeAgo(date: string) {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs === 1) return "1 hour ago";
  if (hrs < 24) return `${hrs} hours ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 17) return "Good afternoon";
  if (h >= 17 && h < 21) return "Good evening";
  return "Good night";
}

/* ── FIX 8: Better time-until format ── */
function getNextRunDate(dayOfWeek: number, hour: number): Date {
  const now = new Date();
  const target = new Date(now);
  target.setHours(hour, 0, 0, 0);
  const diff = (dayOfWeek - now.getDay() + 7) % 7;
  target.setDate(now.getDate() + (diff === 0 && target <= now ? 7 : diff));
  return target;
}

function formatTimeUntil(target: Date): string {
  const diff = target.getTime() - Date.now();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (hours < 1) return "Soon";
  if (hours < 24) return `in ${hours}h`;
  if (days === 1) return "Tomorrow";
  return `in ${days} days`;
}

/* ── FIX 2: Activity text formatter ── */
function formatActivityText(raw: string): string {
  if (!raw) return "";
  const lower = raw.toLowerCase();
  const mappings: [string, string][] = [
    ["content_published sent", "Weekly report email sent"],
    ["content_published", "Content published"],
    ["competitor analysis done", "Competitor analysis completed"],
    ["competitor_analysis", "Competitor analysis completed"],
    ["seo_audit", "SEO audit completed"],
    ["lead_captured", "New lead captured"],
    ["campaign_created", "New campaign created"],
    ["email_sent", "Email sequence sent"],
    ["review_request", "Review request sent"],
    ["brand_memory", "Brand voice updated"],
    ["content_generated", "New content generated"],
    ["video_script", "Video script created"],
  ];
  for (const [key, value] of mappings) {
    if (lower.includes(key)) return value;
  }
  return raw.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()).slice(0, 50);
}

/* ── FIX 8: Clearer task names ── */
const scheduledTasks = [
  { icon: "🎨", name: "Generate new posts", time: formatTimeUntil(getNextRunDate(2, 7)) },
  { icon: "💰", name: "Optimize ad campaigns", time: formatTimeUntil(getNextRunDate((new Date().getDay() + 1) % 7, 6)) },
  { icon: "📊", name: "Update analytics", time: formatTimeUntil(getNextRunDate((new Date().getDay() + 1) % 7, 23)) },
  { icon: "🎯", name: "Competitor analysis", time: formatTimeUntil(getNextRunDate(0, 20)) },
  { icon: "🔍", name: "SEO recommendations", time: formatTimeUntil(getNextRunDate(0, 22)) },
  { icon: "📈", name: "Weekly AI report", time: formatTimeUntil(getNextRunDate(1, 9)) },
];

/* ── FIX 4: Specific button labels per action ── */
const quickActions = [
  { icon: "📝", name: "Generate Post", desc: "AI writes and schedules a new post", color: "bg-primary/10 text-primary", endpoint: "/webhook/instant-content", btnLabel: "Generate Now", loadingText: "Creating post...", successMsg: "✓ Post created! Check Content tab" },
  { icon: "🔍", name: "SEO Audit", desc: "Find new keyword opportunities", color: "bg-success/10 text-success", endpoint: "/webhook/seo-audit", btnLabel: "Start Audit", loadingText: "Starting audit...", successMsg: "✓ Audit started! Check SEO tab in ~60s" },
  { icon: "📣", name: "Launch Campaign", desc: "AI creates and targets an ad campaign", color: "bg-warning/10 text-warning", endpoint: "/webhook/meta-campaign-create", btnLabel: "Launch Campaign", loadingText: "Building campaign...", successMsg: "✓ Campaign created! Check Campaigns tab" },
  { icon: "🎯", name: "Competitor Analysis", desc: "See what competitors are doing", color: "bg-purple-500/10 text-purple-500", endpoint: "/webhook/competitor-analyze", btnLabel: "Analyze Now", loadingText: "Analyzing...", successMsg: "✓ Analysis started! Check Competitors tab" },
  { icon: "🎬", name: "Video Script", desc: "AI writes a TikTok or Reel script", color: "bg-destructive/10 text-destructive", endpoint: "/webhook/video-script-generate", btnLabel: "Write Script", loadingText: "Writing script...", successMsg: "✓ Script ready! Check Content > Videos" },
  { icon: "⭐", name: "Review Request", desc: "Ask a customer to leave a review", color: "bg-yellow-500/10 text-yellow-600", endpoint: "/webhook/review-request-send", btnLabel: "Send Request", loadingText: "Sending...", successMsg: "✓ Request sent!" },
];

export default function DashboardOverview() {
  const { businessId, user, isReady } = useAuth();
  const [stats, setStats] = useState<DailyStat[]>([]);
  const [businessData, setBusinessData] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishedCount, setPublishedCount] = useState(0);
  const [leadCount, setLeadCount] = useState(0);
  const [todayActions, setTodayActions] = useState(0);
  const [pendingApprovalCount, setPendingApprovalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [dateRange, setDateRange] = useState("30");
  const [snapshotSpark, setSnapshotSpark] = useState<{ reach: number[] }>({ reach: [] });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!isReady || (!businessId && !user?.id)) { setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      let resolvedBusinessId = businessId;
      const bizQuery = businessId
        ? externalSupabase.from("businesses").select("*").eq("id", businessId).maybeSingle()
        : user?.id ? externalSupabase.from("businesses").select("*").eq("user_id", user.id).maybeSingle() : null;
      if (!bizQuery) { setLoading(false); return; }
      const { data: bizData } = await bizQuery;
      setBusinessData(bizData);
      resolvedBusinessId = bizData?.id ?? resolvedBusinessId;
      if (!resolvedBusinessId) { setLoading(false); return; }

      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

      const [statsRes, publishedRes, leadsRes, todayRes, pendingRes, rc, ri, rr, rw, snapRes] = await Promise.all([
        externalSupabase.from("daily_stats").select("recorded_at, total_reach").eq("business_id", resolvedBusinessId).order("recorded_at", { ascending: true }).limit(parseInt(dateRange)),
        externalSupabase.from("generated_content").select("id", { count: "exact", head: true }).eq("business_id", resolvedBusinessId).eq("status", "published"),
        externalSupabase.from("contacts").select("id", { count: "exact", head: true }).eq("business_id", resolvedBusinessId),
        externalSupabase.from("generated_content").select("id", { count: "exact", head: true }).eq("business_id", resolvedBusinessId).gte("created_at", todayStart.toISOString()),
        externalSupabase.from("generated_content").select("id", { count: "exact", head: true }).eq("business_id", resolvedBusinessId).eq("status", "pending_approval"),
        externalSupabase.from("generated_content").select("created_at, content_theme, platform").eq("business_id", resolvedBusinessId).order("created_at", { ascending: false }).limit(5),
        externalSupabase.from("competitor_insights").select("recorded_at").eq("business_id", resolvedBusinessId).order("recorded_at", { ascending: false }).limit(3),
        externalSupabase.from("retention_logs").select("email_type, sent_at").eq("business_id", resolvedBusinessId).order("sent_at", { ascending: false }).limit(3),
        externalSupabase.from("win_notifications").select("win_type, notified_at, message").eq("business_id", resolvedBusinessId).order("notified_at", { ascending: false }).limit(3),
        externalSupabase.from("analytics_snapshots").select("snapshot_date, total_reach").eq("business_id", resolvedBusinessId).order("snapshot_date", { ascending: true }).limit(7),
      ]);
      setStats((statsRes.data as DailyStat[]) ?? []);
      setPublishedCount(publishedRes.count ?? 0);
      setLeadCount(leadsRes.count ?? 0);
      setTodayActions(todayRes.count ?? 0);
      setPendingApprovalCount(pendingRes.count ?? 0);
      setSnapshotSpark({ reach: ((snapRes.data || []) as SnapshotItem[]).map((s) => s.total_reach || 0) });

      const feedItems: FeedItem[] = [];
      ((rc.data ?? []) as GeneratedContentRow[]).forEach((c) => feedItems.push({ type: "content", emoji: "✍️", message: `${c.platform || "Post"} generated`, time: c.created_at }));
      ((ri.data ?? []) as CompetitorInsightRow[]).forEach((r) => feedItems.push({ type: "competitor", emoji: "🎯", message: "Competitor analysis completed", time: r.recorded_at }));
      ((rr.data ?? []) as RetentionLogRow[]).forEach((r) => feedItems.push({ type: "email", emoji: "📧", message: `${r.email_type || "Email"} sent`, time: r.sent_at }));
      ((rw.data ?? []) as WinNotificationRow[]).forEach((w) => feedItems.push({ type: "win", emoji: "🏆", message: w.message?.slice(0, 50) || w.win_type || "Milestone!", time: w.notified_at }));
      feedItems.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setFeed(feedItems.slice(0, 10));
    } catch { setError("Something went wrong — we're looking into it"); }
    finally { setLoading(false); }
  }, [businessId, user?.id, isReady, dateRange]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Live activity feed
  useEffect(() => {
    if (!businessId || !isReady) return;
    const channel = externalSupabase.channel(`live-activity-${businessId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "generated_content", filter: `business_id=eq.${businessId}` },
        (p: RealtimePayload) => setFeed(prev => [{ type: "content", emoji: "✍️", message: `${p.new?.platform || "Post"} generated`, time: new Date().toISOString() }, ...prev].slice(0, 20)))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "contacts", filter: `business_id=eq.${businessId}` },
        (p: RealtimePayload) => { setFeed(prev => [{ type: "lead", emoji: "👤", message: `New lead: ${capitalizeName(p.new?.first_name || "Unknown")}`, time: new Date().toISOString() }, ...prev].slice(0, 20)); setLeadCount(c => c + 1); })
      .subscribe();
    return () => { externalSupabase.removeChannel(channel); };
  }, [businessId, isReady]);

  const totalReach = stats.reduce((sum, s) => sum + (s.total_reach || 0), 0) || (businessData?.total_reach ?? 0);
  const reachSpark = snapshotSpark.reach.length >= 2 ? snapshotSpark.reach : stats.slice(-7).map(s => s.total_reach || 0);

  // AI Brain decisions
  let aiDecisions: AIDecision[] = [];
  if (businessData?.ai_brain_decisions) {
    try {
      const raw = typeof businessData.ai_brain_decisions === "string" ? JSON.parse(businessData.ai_brain_decisions) : businessData.ai_brain_decisions;
      if (Array.isArray(raw)) {
        aiDecisions = raw.map((entry, idx) => ({
          title: `Decision ${idx + 1}`,
          value: entry,
        }));
      } else if (typeof raw === "object" && raw !== null) {
        aiDecisions = Object.entries(raw).map(([k, v]) => ({ title: k, value: v }));
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      toast.error(ERROR_MESSAGES.LOAD_FAILED);
    }
  }

  /* ── FIX 6: Setup checklist with real data ── */
  const totalContentCount = publishedCount + pendingApprovalCount;
  const setupSteps = [
    { label: "Connect Facebook & Instagram", done: !!(businessData?.facebook_page_id && businessData?.instagram_account_id), tab: "social" },
    { label: "Connect LinkedIn", done: !!businessData?.linkedin_connected, tab: "social" },
    { label: "Add competitors", done: (() => { try { const c = typeof businessData?.competitors === "string" ? JSON.parse(businessData.competitors) : businessData?.competitors; return Array.isArray(c) ? c.length > 0 : !!businessData?.competitors; } catch { return !!businessData?.competitors; } })(), tab: "settings" },
    { label: "Review first AI content", done: pendingApprovalCount === 0 && totalContentCount > 0, tab: "content" },
    { label: "Set up review requests", done: false, tab: "reviews" }, // would need review_requests count
    { label: "Configure email sequences", done: false, tab: "email" }, // would need email_sequences count
    { label: "Turn on Autopilot", done: !!businessData?.autopilot_enabled, tab: "settings" },
  ];
  const setupDone = setupSteps.filter(s => s.done).length;
  const setupPct = Math.round((setupDone / setupSteps.length) * 100);
  const setupComplete = localStorage.getItem("maroa-setup-complete") === "true";

  const handleQuickAction = async (action: typeof quickActions[0]): Promise<void> => {
    if (!businessId) return;
    setActionLoading(action.name);
    try {
      toast(`🤖 AI is working on "${action.name}"...`);
      await apiPost(action.endpoint, { business_id: businessId, email: user?.email });
      setActionSuccess(action.name);
      toast.success(action.successMsg);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch {
      toast.error(ERROR_MESSAGES.CONNECTION_ERROR);
    } finally { setActionLoading(null); }
  };

  const navTo = (tab: string) => window.dispatchEvent(new CustomEvent("dashboard-navigate", { detail: tab }));

  const chartData = stats.map(s => ({
    date: new Date(s.recorded_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    reach: s.total_reach || 0,
  }));

  const firstName = getFirstName(user, businessData);

  /* ── Loading state (FIX 10.4) ── */
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-14 rounded-lg skeleton" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 rounded-lg skeleton" />)}
        </div>
        <div className="h-48 rounded-lg skeleton" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={fetchData}>Try again</Button>
      </div>
    );
  }

  /* ── FIX 10.3: Empty metric subtexts ── */
  const metricCards = [
    { label: "Total Reach", sub: totalReach > 0 ? "people reached" : "Increases as AI publishes content", value: totalReach, icon: Eye, color: "text-primary bg-primary/10", spark: reachSpark },
    { label: "Posts Published", sub: publishedCount > 0 ? "posts this month" : "First post generating soon", value: publishedCount, icon: Send, color: "text-success bg-success/10", spark: [] as number[] },
    { label: "Active Leads", sub: leadCount > 0 ? "leads in pipeline" : "Leads appear as campaigns run", value: leadCount, icon: Users, color: "text-orange-500 bg-orange-500/10", spark: [] as number[] },
    { label: "AI Actions Today", sub: todayActions > 0 ? "actions today" : "AI will take actions today", value: todayActions, icon: Zap, color: "text-purple-500 bg-purple-500/10", spark: [] as number[] },
  ];

  return (
    <div className="space-y-5 page-enter">
      {/* ── Greeting ── */}
      <div>
        <h2 className="text-xl font-bold text-foreground animate-fade-in">{getGreeting()}{firstName ? `, ${firstName}` : ""}</h2>
        <p className="text-sm text-success mt-0.5 animate-fade-in" style={{ animationDelay: "200ms" }}>✓ Your AI is handling everything — sit back and watch it work</p>
      </div>

      {/* ── Metric cards (FIX 10) ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((m, i) => (
          <div key={m.label} className={`rounded-xl border border-border bg-card p-4 card-hover card-stagger-${i + 1}`}>
            <div className="flex items-center justify-between mb-2">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${m.color}`}>
                <m.icon className="h-4 w-4" />
              </div>
              {m.spark.length >= 2 && <Sparkline data={m.spark} />}
            </div>
            <p className="text-2xl font-bold text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}><AnimatedCounter target={m.value} /></p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Profile completeness ── */}
      <ProfileScore businessId={businessId} userId={user?.id} />

      {/* ── Pending approvals ── */}
      <PendingApprovals onNavigate={navTo} />

      {/* ── AI Brain (FIX 3) ── */}
      <AIBrainStatus businessId={businessId} aiDecisions={aiDecisions} />

      {/* ── Quick Actions (FIX 4) ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Quick Actions</h3>
            <p className="text-[11px] text-muted-foreground">Trigger your AI manually</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map(a => (
            <div key={a.name} className="rounded-xl border border-border bg-card p-4 quick-action-card">
              <div className="flex items-center gap-3 mb-2">
                <span className={`action-icon flex h-10 w-10 items-center justify-center rounded-lg text-lg ${a.color}`}>{a.icon}</span>
                <div>
                  <p className="text-[13px] font-semibold text-foreground">{a.name}</p>
                  <p className="text-[11px] text-muted-foreground">{a.desc}</p>
                </div>
              </div>
              <Button
                variant="outline" size="sm" className="w-full h-8 text-xs mt-1"
                disabled={!!actionLoading}
                onClick={() => handleQuickAction(a)}
              >
                {actionLoading === a.name ? <><Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> {a.loadingText}</>
                  : actionSuccess === a.name ? <><CheckCircle2 className="mr-1.5 h-3 w-3 text-success" /> Done!</>
                  : a.btnLabel}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Performance chart (FIX 5) ── */}
      <div className="rounded-lg border border-border bg-card p-5 shadow-meta">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Performance</h3>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={45} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
              <Line type="monotone" dataKey="reach" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BarChart2 className="h-10 w-10 text-muted-foreground/20" />
            <p className="mt-4 text-sm font-medium text-foreground">Performance tracking starts today</p>
            <p className="mt-1 text-xs text-muted-foreground max-w-xs">Your metrics appear after the first week</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {["📊 Daily reach", "💬 Engagement", "👥 New leads", "📧 Email opens"].map(t => (
                <span key={t} className="rounded-full bg-muted px-3 py-1 text-[11px] text-muted-foreground">{t}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Activity + Schedule ── */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* FIX 2: Activity feed with formatted text */}
        <div className="lg:col-span-3 rounded-lg border border-border bg-card shadow-meta">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
            <span className="live-dot" />
            <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
          </div>
          {feed.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-xs text-muted-foreground">No activity yet — actions appear here as your AI works.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {feed.map((f, i) => {
                const borderColor = f.type === "content" ? "border-l-primary" : f.type === "lead" ? "border-l-success" : f.type === "competitor" ? "border-l-purple-500" : f.type === "seo" ? "border-l-orange-500" : f.type === "email" ? "border-l-teal-500" : f.type === "error" ? "border-l-destructive" : "border-l-transparent";
                return (
                  <div key={i} className={`flex items-center gap-3 px-5 py-2.5 hover:bg-muted/20 transition-colors border-l-2 ${borderColor}`}>
                    <span className="text-sm shrink-0">{f.emoji}</span>
                    <span className="text-[13px] text-foreground truncate flex-1">{formatActivityText(f.message)}</span>
                    <span className="text-[11px] text-muted-foreground shrink-0 whitespace-nowrap">{formatTimeAgo(f.time)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* FIX 8: Scheduled tasks */}
        <div className="lg:col-span-2 rounded-lg border border-border bg-card p-4 shadow-meta">
          <div className="flex items-center gap-2 mb-3">
            <CalendarClock className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Next Scheduled Tasks</h3>
          </div>
          <div className="space-y-2">
            {scheduledTasks.map(t => (
              <div key={t.name} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{t.icon}</span>
                  <span className="text-xs text-foreground">{t.name}</span>
                </div>
                <span className="text-[11px] font-medium text-primary">{t.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Setup checklist (FIX 6) ── */}
      {setupPct < 100 && !setupComplete && (
        <div className="rounded-lg border border-border bg-card p-5 shadow-meta">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Complete your setup</h3>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">{setupDone}/{setupSteps.length}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-border overflow-hidden mb-4">
            <div className="h-full rounded-full progress-shimmer transition-all duration-700" style={{ width: `${setupPct}%` }} />
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {setupSteps.map(s => (
              <button
                key={s.label}
                onClick={() => !s.done && navTo(s.tab)}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-left transition-colors ${!s.done ? "hover:bg-muted/50 cursor-pointer" : ""}`}
              >
                {s.done ? <CheckCircle2 className="h-4 w-4 text-success shrink-0" /> : <Circle className="h-4 w-4 text-muted-foreground/30 shrink-0" />}
                <span className={`text-xs ${s.done ? "text-muted-foreground line-through" : "text-foreground"}`}>{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
