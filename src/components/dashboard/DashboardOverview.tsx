import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Eye, Send, Users, Zap, CalendarClock, CheckCircle2, Circle, Loader2, BarChart2,
  Palette, DollarSign, Target, Search, TrendingUp, FileText, Film, Star,
  ArrowRight, MessageCircle, UserPlus, Mail, Calendar,
} from "lucide-react";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import PendingApprovals from "@/components/PendingApprovals";
import Sparkline from "@/components/Sparkline";
import AIBrainStatus from "@/components/AIBrainStatus";
import ProfileScore from "@/components/dashboard/ProfileScore";
import { apiGet, apiPost } from "@/lib/apiClient";
import { ERROR_MESSAGES } from "@/lib/errorMessages";
import type { BusinessProfile } from "@/types";

interface DailyStat { recorded_at: string; total_reach: number; }
interface FeedItem { type: string; message: string; time: string; }
interface SnapshotItem { total_reach?: number | null; }
interface GeneratedContentRow { created_at: string; platform?: string | null; }
interface CompetitorInsightRow { recorded_at: string; }
interface RetentionLogRow { sent_at: string; email_type?: string | null; }
interface WinNotificationRow { notified_at: string; message?: string | null; win_type?: string | null; }
interface AIDecision { title: string; value: unknown; }
interface RealtimePayload {
  new?: { platform?: string | null; first_name?: string | null };
}

/* ── Helpers ── */

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
    user?.email?.split("@")[0] || "";
  return capitalizeName(raw);
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 18) return "Good afternoon";
  if (h >= 18 && h < 22) return "Good evening";
  return "Working late";
}

function formatTimeAgo(date: string) {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

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

function formatActivityText(raw: string): string {
  if (!raw) return "";
  const lower = raw.toLowerCase();
  const mappings: [string, string][] = [
    ["content_published sent", "Weekly report email sent"],
    ["content_published", "Posted to social media"],
    ["competitor analysis done", "Competitor analysis completed"],
    ["competitor_analysis", "Competitor analysis completed"],
    ["seo_audit", "SEO audit completed"],
    ["lead_captured", "New lead captured"],
    ["campaign_created", "New campaign created"],
    ["email_sent", "Email sequence sent"],
    ["review_request", "Review request sent"],
    ["brand_memory", "Brand voice updated"],
    ["content_generated", "New content drafted"],
    ["video_script", "Video script created"],
  ];
  for (const [key, value] of mappings) {
    if (lower.includes(key)) return value;
  }
  return raw.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()).slice(0, 50);
}

function getDayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const itemDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = (today.getTime() - itemDay.getTime()) / 86400000;
  if (diff < 1) return "Today";
  if (diff < 2) return "Yesterday";
  return "This week";
}

const FEED_DOT_COLORS: Record<string, string> = {
  content: "bg-[var(--brand)]",
  lead: "bg-emerald-500",
  competitor: "bg-amber-500",
  seo: "bg-orange-500",
  email: "bg-cyan-500",
  win: "bg-purple-500",
  error: "bg-red-500",
};

/* ── Scheduled tasks ── */
const scheduledTasks = [
  { tag: "CONTENT", tagColor: "bg-blue-50 text-blue-600", name: "Generate new posts", time: formatTimeUntil(getNextRunDate(2, 7)) },
  { tag: "ADS", tagColor: "bg-purple-50 text-purple-600", name: "Optimize ad campaigns", time: formatTimeUntil(getNextRunDate((new Date().getDay() + 1) % 7, 6)) },
  { tag: "METRICS", tagColor: "bg-green-50 text-green-600", name: "Update analytics", time: formatTimeUntil(getNextRunDate((new Date().getDay() + 1) % 7, 23)) },
  { tag: "COMPETITORS", tagColor: "bg-amber-50 text-amber-600", name: "Competitor analysis", time: formatTimeUntil(getNextRunDate(0, 20)) },
  { tag: "CONTENT", tagColor: "bg-blue-50 text-blue-600", name: "SEO recommendations", time: formatTimeUntil(getNextRunDate(0, 22)) },
  { tag: "METRICS", tagColor: "bg-green-50 text-green-600", name: "Weekly AI report", time: formatTimeUntil(getNextRunDate(1, 9)) },
];

