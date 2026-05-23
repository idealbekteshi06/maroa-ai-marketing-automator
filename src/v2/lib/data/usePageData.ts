/**
 * One hook per page. Each returns a `PageDataState<T>` discriminated
 * union so the UI can render Loading / Empty / Success / Error
 * without ad-hoc booleans.
 *
 * Today these hooks adapt the existing untyped useModules queries
 * onto the typed shapes in `./types.ts`. When the backend is wired,
 * point them at the new endpoints and delete the adapters — the
 * pages themselves don't change.
 */

import { useAuth } from "@/contexts/AuthContext";
import { useCurrentBusiness } from "@/v2/lib/api/hooks/useBusinesses";
import {
  useHealth,
  useDashboardEvents,
  useOpportunities,
} from "@/v2/lib/api/hooks/useHome";
import {
  useContent,
  useCalendar,
  useAds,
  useCompetitors,
  useSeo,
  useIntegrations,
  useBilling,
  useBrandDna,
} from "@/v2/lib/api/hooks/useModules";

import type {
  PageDataState,
  TodayPageData,
  TodayPlanItem,
  TodayApprovalItem,
  TodayActivityEvent,
  ContentPageData,
  ContentPost,
  ContentStatus,
  ContentPlatform,
  ContentCalendarDay,
  GrowthPageData,
  BrainChatData,
  BrainDecisionLogData,
  SettingsPageData,
  AutopilotMode,
} from "./types";

import {
  MOCK_TODAY_DATA,
  MOCK_CONTENT_DATA,
  MOCK_GROWTH_DATA,
  MOCK_BRAIN_SUGGESTED_PROMPTS,
  MOCK_BRAIN_DECISION_LOG_DATA,
  MOCK_SETTINGS_DATA,
} from "./mocks";

/* ── Helpers ───────────────────────────────────────────────────── */

function wrap<T>(
  isLoading: boolean,
  isError: boolean,
  error: unknown,
  data: T,
  isEmpty: boolean,
): PageDataState<T> {
  if (isLoading) return { status: "loading", data: undefined, error: undefined };
  if (isError) return { status: "error", data: undefined, error: error as Error };
  if (isEmpty) return { status: "empty", data, error: undefined };
  return { status: "success", data, error: undefined };
}

function platformOf(c: any): ContentPlatform {
  const raw = (c?.platform ?? "").toString().toLowerCase();
  if (raw.includes("insta") || c?.instagram_caption) return "Instagram";
  if (raw.includes("face") || c?.facebook_post) return "Facebook";
  if (raw.includes("tik") || c?.tiktok_caption) return "TikTok";
  if (raw.includes("link") || c?.linkedin_post) return "LinkedIn";
  return "Instagram";
}

function statusOf(c: any): ContentStatus {
  const s = (c?.status ?? "").toString().toLowerCase();
  if (s === "published") return "Published";
  if (s === "scheduled") return "Scheduled";
  if (s === "pending_approval" || s === "pending") return "Needs approval";
  return "Draft";
}

/* ── Today ─────────────────────────────────────────────────────── */

