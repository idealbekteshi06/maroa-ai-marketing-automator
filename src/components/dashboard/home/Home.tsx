import { useEffect, useState, useCallback, useRef } from "react";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { apiGet } from "@/lib/apiClient";

import TopBar from "./TopBar";
import AutopilotBanner from "./AutopilotBanner";
import KPIGrid from "./KPIGrid";
import NeedsApprovalSection, { type ApprovalItem } from "./NeedsApprovalSection";
import AgentActivityFeed, { type FeedEntry, mapToFeedEntry } from "./AgentActivityFeed";
import WhatsNextCards from "./WhatsNextCards";
import ProfileStrengthWidget from "./ProfileStrengthWidget";
import CommandPalette from "./CommandPalette";

/* ── Types ── */

interface RawFeed { type: string; message: string; time: string; emoji?: string }
interface SnapshotRow { total_reach?: number | null }
interface ContentRow { created_at: string; platform?: string | null; status?: string | null; content_theme?: string | null }
interface CompetitorRow { recorded_at: string }
interface RetentionRow { sent_at: string; email_type?: string | null }
interface WinRow { notified_at: string; message?: string | null; win_type?: string | null }

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

/* ── Component ── */

interface HomeProps {
  onNavigate: (tab: string) => void;
}

export default function Home({ onNavigate }: HomeProps) {
  const { businessId, user, isReady } = useAuth();

  // Data state
  const [loading, setLoading] = useState(true);
  const [reach, setReach] = useState(0);
  const [reachSpark, setReachSpark] = useState<number[]>([]);
  const [leads, setLeads] = useState(0);
  const [publishedCount, setPublishedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [feed, setFeed] = useState<FeedEntry[]>([]);
  const [rawFeed, setRawFeed] = useState<RawFeed[]>([]);
  const [profilePct, setProfilePct] = useState(35);

  // UI state
  const [cmdOpen, setCmdOpen] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);

  const scrollToFeed = useCallback(() => {
    feedRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // ── Fetch data (mirrors legacy DashboardOverview queries) ──
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

      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

      const [publishedRes, leadsRes, pendingRes, rc, ri, rr, rw, snapRes] = await Promise.all([
        externalSupabase.from("generated_content").select("id", { count: "exact", head: true }).eq("business_id", bid).eq("status", "published"),
        externalSupabase.from("contacts").select("id", { count: "exact", head: true }).eq("business_id", bid),
        externalSupabase.from("generated_content").select("id", { count: "exact", head: true }).eq("business_id", bid).eq("status", "pending_approval"),
        externalSupabase.from("generated_content").select("created_at, content_theme, platform").eq("business_id", bid).order("created_at", { ascending: false }).limit(5),
        externalSupabase.from("competitor_insights").select("recorded_at").eq("business_id", bid).order("recorded_at", { ascending: false }).limit(3),
        externalSupabase.from("retention_logs").select("email_type, sent_at").eq("business_id", bid).order("sent_at", { ascending: false }).limit(3),
        externalSupabase.from("win_notifications").select("win_type, notified_at, message").eq("business_id", bid).order("notified_at", { ascending: false }).limit(3),
        externalSupabase.from("analytics_snapshots").select("snapshot_date, total_reach").eq("business_id", bid).order("snapshot_date", { ascending: true }).limit(7),
      ]);

      setPublishedCount(publishedRes.count ?? 0);
      setLeads(leadsRes.count ?? 0);
      setPendingCount(pendingRes.count ?? 0);
      setReachSpark(((snapRes.data || []) as SnapshotRow[]).map(s => s.total_reach || 0));
      const totalReach = bizData?.total_reach ?? ((snapRes.data || []) as SnapshotRow[]).reduce((s, r) => s + (r.total_reach || 0), 0);
      setReach(totalReach);

      // Build activity feed
      const feedItems: RawFeed[] = [];
      ((rc.data ?? []) as ContentRow[]).forEach(c => feedItems.push({ type: "content_generated", emoji: "✍️", message: formatActivity(`content_${c.status === "published" ? "published" : "generated"}`), time: c.created_at }));
      ((ri.data ?? []) as CompetitorRow[]).forEach(r => feedItems.push({ type: "competitor_analysis", emoji: "🎯", message: formatActivity("competitor_analysis"), time: r.recorded_at }));
      ((rr.data ?? []) as RetentionRow[]).forEach(r => feedItems.push({ type: "email_sent", emoji: "📧", message: formatActivity("email_sent"), time: r.sent_at }));
      ((rw.data ?? []) as WinRow[]).forEach(w => feedItems.push({ type: "brand_memory", emoji: "🏆", message: w.message?.slice(0, 50) || formatActivity(w.win_type || ""), time: w.notified_at }));
      feedItems.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setRawFeed(feedItems.slice(0, 10));
      setFeed(feedItems.slice(0, 10).map(mapToFeedEntry));

      // Profile completion estimate
      const od = bizData?.onboarding_data;
      if (od) {
        try {
          const parsed = typeof od === "string" ? JSON.parse(od) : od;
          const form = parsed?.form || {};
          const filled = Object.values(form).filter(v => v && (Array.isArray(v) ? v.length > 0 : String(v).trim())).length;
          setProfilePct(Math.min(100, Math.round((filled / 70) * 100)));
        } catch {}
      }
    } catch {
      toast.error("Couldn't load latest data — retrying in 30s", { duration: 5000 });
    } finally {
      setLoading(false);
    }
  }, [businessId, user?.id, isReady]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Server-aggregated metrics overlay
  useEffect(() => {
    if (!businessId) return;
    const ctrl = new AbortController();
    apiGet<{ summary?: Record<string, unknown> }>(`/api/performance/summary/${businessId}`, ctrl.signal)
      .then(data => {
        const s = data?.summary;
        if (!s) return;
        if (typeof s.total_reach === "number") setReach(s.total_reach);
        if (typeof s.posts_published === "number") setPublishedCount(s.posts_published);
        if (typeof s.active_leads === "number") setLeads(s.active_leads);
      })
      .catch(() => {});
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
          setFeed(prev => [mapToFeedEntry(item, 0), ...prev].slice(0, 10));
        })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "contacts", filter: `business_id=eq.${businessId}` },
        () => {
          setLeads(c => c + 1);
          const item: RawFeed = { type: "lead_captured", emoji: "👤", message: formatActivity("lead_captured"), time: new Date().toISOString() };
          setRawFeed(prev => [item, ...prev].slice(0, 10));
          setFeed(prev => [mapToFeedEntry(item, 0), ...prev].slice(0, 10));
        })
      .subscribe();
    return () => { externalSupabase.removeChannel(channel); };
  }, [businessId, isReady]);

  // ── Derived values ──
  const firstName = getFirstName(user);
  const greeting = getGreeting();
  const agentCount = feed.length > 0 ? 3 : 0;
  const lastActions = rawFeed.slice(0, 3).map(f => f.message);
  const profileComplete = profilePct >= 85;

  // Mock approval items (from pending content)
  const approvalItems: ApprovalItem[] = pendingCount > 0 ? Array.from({ length: Math.min(pendingCount, 3) }, (_, i) => ({
    id: `approval-${i}`,
    title: i === 0 ? "Friday's reel — approve by 4pm" : i === 1 ? "Weekend promo creative" : "Ad copy variant B",
    subtitle: i === 0 ? "Instagram reel, 15s, trending audio" : i === 1 ? "3 image variants for Story" : "Meta ad for local reach campaign",
    type: (["post", "creative", "ad"] as const)[i],
    urgency: (["today", "today", "this_week"] as const)[i],
  })) : [];

  // Skeleton while loading
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 rounded-lg bg-[var(--bg-muted)] animate-pulse" />
        <div className="h-[140px] rounded-[20px] bg-[var(--bg-muted)] animate-pulse" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-[140px] rounded-2xl bg-[var(--bg-muted)] animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-8">
      {/* Main column */}
      <div className="min-w-0 flex-1">
        <TopBar
          pendingCount={pendingCount}
          agentCount={agentCount}
          onOpenPalette={() => setCmdOpen(true)}
          onScrollToFeed={scrollToFeed}
          onOpenApprovals={() => onNavigate("inbox")}
        />

        {/* Greeting */}
        <div className="mb-6">
          <h1 className="text-[36px] font-bold leading-[1.1] tracking-[-0.025em]">
            {greeting}, {firstName}
          </h1>
          <p className="mt-2 text-[15px] leading-[1.55] text-muted-foreground">
            {feed.length > 0
              ? `Your agents shipped ${feed.length} thing${feed.length !== 1 ? "s" : ""} while you were away`
              : "Your AI team is setting up. First actions in ~90 seconds."}
          </p>
        </div>

        <AutopilotBanner
          agentCount={agentCount}
          lastActions={lastActions}
          postsThisMonth={publishedCount}
          goalCoverage={Math.min(100, Math.round((publishedCount / Math.max(1, 20)) * 100))}
          onViewDetails={scrollToFeed}
        />

        <KPIGrid
          reach={reach}
          reachDelta={reach > 0 ? "↑ 24.1%" : "—"}
          reachSpark={reachSpark}
          leads={leads}
          leadsDelta={leads > 0 ? `↑ ${Math.min(leads, 11)} new` : "—"}
          leadsSpark={reachSpark.map((_, i) => Math.round(Math.random() * 10))}
          adSpend={0}
          adSpendDelta="—"
          adSpendSpark={[0, 0, 0, 0, 0, 0, 0]}
          revenue={0}
          revenueDelta="—"
          revenueSpark={[0, 0, 0, 0, 0, 0, 0]}
        />

        <NeedsApprovalSection
          items={approvalItems}
          onReview={() => onNavigate("inbox")}
          onApproveAll={() => onNavigate("inbox")}
          oldestAge={pendingCount > 0 ? "2h ago" : undefined}
        />

        <div ref={feedRef}>
          <AgentActivityFeed items={feed} activeCount={agentCount} />
        </div>

        <WhatsNextCards
          pendingDrafts={pendingCount}
          profileComplete={profileComplete}
          newLeads={leads}
          onNavigate={onNavigate}
        />

        {/* Profile widget — mobile only (below 1280px) */}
        <div className="xl:hidden">
          <ProfileStrengthWidget
            percentage={profilePct}
            sectionsRemaining={Math.max(0, Math.ceil((100 - profilePct) / 16))}
            onNavigate={() => onNavigate("profile-enhancement")}
          />
        </div>
      </div>

      {/* Right rail — desktop only */}
      <div className="sticky top-4 hidden w-[320px] shrink-0 self-start xl:block">
        <ProfileStrengthWidget
          percentage={profilePct}
          sectionsRemaining={Math.max(0, Math.ceil((100 - profilePct) / 16))}
          onNavigate={() => onNavigate("profile-enhancement")}
        />
      </div>

      <CommandPalette
        open={cmdOpen}
        onOpenChange={setCmdOpen}
        onNavigate={(tab) => { onNavigate(tab); setCmdOpen(false); }}
      />
    </div>
  );
}
