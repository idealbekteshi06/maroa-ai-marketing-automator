import { Button } from "@/components/ui/button";
import { Check, X, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useState } from "react";

type Currency = "EUR" | "USD" | "GBP" | "AED";

const currencySymbols: Record<Currency, string> = {
  EUR: "\u20ac",
  USD: "$",
  GBP: "\u00a3",
  AED: "AED ",
};

const planData = [
  {
    key: "starter",
    name: "Starter",
    prices: { EUR: 19, USD: 21, GBP: 17, AED: 77 },
    desc: "Perfect for getting started.",
    features: [
      { text: "1 social account", included: true },
      { text: "30 AI posts/month", included: true },
      { text: "Basic calendar", included: true },
      { text: "Email support", included: true },
      { text: "Ad management", included: false },
      { text: "Competitor tracking", included: false },
    ],
    cta: "Start free trial",
    popular: false,
    priceId: null as string | null,
  },
  {
    key: "growth",
    name: "Growth",
    prices: { EUR: 49, USD: 54, GBP: 43, AED: 198 },
    desc: "Everything you need to grow.",
    features: [
      { text: "5 social accounts", included: true },
      { text: "Unlimited AI content", included: true },
      { text: "Paid ads management", included: true },
      { text: "Competitor tracking", included: true },
      { text: "Email + WhatsApp campaigns", included: true },
      { text: "Priority support", included: true },
    ],
    cta: "Start free trial",
    popular: true,
    priceId: "price_1TEzSrRdWtvqvMKio7e5VO2Y" as string | null,
  },
  {
    key: "agency",
    name: "Agency",
    prices: { EUR: 99, USD: 109, GBP: 87, AED: 400 },
    desc: "For agencies managing multiple brands.",
    features: [
      { text: "Unlimited accounts", included: true },
      { text: "White-label option", included: true },
      { text: "API access", included: true },
      { text: "Dedicated manager", included: true },
      { text: "Custom integrations", included: true },
      { text: "Everything in Growth", included: true },
    ],
    cta: "Start free trial",
    popular: false,
    priceId: "price_1TEzTeRdWtvqvMKiWI61UYLk" as string | null,
  },
];

const comparisonData = [
  ["Monthly cost", "$49/mo", "$2,000+/mo", "Free (your time)"],
  ["Time investment", "5 min/week", "2-3 hrs/week", "15-20 hrs/week"],
  ["Content creation", "Unlimited AI", "10-20 posts", "You write it all"],
  ["Ad management", "AI-optimized", "Monthly review", "Trial & error"],
  ["Competitor tracking", "Real-time AI", "Quarterly report", "Manual research"],
  ["Reports", "Weekly auto", "Monthly PDF", "Build your own"],
  ["Setup time", "5 minutes", "2-4 weeks", "Ongoing"],
];

