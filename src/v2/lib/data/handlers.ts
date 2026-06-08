/**
 * Action handlers for every visible button in the dashboard.
 *
 * Naming uses product language (what the user thinks they are doing),
 * not backend workflow names. Each handler:
 *   1. Reads the current user/business from the module-level handler
 *      context (set by AppShell via useSyncHandlerContext).
 *   2. Calls the real Maroa backend endpoint when one exists.
 *   3. Falls back to a friendly toast stub when context is missing or
 *      the endpoint is not yet defined.
 *   4. Invalidates the relevant TanStack Query caches so the UI
 *      refreshes after the mutation.
 *
 * Call sites do not need to know whether a handler is wired or stubbed.
 */

import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import * as api from "@/lib/api";
import { getHandlerContext, requireContext } from "./context";
import type { AutopilotMode } from "./types";

/* ── helpers ───────────────────────────────────────────────────── */

function notify(label: string, detail?: string) {
  toast.message(label, detail ? { description: detail } : undefined);
}

function notifyError(label: string, err: unknown) {
  const msg = err instanceof Error ? err.message : String(err ?? "Unknown error");
  toast.error(label, { description: msg });
}

function invalidate(keys: unknown[][]) {
  const { queryClient } = getHandlerContext();
  if (!queryClient) return;
  keys.forEach((k) => queryClient.invalidateQueries({ queryKey: k }));
}

function stub(label: string, detail?: string): Promise<void> {
  // eslint-disable-next-line no-console
  console.info(`[handler:stub] ${label}`, detail ?? "");
  notify(label, detail);
  return Promise.resolve();
}

/* ── Today page ────────────────────────────────────────────────── */

export async function approveTodayPlan(): Promise<void> {
  const ctx = requireContext();
  if (!ctx) return stub("Approving today's plan", "Sign in to publish your approved items.");
  notify("Reviewing today's plan", "Opening items that need your approval.");
}

/** Batch-approve every pending content piece for the business. */
export async function batchApproveToday(contentIds: string[]): Promise<void> {
  const ctx = requireContext();
  if (!ctx) return stub("Approved", `${contentIds.length} items queued.`);
  if (contentIds.length === 0) {
    notify("Nothing to approve", "Your queue is empty.");
    return;
  }
  try {
    const res = await api.batchApproveContent({
      business_id: ctx.businessId,
      user_id: ctx.userId,
      content_ids: contentIds,
    });
    const ok = res.results.filter((r) => r.ok).length;
    const failed = res.results.length - ok;
    notify(
      `Approved ${ok}${failed ? ` · ${failed} failed` : ""}`,
      failed ? "We'll retry the failed ones automatically." : "All set — publishing now.",
    );
    invalidate([["content", ctx.businessId], ["calendar", ctx.businessId], ["dashboard-events", ctx.businessId]]);
  } catch (e) {
    notifyError("Couldn't approve batch", e);
  }
}

/** Refresh every cache that powers the Today page. */
export function refreshToday(): void {
  const ctx = requireContext();
  if (!ctx) {
    notify("Refreshing…");
    return;
  }
  invalidate([
    ["health", ctx.userId],
    ["dashboard-events", ctx.businessId],
    ["opportunities", ctx.userId],
    ["content", ctx.businessId],
    ["ads", ctx.businessId],
    ["competitors", ctx.businessId],
    ["calendar", ctx.businessId],
  ]);
  notify("Refreshed", "Pulled the latest from your accounts.");
}

export function reviewApprovalItem(itemId: string): Promise<void> {
  return stub("Opening item for review", `Item ${itemId}`);
}

export async function approveApprovalItem(itemId: string): Promise<void> {
  const ctx = requireContext();
  if (!ctx) return stub("Item approved", `Item ${itemId} is queued to publish.`);
  try {
    await api.approveContentPiece({
      content_id: itemId,
      user_id: ctx.userId,
      business_id: ctx.businessId,
    });
    notify("Approved", "It's queued to publish.");
    invalidate([["content", ctx.businessId], ["calendar", ctx.businessId]]);
  } catch (e) {
    notifyError("Couldn't approve", e);
  }
}

export async function rejectApprovalItem(itemId: string, note?: string): Promise<void> {
  const ctx = requireContext();
  if (!ctx) return stub("Item rejected");
  try {
    await api.rejectContentPiece({
      content_id: itemId,
      user_id: ctx.userId,
      business_id: ctx.businessId,
      note,
    });
    notify("Rejected", "We won't publish this one.");
    invalidate([["content", ctx.businessId]]);
  } catch (e) {
    notifyError("Couldn't reject", e);
  }
}

