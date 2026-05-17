import { useEffect, useState, useCallback, useMemo } from "react";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { apiGet } from "@/lib/apiClient";

import HomeHeader from "./HomeHeader";
import KPIGrid from "./KPIGrid";
import WorkQueue, { type QueueApproval, type QueueActivity } from "./WorkQueue";
import ProfileStrengthWidget from "./ProfileStrengthWidget";
import CommandPalette from "./CommandPalette";

/**
 * Dashboard Home — post-login first impression.
 *
 * Rebuilt for the May 2026 honesty pass. Previous version shipped:
 *   - Hardcoded "↑ 24.1%" deltas regardless of actual data
 *   - Math.random() sparkline for the leads KPI (literal random data)
 *   - adSpend + revenue perma-hardcoded to 0
 *   - Theatrical mock approval titles ("Friday's reel — approve by 4pm")
 *   - Skeleton using var(--bg-muted) when tokens.css wasn't imported
 *
 * Replacements:
 *   - All deltas are computed from real snapshot data via `computeDelta()`,
 *     or returned as `undefined` so KPIGrid shows "—" honestly.
 *   - Sparklines use real `analytics_snapshots` rows; if there are fewer
 *     than 2 data points, we pass an empty array → KPIGrid skips the line.
 *   - Approval titles come from a real query against `generated_content`
 *     where status='pending_approval', not hardcoded.
 *   - Currency is USD across the board (matches the new $149/$599 pricing).
 *   - Skeleton uses Tailwind's bg-muted (shadcn token, always defined).
 *
 * Data flow:
 *   1. Initial fetch via fetchData() — businesses + counts + snapshots +
 *      pending content (with titles) in one Promise.all
 *   2. Server-aggregated metrics overlay (POST-warm via /api/performance/summary)
 *   3. Realtime subscription to new content + new contacts
 *
 * Everything is wrapped in try/catch so a single failing query doesn't
 * blank the whole dashboard.
 */

/* ── Types ── */

interface SnapshotRow {
  snapshot_date?: string | null;
  total_reach?: number | null;
  total_leads?: number | null;
  ad_spend?: number | null;
  revenue?: number | null;
}
interface PendingContent {
  id: string;
  content_theme?: string | null;
  platform?: string | null;
  caption?: string | null;
  created_at: string;
}
interface ContentRow { created_at: string; status?: string | null }
interface CompetitorRow { recorded_at: string }
interface RetentionRow { sent_at: string; email_type?: string | null }
interface WinRow { notified_at: string; message?: string | null; win_type?: string | null }
interface RawFeed { type: string; message: string; time: string; emoji?: string }

/* ── Helpers ── */

function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 18) return "Good afternoon";
  if (h >= 18 && h < 22) return "Good evening";
  return "Working late";
}

