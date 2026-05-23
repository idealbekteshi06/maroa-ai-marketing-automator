/**
 * Typed data contracts for every dashboard page.
 *
 * These types describe what each page expects to render — they are
 * intentionally simple, product-language shapes that the real Maroa
 * backend can map onto without forcing UI changes later.
 *
 * Until the backend is wired, see `mocks.ts` for fixture data and
 * `usePageData.ts` for the hooks that supply (or fall back to) it.
 */

/* ── Shared primitives ─────────────────────────────────────────── */

export type PlanItemStatus = "Ready" | "Needs review" | "Scheduled" | "Watching";
export type PlanItemAction = "Approve" | "Edit" | "Skip" | "View";

/** Discriminated union — every page hook returns one of these. */
export type PageDataState<T> =
  | { status: "loading"; data: undefined; error: undefined }
  | { status: "empty"; data: T; error: undefined }
  | { status: "success"; data: T; error: undefined }
  | { status: "error"; data: undefined; error: Error };

/* ── Today page ────────────────────────────────────────────────── */

export interface TodayPlanItem {
  id: string;
  title: string;            // "Instagram post is ready"
  description: string;      // plain-English context
  status: PlanItemStatus;
  action?: PlanItemAction;
  iconKey: "instagram" | "facebook" | "ads" | "competitor" | "report";
}

export interface TodayApprovalItem {
  id: string;
  platform: "Instagram" | "Facebook" | "TikTok" | "LinkedIn" | "Email" | "Other";
  title: string;
  preview: string;
}

export interface TodayHealth {
  score: number;            // 0-100
  dimensions: {
    content: number;
    ads: number;
    seo: number;
    competitors: number;
  };
}

export interface TodayInsight {
  id: string;
  title: string;            // one-sentence recommendation
}

export interface TodayUpcoming {
  id: string;
  title: string;
  scheduledAt: string;      // ISO
}

export interface TodayActivityEvent {
  id: string;
  title: string;
  occurredAt: string;       // ISO
}

export interface TodayPageData {
  plan: TodayPlanItem[];
  approvals: TodayApprovalItem[];
  approvalsCount: number;
  insight: TodayInsight | null;
  nextScheduled: TodayUpcoming | null;
  health: TodayHealth | null;
  recentActivity: TodayActivityEvent[];
  updatedAt: string;        // ISO
}

/* ── Content page ──────────────────────────────────────────────── */

export type ContentStatus = "Draft" | "Needs approval" | "Scheduled" | "Published";
export type ContentPlatform = "Instagram" | "Facebook" | "TikTok" | "LinkedIn";

export interface ContentPost {
  id: string;
  title: string;
  preview: string;
  platform: ContentPlatform;
  status: ContentStatus;
  scheduledAt?: string;     // ISO if Scheduled/Published
}

export interface ContentCalendarDay {
  date: string;             // ISO (start of day)
  items: { id: string; title: string; platform: ContentPlatform }[];
}

export interface ContentPageData {
  posts: ContentPost[];
  weekCalendar: ContentCalendarDay[];
}

/* ── Growth page ───────────────────────────────────────────────── */

export interface GrowthAdsSummary {
  activeCampaigns: number;
  spendMtd: number;         // dollars
  blendedRoas: number;      // e.g. 2.4 for 2.4x
}

export interface GrowthCompetitorSignal {
  id: string;
  name: string;
  signal: string;           // "Launched new promo"
}

export interface GrowthSeoOpportunity {
  id: string;
  query: string;
  position: number | null;
  clicks: number;
}

export interface GrowthRecommendation {
  id: string;
  what: string;             // "Boost Friday reel"
  why: string;              // plain-English reason
  actionLabel: string;      // "Apply", "Schedule", etc.
}

export interface GrowthPageData {
  ads: GrowthAdsSummary;
  competitors: GrowthCompetitorSignal[];
  seoOpportunities: GrowthSeoOpportunity[];
  recommendations: GrowthRecommendation[];
}

/* ── AI Brain — Chat ───────────────────────────────────────────── */

export type BrainMessageRole = "user" | "ai";

export interface BrainMessage {
  id: string;
  role: BrainMessageRole;
  text: string;
  createdAt: string;        // ISO
}

export interface BrainChatData {
  messages: BrainMessage[];
  suggestedPrompts: string[];
}

/* ── AI Brain — Decision log ───────────────────────────────────── */

export interface BrainDecision {
  id: string;
  title: string;            // "Posted Friday reel at 4pm"
  reasoning: string;        // plain-English why
  occurredAt: string;       // ISO
}

export interface BrainDecisionLogData {
  decisions: BrainDecision[];
}

/* ── Settings ──────────────────────────────────────────────────── */

export type AutopilotMode = "manual" | "review" | "autopilot";

export interface SettingsBusinessProfile {
  businessName: string;
  primaryGoal: string;
  monthlyBudget: number | null;
  ownerEmail: string;
}

export interface SettingsBrandVoice {
  tone: string;
  mission: string;
  audience: string;
}

export interface SettingsConnectedAccount {
  id: string;
  provider: "Instagram" | "Facebook" | "Google" | "TikTok" | "LinkedIn" | "Other";
  accountName: string;
  status: "connected" | "needs_attention" | "disconnected";
}

export interface SettingsBilling {
  planName: string;         // "Growth", "Agency", "Free"
  status: "active" | "trialing" | "past_due" | "canceled";
  nextInvoiceDate: string | null;
}

export interface SettingsPageData {
  profile: SettingsBusinessProfile;
  brandVoice: SettingsBrandVoice;
  connectedAccounts: SettingsConnectedAccount[];
  autopilotMode: AutopilotMode;
  billing: SettingsBilling;
}
