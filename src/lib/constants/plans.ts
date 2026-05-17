/**
 * Canonical pricing for maroa.ai. Used by:
 *   - src/pages/Index.tsx (public landing — inline pricing section)
 *   - src/pages/Pricing.tsx (full pricing page)
 *   - src/pages/SignUp.tsx (plan-aware confirmation copy)
 *   - src/components/dashboard/DashboardSettings.tsx (in-app plan view)
 *
 * Source of truth: this file. Backend `/api/billing/plans` and the
 * cost-cap table in `lib/costGuard.js` (backend repo) must match these
 * keys, prices, and tier limits — keep in sync on every change.
 *
 * Pricing model:
 *   - Two paid tiers (Growth $149/mo, Agency $599/mo), USD.
 *   - Annual billing = ~30% off the monthly rate (paid up front).
 *   - Enterprise is contact-only — no posted number.
 *   - NO free tier. NO 7-day trial. NO money-back guarantee.
 *   - Risk-reversal: cancel-anytime monthly billing. Current month is
 *     non-refundable; no future charge. That's the whole guarantee.
 */

export type PlanKey = "growth" | "agency";

export interface Plan {
  key: PlanKey;
  name: string;
  monthlyPrice: number;
  /** Monthly equivalent when billed annually (used for the "or $/mo" line). */
  annualPrice: number;
  /** Displayed yearly total — what the customer's card actually gets charged. */
  annualTotal: number;
  /** Savings vs paying monthly × 12 — anchors the annual upsell. */
  annualSavings: number;
  currency: "USD";
  desc: string;
  features: readonly string[];
  popular: boolean;
  ctaLabel: string;
}

export const PLANS: readonly Plan[] = [
  {
    key: "growth",
    name: "Growth",
    monthlyPrice: 149,
    annualPrice: 104,
    annualTotal: 1250,
    annualSavings: 538,
    currency: "USD",
    desc: "Full agency-grade AI marketing for one business.",
    features: [
      "1 business",
      "60 AI posts / month",
      "Daily ad audit — Meta + Google",
      "Compliance refusal + reasoning trace",
      "Voice signature + cultural calendar",
      "Approval gate with magic-link client review",
      "60 images + 25 Kling + 5 Sora videos / month",
      "Pacing alerts every 4h",
      "Sonnet 4.5 + Opus 4.7 routing",
      "Priority support, 12h response",
      "Cancel anytime — no contracts",
    ],
    popular: true,
    ctaLabel: "Start with Growth",
  },
  {
    key: "agency",
    name: "Agency",
    monthlyPrice: 599,
    annualPrice: 419,
    annualTotal: 5030,
    annualSavings: 2158,
    currency: "USD",
    desc: "Multi-brand operators and agencies, up to 5 brands.",
    features: [
      "Up to 5 brands",
      "Everything in Growth, per brand",
      "White-label weekly reports + custom domain",
      "Opus 4.7 reasoning on every strategic call",
      "Multi-locale (ES, IT, SQ — beta)",
      "Competitor war room dashboard",
      "Slack channel handoffs per brand",
      "API access",
      "Dedicated success rep",
      "Priority support, 4h response",
      "Cancel anytime — no contracts",
    ],
    popular: false,
    ctaLabel: "Start with Agency",
  },
] as const;

/** Enterprise is contact-only. Surfaced as the third card on the pricing
 *  page and as the sales hand-off everywhere SSO / BAA / 10+ brands /
 *  regulated industry comes up. No price is ever posted. */
export const ENTERPRISE_CONTACT = {
  headline: "Need SSO, audit logs, BAA, or 10+ brands?",
  cta: "Talk to sales",
  href: "/contact?topic=enterprise",
  features: [
    "Unlimited brands",
    "SSO (Okta, Google Workspace, Microsoft AD)",
    "Audit logs to SIEM",
    "Custom compliance rulesets",
    "BAA available",
    "Custom model routing",
    "White-glove onboarding",
    "Dedicated CSM",
    "1h response SLA + 99.95% uptime",
    "SOC 2 Type II (in progress)",
  ] as const,
} as const;

export const PLAN_BY_KEY: Record<PlanKey, Plan> = PLANS.reduce(
  (acc, p) => ({ ...acc, [p.key]: p }),
  {} as Record<PlanKey, Plan>,
);

/** Format a USD price for display. Always returns the symbol-prefixed form. */
export function formatPrice(amountUsd: number): string {
  return `$${amountUsd.toLocaleString("en-US")}`;
}
