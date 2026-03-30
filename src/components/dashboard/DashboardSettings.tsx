import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Check, ExternalLink, Clock, Shield, Trash2 } from "lucide-react";

const tabs = ["Profile", "Billing", "Notifications", "Account"];

const PLANS = {
  free: { name: "Free", price: 0, price_id: null, features: ["1 business", "5 posts/month with watermark", "Basic dashboard"] },
  growth: { name: "Growth", price: 49, price_id: "price_1TEzSrRdWtvqvMKio7e5VO2Y", popular: true, features: ["Unlimited content", "All platforms", "Ad management", "Daily optimization", "Weekly strategy", "Competitor tracking", "Monthly reports"] },
  agency: { name: "Agency", price: 99, price_id: "price_1TEzTeRdWtvqvMKiWI61UYLk", features: ["Everything in Growth", "Unlimited businesses", "White label", "Client reports", "Priority support"] },
} as const;
type PlanKey = keyof typeof PLANS;

const planBadge: Record<string, string> = {
  free: "bg-green-500/10 text-green-600 dark:text-green-400",
  growth: "bg-primary/10 text-primary",
  agency: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
};

const industries = ["Bakery", "Restaurant", "Café", "Salon & Spa", "Gym & Fitness", "Boutique & Retail", "Photography", "Real Estate", "Coaching & Consulting", "Medical & Dental", "Auto Services", "Home Services", "E-commerce", "Professional Services", "Healthcare", "Education", "Technology", "Food & Beverage", "Entertainment", "Other"];
const tones = ["Professional", "Friendly", "Casual", "Energetic", "Luxurious"];
const goals = ["Get more customers", "Increase brand awareness", "Drive online sales", "Build email list"];

interface NotificationPrefs {
  weekly_content_preview: boolean; win_alerts: boolean; monthly_strategy_report: boolean;
  daily_ad_summary: boolean; competitor_intelligence: boolean; reactivation_emails: boolean;
}
const defaultPrefs: NotificationPrefs = { weekly_content_preview: true, win_alerts: true, monthly_strategy_report: true, daily_ad_summary: false, competitor_intelligence: true, reactivation_emails: true };

const notifConfig = [
  { key: "weekly_content_preview" as const, label: "Weekly content preview", desc: "Every Sunday you get a preview of next week's content" },
  { key: "win_alerts" as const, label: "Win alerts", desc: "Instant notification when an ad hits exceptional performance" },
  { key: "monthly_strategy_report" as const, label: "Monthly strategy report", desc: "Full analysis of your marketing delivered on the 1st" },
  { key: "daily_ad_summary" as const, label: "Daily ad summary", desc: "Quick overview of ad performance every morning" },
  { key: "competitor_intelligence" as const, label: "Competitor intelligence", desc: "Every Friday get a full report on competitor activity" },
  { key: "reactivation_emails" as const, label: "Reactivation emails", desc: "If you're inactive for 14 days we check in" },
];

