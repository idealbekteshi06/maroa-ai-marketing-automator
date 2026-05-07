/**
 * Canonical pricing for maroa.ai. Used by:
 *   - src/pages/Index.tsx (public landing)
 *   - src/pages/Pricing.tsx
 *   - src/components/dashboard/DashboardSettings.tsx (in-app upgrade)
 *
 * Source of truth: this file. Backend `/api/billing/plans` should match these
 * keys/prices. Currency is € (Balkan-first) per CLAUDE.md.
 */

export type PlanKey = "free" | "starter" | "growth" | "agency";

export interface Plan {
  key: PlanKey;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  desc: string;
  features: readonly string[];
  popular: boolean;
}

export const PLANS: readonly Plan[] = [
  {
    key: "free",
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    desc: "Try everything for 7 days. No credit card.",
    features: [
      "1 business",
      "5 AI posts during trial",
      "Connect 1 platform",
      "Email support",
    ],
    popular: false,
  },
  {
    key: "starter",
    name: "Starter",
    monthlyPrice: 29,
    annualPrice: 19,
    desc: "Solo operator getting started.",
    features: [
      "1 platform",
      "20 AI images / month",
      "Daily AI optimization",
      "Content calendar",
      "Email support",
    ],
    popular: false,
  },
  {
    key: "growth",
    name: "Growth",
    monthlyPrice: 59,
    annualPrice: 39,
    desc: "Most small businesses pick this one.",
    features: [
      "3 platforms",
      "60 AI images / month",
      "25 Kling videos · 5 Sora videos",
      "Daily AI optimization",
      "Paid ads + competitor tracking",
      "Analytics dashboard",
      "Priority support",
    ],
    popular: true,
  },
  {
    key: "agency",
    name: "Agency",
    monthlyPrice: 99,
    annualPrice: 69,
    desc: "Multi-brand operators and agencies.",
    features: [
      "Unlimited platforms",
      "120 AI images / month",
      "50 Kling + 15 Sora videos",
      "Up to 3 brands",
      "White-label dashboard",
      "API access",
      "Dedicated account manager",
    ],
    popular: false,
  },
] as const;

export const PLAN_BY_KEY: Record<PlanKey, Plan> = PLANS.reduce(
  (acc, p) => ({ ...acc, [p.key]: p }),
  {} as Record<PlanKey, Plan>,
);

export const PAID_PLANS = PLANS.filter((p) => p.monthlyPrice > 0);

export function formatPrice(amountEur: number): string {
  return amountEur === 0 ? "Free" : `€${amountEur}`;
}
