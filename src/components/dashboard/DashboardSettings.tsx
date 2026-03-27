import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Check, ExternalLink } from "lucide-react";

const tabs = ["Profile", "Billing", "Notifications"];

const PLANS = {
  free: { name: "Free", price: 0, price_id: null, features: ["1 business", "5 posts/month", "Basic dashboard"] },
  growth: { name: "Growth", price: 49, price_id: "price_1TEzSrRdWtvqvMKio7e5VO2Y", popular: true, features: ["Unlimited content", "All platforms", "Ad management", "Daily optimization", "Weekly strategy", "Competitor tracking"] },
  agency: { name: "Agency", price: 99, price_id: "price_1TEzTeRdWtvqvMKiWI61UYLk", features: ["Unlimited businesses", "White label", "Client reports", "Everything in Growth"] },
} as const;

type PlanKey = keyof typeof PLANS;

interface NotificationPrefs {
  weekly_content_preview: boolean;
  win_alerts: boolean;
  monthly_strategy_report: boolean;
  daily_ad_summary: boolean;
  competitor_intelligence: boolean;
}

const defaultPrefs: NotificationPrefs = {
  weekly_content_preview: true,
  win_alerts: true,
  monthly_strategy_report: true,
  daily_ad_summary: false,
  competitor_intelligence: true,
};

const notifConfig = [
  { key: "weekly_content_preview" as const, label: "Weekly content preview", desc: "Get your next week of content every Sunday evening for review" },
  { key: "win_alerts" as const, label: "Win alerts", desc: "Get notified immediately when an ad is performing exceptionally well" },
  { key: "monthly_strategy_report" as const, label: "Monthly strategy report", desc: "Receive your monthly performance analysis and updated strategy" },
  { key: "daily_ad_summary" as const, label: "Daily ad summary", desc: "Morning briefing of your ad performance every day at 9am" },
  { key: "competitor_intelligence" as const, label: "Competitor intelligence", desc: "Every Friday get a report on what your competitors are doing" },
];

export default function DashboardSettings() {
  const [activeTab, setActiveTab] = useState("Profile");
  const { user, businessId, isReady } = useAuth();
  const [business, setBusiness] = useState<any>(null);
  const [profileForm, setProfileForm] = useState({ business_name: "", email: "", location: "", industry: "" });
  const [saving, setSaving] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<PlanKey>("free");
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(defaultPrefs);

  useEffect(() => {
    if (!businessId || !isReady) return;
    externalSupabase.from("businesses").select("*").eq("id", businessId).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setBusiness(data);
          setProfileForm({
            business_name: data.business_name ?? "",
            email: data.email ?? "",
            location: data.location ?? "",
            industry: data.industry ?? "",
          });
          const plan = data.plan as string;
          setCurrentPlan(plan === "growth" || plan === "agency" ? plan : "free");
          // Load notification preferences
          if (data.notification_preferences) {
            try {
              const prefs = typeof data.notification_preferences === "string"
                ? JSON.parse(data.notification_preferences)
                : data.notification_preferences;
              setNotifPrefs({ ...defaultPrefs, ...prefs });
            } catch { /* use defaults */ }
          }
        }
      });
  }, [businessId, isReady]);

  const handleSaveProfile = async () => {
    if (!businessId) return;
    setSaving(true);
    const { error } = await externalSupabase.from("businesses").update(profileForm).eq("id", businessId);
    setSaving(false);
    if (error) toast.error("Failed to save");
    else toast.success("Profile updated!");
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure? This will permanently delete your account and all data.")) return;
    if (businessId) await externalSupabase.from("businesses").delete().eq("id", businessId);
    await externalSupabase.auth.signOut();
    window.location.href = "/";
  };

  const handleToggleNotif = async (key: keyof NotificationPrefs, checked: boolean) => {
    const newPrefs = { ...notifPrefs, [key]: checked };
    setNotifPrefs(newPrefs);
    if (businessId) {
      const { error } = await externalSupabase
        .from("businesses")
        .update({ notification_preferences: newPrefs })
        .eq("id", businessId);
      if (error) {
        toast.error("Failed to save preference");
        setNotifPrefs(notifPrefs); // revert
      }
    }
  };

  const handleUpgrade = async (planKey: PlanKey) => {
    const plan = PLANS[planKey];
    if (!plan.price_id) {
      if (businessId) {
        await externalSupabase.from("businesses").update({ plan: "free", plan_price: 0 }).eq("id", businessId);
        setCurrentPlan("free");
        toast.success("Downgraded to Free plan.");
      }
      return;
    }
    setCheckoutLoading(planKey);
    try {
      const email = business?.email || user?.email;
      if (!email) throw new Error("No email found");
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/create-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": anonKey },
        body: JSON.stringify({ priceId: plan.price_id, email }),
      });
      const data = await response.json();
      if (data?.error) throw new Error(data.error);
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast.error(err.message || "Failed to start checkout.");
    }
    setCheckoutLoading(null);
  };

  const handleManageSubscription = async () => {
    try {
      const email = business?.email || user?.email;
      if (!email) throw new Error("No email found");
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/customer-portal`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": anonKey },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (data?.error) throw new Error(data.error);
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast.error(err.message || "Failed to open billing portal.");
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex gap-1 rounded-xl bg-muted p-1">
        {tabs.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            }`}>
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
                <p className="text-sm text-muted-foreground">{PLANS[currentPlan].price > 0 ? `$${PLANS[currentPlan].price}/month` : "Free forever"}</p>
              </div>
              {currentPlan !== "free" && <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">Active</span>}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {(Object.entries(PLANS) as [PlanKey, typeof PLANS[PlanKey]][]).map(([key, plan]) => (
              <div key={key} className={`relative rounded-2xl border-2 p-6 transition-all ${currentPlan === key ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30"}`}>
                {"popular" in plan && plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[10px] font-semibold text-primary-foreground">Most popular</span>
                )}
                <h4 className="text-lg font-bold text-card-foreground">{plan.name}</h4>
                <p className="mt-1 text-2xl font-bold text-foreground">${plan.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                <ul className="mt-4 space-y-2">{plan.features.map((f) => (<li key={f} className="flex items-center gap-2 text-sm text-muted-foreground"><Check className="h-3 w-3 text-primary" /> {f}</li>))}</ul>
                <Button variant={currentPlan === key ? "outline" : "default"} size="sm" className="mt-4 w-full"
                  disabled={currentPlan === key || checkoutLoading !== null} onClick={() => handleUpgrade(key)}>
                  {checkoutLoading === key ? "Redirecting..." : currentPlan === key ? "Current plan" : plan.price < PLANS[currentPlan].price ? "Downgrade" : "Upgrade"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "Notifications" && (
        <div className="space-y-1 rounded-2xl bg-card p-6">
          {notifConfig.map((n) => (
            <div key={n.key} className="flex items-center justify-between py-4 border-b border-border last:border-0">
              <div className="pr-4">
                <p className="text-sm font-medium text-card-foreground">{n.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{n.desc}</p>
              </div>
              <Switch checked={notifPrefs[n.key]} onCheckedChange={(checked) => handleToggleNotif(n.key, checked)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
