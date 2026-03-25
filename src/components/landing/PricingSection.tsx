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
    period: "/month",
    desc: "Everything you need to grow.",
    features: [
      "Unlimited content",
      "All platforms",
      "Ad management",
      "Daily optimization",
      "Weekly strategy",
      "Competitor tracking",
    ],
    cta: "Start free trial",
    popular: true,
  },
  {
    name: "Agency",
    price: "$99",
    period: "/month",
    desc: "For agencies managing multiple brands.",
    features: [
      "Unlimited businesses",
      "White label",
      "Client reports",
      "Everything in Growth",
      "Priority support",
      "Custom integrations",
    ],
    cta: "Start free trial",
    popular: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="border-t border-border py-24 md:py-32">
      <div className="container">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
            No hidden fees. Cancel anytime.
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-4xl gap-8 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 ${
                plan.popular
                  ? "bg-foreground text-background ring-2 ring-foreground"
                  : "bg-card text-card-foreground"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-medium text-primary-foreground">
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className={`text-sm ${plan.popular ? "opacity-60" : "text-muted-foreground"}`}>
                  {plan.period}
                </span>
              </div>
              <p className={`mt-2 text-sm ${plan.popular ? "opacity-70" : "text-muted-foreground"}`}>
                {plan.desc}
              </p>
              <ul className="mt-6 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className={`mt-0.5 h-4 w-4 shrink-0 ${plan.popular ? "text-primary" : "text-primary"}`} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="mt-8 block">
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
