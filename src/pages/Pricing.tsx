import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { postCheckout } from "@/lib/apiClient";
import { PLANS, ENTERPRISE_CONTACT, type Plan } from "@/lib/constants/plans";
import { useSEO } from "@/hooks/useSEO";

/**
 * Pricing page — premium 2-tier + Enterprise.
 *
 * Three cards: Growth (popular, scaled + accent border + pill) /
 * Agency / Enterprise (contact-only, no price). No annual toggle —
 * the annual price is shown as a small line under each monthly price
 * so the customer can see the saving without having to click anything.
 *
 * No free tier. No 7-day trial. No money-back guarantee. The entire
 * risk-reversal mechanism is "cancel anytime, no contracts" — stated
 * once below the grid and once inside each plan's feature list.
 */
export default function Pricing() {
  useSEO({
    title: "Pricing — $149 Growth / $599 Agency",
    description:
      "Two paid plans. Growth $149/mo for one business. Agency $599/mo for up to 5 brands. Annual saves ~30%. Cancel anytime — no contracts, no lock-in, no refunds needed.",
    path: "/pricing",
  });
  const [loading, setLoading] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = async (plan: Plan) => {
    if (!user?.id) {
      navigate(`/signup?plan=${plan.key}`);
      return;
    }
    setLoading(plan.key);
    try {
      const result = await postCheckout(user.id, plan.key);
      if (result.checkout_url) window.location.href = result.checkout_url;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to start checkout.");
    }
    setLoading(null);
  };

  return (
    <>
      <Navbar />
      <main className="py-24 md:py-32">
        <div className="container">
          {/* Hero */}
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Replace your agency at 10% the cost.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground leading-relaxed">
              Compliance-first AI marketing with reasoning trace, daily ad audits, and an
              approval gate. Cancel anytime.
            </p>
          </div>

          {/* 3-card grid: Growth / Agency / Enterprise */}
          {/* Tablet (md): 2 columns so the popular Growth card and Agency
              card sit side-by-side; Enterprise wraps below full-width.
              lg+ goes back to 3 across. */}
          <div className="mx-auto mt-16 grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3 items-stretch">
            {PLANS.map((plan) => (
              <PlanCard
                key={plan.key}
                plan={plan}
                loading={loading === plan.key}
                onCta={() => handleCheckout(plan)}
              />
            ))}
            <EnterpriseCard onCta={() => navigate(ENTERPRISE_CONTACT.href)} />
          </div>

          {/* Single risk-reversal line — the entire promise. */}
          <p className="mx-auto mt-10 max-w-3xl text-center text-sm text-muted-foreground">
            Cancel anytime. No contracts. No lock-in.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}

/* ── PlanCard — for Growth + Agency ───────────────────────────────────── */
function PlanCard({
  plan,
  loading,
  onCta,
}: {
  plan: Plan;
  loading: boolean;
  onCta: () => void;
}) {
  return (
    <div
      className={`relative rounded-2xl p-7 flex flex-col transition-all ${
        plan.popular
          ? // Popular card lifts: 1.04× scale, 2px primary border,
            // pill above. The page provides the surface — we keep
            // the card on the same off-white bg as its siblings so
            // the lift comes from scale + ring, not a colour swap.
            "bg-card text-card-foreground ring-2 ring-primary shadow-lg scale-[1.04]"
          : "bg-card text-card-foreground border border-border"
      }`}
    >
      {plan.popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-[10px] font-semibold text-primary-foreground uppercase tracking-wider">
          Most popular
        </span>
      )}

      <h3 className="text-xl font-semibold">{plan.name}</h3>

      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-5xl font-bold tracking-tight">${plan.monthlyPrice}</span>
        <span className="text-sm text-muted-foreground">/mo</span>
      </div>

      {/* Annual upsell — small muted line, no toggle. The customer reads
          the saving without having to click. */}
      <p className="mt-1 text-xs text-muted-foreground">
        or ${plan.annualTotal.toLocaleString("en-US")}/yr — save ${plan.annualSavings.toLocaleString("en-US")}
      </p>

      <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{plan.desc}</p>

      <Button
        className="mt-7 w-full"
        variant={plan.popular ? "default" : "outline"}
        size="lg"
        disabled={loading}
        onClick={onCta}
      >
        {loading ? "Redirecting..." : plan.ctaLabel}
        <ArrowRight className="ml-1 h-4 w-4" />
      </Button>

      <ul className="mt-7 space-y-2.5 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span className="text-foreground/85">{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── EnterpriseCard — contact-only, no price ──────────────────────────── */
function EnterpriseCard({ onCta }: { onCta: () => void }) {
  return (
    <div className="relative rounded-2xl p-7 flex flex-col bg-card text-card-foreground border border-border">
      <h3 className="text-xl font-semibold">Enterprise</h3>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-5xl font-bold tracking-tight">Custom</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        10+ brands or regulated industries
      </p>

      <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
        {ENTERPRISE_CONTACT.headline}
      </p>

      <Button
        className="mt-7 w-full"
        variant="outline"
        size="lg"
        onClick={onCta}
      >
        {ENTERPRISE_CONTACT.cta}
        <ArrowRight className="ml-1 h-4 w-4" />
      </Button>

      <ul className="mt-7 space-y-2.5 flex-1">
        {ENTERPRISE_CONTACT.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span className="text-foreground/85">{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