export function PricingSection() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [currency, setCurrency] = useState<Currency>("EUR");
  const [isAnnual, setIsAnnual] = useState(false);

  const currencies: Currency[] = ["EUR", "USD", "GBP", "AED"];

  const getDisplayPrice = (plan: typeof planData[number]) => {
    const monthly = plan.prices[currency];
    const amount = isAnnual ? monthly * 10 : monthly;
    const symbol = currencySymbols[currency];
    // For AED the symbol already has a space, for others no space needed
    return `${symbol}${amount}`;
  };

  const handleCheckout = async (plan: typeof planData[number]) => {
    if (!plan.priceId) { navigate("/signup"); return; }
    if (!user) { navigate("/signup"); return; }

    setLoading(plan.key);
    try {
      const email = user.email;
      if (!email) throw new Error("No email found");

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/create-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": anonKey },
        body: JSON.stringify({ priceId: plan.priceId, email }),
      });

      const data = await response.json();
      if (data?.error) throw new Error(data.error);
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast.error(err.message || "Failed to start checkout.");
    }
    setLoading(null);
  };

  return (
    <section id="pricing" className="py-20 sm:py-28 md:py-40 bg-muted/30">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center px-4">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Simple pricing.
          </h2>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-muted-foreground">No surprises. Cancel anytime.</p>
        </div>

        {/* Currency selector */}
        <div className="mx-auto mt-8 flex items-center justify-center gap-2 px-4">
          {currencies.map((c) => (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                currency === c
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Annual / Monthly toggle */}
        <div className="mx-auto mt-5 flex items-center justify-center gap-3 px-4">
          <span className={`text-sm ${!isAnnual ? "font-semibold text-foreground" : "text-muted-foreground"}`}>Monthly</span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
              isAnnual ? "bg-primary" : "bg-muted-foreground/30"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                isAnnual ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
          <span className={`text-sm ${isAnnual ? "font-semibold text-foreground" : "text-muted-foreground"}`}>Annual</span>
          {isAnnual && (
            <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success">Save 20%</span>
          )}
        </div>

        <div className="mx-auto mt-12 sm:mt-16 grid max-w-4xl gap-5 sm:gap-6 px-2 sm:px-0 md:grid-cols-3">
          {planData.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border-2 p-6 sm:p-8 transition-all duration-300 hover:-translate-y-0.5 ${
                plan.popular
                  ? "border-primary bg-card shadow-elevated"
                  : "border-border bg-card hover:shadow-card-hover"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground">
                  Most popular
                </span>
              )}
              <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">{plan.name}</h3>
              <div className="mt-3 sm:mt-4 flex items-baseline gap-1">
                <span className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">{getDisplayPrice(plan)}</span>
                <span className="text-sm text-muted-foreground">{isAnnual ? "/yr" : "/mo"}</span>
              </div>
              <p className="mt-2 sm:mt-3 text-sm text-muted-foreground">{plan.desc}</p>
              <ul className="mt-6 sm:mt-8 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li key={f.text} className="flex items-center gap-2.5 text-sm">
                    {f.included ? (
                      <Check className="h-4 w-4 shrink-0 text-primary" strokeWidth={2.5} />
                    ) : (
                      <X className="h-4 w-4 shrink-0 text-muted-foreground/30" strokeWidth={2} />
                    )}
                    <span className={f.included ? "text-foreground" : "text-muted-foreground/50"}>{f.text}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="mt-6 sm:mt-8 w-full"
                variant={plan.popular ? "default" : "outline"}
                size="lg"
                disabled={loading !== null}
                onClick={() => handleCheckout(plan)}
              >
                {loading === plan.key ? "Redirecting..." : plan.cta}
              </Button>
            </div>
          ))}
        </div>

        {/* Trust bar */}
        <p className="mx-auto mt-8 text-center text-sm text-muted-foreground">
          🔒 SSL Secured · Cancel anytime · No hidden fees · 14-day free trial
        </p>

        {/* Money-back guarantee */}
        <div className="mx-auto mt-10 max-w-md rounded-2xl border border-border bg-card p-6 sm:p-8 text-center shadow-sm">
          <Shield className="mx-auto h-10 w-10 text-primary" />
          <h4 className="mt-4 text-lg font-bold text-foreground">14-Day Money-Back Guarantee</h4>
          <p className="mt-2 text-sm text-muted-foreground">
            Try maroa.ai risk-free. If you are not satisfied within the first 14 days, we will refund your payment in full — no questions asked.
          </p>
        </div>

        {/* Comparison table */}
        <div className="mx-auto mt-16 sm:mt-24 max-w-4xl px-2 sm:px-0">
          <h3 className="text-center text-xl sm:text-2xl font-bold text-foreground">maroa.ai vs the alternatives</h3>
          <div className="mt-8 sm:mt-10 -mx-2 sm:mx-0 overflow-x-auto">
            <table className="w-full text-xs sm:text-sm min-w-[420px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-3 sm:py-4 text-left font-medium text-muted-foreground pr-3">Feature</th>
                  <th className="py-3 sm:py-4 text-center font-bold text-primary px-2">maroa.ai</th>
                  <th className="py-3 sm:py-4 text-center font-medium text-muted-foreground px-2">Agency</th>
                  <th className="py-3 sm:py-4 text-center font-medium text-muted-foreground pl-2">DIY</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map(([feature, maroa, agency, diy]) => (
                  <tr key={feature} className="border-b border-border/50">
                    <td className="py-3 sm:py-4 font-medium text-foreground pr-3 whitespace-nowrap">{feature}</td>
                    <td className="py-3 sm:py-4 text-center font-medium text-primary px-2">{maroa}</td>
                    <td className="py-3 sm:py-4 text-center text-muted-foreground px-2">{agency}</td>
                    <td className="py-3 sm:py-4 text-center text-muted-foreground pl-2">{diy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
