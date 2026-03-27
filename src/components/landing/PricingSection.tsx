import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useState } from "react";

const plans = [
  {
    key: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    desc: "Try it out with one business.",
    features: [
      { text: "1 business", included: true },
      { text: "5 posts per month", included: true },
      { text: "Basic dashboard", included: true },
      { text: "Email support", included: true },
      { text: "Ad management", included: false },
      { text: "Competitor tracking", included: false },
    ],
    cta: "Get started",
    popular: false,
    priceId: null,
  },
  {
    key: "growth",
    name: "Growth",
    price: "$49",
    period: "/mo",
    desc: "Everything you need to grow.",
    features: [
      { text: "Unlimited content", included: true },
      { text: "All platforms", included: true },
      { text: "Ad management", included: true },
      { text: "Daily optimization", included: true },
      { text: "Weekly strategy", included: true },
      { text: "Competitor tracking", included: true },
    ],
    cta: "Start free trial",
    popular: true,
    priceId: "price_1TEzSrRdWtvqvMKio7e5VO2Y",
  },
  {
    key: "agency",
    name: "Agency",
    price: "$99",
    period: "/mo",
    desc: "For agencies managing multiple brands.",
    features: [
      { text: "Unlimited businesses", included: true },
      { text: "White label", included: true },
      { text: "Client reports", included: true },
      { text: "Everything in Growth", included: true },
      { text: "Priority support", included: true },
      { text: "Custom integrations", included: true },
    ],
    cta: "Start free trial",
    popular: false,
    priceId: "price_1TEzTeRdWtvqvMKiWI61UYLk",
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

  const handleCheckout = async (plan: typeof plans[number]) => {
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
        <div className="mx-auto mt-12 sm:mt-16 grid max-w-4xl gap-5 sm:gap-6 px-2 sm:px-0 md:grid-cols-3">
          {plans.map((plan) => (
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
                <span className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">{plan.price}</span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
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
