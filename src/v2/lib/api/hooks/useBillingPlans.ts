/**
 * Plan catalog driven by the backend, with a local fallback.
 *
 *   GET /api/billing/plans   (PUBLIC — no auth)
 *   → { plans: { starter:{name,price,features[]}, growth:{…}, agency:{…} } }
 *     (price is a number)
 *
 * Per the contract we drive PRICE + FEATURES from the API but keep the rest of
 * the copy (description, CTA label, "popular" flag) local in
 * src/lib/constants/plans.ts. If the fetch fails we fall back to the static
 * table entirely — the catalog always renders something real.
 */
import { useQuery } from "@tanstack/react-query";
import { api } from "../client";
import { PLANS, type PlanKey } from "@/lib/constants/plans";

export interface ApiPlan {
  name: string;
  price: number;
  features: string[];
}

export interface BillingPlansResponse {
  plans: Partial<Record<PlanKey, ApiPlan>>;
}

export interface MergedPlan {
  key: PlanKey;
  name: string;
  /** Monthly price, USD. */
  price: number;
  features: string[];
  popular: boolean;
  desc: string;
  ctaLabel: string;
  /** Whether price/features came from the live API or the local fallback. */
  source: "api" | "local";
}

function localPlans(): MergedPlan[] {
  return PLANS.map((p) => ({
    key: p.key,
    name: p.name,
    price: p.monthlyPrice,
    features: [...p.features],
    popular: p.popular,
    desc: p.desc,
    ctaLabel: p.ctaLabel,
    source: "local",
  }));
}

function merge(res: BillingPlansResponse | null | undefined): MergedPlan[] {
  const apiPlans = res?.plans ?? {};
  return PLANS.map((p) => {
    const a = apiPlans[p.key];
    const hasFeatures = Array.isArray(a?.features) && a!.features.length > 0;
    return {
      key: p.key,
      name: a?.name ?? p.name,
      price: typeof a?.price === "number" ? a.price : p.monthlyPrice,
      features: hasFeatures ? a!.features : [...p.features],
      popular: p.popular,
      desc: p.desc,
      ctaLabel: p.ctaLabel,
      source: a ? "api" : "local",
    };
  });
}

export function useBillingPlans() {
  return useQuery<MergedPlan[]>({
    queryKey: ["billing-plans"],
    staleTime: 5 * 60_000,
    // Show the local table instantly, then reconcile with the live catalog.
    placeholderData: localPlans(),
    queryFn: async () => {
      try {
        const res = await api.get<BillingPlansResponse>("/api/billing/plans");
        return merge(res);
      } catch {
        return localPlans();
      }
    },
  });
}