export function useTodayPageData(): PageDataState<TodayPageData> {
  const { user } = useAuth();
  const { business } = useCurrentBusiness(user?.id);
  const bid = business?.id;

  const health = useHealth(user?.id);
  const events = useDashboardEvents(bid);
  const opps = useOpportunities(user?.id);
  const content = useContent(bid);
  const ads = useAds(bid);
  const competitors = useCompetitors(bid);
  const now = new Date();
  const calendar = useCalendar(bid, now.getMonth() + 1, now.getFullYear());

  const isLoading =
    health.isLoading || events.isLoading || opps.isLoading ||
    content.isLoading || ads.isLoading || competitors.isLoading ||
    calendar.isLoading;

  const isError =
    health.isError || events.isError || opps.isError ||
    content.isError || ads.isError || competitors.isError ||
    calendar.isError;
  const error = health.error ?? events.error ?? opps.error ?? content.error ?? ads.error ?? competitors.error ?? calendar.error;

  const drafts = Array.isArray(content.data) ? content.data : [];
  const adList = Array.isArray(ads.data) ? ads.data : [];
  const compList = Array.isArray(competitors.data) ? competitors.data : [];

  const plan: TodayPlanItem[] = [];
  const ig = drafts.find((c: any) => /insta/i.test(c?.platform ?? "") || c?.instagram_caption);
  const fb = drafts.find((c: any) => /face/i.test(c?.platform ?? "") || c?.facebook_post);
  if (ig)
    plan.push({
      id: `ig-${ig.id ?? "draft"}`,
      iconKey: "instagram",
      title: "Instagram post is ready",
      description: (ig.instagram_caption ?? ig.content_theme ?? "Take a quick look and approve.").toString().slice(0, 110),
      status: ig.status === "published" ? "Scheduled" : ig.status === "pending_approval" ? "Needs review" : "Ready",
      action: ig.status === "published" ? "View" : "Approve",
    });
  if (fb)
    plan.push({
      id: `fb-${fb.id ?? "draft"}`,
      iconKey: "facebook",
      title: "Facebook post is ready",
      description: (fb.facebook_post ?? fb.content_theme ?? "Take a quick look and approve.").toString().slice(0, 110),
      status: fb.status === "published" ? "Scheduled" : fb.status === "pending_approval" ? "Needs review" : "Ready",
      action: fb.status === "published" ? "View" : "Approve",
    });
  if (adList.length > 0)
    plan.push({
      id: "ad-refresh",
      iconKey: "ads",
      title: "Your ads could use fresh photos",
      description: `${adList.length} ad${adList.length === 1 ? "" : "s"} running — swapping creative this week usually boosts results.`,
      status: "Needs review",
      action: "View",
    });
  if (compList.length > 0)
    plan.push({
      id: "comp-trend",
      iconKey: "competitor",
      title: "A competitor just posted something new",
      description: `We're watching ${compList.length} competitor${compList.length === 1 ? "" : "s"} so you don't have to.`,
      status: "Watching",
      action: "View",
    });
  plan.push({
    id: "weekly-scorecard",
    iconKey: "report",
    title: "Your weekly summary lands Friday",
    description: "We'll email a plain-English recap of what worked.",
    status: "Scheduled",
  });

  const approvalsAll = drafts.filter((c: any) => c?.status === "pending_approval" || c?.status === "draft");
  const approvals: TodayApprovalItem[] = approvalsAll.slice(0, 3).map((a: any, i: number) => ({
    id: a.id ?? `approval-${i}`,
    platform: platformOf(a) as TodayApprovalItem["platform"],
    title: a.content_theme ?? a.title ?? "Social post draft",
    preview: (a.instagram_caption ?? a.facebook_post ?? a.preview ?? "Draft ready for review.").toString().slice(0, 120),
  }));

  const cal = Array.isArray(calendar.data) ? calendar.data : [];
  const future = cal
    .filter((c: any) => c?.scheduled_at && new Date(c.scheduled_at).getTime() >= Date.now())
    .sort((a: any, b: any) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  const upcomingRaw = future[0] ?? cal[0];
  const nextScheduled = upcomingRaw
    ? {
        id: upcomingRaw.id ?? "next",
        title: upcomingRaw.title ?? upcomingRaw.theme ?? "Scheduled post",
        scheduledAt: upcomingRaw.scheduled_at,
      }
    : null;

  const insightRaw = opps.data?.[0];
  const insight = insightRaw ? { id: insightRaw.id, title: insightRaw.title } : null;

  const recentActivity: TodayActivityEvent[] = (events.data ?? []).slice(0, 5).map((e) => ({
    id: e.id,
    title: e.title,
    occurredAt: e.created_at,
  }));

  const data: TodayPageData = {
    plan,
    approvals,
    approvalsCount: approvalsAll.length,
    insight,
    nextScheduled,
    health: health.data
      ? {
          score: health.data.score ?? 0,
          dimensions: {
            content: (health.data.dimensions?.content as number) ?? 0,
            ads: (health.data.dimensions?.ads as number) ?? 0,
            seo: (health.data.dimensions?.seo as number) ?? 0,
            competitors: (health.data.dimensions?.competitors as number) ?? 0,
          },
        }
      : null,
    recentActivity,
    updatedAt: events.data?.[0]?.created_at ?? health.data?.updated_at ?? new Date().toISOString(),
  };

  const isEmpty = plan.length <= 1 && approvals.length === 0 && recentActivity.length === 0;
  return wrap(isLoading, isError, error, data, isEmpty);
}

/* ── Content ───────────────────────────────────────────────────── */

export function useContentPageData(): PageDataState<ContentPageData> {
  const { user } = useAuth();
  const { business } = useCurrentBusiness(user?.id);
  const bid = business?.id;
  const content = useContent(bid);
  const now = new Date();
  const calendar = useCalendar(bid, now.getMonth() + 1, now.getFullYear());

  const isLoading = content.isLoading || calendar.isLoading;
  const isError = content.isError || calendar.isError;
  const error = content.error ?? calendar.error;

  const posts: ContentPost[] = (Array.isArray(content.data) ? content.data : []).map((c: any, i: number) => ({
    id: c.id ?? `post-${i}`,
    title: c.content_theme ?? c.title ?? "Post",
    preview: (c.instagram_caption ?? c.facebook_post ?? c.preview ?? "—").toString(),
    platform: platformOf(c),
    status: statusOf(c),
    scheduledAt: c.scheduled_at ?? undefined,
  }));

  // Week (Mon–Sun)
  const today = new Date();
  const day = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - day);
  monday.setHours(0, 0, 0, 0);
  const cal = Array.isArray(calendar.data) ? calendar.data : [];
  const weekCalendar: ContentCalendarDay[] = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const items = cal
      .filter((c: any) => {
        if (!c?.scheduled_at) return false;
        return new Date(c.scheduled_at).toDateString() === d.toDateString();
      })
      .map((c: any, j: number) => ({
        id: c.id ?? `cal-${i}-${j}`,
        title: (c.title ?? c.theme ?? "Post").toString().slice(0, 22),
        platform: platformOf(c),
      }));
    return { date: d.toISOString(), items };
  });

  const data: ContentPageData = { posts, weekCalendar };
  const isEmpty = posts.length === 0 && weekCalendar.every((d) => d.items.length === 0);
  return wrap(isLoading, isError, error, isEmpty && !isLoading ? MOCK_CONTENT_DATA : data, isEmpty);
}

