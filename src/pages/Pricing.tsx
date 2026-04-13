import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { postCheckout } from "@/lib/apiClient";

const PLANS = [
  {
    key: "free", name: "Free", monthlyPrice: 0, annualPrice: 0,
    desc: "Try it out with one business.",
    features: ["1 business", "5 posts per month", "Basic dashboard", "Email support"],
    popular: false,
  },
  {
    key: "growth", name: "Growth", monthlyPrice: 59, annualPrice: 49,
    desc: "Everything you need to grow.",
    features: ["Unlimited content generation", "All social platforms", "Meta ad management", "Daily AI optimization", "Weekly strategy reports", "Competitor tracking", "AI image generation", "Priority support"],
    popular: true,
  },
  {
    key: "agency", name: "Agency", monthlyPrice: 99, annualPrice: 83,
    desc: "For agencies managing multiple brands.",
    features: ["Everything in Growth", "Unlimited businesses", "White label dashboard", "Client-facing reports", "Custom integrations", "Dedicated account manager", "API access", "Custom branding"],
    popular: false,
  },
];

export default function Pricing() {
  const [annual, setAnnual] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = async (plan: typeof PLANS[number]) => {
    if (plan.key === "free") { navigate("/signup"); return; }
    if (!user?.id) { navigate("/signup"); return; }

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
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">Simple, transparent pricing</h1>
            <p className="mx-auto mt-4 max-w-lg text-lg text-muted-foreground">No hidden fees. No contracts. Cancel anytime.</p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <span className={`text-sm ${!annual ? "text-foreground font-medium" : "text-muted-foreground"}`}>Monthly</span>
              <button onClick={() => setAnnual(!annual)} className={`relative h-7 w-12 rounded-full transition-colors ${annual ? "bg-primary" : "bg-muted"}`}>
                <div className={`absolute top-0.5 h-6 w-6 rounded-full bg-background shadow transition-transform ${annual ? "translate-x-[22px]" : "translate-x-0.5"}`} />
              </button>
              <span className={`text-sm ${annual ? "text-foreground font-medium" : "text-muted-foreground"}`}>Annual <span className="text-primary">(2 months free)</span></span>
            </div>
          </div>
          <div className="mx-auto mt-16 grid max-w-5xl gap-8 md:grid-cols-3">
            {PLANS.map((plan) => {
              const price = annual ? plan.annualPrice : plan.monthlyPrice;
              return (
                <div key={plan.name} className={`relative rounded-2xl p-8 ${plan.popular ? "bg-foreground text-background ring-2 ring-foreground" : "bg-card text-card-foreground border border-border"}`}>
                  {plan.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-medium text-primary-foreground">Most popular</span>}
                  <h3 className="text-xl font-semibold">{plan.name}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-5xl font-bold">${price}</span>
                    {price > 0 && <span className={`text-sm ${plan.popular ? "opacity-60" : "text-muted-foreground"}`}>/month</span>}
                  </div>
                  <p className={`mt-3 text-sm ${plan.popular ? "opacity-70" : "text-muted-foreground"}`}>{plan.desc}</p>
                  <ul className="mt-8 space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{f}</li>
                    ))}
                  </ul>
                  <Button className="mt-8 w-full" variant={plan.popular ? "default" : "outline"} size="lg" disabled={loading !== null} onClick={() => handleCheckout(plan)}>
                    {loading === plan.key ? "Redirecting..." : price === 0 ? "Get started free" : "Start free trial"}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
