/**
 * Placeholder action handlers for every visible button in the
 * dashboard. Naming uses product language (what the user thinks they
 * are doing), not backend workflow names. When the real backend is
 * wired, replace the body of each function — the call sites do not
 * need to change.
 *
 * Every handler returns a Promise<void> so call sites can show
 * pending/disabled states once mutations are real.
 */

import { toast } from "sonner";
import type { AutopilotMode } from "./types";

/** Internal: stub that logs + toasts a friendly placeholder. */
function stub(label: string, detail?: string): Promise<void> {
  // eslint-disable-next-line no-console
  console.info(`[handler] ${label}`, detail ?? "");
  toast.message(label, detail ? { description: detail } : undefined);
  return Promise.resolve();
}

/* ── Today page ────────────────────────────────────────────────── */

export function approveTodayPlan(): Promise<void> {
  return stub("Approving today's plan", "We'll publish or schedule every approved item.");
}

export function reviewApprovalItem(itemId: string): Promise<void> {
  return stub("Opening item for review", `Item ${itemId}`);
}

export function approveApprovalItem(itemId: string): Promise<void> {
  return stub("Item approved", `Item ${itemId} is queued to publish.`);
}

export function rejectApprovalItem(itemId: string): Promise<void> {
  return stub("Item rejected", `Item ${itemId} won't be published.`);
}

export function editApprovalItem(itemId: string): Promise<void> {
  return stub("Editing item", `Item ${itemId}`);
}

export function viewPlanItem(itemId: string): Promise<void> {
  return stub("Opening details", `Item ${itemId}`);
}

export function viewHealthDetails(): Promise<void> {
  return stub("Opening marketing health details");
}

export function viewRecentActivity(): Promise<void> {
  return stub("Opening recent activity");
}

export function viewUpcomingSchedule(): Promise<void> {
  return stub("Opening upcoming schedule");
}

/* ── Content page ──────────────────────────────────────────────── */

export function generateWeeklyContent(): Promise<void> {
  return stub("Generating this week's posts", "Drafts will appear here when ready.");
}

export function approveContentPost(postId: string): Promise<void> {
  return stub("Post approved", `Post ${postId} will publish on schedule.`);
}

export function editContentPost(postId: string): Promise<void> {
  return stub("Editing post", `Post ${postId}`);
}

export function schedulePost(postId: string): Promise<void> {
  return stub("Post scheduled", `Post ${postId}`);
}

export function filterContentByPlatform(_platform: string): void {
  // Synchronous — state lives in the page. No-op handler kept for
  // analytics / instrumentation hooks once wired.
}

export function filterContentByStatus(_status: string): void {
  // Same as above.
}

/* ── Growth page ───────────────────────────────────────────────── */

export function applyGrowthRecommendation(recId: string): Promise<void> {
  return stub("Applying recommendation", `Recommendation ${recId}`);
}

export function dismissGrowthRecommendation(recId: string): Promise<void> {
  return stub("Recommendation dismissed", `Recommendation ${recId}`);
}

export function explainGrowthRecommendation(recId: string): Promise<void> {
  return stub("Explaining recommendation", `Recommendation ${recId}`);
}

export function viewCompetitorSignal(signalId: string): Promise<void> {
  return stub("Opening competitor signal", signalId);
}

export function viewSeoOpportunity(oppId: string): Promise<void> {
  return stub("Opening SEO opportunity", oppId);
}

/* ── AI Brain ──────────────────────────────────────────────────── */

export function sendBrainMessage(text: string): Promise<string> {
  // eslint-disable-next-line no-console
  console.info("[handler] sendBrainMessage", text);
  // Returns the placeholder reply text so the chat UI can echo it.
  return Promise.resolve(
    "I'm thinking through this against your brand memory and recent performance. The full reply will appear once chat is wired to the AI Brain endpoint.",
  );
}

export function explainBrainDecision(decisionId: string): Promise<void> {
  return stub("Explaining decision", decisionId);
}

/* ── Settings ──────────────────────────────────────────────────── */

export function updateAutopilotMode(mode: AutopilotMode): Promise<void> {
  return stub("Autopilot updated", `Mode: ${mode}`);
}

export function editBusinessProfile(): Promise<void> {
  return stub("Editing business profile");
}

export function editBrandVoice(): Promise<void> {
  return stub("Editing brand voice");
}

export function connectSocialAccount(): Promise<void> {
  return stub("Connect an account", "We'll walk you through linking it.");
}

export function manageConnectedAccount(accountId: string): Promise<void> {
  return stub("Managing connection", `Account ${accountId}`);
}

export function manageBilling(): Promise<void> {
  return stub("Opening billing portal");
}