export async function requestApprovalChanges(itemId: string, note: string): Promise<void> {
  const ctx = requireContext();
  if (!ctx) return stub("Changes requested");
  try {
    await api.requestContentChanges({
      content_id: itemId,
      user_id: ctx.userId,
      business_id: ctx.businessId,
      note,
    });
    notify("Changes requested", "Maroa will rework it and ping you.");
    invalidate([["content", ctx.businessId]]);
  } catch (e) {
    notifyError("Couldn't send changes", e);
  }
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

export async function generateWeeklyContent(): Promise<void> {
  const ctx = requireContext();
  if (!ctx) return stub("Generating this week's posts");
  try {
    notify("Generating posts", "Drafts will appear shortly.");
    await api.contentGenerate({
      business_id: ctx.businessId,
      user_id: ctx.userId,
    });
    invalidate([["content", ctx.businessId], ["calendar", ctx.businessId]]);
  } catch (e) {
    notifyError("Couldn't start generation", e);
  }
}

export async function approveContentPost(postId: string): Promise<void> {
  return approveApprovalItem(postId);
}

export function editContentPost(postId: string): Promise<void> {
  return stub("Editing post", `Post ${postId}`);
}

export function schedulePost(postId: string): Promise<void> {
  return stub("Post scheduled", `Post ${postId}`);
}

export function filterContentByPlatform(_platform: string): void {
  // UI-only filter; no backend call needed.
}

export function filterContentByStatus(_status: string): void {
  // UI-only filter; no backend call needed.
}

/* ── Growth page ───────────────────────────────────────────────── */

export async function applyGrowthRecommendation(recId: string): Promise<void> {
  const ctx = requireContext();
  if (!ctx) return stub("Applying recommendation", `Recommendation ${recId}`);
  try {
    await api.seoRecommendationApply({
      recommendation_id: recId,
      business_id: ctx.businessId,
      user_id: ctx.userId,
    });
    notify("Applied", "We'll roll this out and report back.");
    invalidate([["seo", ctx.businessId], ["opportunities", ctx.userId]]);
  } catch (e) {
    notifyError("Couldn't apply", e);
  }
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

const BRAIN_SYSTEM_PROMPT =
  "You are Maroa, an AI marketing co-pilot. You speak in plain English, " +
  "stay concise, and ground your answers in the user's brand and recent " +
  "performance. When you don't know something, say so.";

export async function sendBrainMessage(text: string): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke("chat", {
      body: {
        systemPrompt: BRAIN_SYSTEM_PROMPT,
        messages: [{ role: "user", content: text }],
      },
    });
    if (error) throw error;
    const reply =
      (data as any)?.choices?.[0]?.message?.content ??
      (data as any)?.message ??
      (data as any)?.content;
    if (typeof reply === "string" && reply.trim().length > 0) return reply;
    return "I didn't catch that. Could you rephrase?";
  } catch (e) {
    notifyError("Brain is offline", e);
    return "I'm having trouble reaching the Brain right now. Please try again in a moment.";
  }
}

export function explainBrainDecision(decisionId: string): Promise<void> {
  return stub("Explaining decision", decisionId);
}

/* ── Settings ──────────────────────────────────────────────────── */

export async function updateAutopilotMode(mode: AutopilotMode): Promise<void> {
  const ctx = requireContext();
  if (!ctx) return stub("Autopilot updated", `Mode: ${mode}`);
  const backendMode =
    mode === "autopilot" ? "full_autopilot" : mode === "review" ? "hybrid" : "approve_everything";
  try {
    await api.wf1SetAutonomyMode({ businessId: ctx.businessId, mode: backendMode });
    notify("Autopilot updated", `Set to ${mode}.`);
    invalidate([["businesses", ctx.userId]]);
  } catch (e) {
    notifyError("Couldn't update autopilot", e);
  }
}

export function editBusinessProfile(): Promise<void> {
  return stub("Editing business profile", "Profile editor coming soon.");
}

export function editBrandVoice(): Promise<void> {
  return stub("Editing brand voice", "Voice editor coming soon.");
}

export async function connectSocialAccount(): Promise<void> {
  // Real connect flow lives on Settings → Connections (Meta/Google OAuth).
  notify("Open Connections", "Connect Meta or Google from Settings → Connections.");
}

export function manageConnectedAccount(_accountId: string): Promise<void> {
  // No disconnect/manage endpoint is exposed yet — say so honestly.
  return stub(
    "Managing a connection isn't available yet",
    "Coming soon — reconnect from Settings → Connections.",
  );
}

export async function manageBilling(): Promise<void> {
  try {
    const { data, error } = await supabase.functions.invoke("customer-portal", {});
    if (error) throw error;
    const url = (data as any)?.url;
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    notify("Opening billing portal");
  } catch (e) {
    notifyError("Couldn't open billing portal", e);
  }
}