/* ── Growth ────────────────────────────────────────────────────── */

export function useGrowthPageData(): PageDataState<GrowthPageData> {
  const { user } = useAuth();
  const { business } = useCurrentBusiness(user?.id);
  const bid = business?.id;

  const ads = useAds(bid);
  const competitors = useCompetitors(bid);
  const seo = useSeo(bid);
  const opps = useOpportunities(user?.id);

  const isLoading = ads.isLoading || competitors.isLoading || seo.isLoading || opps.isLoading;
  const isError = ads.isError || competitors.isError || seo.isError || opps.isError;
  const error = ads.error ?? competitors.error ?? seo.error ?? opps.error;

  const adList = Array.isArray(ads.data) ? ads.data : [];
  const activeCampaigns = adList.filter((a: any) => a?.status === "active").length;
  const spendMtd = adList.reduce((s: number, a: any) => s + (Number(a?.spend ?? 0) || 0), 0);
  const blendedRoas = adList.length
    ? adList.reduce((s: number, a: any) => s + (Number(a?.roas ?? 0) || 0), 0) / adList.length
    : 0;

  const competitorsList = (Array.isArray(competitors.data) ? competitors.data : []).slice(0, 5).map((c: any, i: number) => ({
    id: c.id ?? `comp-${i}`,
    name: c.name ?? c.competitor_name ?? "Competitor",
    signal: c.signal ?? c.last_activity ?? "Tracking",
  }));

  const seoOpps = ((seo.data as any)?.keywords ?? []).slice(0, 5).map((k: any, i: number) => ({
    id: k.id ?? `kw-${i}`,
    query: k.query,
    position: k.position ?? null,
    clicks: k.clicks ?? 0,
  }));

  const recs = (Array.isArray(opps.data) ? opps.data : []).slice(0, 4).map((o) => ({
    id: o.id,
    what: o.title,
    why: o.why,
    actionLabel: "Apply",
  }));

  const data: GrowthPageData = {
    ads: { activeCampaigns, spendMtd, blendedRoas },
    competitors: competitorsList,
    seoOpportunities: seoOpps,
    recommendations: recs,
  };

  const isEmpty =
    activeCampaigns === 0 &&
    competitorsList.length === 0 &&
    seoOpps.length === 0 &&
    recs.length === 0;
  return wrap(isLoading, isError, error, isEmpty && !isLoading ? MOCK_GROWTH_DATA : data, isEmpty);
}

