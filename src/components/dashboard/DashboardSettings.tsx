import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Check, ExternalLink, Clock } from "lucide-react";

const tabs = ["Profile", "Billing", "Notifications", "Workflows"];

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
  content_generation: boolean;
  ad_optimization: boolean;
  strategy_review: boolean;
  monthly_report: boolean;
  budget_recommendation: boolean;
}

const defaultPrefs: NotificationPrefs = {
  weekly_content_preview: true, win_alerts: true, monthly_strategy_report: true,
  daily_ad_summary: false, competitor_intelligence: true,
  content_generation: true, ad_optimization: true, strategy_review: true,
  monthly_report: true, budget_recommendation: true,
};

const notifConfig = [
  { key: "weekly_content_preview" as const, label: "Weekly content preview", desc: "Get your next week of content every Sunday evening for review" },
  { key: "win_alerts" as const, label: "Win alerts", desc: "Get notified immediately when an ad is performing exceptionally well" },
  { key: "monthly_strategy_report" as const, label: "Monthly strategy report", desc: "Receive your monthly performance analysis and updated strategy" },
  { key: "daily_ad_summary" as const, label: "Daily ad summary", desc: "Morning briefing of your ad performance every day at 9am" },
  { key: "competitor_intelligence" as const, label: "Competitor intelligence", desc: "Every Friday get a report on what your competitors are doing" },
];

const workflowSchedule = [
  { key: "content_generation" as const, label: "Content Generation", schedule: "Every Monday at 9:00 AM", icon: "📝" },
  { key: "ad_optimization" as const, label: "Ad Optimization", schedule: "Every day at 8:00 AM", icon: "📊" },
  { key: "strategy_review" as const, label: "Strategy Review", schedule: "Every Sunday at 10:00 PM", icon: "🎯" },
  { key: "monthly_report" as const, label: "Monthly Report", schedule: "1st of every month", icon: "📋" },
  { key: "budget_recommendation" as const, label: "Budget Recommendation", schedule: "28th of every month", icon: "💰" },
];

export default function DashboardSettings() {
  const [activeTab, setActiveTab] = useState("Profile");
  const { user, businessId, isReady } = useAuth();
  const [business, setBusiness] = useState<any>(null);
  const [profileForm, setProfileForm] = useState({
    business_name: "", email: "", location: "", industry: "",
    target_audience: "", brand_tone: "", marketing_goal: "", competitors: "", daily_budget: 0,
  });
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
            business_name: data.business_name ?? "", email: data.email ?? "",
            location: data.location ?? "", industry: data.industry ?? "",
            target_audience: data.target_audience ?? "", brand_tone: data.brand_tone ?? "",
            marketing_goal: data.marketing_goal ?? "", competitors: data.competitors ?? "",
            daily_budget: data.daily_budget ?? 0,
          });
          const plan = data.plan as string;
          setCurrentPlan(plan === "growth" || plan === "agency" ? plan : "free");
          if (data.notification_preferences) {
            try {
              const prefs = typeof data.notification_preferences === "string"
                ? JSON.parse(data.notification_preferences) : data.notification_preferences;
              setNotifPrefs({ ...defaultPrefs, ...prefs });
            } catch { /* defaults */ }
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
      const { error } = await externalSupabase.from("businesses").update({ notification_preferences: newPrefs }).eq("id", businessId);
      if (error) { toast.error("Failed to save preference"); setNotifPrefs(notifPrefs); }
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
      const response = await fetch(`https://zqhyrbttuqkvmdewiytf.supabase.co/functions/v1/create-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": "sb_publishable_4O2w1ObpYPQ7eOIlOhwl5A_8GxCt-gs" },
        body: JSON.stringify({ priceId: plan.price_id, email }),
      });
      const data = await response.json();
      if (data?.error) throw new Error(data.error);
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) { toast.error(err.message || "Failed to start checkout."); }
    setCheckoutLoading(null);
  };

  const handleManageSubscription = async () => {
    try {
      const email = business?.email || user?.email;
      if (!email) throw new Error("No email found");
      const response = await fetch(`https://zqhyrbttuqkvmdewiytf.supabase.co/functions/v1/customer-portal`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": "sb_publishable_4O2w1ObpYPQ7eOIlOhwl5A_8GxCt-gs" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (data?.error) throw new Error(data.error);
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) { toast.error(err.message || "Failed to open billing portal."); }
  };

  const handleChangePassword = async () => {
    const email = user?.email;
    if (!email) { toast.error("No email found"); return; }
    try {
      const { error } = await externalSupabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Password reset link sent to your email!");
    } catch (err: any) {
      toast.error(err.message || "Failed to send reset email");
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex gap-1 rounded-xl bg-muted p-1">
        {tabs.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-colors ${
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
          <div><Label>Target Audience</Label><Textarea value={profileForm.target_audience} onChange={(e) => setProfileForm((f) => ({ ...f, target_audience: e.target.value }))} className="mt-1" rows={2} /></div>
          <div><Label>Brand Tone</Label><Input value={profileForm.brand_tone} onChange={(e) => setProfileForm((f) => ({ ...f, brand_tone: e.target.value }))} placeholder="e.g. Friendly, professional, playful" /></div>
          <div><Label>Marketing Goal</Label><Input value={profileForm.marketing_goal} onChange={(e) => setProfileForm((f) => ({ ...f, marketing_goal: e.target.value }))} /></div>
          <div><Label>Competitors</Label><Input value={profileForm.competitors} onChange={(e) => setProfileForm((f) => ({ ...f, competitors: e.target.value }))} placeholder="e.g. Joe's Bakery, Sweet Flour" /></div>
          <div><Label>Daily Ad Budget ($)</Label><Input type="number" value={profileForm.daily_budget} onChange={(e) => setProfileForm((f) => ({ ...f, daily_budget: Number(e.target.value) }))} /></div>
          <Button onClick={handleSaveProfile} disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>
          <div className="mt-8 rounded-2xl border border-border p-6">
            <h3 className="font-semibold text-card-foreground">Change Password</h3>
            <p className="mt-1 text-sm text-muted-foreground">We'll send a password reset link to your email.</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={handleChangePassword}>Send reset link</Button>
          </div>
          <div className="mt-4 rounded-2xl border border-destructive/20 p-6">
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

      {activeTab === "Workflows" && (
        <div className="space-y-1 rounded-2xl bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-card-foreground">Automation Schedule</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Toggle each workflow on or off. Active workflows run automatically at the scheduled time.</p>
          {workflowSchedule.map((w) => (
            <div key={w.key} className="flex items-center justify-between py-4 border-b border-border last:border-0">
              <div className="flex items-center gap-3 pr-4">
                <span className="text-lg">{w.icon}</span>
                <div>
                  <p className="text-sm font-medium text-card-foreground">{w.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{w.schedule}</p>
                </div>
              </div>
              <Switch checked={notifPrefs[w.key]} onCheckedChange={(checked) => handleToggleNotif(w.key, checked)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
