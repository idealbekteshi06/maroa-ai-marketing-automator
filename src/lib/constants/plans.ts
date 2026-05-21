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
 *   - Three paid tiers (Starter $29, Growth $59, Agency $99/mo), USD.
 *   - Annual billing matches backend catalog (paid up front).
 *   - Enterprise is contact-only — no posted number.
 *   - NO free tier. NO 7-day trial.
 *   - Cancel anytime — no contracts.
 */

export type PlanKey = "starter" | "growth" | "agency";

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
    key: "starter",
    name: "Starter",
    monthlyPrice: 29,
    annualPrice: 24,
    annualTotal: 290,
    annualSavings: 58,
    currency: "USD",
    desc: "Essential AI marketing for one business getting started.",
    features: [
      "1 platform",
      "1 brand",
      "20 AI images / month",
      "AI brain 1×/day",
      "Content calendar",
      "Email support",
      "Cancel anytime — no contracts",
    ],
    popular: false,
    ctaLabel: "Start with Starter",
  },
  {
    key: "growth",
    name: "Growth",
    monthlyPrice: 59,
    annualPrice: 49,
    annualTotal: 590,
    annualSavings: 118,
    currency: "USD",
    desc: "Full AI marketing for one business — ads, video, and analytics.",
    features: [
      "3 platforms",
      "1 brand",
      "60 AI images / month",
      "25 Kling + 5 Sora videos / month",
      "AI brain 3×/day",
      "Paid ads + competitor tracking",
      "Analytics + pacing alerts",
      "Priority support, 12h response",
      "Cancel anytime — no contracts",
    ],
    popular: true,
    ctaLabel: "Start with Growth",
  },
  {
    key: "agency",
    name: "Agency",
    monthlyPrice: 99,
    annualPrice: 83,
    annualTotal: 990,
    annualSavings: 198,
    currency: "USD",
    desc: "Multi-brand operators — up to 3 brands, white-label, API.",
    features: [
      "Unlimited platforms",
      "Up to 3 brands",
      "120 AI images / month",
      "50 Kling + 15 Sora videos / month",
      "AI brain 5×/day",
      "White-label + API access",
      "Dedicated success rep",
      "Priority support, 4h response",
      "Cancel anytime — no contracts",
    ],
    popular: false,
    ctaLabel: "Start with Agency",
  },
] as const;

/** Enterprise is contact-only. Surfaced as the fourth card on the pricing page. */
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

/** Lowest monthly tier — for meta copy ("From $29/mo"). */
export const STARTING_PRICE_USD = PLANS[0].monthlyPrice;

/** Format a USD price for display. Always returns the symbol-prefixed form. */
export function formatPrice(amountUsd: number): string {
  return `$${amountUsd.toLocaleString("en-US")}`;
}