/* ── AI Brain — Chat (local state, no fetch yet) ───────────────── */

export function useBrainChatData(messages: BrainChatData["messages"]): PageDataState<BrainChatData> {
  // Chat is client-state until the backend message thread API exists.
  // Wrapped in the same envelope for UI consistency.
  return {
    status: "success",
    data: { messages, suggestedPrompts: MOCK_BRAIN_SUGGESTED_PROMPTS },
    error: undefined,
  };
}

/* ── AI Brain — Decision log ───────────────────────────────────── */

export function useBrainDecisionLogData(): PageDataState<BrainDecisionLogData> {
  const { user } = useAuth();
  const { business } = useCurrentBusiness(user?.id);
  const bid = business?.id;
  const events = useDashboardEvents(bid);

  const isLoading = events.isLoading;
  const isError = events.isError;
  const decisions = (events.data ?? []).map((d) => ({
    id: d.id,
    title: d.title,
    reasoning: d.narrative ?? "",
    occurredAt: d.created_at,
  }));
  const data: BrainDecisionLogData = { decisions };
  const isEmpty = decisions.length === 0;
  return wrap(isLoading, isError, events.error, isEmpty && !isLoading ? MOCK_BRAIN_DECISION_LOG_DATA : data, isEmpty);
}

/* ── Settings ──────────────────────────────────────────────────── */

export function useSettingsPageData(): PageDataState<SettingsPageData> {
  const { user } = useAuth();
  const { business } = useCurrentBusiness(user?.id);
  const bid = business?.id;
  const integrations = useIntegrations(bid);
  const billing = useBilling(bid);
  const brand = useBrandDna(bid);

  const isLoading = integrations.isLoading || billing.isLoading || brand.isLoading;
  const isError = integrations.isError || billing.isError || brand.isError;
  const error = integrations.error ?? billing.error ?? brand.error;

  const brandD = brand.data as any;
  const billingD = billing.data as any;
  const integList = Array.isArray(integrations.data) ? integrations.data : [];

  const data: SettingsPageData = {
    profile: {
      businessName: business?.business_name ?? business?.name ?? MOCK_SETTINGS_DATA.profile.businessName,
      primaryGoal: business?.primary_goal ?? "",
      monthlyBudget: business?.monthly_budget ?? null,
      ownerEmail: user?.email ?? "",
    },
    brandVoice: {
      tone: brandD?.tone ?? brandD?.voice?.tone ?? "",
      mission: brandD?.mission ?? "",
      audience: brandD?.audience ?? brandD?.target_audience ?? "",
    },
    connectedAccounts: integList.map((it: any, i: number) => ({
      id: it.id ?? `acc-${i}`,
      provider: (it.provider ?? it.name ?? "Other") as any,
      accountName: it.account_name ?? it.account ?? "—",
      status: (it.status === "connected" ? "connected" : it.status === "needs_attention" ? "needs_attention" : "disconnected") as any,
    })),
    autopilotMode: (business?.autopilot_enabled ? "autopilot" : "review") as AutopilotMode,
    billing: {
      planName:
        (business?.plan ? business.plan[0].toUpperCase() + business.plan.slice(1) : null) ??
        billingD?.plan ?? "Free",
      status: (billingD?.status ?? "active") as SettingsPageData["billing"]["status"],
      nextInvoiceDate: billingD?.next_invoice_date ?? null,
    },
  };

  // Settings is never "empty" — there is always a profile and a plan.
  return wrap(isLoading, isError, error, data, false);
}
