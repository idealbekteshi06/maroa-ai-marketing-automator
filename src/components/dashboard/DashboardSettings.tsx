import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Check } from "lucide-react";

const tabs = ["Profile", "Billing", "Notifications"];

// TODO: Replace with your Stripe publishable key
const STRIPE_PUBLISHABLE_KEY = "pk_test_51T8u8ORdWtvqvMKip8L7l2bBsBMQUW7lznYBXpLZqdZSjhweHF2sDpqBVsKysz6K4XYjvzZK34c4jdT0PM9sPxYU00SWfZxY0y";

const plans = [
  { id: "free", name: "Free", price: 0, features: ["1 business", "5 posts/month", "Basic dashboard"] },
  { id: "growth", name: "Growth", price: 49, popular: true, features: ["Unlimited content", "All platforms", "Ad management", "Daily optimization", "Weekly strategy", "Competitor tracking"] },
  { id: "agency", name: "Agency", price: 99, features: ["Unlimited businesses", "White label", "Client reports", "Everything in Growth"] },
];

// Stripe Price IDs — replace with your actual Stripe price IDs
const STRIPE_PRICE_IDS: Record<string, string> = {
  growth: "price_GROWTH_MONTHLY_ID",
  agency: "price_AGENCY_MONTHLY_ID",
};

export default function DashboardSettings() {
  const [activeTab, setActiveTab] = useState("Profile");
  const { user, businessId } = useAuth();
  const [business, setBusiness] = useState<any>(null);
  const [profileForm, setProfileForm] = useState({ business_name: "", email: "", location: "", industry: "" });
  const [saving, setSaving] = useState(false);

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
    // Delete business data
    if (businessId) {
      await externalSupabase.from("businesses").delete().eq("id", businessId);
    }
    // Sign out
    await externalSupabase.auth.signOut();
    window.location.href = "/";
  };

  const currentPlan = business?.plan ?? "free";
  const currentPlanPrice = business?.plan_price ?? 0;

  const handleChangePlan = async (planId: string) => {
    if (planId === "free") {
      // Downgrade to free — update DB
      if (businessId) {
        await externalSupabase
          .from("businesses")
          .update({ plan: "free", plan_price: 0 })
          .eq("id", businessId);
        setBusiness((prev: any) => ({ ...prev, plan: "free", plan_price: 0 }));
        toast.success("Downgraded to Free plan.");
      }
      return;
    }

    // Redirect to Stripe Checkout
    const priceId = STRIPE_PRICE_IDS[planId];
    if (!priceId || priceId.includes("YOUR")) {
      toast.error("Stripe price IDs not configured yet. Update STRIPE_PRICE_IDS in DashboardSettings.tsx");
      return;
    }

    try {
      // For now, open Stripe checkout via a simple redirect
      // In production, create a checkout session via an edge function
      toast.info("Stripe checkout integration — configure your price IDs and checkout endpoint.");
    } catch (err) {
      toast.error("Failed to start checkout.");
    }
  };

  const nextBillingDate = new Date();
  nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
  const formattedBillingDate = nextBillingDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

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
            <h3 className="font-semibold text-card-foreground">Current Plan</h3>
            <div className="mt-4 flex items-center justify-between rounded-xl bg-muted p-4">
              <div>
                <p className="font-medium text-foreground capitalize">{currentPlan} Plan</p>
                <p className="text-sm text-muted-foreground">
                  {currentPlanPrice > 0 ? `$${currentPlanPrice}/month · Next billing: ${formattedBillingDate}` : "Free forever"}
                </p>
              </div>
              {currentPlan !== "free" && (
                <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">Active</span>
              )}
            </div>
          </div>

          {/* Plan Options */}
          <div className="grid gap-4 sm:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-2xl border-2 p-6 transition-all ${
                  currentPlan === plan.id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30"
                }`}
              >
                {plan.popular && (
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
                  variant={currentPlan === plan.id ? "outline" : "default"}
                  size="sm"
                  className="mt-4 w-full"
                  disabled={currentPlan === plan.id}
                  onClick={() => handleChangePlan(plan.id)}
                >
                  {currentPlan === plan.id ? "Current plan" : currentPlan !== "free" && plan.price < (business?.plan_price ?? 0) ? "Downgrade" : "Upgrade"}
                </Button>
              </div>
            ))}
          </div>

          {/* Stripe Key Notice */}
          <div className="rounded-xl bg-muted p-4">
            <p className="text-xs text-muted-foreground">
              💡 To enable payments, update <code className="rounded bg-background px-1 py-0.5 text-[10px]">STRIPE_PUBLISHABLE_KEY</code> and{" "}
              <code className="rounded bg-background px-1 py-0.5 text-[10px]">STRIPE_PRICE_IDS</code> in <code className="rounded bg-background px-1 py-0.5 text-[10px]">DashboardSettings.tsx</code>
            </p>
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
