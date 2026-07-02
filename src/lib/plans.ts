/**
 * Canonical billing tiers — must match maroa-api GET /api/billing/plans
 * (starter $25, growth $59, agency $99).
 */
export type BillingPlanKey = "starter" | "growth" | "agency";

export interface BillingPlan {
  key: BillingPlanKey;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  popular?: boolean;
  desc: string;
  features: string[];
}

export const BILLING_PLANS: BillingPlan[] = [
  {
    key: "starter",
    name: "Starter",
    monthlyPrice: 25,
    annualPrice: 250,
    desc: "Get started with one platform and daily AI content.",
    features: [
      "1 platform",
      "20 AI images/mo",
      "AI brain 1×/day",
      "Content calendar",
      "Email support",
    ],
  },
  {
    key: "growth",
    name: "Growth",
    monthlyPrice: 59,
    annualPrice: 590,
    popular: true,
    desc: "Everything you need to grow across channels.",
    features: [
      "3 platforms",
      "60 AI images/mo",
      "25 Kling + 5 Sora videos",
      "AI brain 3×/day",
      "Paid ads & competitor tracking",
      "Analytics",
    ],
  },
  {
    key: "agency",
    name: "Agency",
    monthlyPrice: 99,
    annualPrice: 990,
    desc: "For agencies managing multiple brands.",
    features: [
      "Unlimited platforms",
      "120 AI images/mo",
      "50 Kling + 15 Sora videos",
      "3 brands",
      "White-label & API access",
      "AI brain 5×/day",
    ],
  },
];

export const DEFAULT_SIGNUP_PLAN: BillingPlanKey = "starter";
