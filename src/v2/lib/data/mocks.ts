/**
 * Mock data fixtures for the dashboard, used as fallbacks when the
 * real Maroa backend hasn't returned data yet (or in preview mode).
 *
 * Naming convention: `mock<PageName><Section>`.
 * When the backend is wired, replace the mock import in `usePageData.ts`
 * with a real network call — every page renders identically because the
 * shapes are defined in `./types.ts`.
 */

import type {
  TodayPageData,
  ContentPageData,
  GrowthPageData,
  BrainChatData,
  BrainDecisionLogData,
  SettingsPageData,
} from "./types";

/* ── Today ─────────────────────────────────────────────────────── */

export const MOCK_TODAY_DATA: TodayPageData = {
  plan: [],
  approvals: [],
  approvalsCount: 0,
  insight: null,
  nextScheduled: null,
  health: null,
  recentActivity: [],
  updatedAt: new Date().toISOString(),
};

/* ── Content ───────────────────────────────────────────────────── */

export const MOCK_CONTENT_DATA: ContentPageData = {
  posts: [],
  weekCalendar: [],
};

/* ── Growth ────────────────────────────────────────────────────── */

export const MOCK_GROWTH_DATA: GrowthPageData = {
  ads: { activeCampaigns: 0, spendMtd: 0, blendedRoas: 0 },
  competitors: [],
  seoOpportunities: [],
  recommendations: [],
};

/* ── AI Brain — Chat ───────────────────────────────────────────── */

export const MOCK_BRAIN_SUGGESTED_PROMPTS: string[] = [
  "What should I post today?",
  "Why did you recommend this ad change?",
  "What are my competitors doing?",
  "How can I get more bookings this week?",
];

export const MOCK_BRAIN_CHAT_DATA: BrainChatData = {
  messages: [],
  suggestedPrompts: MOCK_BRAIN_SUGGESTED_PROMPTS,
};

/* ── AI Brain — Decision log ───────────────────────────────────── */

export const MOCK_BRAIN_DECISION_LOG_DATA: BrainDecisionLogData = {
  decisions: [],
};

/* ── Settings ──────────────────────────────────────────────────── */

export const MOCK_SETTINGS_DATA: SettingsPageData = {
  profile: {
    businessName: "Your business",
    primaryGoal: "",
    monthlyBudget: null,
    ownerEmail: "",
  },
  brandVoice: { tone: "", mission: "", audience: "" },
  connectedAccounts: [],
  autopilotMode: "review",
  billing: {
    planName: "Free",
    status: "active",
    nextInvoiceDate: null,
  },
};
