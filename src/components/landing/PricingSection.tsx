import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    desc: "Try it out with one business.",
    features: ["1 business", "5 posts per month", "Basic dashboard", "Email support"],
    cta: "Get started",
    popular: false,
  },
  {
    name: "Growth",
    price: "$49",
    period: "/mo",
    desc: "Everything you need to grow.",
    features: ["Unlimited content", "All platforms", "Ad management", "Daily optimization", "Weekly strategy", "Competitor tracking"],
    cta: "Start free trial",
    popular: true,
  },
  {
    name: "Agency",
    price: "$99",
    period: "/mo",
    desc: "For agencies managing multiple brands.",
    features: ["Unlimited businesses", "White label", "Client reports", "Everything in Growth", "Priority support", "Custom integrations"],
    cta: "Start free trial",
    popular: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-28 md:py-40">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            Simple pricing.
            <br />
            <span className="text-muted-foreground">No surprises.</span>
          </h2>
        </div>
        <div className="mx-auto mt-20 grid max-w-4xl gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-3xl p-8 md:p-10 transition-all ${
                plan.popular
                  ? "bg-foreground text-background"
                  : "bg-card text-card-foreground"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-[11px] font-medium text-primary-foreground">
                  Most popular
                </span>
              )}
              <h3 className="text-sm font-medium uppercase tracking-wider opacity-60">{plan.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-5xl font-semibold tracking-tight">{plan.price}</span>
                <span className="text-sm opacity-50">{plan.period}</span>
              </div>
              <p className={`mt-3 text-sm ${plan.popular ? "opacity-60" : "text-muted-foreground"}`}>
                {plan.desc}
              </p>
              <ul className="mt-8 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <Check className="h-4 w-4 shrink-0 text-primary" strokeWidth={2.5} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="mt-10 block">
                <Button
                  className="w-full"
                  variant={plan.popular ? "hero" : "outline"}
                  size="lg"
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