export default function DashboardSettings() {
  const [activeTab, setActiveTab] = useState("Profile");
  const { user, businessId, isReady } = useAuth();
  const [business, setBusiness] = useState<any>(null);
  const [form, setForm] = useState({
    business_name: "", email: "", location: "", industry: "",
    target_audience: "", brand_tone: "", marketing_goal: "", competitors: "", daily_budget: 0,
  });
  const [saving, setSaving] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<PlanKey>("free");
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(defaultPrefs);

  useEffect(() => {
    if (!businessId || !isReady) return;
    externalSupabase.from("businesses").select("*").eq("id", businessId).maybeSingle().then(({ data }) => {
      if (!data) return;
      setBusiness(data);
      setForm({
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
          const prefs = typeof data.notification_preferences === "string" ? JSON.parse(data.notification_preferences) : data.notification_preferences;
          setNotifPrefs({ ...defaultPrefs, ...prefs });
        } catch { /* defaults */ }
      }
    });
  }, [businessId, isReady]);

  const handleSaveProfile = async () => {
    if (!businessId) return;
    setSaving(true);
    const { error } = await externalSupabase.from("businesses").update(form).eq("id", businessId);
    setSaving(false);
    if (error) toast.error("Failed to save"); else toast.success("Profile updated!");
  };

  const handleToggleNotif = async (key: keyof NotificationPrefs, checked: boolean) => {
    const newPrefs = { ...notifPrefs, [key]: checked };
    setNotifPrefs(newPrefs);
    if (businessId) {
      const { error } = await externalSupabase.from("businesses").update({ notification_preferences: newPrefs }).eq("id", businessId);
      if (error) { toast.error("Failed to save"); setNotifPrefs(notifPrefs); }
    }
  };

  const handleUpgrade = async (planKey: PlanKey) => {
    const plan = PLANS[planKey];
    if (!plan.price_id) {
      if (businessId) { await externalSupabase.from("businesses").update({ plan: "free", plan_price: 0 }).eq("id", businessId); setCurrentPlan("free"); toast.success("Downgraded to Free."); }
      return;
    }
    setCheckoutLoading(planKey);
    try {
      const email = business?.email || user?.email;
      if (!email) throw new Error("No email found");
      const res = await fetch("https://zqhyrbttuqkvmdewiytf.supabase.co/functions/v1/create-checkout", {
        method: "POST", headers: { "Content-Type": "application/json", apikey: "sb_publishable_4O2w1ObpYPQ7eOIlOhwl5A_8GxCt-gs" },
        body: JSON.stringify({ priceId: plan.price_id, email }),
      });
      const data = await res.json();
      if (data?.error) throw new Error(data.error);
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) { toast.error(err.message || "Failed"); }
    setCheckoutLoading(null);
  };

  const handleManageSub = async () => {
    try {
      const email = business?.email || user?.email;
      const res = await fetch("https://zqhyrbttuqkvmdewiytf.supabase.co/functions/v1/customer-portal", {
        method: "POST", headers: { "Content-Type": "application/json", apikey: "sb_publishable_4O2w1ObpYPQ7eOIlOhwl5A_8GxCt-gs" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) { toast.error(err.message || "Failed"); }
  };

  const handleChangePassword = async () => {
    const email = user?.email;
    if (!email) { toast.error("No email found"); return; }
    const { error } = await externalSupabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    if (error) toast.error(error.message); else toast.success("Password reset link sent!");
  };

  const handleDeleteAccount = async () => {
    if (!confirm("This will permanently delete your business data and cancel your subscription. Are you sure?")) return;
    if (businessId) await externalSupabase.from("businesses").delete().eq("id", businessId);
    await externalSupabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex gap-1 rounded-xl bg-muted p-1">
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-colors ${activeTab === tab ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Profile" && (
        <div className="space-y-4 rounded-2xl bg-card border border-border p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-card-foreground">Business Profile</h3>
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${planBadge[currentPlan]}`}>{PLANS[currentPlan].name}</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Business name</Label><Input value={form.business_name} onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))} className="mt-1" /></div>
            <div><Label>Email</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="mt-1" /></div>
            <div><Label>Location</Label><Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="mt-1" /></div>
            <div>
              <Label>Industry</Label>
              <Select value={form.industry} onValueChange={v => setForm(f => ({ ...f, industry: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select industry" /></SelectTrigger>
                <SelectContent>{industries.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Brand Tone</Label>
              <Select value={form.brand_tone} onValueChange={v => setForm(f => ({ ...f, brand_tone: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select tone" /></SelectTrigger>
                <SelectContent>{tones.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Marketing Goal</Label>
              <Select value={form.marketing_goal} onValueChange={v => setForm(f => ({ ...f, marketing_goal: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select goal" /></SelectTrigger>
                <SelectContent>{goals.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Target Audience</Label><Textarea value={form.target_audience} onChange={e => setForm(f => ({ ...f, target_audience: e.target.value }))} className="mt-1" rows={2} /></div>
          <div><Label>Competitors</Label><Textarea value={form.competitors} onChange={e => setForm(f => ({ ...f, competitors: e.target.value }))} className="mt-1" rows={2} placeholder="e.g. Joe's Bakery, Sweet Flour" /></div>
          <div><Label>Daily Ad Budget ($)</Label><Input type="number" value={form.daily_budget} onChange={e => setForm(f => ({ ...f, daily_budget: Number(e.target.value) }))} className="mt-1 max-w-[200px]" /></div>
          <Button onClick={handleSaveProfile} disabled={saving} className="min-w-[120px]">{saving ? "Saving..." : "Save changes"}</Button>
        </div>
      )}

      {activeTab === "Billing" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-card-foreground">Current Plan</h3>
              {currentPlan !== "free" && <Button variant="outline" size="sm" onClick={handleManageSub}><ExternalLink className="mr-2 h-3 w-3" /> Manage</Button>}
            </div>
            <div className="mt-4 rounded-xl bg-muted p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground capitalize">{PLANS[currentPlan].name}</p>
                <p className="text-sm text-muted-foreground">{PLANS[currentPlan].price > 0 ? `$${PLANS[currentPlan].price}/month` : "Free forever"}</p>
              </div>
              {currentPlan !== "free" && <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-600 dark:text-green-400">Active</span>}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {(Object.entries(PLANS) as [PlanKey, typeof PLANS[PlanKey]][]).map(([key, plan]) => (
              <div key={key} className={`relative rounded-2xl border-2 p-6 transition-all ${currentPlan === key ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30"}`}>
                {"popular" in plan && plan.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[10px] font-semibold text-primary-foreground">Most popular</span>}
                <h4 className="text-lg font-bold text-card-foreground">{plan.name}</h4>
                <p className="mt-1 text-2xl font-bold text-foreground">${plan.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                <ul className="mt-4 space-y-2">{plan.features.map(f => <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground"><Check className="h-3 w-3 text-primary shrink-0" /> {f}</li>)}</ul>
                <Button variant={currentPlan === key ? "outline" : "default"} size="sm" className="mt-4 w-full"
                  disabled={currentPlan === key || checkoutLoading !== null} onClick={() => handleUpgrade(key)}>
                  {checkoutLoading === key ? "Redirecting..." : currentPlan === key ? "Current plan" : "Upgrade"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "Notifications" && (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-1">
          {notifConfig.map(n => (
            <div key={n.key} className="flex items-center justify-between py-4 border-b border-border last:border-0">
              <div className="pr-4">
                <p className="text-sm font-medium text-card-foreground">{n.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{n.desc}</p>
              </div>
              <Switch checked={notifPrefs[n.key]} onCheckedChange={checked => handleToggleNotif(n.key, checked)} />
            </div>
          ))}
        </div>
      )}

      {activeTab === "Account" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-3"><Shield className="h-4 w-4 text-primary" /><h3 className="font-semibold text-card-foreground">Change Password</h3></div>
            <p className="text-sm text-muted-foreground mb-4">We'll send a password reset link to your email.</p>
            <Button variant="outline" size="sm" onClick={handleChangePassword}>Send reset link</Button>
          </div>
          <div className="rounded-2xl border border-destructive/20 bg-card p-6">
            <div className="flex items-center gap-2 mb-3"><Trash2 className="h-4 w-4 text-destructive" /><h3 className="font-semibold text-destructive">Danger Zone</h3></div>
            <p className="text-sm text-muted-foreground mb-4">This will permanently delete your business data and cancel your subscription.</p>
            <Button variant="destructive" size="sm" onClick={handleDeleteAccount}>Delete account</Button>
          </div>
        </div>
      )}
    </div>
  );
}