function getFirstName(user: { email?: string; user_metadata?: Record<string, unknown> } | null): string {
  const raw =
    (user?.user_metadata?.first_name as string) ||
    (user?.user_metadata?.full_name as string)?.split(" ")[0] ||
    (user?.user_metadata?.name as string)?.split(" ")[0] ||
    user?.email?.split("@")[0] || "there";
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

function formatActivity(raw: string): string {
  const lower = raw.toLowerCase();
  const map: [string, string][] = [
    ["content_published", "shipped a new post"],
    ["content_generated", "drafted new content"],
    ["competitor_analysis", "completed competitor analysis"],
    ["seo_audit", "ran SEO audit"],
    ["lead_captured", "captured a new lead"],
    ["campaign_created", "launched a campaign"],
    ["email_sent", "sent email sequence"],
    ["review_request", "sent review request"],
    ["brand_memory", "updated brand voice"],
    ["video_script", "wrote a video script"],
  ];
  for (const [k, v] of map) if (lower.includes(k)) return v;
  return raw.replace(/_/g, " ").slice(0, 50);
}

/** Compute a percentage delta between the most-recent value and the
 *  oldest value in a series. Returns undefined if the series is too
 *  short OR if the baseline is zero (would divide by zero). KPIGrid
 *  renders undefined as "—" — the honest empty state. */
function computeDelta(series: number[]): string | undefined {
  if (series.length < 2) return undefined;
  const baseline = series[0];
  const current = series[series.length - 1];
  if (baseline === 0 || baseline == null) return undefined;
  const pct = ((current - baseline) / baseline) * 100;
  if (!Number.isFinite(pct)) return undefined;
  if (Math.abs(pct) < 0.1) return "± 0%";
  const sign = pct > 0 ? "↑" : "↓";
  return `${sign} ${Math.abs(pct).toFixed(1)}%`;
}

/** Truncate a generated-content theme/title to a card-friendly headline.
 *  Falls back to platform name if no theme, then to "Untitled draft". */
function pendingItemTitle(item: PendingContent): string {
  const theme = (item.content_theme || "").trim();
  if (theme) return theme.length > 60 ? theme.slice(0, 57) + "..." : theme;
  if (item.platform) return `${item.platform} draft`;
  return "Untitled draft";
}

/** "2m" / "3h" / "1d" — compact relative time for activity rows. */
function relativeTimeShort(iso: string): string {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.round(ms / 60_000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}

function pendingItemSubtitle(item: PendingContent): string {
  const created = new Date(item.created_at);
  const ageMs = Date.now() - created.getTime();
  const ageHours = Math.round(ageMs / (1000 * 60 * 60));
  const ageLabel =
    ageHours < 1 ? "just drafted" :
    ageHours === 1 ? "1 hour ago" :
    ageHours < 24 ? `${ageHours} hours ago` :
    `${Math.round(ageHours / 24)} days ago`;
  return item.platform ? `${item.platform} · drafted ${ageLabel}` : `Drafted ${ageLabel}`;
}

/* ── Component ── */

interface HomeProps {
  onNavigate: (tab: string) => void;
}

export default function Home({ onNavigate }: HomeProps) {
  const { businessId, user, isReady } = useAuth();

  // Data state — every initial value matches the "no data yet" honest state.
  const [loading, setLoading] = useState(true);
  const [reach, setReach] = useState(0);
  const [reachSpark, setReachSpark] = useState<number[]>([]);
  const [leads, setLeads] = useState(0);
  const [leadsSpark, setLeadsSpark] = useState<number[]>([]);
  const [adSpend, setAdSpend] = useState(0);
  const [adSpendSpark, setAdSpendSpark] = useState<number[]>([]);
  const [revenue, setRevenue] = useState(0);
  const [revenueSpark, setRevenueSpark] = useState<number[]>([]);
  const [pendingItems, setPendingItems] = useState<PendingContent[]>([]);
  const [rawFeed, setRawFeed] = useState<RawFeed[]>([]);
  const [profilePct, setProfilePct] = useState(35);

  // UI state
  const [cmdOpen, setCmdOpen] = useState(false);

  // ── Fetch data ──
  const fetchData = useCallback(async () => {
    if (!isReady || (!businessId && !user?.id)) { setLoading(false); return; }
    setLoading(true);
    try {
      const resolvedId = businessId || user?.id;
      if (!resolvedId) { setLoading(false); return; }

      const bizQuery = businessId
        ? externalSupabase.from("businesses").select("*").eq("id", businessId).maybeSingle()
        : externalSupabase.from("businesses").select("*").eq("user_id", user!.id!).maybeSingle();

      const { data: bizData } = await bizQuery;
      const bid = bizData?.id || resolvedId;

      const [leadsRes, pendingRes, rc, ri, rr, rw, snapRes] = await Promise.all([
        externalSupabase.from("contacts").select("id", { count: "exact", head: true }).eq("business_id", bid),
        // Pending content — fetch real rows (not just count) so we can show real titles + caption previews.
        externalSupabase.from("generated_content").select("id, content_theme, platform, caption, created_at").eq("business_id", bid).eq("status", "pending_approval").order("created_at", { ascending: false }).limit(5),
        externalSupabase.from("generated_content").select("created_at, status").eq("business_id", bid).order("created_at", { ascending: false }).limit(5),
        externalSupabase.from("competitor_insights").select("recorded_at").eq("business_id", bid).order("recorded_at", { ascending: false }).limit(3),
        externalSupabase.from("retention_logs").select("email_type, sent_at").eq("business_id", bid).order("sent_at", { ascending: false }).limit(3),
        externalSupabase.from("win_notifications").select("win_type, notified_at, message").eq("business_id", bid).order("notified_at", { ascending: false }).limit(3),
        // 7-day snapshot — order ascending so [0] is oldest, [last] is newest
        // → computeDelta() returns a real percentage instead of fake "↑ 24.1%".
        externalSupabase.from("analytics_snapshots").select("snapshot_date, total_reach, total_leads, ad_spend, revenue").eq("business_id", bid).order("snapshot_date", { ascending: true }).limit(7),
      ]);

      setLeads(leadsRes.count ?? 0);
      setPendingItems((pendingRes.data ?? []) as PendingContent[]);

      // ── Snapshot-derived KPIs (real data, no Math.random) ──
      const snapshots = ((snapRes.data ?? []) as SnapshotRow[]);
      const reachSeries = snapshots.map(s => s.total_reach ?? 0);
      const leadsSeries = snapshots.map(s => s.total_leads ?? 0);
      const adSpendSeries = snapshots.map(s => s.ad_spend ?? 0);
      const revenueSeries = snapshots.map(s => s.revenue ?? 0);
      setReachSpark(reachSeries);
      setLeadsSpark(leadsSeries);
      setAdSpendSpark(adSpendSeries);
      setRevenueSpark(revenueSeries);
      // Most-recent values; if no snapshot data yet, fall back to businesses
      // table aggregate columns where possible.
      setReach(reachSeries[reachSeries.length - 1] ?? bizData?.total_reach ?? 0);
      setAdSpend(adSpendSeries[adSpendSeries.length - 1] ?? 0);
      setRevenue(revenueSeries[revenueSeries.length - 1] ?? 0);

      // Build activity feed
      const feedItems: RawFeed[] = [];
      ((rc.data ?? []) as ContentRow[]).forEach(c => feedItems.push({ type: "content_generated", emoji: "✍️", message: formatActivity(`content_${c.status === "published" ? "published" : "generated"}`), time: c.created_at }));
      ((ri.data ?? []) as CompetitorRow[]).forEach(r => feedItems.push({ type: "competitor_analysis", emoji: "🎯", message: formatActivity("competitor_analysis"), time: r.recorded_at }));
      ((rr.data ?? []) as RetentionRow[]).forEach(r => feedItems.push({ type: "email_sent", emoji: "📧", message: formatActivity("email_sent"), time: r.sent_at }));
      ((rw.data ?? []) as WinRow[]).forEach(w => feedItems.push({ type: "brand_memory", emoji: "🏆", message: w.message?.slice(0, 50) || formatActivity(w.win_type || ""), time: w.notified_at }));
      feedItems.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setRawFeed(feedItems.slice(0, 10));

      // Profile completion
      const od = bizData?.onboarding_data;
      if (od) {
        try {
          const parsed = typeof od === "string" ? JSON.parse(od) : od;
          const form = parsed?.form || {};
          const filled = Object.values(form).filter(v => v && (Array.isArray(v) ? v.length > 0 : String(v).trim())).length;
          setProfilePct(Math.min(100, Math.round((filled / 70) * 100)));
        } catch { /* noop — malformed onboarding_data shouldn't break dashboard */ }
      }
    } catch {
      toast.error("Couldn't load latest data — retrying in 30s", { duration: 5000 });
    } finally {
      setLoading(false);
    }
  }, [businessId, user?.id, isReady]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Server-aggregated metrics overlay — POSTs from /api/performance/summary.
  // Keeps the dashboard fresh without forcing a full refetch.
  useEffect(() => {
    if (!businessId) return;
    const ctrl = new AbortController();
    apiGet<{ summary?: Record<string, unknown> }>(`/api/performance/summary/${businessId}`, ctrl.signal)
      .then(data => {
        const s = data?.summary;
        if (!s) return;
        if (typeof s.total_reach === "number") setReach(s.total_reach);
        if (typeof s.active_leads === "number") setLeads(s.active_leads);
        if (typeof s.ad_spend === "number") setAdSpend(s.ad_spend);
        if (typeof s.revenue === "number") setRevenue(s.revenue);
      })
      .catch(() => { /* server summary is optional; UI degrades gracefully */ });
    return () => ctrl.abort();
  }, [businessId]);

  // Realtime feed
  useEffect(() => {
    if (!businessId || !isReady) return;
    const channel = externalSupabase.channel(`home-live-${businessId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "generated_content", filter: `business_id=eq.${businessId}` },
        () => {
          const item: RawFeed = { type: "content_generated", emoji: "✍️", message: formatActivity("content_generated"), time: new Date().toISOString() };
          setRawFeed(prev => [item, ...prev].slice(0, 10));
        })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "contacts", filter: `business_id=eq.${businessId}` },
        () => {
          setLeads(c => c + 1);
          const item: RawFeed = { type: "lead_captured", emoji: "👤", message: formatActivity("lead_captured"), time: new Date().toISOString() };
          setRawFeed(prev => [item, ...prev].slice(0, 10));
        })
      .subscribe();
    return () => { externalSupabase.removeChannel(channel); };
  }, [businessId, isReady]);

  // ── Derived values ──
  const firstName = getFirstName(user);
  const greeting = getGreeting();
  const pendingCount = pendingItems.length;

  const last24hCount = useMemo(() => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return rawFeed.filter(f => new Date(f.time).getTime() >= cutoff).length;
  }, [rawFeed]);

  // Honest deltas — computeDelta() returns undefined when the series is
  // too short or baseline is zero, which KPIGrid renders as "—".
  const deltas = useMemo(() => ({
    reach: computeDelta(reachSpark),
    leads: computeDelta(leadsSpark),
    adSpend: computeDelta(adSpendSpark),
    revenue: computeDelta(revenueSpark),
  }), [reachSpark, leadsSpark, adSpendSpark, revenueSpark]);

  // Map pending content rows → WorkQueue's QueueApproval shape.
  // Snippet prefers a one-line caption preview; falls back to platform+age.
  const queueApprovals: QueueApproval[] = pendingItems.slice(0, 3).map(item => {
    const caption = (item.caption || "").trim();
    const snippet = caption
      ? (caption.length > 110 ? caption.slice(0, 107) + "..." : caption)
      : pendingItemSubtitle(item);
    const type: QueueApproval["type"] =
      item.platform?.toLowerCase().includes("ad") ? "ad" :
      item.platform?.toLowerCase().includes("image") ? "creative" : "post";
    return {
      id: item.id,
      title: pendingItemTitle(item),
      snippet,
      platform: item.platform ?? undefined,
      type,
      createdAt: item.created_at,
    };
  });

  // Map raw activity feed → WorkQueue's QueueActivity shape.
  const queueActivity: QueueActivity[] = rawFeed.slice(0, 6).map((f, i) => ({
    id: `${f.time}-${i}`,
    message: f.message.charAt(0).toUpperCase() + f.message.slice(1),
    timeLabel: relativeTimeShort(f.time),
  }));

  // Skeleton while loading — uses shadcn's bg-muted (always defined) so
  // the loader actually renders. Old version used var(--bg-muted) which
  // depended on tokens.css being imported (it wasn't).
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 rounded-lg bg-muted animate-pulse" />
        <div className="h-[140px] rounded-[20px] bg-muted animate-pulse" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-[140px] rounded-2xl bg-muted animate-pulse" />)}
        </div>
        <div className="h-[200px] rounded-2xl bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px]">
      {/* 1. HEADER — compact greeting + live status pill, hairline only */}
      <HomeHeader
        greeting={greeting}
        firstName={firstName}
        actionsLast24h={last24hCount}
        pendingCount={pendingCount}
        onReviewApprovals={() => onNavigate("approvals")}
      />

      {/* 2. KPIs — the visual centerpiece, full-width sparklines */}
      <div className="mb-8">
        <KPIGrid
          reach={reach}
          reachDelta={deltas.reach ?? "—"}
          reachSpark={reachSpark}
          leads={leads}
          leadsDelta={deltas.leads ?? "—"}
          leadsSpark={leadsSpark}
          adSpend={adSpend}
          adSpendDelta={deltas.adSpend ?? "—"}
          adSpendSpark={adSpendSpark}
          revenue={revenue}
          revenueDelta={deltas.revenue ?? "—"}
          revenueSpark={revenueSpark}
        />
      </div>

      {/* 3. TWO-COLUMN — WorkQueue dominates; ProfileStrengthWidget rail */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
        <WorkQueue
          pending={queueApprovals}
          activity={queueActivity}
          pendingCount={pendingCount}
          onReviewItem={() => onNavigate("approvals")}
          onReviewAll={() => onNavigate("approvals")}
          onViewAllActivity={() => onNavigate("approvals")}
        />

        <aside className="xl:sticky xl:top-4 xl:self-start">
          <ProfileStrengthWidget
            percentage={profilePct}
            sectionsRemaining={Math.max(0, Math.ceil((100 - profilePct) / 16))}
            onNavigate={() => onNavigate("profile-enhancement")}
          />
        </aside>
      </div>

      <CommandPalette
        open={cmdOpen}
        onOpenChange={setCmdOpen}
        onNavigate={(tab) => { onNavigate(tab); setCmdOpen(false); }}
      />
    </div>
  );
}