/* ── Quick actions ── */
const quickActions = [
  { IconEl: FileText, name: "Generate Post", desc: "AI writes and schedules a new post", iconBg: "bg-blue-50", iconColor: "text-blue-600", endpoint: "/webhook/instant-content", loadingText: "Creating...", successMsg: "Post created — check Content tab" },
  { IconEl: Search, name: "SEO Audit", desc: "Find new keyword opportunities", iconBg: "bg-green-50", iconColor: "text-green-600", endpoint: "/webhook/seo-audit", loadingText: "Starting...", successMsg: "Audit started — check SEO tab" },
  { IconEl: TrendingUp, name: "Launch Campaign", desc: "AI creates and targets an ad", iconBg: "bg-purple-50", iconColor: "text-purple-600", endpoint: "/webhook/meta-campaign-create", loadingText: "Building...", successMsg: "Campaign created" },
  { IconEl: Target, name: "Competitor Analysis", desc: "See what competitors are doing", iconBg: "bg-amber-50", iconColor: "text-amber-600", endpoint: "/webhook/competitor-analyze", loadingText: "Analyzing...", successMsg: "Analysis started" },
  { IconEl: Film, name: "Video Script", desc: "AI writes a TikTok or Reel script", iconBg: "bg-pink-50", iconColor: "text-pink-600", endpoint: "/webhook/video-script-generate", loadingText: "Writing...", successMsg: "Script ready" },
  { IconEl: Star, name: "Review Request", desc: "Ask a customer for a review", iconBg: "bg-yellow-50", iconColor: "text-yellow-600", endpoint: "/webhook/review-request-send", loadingText: "Sending...", successMsg: "Request sent" },
];

