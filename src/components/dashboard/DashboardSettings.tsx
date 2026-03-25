import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Check, ExternalLink } from "lucide-react";

const tabs = ["Profile", "Billing", "Notifications"];

const PLANS = {
  free: { name: "Free", price: 0, product_id: null, price_id: null, features: ["1 business", "5 posts/month", "Basic dashboard"] },
  growth: { name: "Growth", price: 49, product_id: "prod_UDQJ9P4MuCqw3G", price_id: "price_1TEzSrRdWtvqvMKio7e5VO2Y", popular: true, features: ["Unlimited content", "All platforms", "Ad management", "Daily optimization", "Weekly strategy", "Competitor tracking"] },
  agency: { name: "Agency", price: 99, product_id: "prod_UDQKixhKr9Pxg7", price_id: "price_1TEzTeRdWtvqvMKiWI61UYLk", features: ["Unlimited businesses", "White label", "Client reports", "Everything in Growth"] },
} as const;

type PlanKey = keyof typeof PLANS;

export default function DashboardSettings() {
  const [activeTab, setActiveTab] = useState("Profile");
  const { user, businessId } = useAuth();
  const [business, setBusiness] = useState<any>(null);
  const [profileForm, setProfileForm] = useState({ business_name: "", email: "", location: "", industry: "" });
  const [saving, setSaving] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<PlanKey>("free");
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [checkingPlan, setCheckingPlan] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!businessId) return;
    externalSupabase
      .from("businesses")
      .select("*")
      .eq("id", businessId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setBusiness(data);
          setProfileForm({
            business_name: data.business_name ?? "",
            email: data.email ?? "",
            location: data.location ?? "",
            industry: data.industry ?? "",
          });
        }
      });
  }, [businessId]);

  // Check subscription status
  const checkSubscription = async () => {
    setCheckingPlan(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setCheckingPlan(false); return; }

      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error || data?.error) {
        console.warn("Subscription check failed:", error || data?.error);
        setCheckingPlan(false);
        return;
      }

      if (data?.subscribed && data?.product_id) {
        const matchedPlan = (Object.entries(PLANS) as [PlanKey, typeof PLANS[PlanKey]][]).find(
          ([_, p]) => p.product_id === data.product_id
        );
        if (matchedPlan) {
          setCurrentPlan(matchedPlan[0]);
          setSubscriptionEnd(data.subscription_end);
        }
      } else {
        setCurrentPlan("free");
        setSubscriptionEnd(null);
      }
    } catch (err) {
      console.warn("Subscription check error:", err);
    }
    setCheckingPlan(false);
  };

  useEffect(() => {
    checkSubscription();
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveProfile = async () => {
    if (!businessId) return;
    setSaving(true);
    const { error } = await externalSupabase
      .from("businesses")
      .update(profileForm)
      .eq("id", businessId);
    setSaving(false);
    if (error) toast.error("Failed to save");
    else toast.success("Profile updated!");
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure? This will permanently delete your account and all data.")) return;
    if (businessId) {
      await externalSupabase.from("businesses").delete().eq("id", businessId);
    }
    await externalSupabase.auth.signOut();
    window.location.href = "/";
  };

  const handleUpgrade = async (planKey: PlanKey) => {
    const plan = PLANS[planKey];
    if (!plan.price_id) {
      // Downgrade to free
      if (businessId) {
        await externalSupabase.from("businesses").update({ plan: "free", plan_price: 0 }).eq("id", businessId);
        setCurrentPlan("free");
        setSubscriptionEnd(null);
        toast.success("Downgraded to Free plan.");
      }
      return;
    }

    setCheckoutLoading(planKey);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: plan.price_id },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error || data?.error) throw new Error(data?.error || "Checkout failed");

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to start checkout.");
    }
    setCheckoutLoading(null);
  };

  const handleManageSubscription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("customer-portal", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error || data?.error) throw new Error(data?.error || "Portal failed");
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast.error(err.message || "Failed to open billing portal.");
    }
  };

  const formattedEnd = subscriptionEnd
    ? new Date(subscriptionEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex gap-1 rounded-xl bg-muted p-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Profile" && (
        <div className="space-y-4 rounded-2xl bg-card p-6">
          <div><Label>Business name</Label><Input value={profileForm.business_name} onChange={(e) => setProfileForm((f) => ({ ...f, business_name: e.target.value }))} /></div>
          <div><Label>Email</Label><Input value={profileForm.email} onChange={(e) => setProfileForm((f) => ({ ...f, email: e.target.value }))} /></div>
          <div><Label>Location</Label><Input value={profileForm.location} onChange={(e) => setProfileForm((f) => ({ ...f, location: e.target.value }))} /></div>
          <div><Label>Industry</Label><Input value={profileForm.industry} onChange={(e) => setProfileForm((f) => ({ ...f, industry: e.target.value }))} /></div>
          <Button onClick={handleSaveProfile} disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>

          <div className="mt-8 rounded-2xl border border-destructive/20 p-6">
            <h3 className="font-semibold text-destructive">Danger zone</h3>
            <p className="mt-1 text-sm text-muted-foreground">Permanently delete your account and all data.</p>
            <Button variant="destructive" size="sm" className="mt-4" onClick={handleDeleteAccount}>Delete account</Button>
          </div>
        </div>
      )}

      {activeTab === "Billing" && (
        <div className="space-y-6">
          {/* Current Plan */}
          <div className="rounded-2xl bg-card p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-card-foreground">Current Plan</h3>
              {currentPlan !== "free" && (
                <Button variant="outline" size="sm" onClick={handleManageSubscription}>
                  <ExternalLink className="mr-2 h-3 w-3" /> Manage subscription
                </Button>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl bg-muted p-4">
              <div>
                <p className="font-medium text-foreground capitalize">{PLANS[currentPlan].name} Plan</p>
                <p className="text-sm text-muted-foreground">
                  {PLANS[currentPlan].price > 0
                    ? `$${PLANS[currentPlan].price}/month${formattedEnd ? ` · Next billing: ${formattedEnd}` : ""}`
                    : "Free forever"}
                </p>
              </div>
              {currentPlan !== "free" && (
                <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">Active</span>
              )}
            </div>
            <Button variant="ghost" size="sm" className="mt-2" onClick={checkSubscription} disabled={checkingPlan}>
              {checkingPlan ? "Checking..." : "Refresh status"}
            </Button>
          </div>

          {/* Plan Options */}
          <div className="grid gap-4 sm:grid-cols-3">
            {(Object.entries(PLANS) as [PlanKey, typeof PLANS[PlanKey]][]).map(([key, plan]) => (
              <div
                key={key}
                className={`relative rounded-2xl border-2 p-6 transition-all ${
                  currentPlan === key ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30"
                }`}
              >
                {"popular" in plan && plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[10px] font-semibold text-primary-foreground">
                    Most popular
                  </span>
                )}
                <h4 className="text-lg font-bold text-card-foreground">{plan.name}</h4>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  ${plan.price}<span className="text-sm font-normal text-muted-foreground">/mo</span>
                </p>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-3 w-3 text-primary" /> {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={currentPlan === key ? "outline" : "default"}
                  size="sm"
                  className="mt-4 w-full"
                  disabled={currentPlan === key || checkoutLoading !== null}
                  onClick={() => handleUpgrade(key)}
                >
                  {checkoutLoading === key
                    ? "Redirecting..."
                    : currentPlan === key
                    ? "Current plan"
                    : plan.price < PLANS[currentPlan].price
                    ? "Downgrade"
                    : "Upgrade"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "Notifications" && (
        <div className="space-y-4 rounded-2xl bg-card p-6">
          {["Weekly performance report", "Content ready for approval", "Ad campaign updates", "Competitor insights"].map((n) => (
            <div key={n} className="flex items-center justify-between">
              <span className="text-sm text-card-foreground">{n}</span>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" defaultChecked className="peer sr-only" />
                <div className="h-6 w-11 rounded-full bg-muted peer-checked:bg-primary after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-background after:transition-all peer-checked:after:translate-x-full" />
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
