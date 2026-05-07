/**
 * Maroa.ai analytics — thin lazy-loaded PostHog wrapper.
 *
 * Initialized in main.tsx. Activates only when VITE_POSTHOG_KEY is set, so
 * dev/preview builds without a key are zero-cost no-ops (the posthog-js
 * bundle isn't even fetched).
 *
 * Conventions:
 *   - Event names are snake_case past-tense, scoped by surface
 *     (e.g. "signup_completed", "content_generated", "psychology_applied").
 *   - Properties are camelCase. Always include planTier when known so we can
 *     funnel-segment by plan.
 *   - Identify on auth login. Reset on logout.
 */

const POSTHOG_KEY =
  (typeof import.meta !== "undefined" && (import.meta.env?.VITE_POSTHOG_KEY as string | undefined)) || "";
const POSTHOG_HOST =
  (typeof import.meta !== "undefined" && (import.meta.env?.VITE_POSTHOG_HOST as string | undefined)) ||
  "https://eu.i.posthog.com";

type PosthogModule = typeof import("posthog-js")["default"];

let _client: PosthogModule | null = null;
let _loadingPromise: Promise<PosthogModule | null> | null = null;
let _queue: Array<(client: PosthogModule) => void> = [];

function loadClient(): Promise<PosthogModule | null> {
  if (_client) return Promise.resolve(_client);
  if (_loadingPromise) return _loadingPromise;
  if (!POSTHOG_KEY) return Promise.resolve(null);
  _loadingPromise = import("posthog-js")
    .then((mod) => {
      const ph = mod.default;
      ph.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        person_profiles: "identified_only",
        autocapture: true,
        capture_pageview: false,
        capture_pageleave: true,
        disable_session_recording: false,
        session_recording: {
          maskAllInputs: true,
          maskTextSelector: "[data-private], input[type='password'], input[type='email']",
        },
      });
      _client = ph;
      _queue.forEach((fn) => {
        try {
          fn(ph);
        } catch {
          /* swallow */
        }
      });
      _queue = [];
      return ph;
    })
    .catch(() => {
      _loadingPromise = null;
      return null;
    });
  return _loadingPromise;
}

function withClient(fn: (client: PosthogModule) => void): void {
  if (typeof window === "undefined") return;
  if (!POSTHOG_KEY) return;
  if (_client) {
    try {
      fn(_client);
    } catch {
      /* swallow */
    }
    return;
  }
  _queue.push(fn);
  // Kick off load on first call. Subsequent calls just queue.
  if (!_loadingPromise) void loadClient();
}

export function initAnalytics(): void {
  if (typeof window === "undefined") return;
  // No key configured → explicit opt-out, never loads the bundle.
  if (!POSTHOG_KEY) return;
  // Lazy-load on next idle tick so it doesn't compete with first paint.
  const trigger = () => void loadClient();
  if ("requestIdleCallback" in window) {
    (window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(trigger);
  } else {
    setTimeout(trigger, 1500);
  }
}

export type EventProps = Record<string, string | number | boolean | null | undefined>;

export function track(event: string, properties?: EventProps): void {
  withClient((client) => client.capture(event, properties));
}

export function identify(userId: string, properties?: EventProps): void {
  withClient((client) => client.identify(userId, properties));
}

export function setPersonProperties(properties: EventProps): void {
  withClient((client) => client.setPersonProperties(properties));
}

export function reset(): void {
  withClient((client) => client.reset());
}

export function pageview(path?: string): void {
  withClient((client) => client.capture("$pageview", path ? { $current_url: path } : undefined));
}

/* ── Canonical funnel events ───────────────────────────────────────────────
 *
 * Use these helpers (vs. raw track()) so that downstream dashboards stay
 * aligned with what the codebase actually fires.
 *
 * Funnel order:
 *   landing_viewed → signup_started → signup_completed → onboarding_block_completed
 *   → onboarding_completed → dashboard_first_visit → content_generated
 *   → content_approved → campaign_launched → subscription_upgraded
 */

export const events = {
  landingViewed: () => track("landing_viewed"),

  signupStarted: (method: "email" | "google") =>
    track("signup_started", { method }),

  signupCompleted: (method: "email" | "google", userId?: string) => {
    track("signup_completed", { method });
    if (userId) identify(userId);
  },

  loginCompleted: (method: "email" | "google", userId?: string) => {
    track("login_completed", { method });
    if (userId) identify(userId);
  },

  onboardingBlockCompleted: (block: number, total: number) =>
    track("onboarding_block_completed", { block, total }),

  onboardingCompleted: (totalBlocks: number) =>
    track("onboarding_completed", { totalBlocks }),

  dashboardFirstVisit: (planTier: string) =>
    track("dashboard_first_visit", { planTier }),

  welcomeFlowCompleted: () => track("welcome_flow_completed"),

  contentGenerated: (theme?: string, qualityScore?: number) =>
    track("content_generated", {
      theme: theme ?? null,
      qualityScore: qualityScore ?? null,
    }),

  contentApproved: (contentId: string) =>
    track("content_approved", { contentId }),

  campaignLaunched: (objective: string, dailyBudget: number) =>
    track("campaign_launched", { objective, dailyBudget }),

  brandVoiceRebuilt: () => track("brand_voice_rebuilt"),

  subscriptionUpgradeStarted: (planKey: string) =>
    track("subscription_upgrade_started", { planKey }),

  subscriptionUpgraded: (planKey: string) =>
    track("subscription_upgraded", { planKey }),

  errorOccurred: (where: string, message: string) =>
    track("error_occurred", { where, message: message.slice(0, 200) }),
};