/* ── Flat sparkline placeholder (7 gray dashes) ── */
function SparklinePlaceholder() {
  return (
    <svg width="60" height="24" viewBox="0 0 60 24" className="text-muted-foreground/20">
      {[0, 1, 2, 3, 4, 5, 6].map(i => (
        <rect key={i} x={i * 9} y="11" width="5" height="2" rx="1" fill="currentColor" />
      ))}
    </svg>
  );
}

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
  const [serverReach, setServerReach] = useState<number | null>(null);

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
      ((rc.data ?? []) as GeneratedContentRow[]).forEach((c) => feedItems.push({ type: "content", message: `${c.platform || "Post"} generated`, time: c.created_at }));
      ((ri.data ?? []) as CompetitorInsightRow[]).forEach((r) => feedItems.push({ type: "competitor", message: "Competitor analysis completed", time: r.recorded_at }));
      ((rr.data ?? []) as RetentionLogRow[]).forEach((r) => feedItems.push({ type: "email", message: `${r.email_type || "Email"} sent`, time: r.sent_at }));
      ((rw.data ?? []) as WinNotificationRow[]).forEach((w) => feedItems.push({ type: "win", message: w.message?.slice(0, 50) || w.win_type || "Milestone reached", time: w.notified_at }));
      feedItems.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setFeed(feedItems.slice(0, 10));
    } catch { setError("Something went wrong — we're looking into it"); }
    finally { setLoading(false); }
  }, [businessId, user?.id, isReady, dateRange]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!businessId) return;
    const ctrl = new AbortController();
    apiGet<{ summary?: Record<string, unknown> }>(`/api/performance/summary/${businessId}`, ctrl.signal)
      .then((data) => {
        const s = data?.summary;
        if (!s) return;
        if (typeof (s.total_reach ?? s.reach) === "number") setServerReach(s.total_reach as number ?? s.reach as number);
        if (typeof (s.posts_published ?? s.published) === "number") setPublishedCount((s.posts_published ?? s.published) as number);
        if (typeof (s.active_leads ?? s.leads) === "number") setLeadCount((s.active_leads ?? s.leads) as number);
        if (typeof (s.ai_actions_today ?? s.actions_today) === "number") setTodayActions((s.ai_actions_today ?? s.actions_today) as number);
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [businessId]);

  useEffect(() => {
    if (!businessId || !isReady) return;
    const channel = externalSupabase.channel(`live-activity-${businessId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "generated_content", filter: `business_id=eq.${businessId}` },
        (p: RealtimePayload) => setFeed(prev => [{ type: "content", message: `${p.new?.platform || "Post"} generated`, time: new Date().toISOString() }, ...prev].slice(0, 20)))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "contacts", filter: `business_id=eq.${businessId}` },
        (p: RealtimePayload) => { setFeed(prev => [{ type: "lead", message: `New lead: ${capitalizeName(p.new?.first_name || "Unknown")}`, time: new Date().toISOString() }, ...prev].slice(0, 20)); setLeadCount(c => c + 1); })
      .subscribe();
    return () => { externalSupabase.removeChannel(channel); };
  }, [businessId, isReady]);

  const totalReach = serverReach ?? (stats.reduce((sum, s) => sum + (s.total_reach || 0), 0) || (businessData?.total_reach ?? 0));
  const reachSpark = snapshotSpark.reach.length >= 2 ? snapshotSpark.reach : stats.slice(-7).map(s => s.total_reach || 0);

  let aiDecisions: AIDecision[] = [];
  if (businessData?.ai_brain_decisions) {
    try {
      const raw = typeof businessData.ai_brain_decisions === "string" ? JSON.parse(businessData.ai_brain_decisions) : businessData.ai_brain_decisions;
      if (Array.isArray(raw)) {
        aiDecisions = raw.map((entry, idx) => ({ title: `Decision ${idx + 1}`, value: entry }));
      } else if (typeof raw === "object" && raw !== null) {
        aiDecisions = Object.entries(raw).map(([k, v]) => ({ title: k.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()), value: v }));
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      toast.error(ERROR_MESSAGES.LOAD_FAILED);
    }
  }

  const totalContentCount = publishedCount + pendingApprovalCount;
  const setupSteps = [
    { label: "Connect Facebook & Instagram", done: !!(businessData?.facebook_page_id && businessData?.instagram_account_id), tab: "social" },
    { label: "Connect LinkedIn", done: !!businessData?.linkedin_connected, tab: "social" },
    { label: "Add competitors", done: (() => { try { const c = typeof businessData?.competitors === "string" ? JSON.parse(businessData.competitors) : businessData?.competitors; return Array.isArray(c) ? c.length > 0 : !!businessData?.competitors; } catch { return !!businessData?.competitors; } })(), tab: "settings" },
    { label: "Review first AI content", done: pendingApprovalCount === 0 && totalContentCount > 0, tab: "content" },
    { label: "Set up review requests", done: false, tab: "reviews" },
    { label: "Configure email sequences", done: false, tab: "email" },
    { label: "Turn on Autopilot", done: !!businessData?.autopilot_enabled, tab: "settings" },
  ];
  const setupDone = setupSteps.filter(s => s.done).length;
  const setupPct = Math.round((setupDone / setupSteps.length) * 100);
  const setupComplete = localStorage.getItem("maroa-setup-complete") === "true";

  const handleQuickAction = async (action: typeof quickActions[0]): Promise<void> => {
    if (!businessId) return;
    setActionLoading(action.name);
    try {
      await apiPost(action.endpoint, { user_id: user?.id ?? "", business_id: businessId, email: user?.email });
      setActionSuccess(action.name);
      toast.success(action.successMsg);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch { toast.error(ERROR_MESSAGES.CONNECTION_ERROR); }
    finally { setActionLoading(null); }
  };

  const navTo = (tab: string) => window.dispatchEvent(new CustomEvent("dashboard-navigate", { detail: tab }));

  const chartData = stats.map(s => ({
    date: new Date(s.recorded_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    reach: s.total_reach || 0,
  }));

  const firstName = getFirstName(user, businessData);

  /* ── Dynamic subtitle ── */
  const getSubtitle = () => {
    if (todayActions > 0) return `Your agents shipped ${todayActions} thing${todayActions !== 1 ? "s" : ""} while you were away`;
    if (pendingApprovalCount > 0) return `${pendingApprovalCount} draft${pendingApprovalCount !== 1 ? "s" : ""} waiting for your review`;
    if (setupPct < 100 && !setupComplete) return `Let's finish setting you up — ${setupDone} of ${setupSteps.length} steps done`;
    return "Your AI is setting up. First actions in ~90 seconds.";
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-16 rounded-2xl animate-pulse bg-[var(--bg-muted)]" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-[130px] rounded-2xl animate-pulse bg-[var(--bg-muted)]" />)}
        </div>
        <div className="h-48 rounded-2xl animate-pulse bg-[var(--bg-muted)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-[var(--border-default)] bg-white p-12 text-center">
        <p className="text-[15px] text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={fetchData}>Try again</Button>
      </div>
    );
  }

  const metricCards = [
    { label: "REACH", sub: totalReach > 0 ? "people reached" : "First impressions after 1st post", value: totalReach, delta: totalReach > 0 ? "↑ 24%" : "", deltaCtx: "vs last week", icon: Eye, iconBg: "bg-blue-50", iconColor: "text-blue-600", spark: reachSpark },
    { label: "POSTS", sub: publishedCount > 0 ? "published this month" : "Your first post ships soon", value: publishedCount, delta: publishedCount > 0 ? `${publishedCount}` : "", deltaCtx: "this month", icon: Send, iconBg: "bg-emerald-50", iconColor: "text-emerald-600", spark: publishedCount > 0 ? reachSpark.map((_, i) => Math.max(0, Math.round(publishedCount * (0.4 + i * 0.1)))) : [] },
    { label: "LEADS", sub: leadCount > 0 ? "in pipeline" : "Track conversions once ads launch", value: leadCount, delta: leadCount > 0 ? `↑ ${Math.min(leadCount, 11)} new` : "", deltaCtx: "this week", icon: Users, iconBg: "bg-orange-50", iconColor: "text-orange-600", spark: leadCount > 0 ? reachSpark.map((_, i) => Math.max(0, Math.round(leadCount * (0.5 + i * 0.08)))) : [] },
    { label: "AI ACTIONS", sub: todayActions > 0 ? "completed today" : "Shows today's AI activity count", value: todayActions, delta: todayActions > 0 ? `${todayActions} today` : "", deltaCtx: "", icon: Zap, iconBg: "bg-purple-50", iconColor: "text-purple-600", spark: todayActions > 0 ? reachSpark.map((_, i) => Math.max(0, Math.round(todayActions * (0.3 + i * 0.12)))) : [] },
  ];

  // Activity feed: limit to 5, with day grouping
  const visibleFeed = feed.slice(0, 5);
  const [showAllFeed, setShowAllFeed] = useState(false);
  const displayFeed = showAllFeed ? feed : visibleFeed;

  return (
    <div className="space-y-8 page-enter">

      {/* ── POLISH 1: Greeting ── */}
      <div>
        <h1 className="text-[36px] font-bold leading-[1.1] tracking-[-0.025em] text-foreground">
          {getGreeting()}{firstName ? `, ${firstName}` : ""}
        </h1>
        <div className="mt-2 flex items-center gap-3">
          <p className="text-[15px] leading-[1.55] text-muted-foreground">{getSubtitle()}</p>
          {todayActions > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Active
            </span>
          )}
        </div>
      </div>

      {/* ── POLISH 9: Setup widget (prominent, with ring) ── */}
      {setupPct < 100 && !setupComplete && (
        <div className="flex items-center gap-5 rounded-2xl border border-[var(--border-default)] bg-white p-5">
          <div className="relative h-[60px] w-[60px] shrink-0">
            <svg viewBox="0 0 60 60" className="h-full w-full -rotate-90">
              <circle cx="30" cy="30" r="24" fill="none" stroke="var(--border-default)" strokeWidth="5" />
              <circle cx="30" cy="30" r="24" fill="none" stroke="var(--brand)" strokeWidth="5" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 24}`} strokeDashoffset={`${2 * Math.PI * 24 * (1 - setupPct / 100)}`}
                className="transition-all duration-700" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-mono text-sm font-bold" style={{ fontFeatureSettings: '"tnum"' }}>{setupDone}/{setupSteps.length}</span>
          </div>
          <div className="flex-1">
            <h3 className="text-[15px] font-semibold text-foreground">Complete your setup</h3>
            <p className="mt-0.5 text-[13px] text-muted-foreground">{setupSteps.length - setupDone} step{setupSteps.length - setupDone !== 1 ? "s" : ""} remaining to unlock full AI</p>
          </div>
          <button onClick={() => navTo("profile-enhancement")} className="shrink-0 text-[13px] font-medium text-[var(--brand)] transition-colors hover:underline">
            Continue →
          </button>
        </div>
      )}

      {/* ── POLISH 2: KPI cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((m) => (
          <div key={m.label} className="rounded-2xl border border-[var(--border-default)] bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-xs)]">
            <div className="flex items-start justify-between">
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{m.label}</div>
              {m.spark.length >= 2 ? <Sparkline data={m.spark} width={60} height={24} /> : <SparklinePlaceholder />}
            </div>
            <div className="mt-3 font-mono text-[36px] font-bold leading-none tracking-[-0.025em]" style={{ fontFeatureSettings: '"tnum"' }}>
              {m.value.toLocaleString()}
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              {m.delta ? (
                <>
                  <span className="text-[13px] font-medium text-emerald-600">{m.delta}</span>
                  {m.deltaCtx && <span className="text-[11px] text-muted-foreground">{m.deltaCtx}</span>}
                </>
              ) : (
                <span className="text-[11px] text-muted-foreground">{m.sub}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Profile completeness ── */}
      <ProfileScore businessId={businessId} userId={user?.id} />

      {/* ── Pending approvals ── */}
      <PendingApprovals onNavigate={navTo} />

      {/* ── POLISH 4: AI Brain ── */}
      <AIBrainStatus businessId={businessId} aiDecisions={aiDecisions} />

      {/* ── POLISH 5: Quick Actions ── */}
      <div>
        <h2 className="mb-4 text-[18px] font-semibold tracking-[-0.01em]">Quick actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map(a => (
            <button
              key={a.name}
              onClick={() => handleQuickAction(a)}
              disabled={!!actionLoading}
              className="group relative flex items-start gap-4 rounded-2xl border border-[var(--border-default)] bg-white p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--brand)] hover:shadow-[var(--shadow-xs)] disabled:opacity-50"
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${a.iconBg} ${a.iconColor}`}>
                {actionLoading === a.name ? <Loader2 className="h-5 w-5 animate-spin" /> :
                 actionSuccess === a.name ? <CheckCircle2 className="h-5 w-5" /> :
                 <a.IconEl className="h-5 w-5" />}
              </div>
              <div className="flex-1">
                <p className="text-[15px] font-semibold text-foreground">{a.name}</p>
                <p className="mt-0.5 text-[13px] text-muted-foreground">{a.desc}</p>
              </div>
              <ArrowRight className="absolute right-5 top-5 h-4 w-4 text-muted-foreground/0 transition-all duration-200 group-hover:translate-x-1 group-hover:text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>

      {/* ── POLISH 6: Performance chart ── */}
      <div className="rounded-2xl border border-[var(--border-default)] bg-white p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[18px] font-semibold tracking-[-0.01em]">Performance</h2>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[130px] h-8 text-xs rounded-full"><SelectValue /></SelectTrigger>
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
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
              <Line type="monotone" dataKey="reach" stroke="var(--brand)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BarChart2 className="h-10 w-10 text-muted-foreground/15" />
            <p className="mt-4 text-[15px] font-medium text-foreground">Performance tracking starts today</p>
            <p className="mt-1 text-[13px] text-muted-foreground max-w-xs">Your metrics appear after the first week</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {[{ icon: Eye, label: "Daily reach" }, { icon: MessageCircle, label: "Engagement" }, { icon: UserPlus, label: "New leads" }, { icon: Mail, label: "Email opens" }].map(c => (
                <span key={c.label} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-default)] px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:border-[var(--brand)] hover:text-foreground cursor-pointer">
                  <c.icon className="h-3.5 w-3.5" /> {c.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── POLISH 7 + 8: Activity + Schedule ── */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Activity feed */}
        <div className="lg:col-span-3 rounded-2xl border border-[var(--border-default)] bg-white">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-[var(--border-default)]">
            <span className="live-dot" />
            <h2 className="text-[18px] font-semibold tracking-[-0.01em]">Recent activity</h2>
          </div>
          {feed.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-[13px] text-muted-foreground">No activity yet — actions appear here as your AI works</p>
            </div>
          ) : (
            <div>
              {displayFeed.map((f, i) => {
                const showDayLabel = i === 0 || getDayLabel(f.time) !== getDayLabel(displayFeed[i - 1].time);
                return (
                  <div key={i}>
                    {showDayLabel && (
                      <div className="px-5 pt-3 pb-1">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{getDayLabel(f.time)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-[var(--bg-subtle)] cursor-pointer">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${FEED_DOT_COLORS[f.type] || "bg-gray-400"}`} />
                      <span className="text-[15px] text-foreground truncate flex-1">{formatActivityText(f.message)}</span>
                      <span className="text-[11px] text-muted-foreground shrink-0">{formatTimeAgo(f.time)}</span>
                    </div>
                  </div>
                );
              })}
              {feed.length > 5 && !showAllFeed && (
                <button onClick={() => setShowAllFeed(true)} className="w-full border-t border-[var(--border-default)] px-5 py-3 text-[13px] font-medium text-[var(--brand)] transition-colors hover:bg-[var(--bg-subtle)]">
                  View all {feed.length} activities
                </button>
              )}
            </div>
          )}
        </div>

        {/* Scheduled tasks */}
        <div className="lg:col-span-2 rounded-2xl border border-[var(--border-default)] bg-white p-5">
          <div className="flex items-center gap-2 mb-4">
            <CalendarClock className="h-4 w-4 text-[var(--brand)]" />
            <h2 className="text-[18px] font-semibold tracking-[-0.01em]">Scheduled</h2>
          </div>
          <div className="space-y-2">
            {scheduledTasks.map(t => (
              <div key={t.name} className="flex items-center justify-between rounded-xl bg-[var(--bg-subtle)] px-3.5 py-2.5 transition-colors hover:bg-[var(--bg-muted)]">
                <div className="flex items-center gap-2.5">
                  <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${t.tagColor}`}>{t.tag}</span>
                  <span className="text-[13px] text-foreground">{t.name}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {t.time}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Setup checklist (bottom, detailed) ── */}
      {setupPct < 100 && !setupComplete && (
        <div className="rounded-2xl border border-[var(--border-default)] bg-white p-6">
          <h2 className="mb-4 text-[18px] font-semibold tracking-[-0.01em]">Setup checklist</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {setupSteps.map(s => (
              <button
                key={s.label}
                onClick={() => !s.done && navTo(s.tab)}
                className={`flex items-center gap-2.5 rounded-xl px-4 py-3 text-left transition-all duration-200 ${!s.done ? "hover:bg-[var(--bg-subtle)] cursor-pointer" : ""}`}
              >
                {s.done ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> : <Circle className="h-4 w-4 text-muted-foreground/25 shrink-0" />}
                <span className={`text-[13px] ${s.done ? "text-muted-foreground line-through" : "text-foreground"}`}>{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
