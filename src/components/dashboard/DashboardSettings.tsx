import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Check, ExternalLink, User, CreditCard, Bell, Zap, Palette, Link2, CalendarClock, Loader2, Trash2, Shield } from "lucide-react";

/* ── Tabs ── */
const tabs = [
  { key: "Profile", label: "Business Profile", icon: User },
  { key: "Platforms", label: "Connected Platforms", icon: Link2 },
  { key: "Billing", label: "Plan & Billing", icon: CreditCard },
  { key: "Brand", label: "Brand Voice", icon: Palette },
  { key: "Automation", label: "AI Preferences", icon: Zap },
  { key: "Notifications", label: "Notifications", icon: Bell },
  { key: "Account", label: "Account", icon: Shield },
];

const PLANS = {
  free: { name: "Free", price: 0, price_id: null, features: ["3 posts/week", "1 platform", "Basic analytics"] },
  growth: { name: "Growth", price: 49, price_id: "price_1TEzSrRdWtvqvMKio7e5VO2Y", popular: true, features: ["Unlimited posts", "All platforms", "AI campaigns", "Competitor tracking", "SEO automation", "CRM & leads", "WhatsApp alerts"] },
  agency: { name: "Agency", price: 99, price_id: "price_1TEzTeRdWtvqvMKiWI61UYLk", features: ["Everything in Growth", "20 client workspaces", "White label branding", "PDF client reports", "Priority support"] },
} as const;
type PlanKey = keyof typeof PLANS;

const industries = ["Restaurant", "Café & Coffee", "Bakery", "Bar & Nightlife", "Fitness & Gym", "Beauty & Salon", "Spa & Wellness", "Retail & Shop", "Fashion", "Jewelry", "Real Estate", "Construction", "IT & Software", "Marketing Agency", "Consulting", "Education", "Healthcare", "Legal", "Automotive", "Photography", "Other"];
const toneOptions = ["Professional", "Friendly", "Playful", "Inspirational", "Luxury", "Educational"];
const goalOptions = ["Get more walk-ins", "Drive online orders", "Grow social following", "Build email list", "Brand awareness", "Generate leads", "Get more reviews", "Increase revenue"];

interface NotifPrefs { [key: string]: boolean }
const defaultNotifs: NotifPrefs = { hot_lead: true, campaign_alert: true, competitor_move: true, content_ready: true, weekly_report: true, seo_opportunity: false, new_review: false, email_stats: false };
const notifConfig = [
  { key: "hot_lead", icon: "🔥", label: "Hot Lead", desc: "Lead scores 75+ points" },
  { key: "campaign_alert", icon: "📣", label: "Campaign Alert", desc: "Significant performance change" },
  { key: "competitor_move", icon: "🎯", label: "Competitor Move", desc: "Major change detected" },
  { key: "content_ready", icon: "✍️", label: "Content Ready", desc: "AI content needs review" },
  { key: "weekly_report", icon: "📊", label: "Weekly Report", desc: "Every Monday morning" },
  { key: "seo_opportunity", icon: "🔍", label: "SEO Opportunity", desc: "New keyword gap found" },
  { key: "new_review", icon: "⭐", label: "New Review", desc: "Customer leaves a review" },
  { key: "email_stats", icon: "📧", label: "Email Stats", desc: "Weekly email performance" },
];

const workflows = [
  { name: "Create posts", schedule: "Monday 9am", freq: "Weekly" },
  { name: "Optimize ads", schedule: "Daily 8am", freq: "Daily" },
  { name: "Track performance", schedule: "Daily 11pm", freq: "Daily" },
  { name: "Retention emails", schedule: "Daily 7am", freq: "Daily" },
  { name: "Competitor check", schedule: "Sunday 8pm", freq: "Weekly" },
  { name: "AI Brain analysis", schedule: "Sunday 8pm", freq: "Weekly" },
  { name: "Lead scoring", schedule: "Daily 6am", freq: "Daily" },
  { name: "Review monitoring", schedule: "Daily 9am", freq: "Daily" },
  { name: "SEO scan", schedule: "Sunday 10pm", freq: "Weekly" },
  { name: "Weekly report", schedule: "Monday 9am", freq: "Weekly" },
];

export default function DashboardSettings() {
  const [activeTab, setActiveTab] = useState("Profile");
  const { user, businessId, isReady } = useAuth();
  const [business, setBusiness] = useState<any>(null);
  const [form, setForm] = useState<Record<string, any>>({
    business_name: "", email: "", location: "", industry: "", website_url: "", description: "", phone: "",
    target_audience: "", brand_tone: "", marketing_goal: "", competitors: "", daily_budget: 0,
  });
  const [currentPlan, setCurrentPlan] = useState<PlanKey>("free");
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>(defaultNotifs);
  const [autopilot, setAutopilot] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [brandTraining, setBrandTraining] = useState(false);

  useEffect(() => {
    if (!businessId || !isReady) return;
    externalSupabase.from("businesses").select("*").eq("id", businessId).maybeSingle().then(({ data }) => {
      if (!data) return;
      setBusiness(data);
      setForm({
        business_name: data.business_name ?? "", email: data.email ?? "",
        location: data.location ?? "", industry: data.industry ?? "",
        website_url: data.website_url ?? "", description: data.description ?? "",
        phone: data.phone ?? "",
        target_audience: data.target_audience ?? "", brand_tone: data.brand_tone ?? "",
        marketing_goal: data.marketing_goal ?? "", competitors: data.competitors ?? "",
        daily_budget: data.daily_budget ?? 0,
      });
      setCurrentPlan((data.plan === "growth" || data.plan === "agency") ? data.plan : "free");
      setAutopilot(!!data.autopilot_enabled);
      if (data.notification_preferences) {
        try {
          const p = typeof data.notification_preferences === "string" ? JSON.parse(data.notification_preferences) : data.notification_preferences;
          setNotifPrefs({ ...defaultNotifs, ...p });
        } catch {}
      }
    });
  }, [businessId, isReady]);

  /* Auto-save profile with debounce */
  const autoSave = useCallback((newForm: Record<string, any>) => {
    clearTimeout(saveTimerRef.current);
    setSaveStatus("saving");
    saveTimerRef.current = setTimeout(async () => {
      if (!businessId) return;
      const { error } = await externalSupabase.from("businesses").update(newForm).eq("id", businessId);
      if (error) { setSaveStatus("error"); toast.error("Failed to save"); }
      else { setSaveStatus("saved"); setTimeout(() => setSaveStatus("idle"), 3000); }
    }, 2000);
  }, [businessId]);

  const updateField = (key: string, value: any) => {
    const newForm = { ...form, [key]: value };
    setForm(newForm);
    autoSave(newForm);
  };

  const handleUpgrade = async (planKey: PlanKey) => {
    const plan = PLANS[planKey];
    if (!plan.price_id) return;
    setCheckoutLoading(planKey);
    try {
      const email = business?.email || user?.email;
      const res = await fetch("https://zqhyrbttuqkvmdewiytf.supabase.co/functions/v1/create-checkout", {
        method: "POST", headers: { "Content-Type": "application/json", apikey: "sb_publishable_4O2w1ObpYPQ7eOIlOhwl5A_8GxCt-gs" },
        body: JSON.stringify({ priceId: plan.price_id, email }),
      });
      const data = await res.json();
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) { toast.error(err.message || "Failed"); }
    setCheckoutLoading(null);
  };

  const handleToggleNotif = async (key: string, checked: boolean) => {
    const newPrefs = { ...notifPrefs, [key]: checked };
    setNotifPrefs(newPrefs);
    if (businessId) {
      const { error } = await externalSupabase.from("businesses").update({ notification_preferences: newPrefs }).eq("id", businessId);
      if (error) { toast.error("Failed to save"); setNotifPrefs(notifPrefs); }
    }
  };

  const handleBrandTrain = async () => {
    if (!businessId) return;
    setBrandTraining(true);
    toast("🧠 Training brand voice...");
    try {
      await fetch("https://maroa-api-production.up.railway.app/webhook/brand-memory-train", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ business_id: businessId }) });
      toast.success("✓ Brand voice updated!");
    } catch { toast.error("Training failed — try again"); }
    setBrandTraining(false);
  };

  return (
    <div className="flex gap-6 pb-20 md:pb-0">
      {/* Left sidebar nav */}
      <div className="hidden md:block w-[200px] shrink-0">
        <div className="sticky top-20 space-y-1">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors ${
                activeTab === tab.key ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
              }`}
              style={activeTab === tab.key ? { boxShadow: "inset 3px 0 0 hsl(var(--primary))" } : undefined}>
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile tabs */}
      <div className="flex-1 space-y-4">
        <div className="flex gap-1 md:hidden overflow-x-auto pb-1">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-2 text-[11px] font-medium rounded-lg whitespace-nowrap transition-colors ${
                activeTab === tab.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>{tab.label}</button>
          ))}
        </div>

        {/* ── Business Profile ── */}
        {activeTab === "Profile" && (
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[15px] font-semibold text-foreground">Business Information</h3>
              {saveStatus === "saving" && <span className="text-[11px] text-muted-foreground">Saving...</span>}
              {saveStatus === "saved" && <span className="text-[11px] text-success">Saved ✓</span>}
              {saveStatus === "error" && <span className="text-[11px] text-destructive">Failed to save</span>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label className="text-xs">Business Name *</Label><Input value={form.business_name} onChange={e => updateField("business_name", e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs">Industry *</Label>
                <Select value={form.industry} onValueChange={v => updateField("industry", v)}><SelectTrigger className="mt-1"><SelectValue placeholder="Select industry" /></SelectTrigger><SelectContent>{industries.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent></Select></div>
              <div><Label className="text-xs">Website URL</Label><Input type="url" value={form.website_url} onChange={e => updateField("website_url", e.target.value)} className="mt-1" placeholder="https://yourbusiness.com" /></div>
              <div><Label className="text-xs">Email</Label><Input value={form.email} onChange={e => updateField("email", e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs">Phone</Label><Input value={form.phone} onChange={e => updateField("phone", e.target.value)} className="mt-1" placeholder="+383 44 123 456" /></div>
              <div><Label className="text-xs">Location</Label><Input value={form.location} onChange={e => updateField("location", e.target.value)} className="mt-1" placeholder="City, Country" /></div>
              <div><Label className="text-xs">Brand Tone</Label>
                <Select value={form.brand_tone} onValueChange={v => updateField("brand_tone", v)}><SelectTrigger className="mt-1"><SelectValue placeholder="Select brand tone" /></SelectTrigger><SelectContent>{toneOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
              <div><Label className="text-xs">Marketing Goal</Label>
                <Select value={form.marketing_goal} onValueChange={v => updateField("marketing_goal", v)}><SelectTrigger className="mt-1"><SelectValue placeholder="Select main goal" /></SelectTrigger><SelectContent>{goalOptions.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="mt-4"><Label className="text-xs">About Your Business</Label><Textarea value={form.description} onChange={e => updateField("description", e.target.value)} className="mt-1" rows={3} placeholder="What does your business do?" /></div>
            <div className="mt-4"><Label className="text-xs">Target Audience</Label><Textarea value={form.target_audience} onChange={e => updateField("target_audience", e.target.value)} className="mt-1" rows={2} placeholder="Describe your ideal customer" /></div>
            <div className="mt-4">
              <Label className="text-xs">Competitors to Monitor</Label>
              <p className="text-[11px] text-muted-foreground mb-1">Add competitor names or websites, one per line</p>
              <Textarea value={form.competitors} onChange={e => updateField("competitors", e.target.value)} className="mt-1" rows={3} placeholder={"Competitor 1\nCompetitor 2"} />
            </div>
            <div className="mt-4"><Label className="text-xs">Daily Ad Budget ($)</Label><Input type="number" value={form.daily_budget} onChange={e => updateField("daily_budget", Number(e.target.value))} className="mt-1 max-w-[200px]" /></div>
          </div>
        )}

        {/* ── Connected Platforms ── */}
        {activeTab === "Platforms" && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-[15px] font-semibold text-foreground mb-4">Connected Platforms</h3>
            <p className="text-xs text-muted-foreground mb-4">Manage your platform connections in the Social Hub tab for full connect/disconnect controls.</p>
            <div className="space-y-3">
              {[
                { name: "Facebook", connected: !!business?.facebook_page_id, desc: "Posts to your page automatically" },
                { name: "Instagram", connected: !!business?.instagram_account_id, desc: "Photos and reels posted daily" },
                { name: "LinkedIn", connected: !!business?.linkedin_connected, desc: "Professional posts published" },
                { name: "Google Ads", connected: !!business?.ad_account_id, desc: "Search and display ads managed" },
                { name: "TikTok", connected: false, desc: "Coming soon — app review pending" },
              ].map(p => (
                <div key={p.name} className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.name}</p>
                    <p className="text-[11px] text-muted-foreground">{p.desc}</p>
                  </div>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${p.connected ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                    {p.connected ? "✓ Connected" : "Not connected"}
                  </span>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => window.dispatchEvent(new CustomEvent("dashboard-navigate", { detail: "social" }))}>
              Manage in Social Hub →
            </Button>
          </div>
        )}

        {/* ── Plan & Billing ── */}
        {activeTab === "Billing" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">You are on the <strong className="text-foreground capitalize">{PLANS[currentPlan].name}</strong> plan{PLANS[currentPlan].price > 0 ? ` — $${PLANS[currentPlan].price}/month` : ""}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {(Object.entries(PLANS) as [PlanKey, typeof PLANS[PlanKey]][]).map(([key, plan]) => (
                <div key={key} className={`relative rounded-xl border-2 p-5 ${currentPlan === key ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                  {"popular" in plan && plan.popular && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold text-primary-foreground">Popular</span>}
                  <h4 className="font-bold text-foreground">{plan.name}</h4>
                  <p className="mt-1 text-2xl font-bold text-foreground">${plan.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                  <ul className="mt-3 space-y-1.5">{plan.features.map(f => <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground"><Check className="h-3 w-3 text-success shrink-0" />{f}</li>)}</ul>
                  <Button variant={currentPlan === key ? "outline" : "default"} size="sm" className="mt-4 w-full"
                    disabled={currentPlan === key || !!checkoutLoading} onClick={() => handleUpgrade(key)}>
                    {checkoutLoading === key ? "Opening checkout..." : currentPlan === key ? "Current Plan" : `Upgrade to ${plan.name}`}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Brand Voice ── */}
        {activeTab === "Brand" && (
          <div className="space-y-4">
            <div className="rounded-xl bg-muted/50 border border-border p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">🧠 How Brand Voice Works</h3>
              <div className="space-y-2">
                {["AI reads your best-performing content", "Learns your exact tone and style", "All future content sounds like you"].map((s, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">{i + 1}</span>
                    <span className="text-xs text-foreground">{s}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground">Content analyzed: 0 pieces</p>
              <p className="text-xs text-muted-foreground">Last trained: Not trained yet</p>
            </div>
            <Button className="w-full" onClick={handleBrandTrain} disabled={brandTraining}>
              {brandTraining ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Training...</> : "🎓 Train Brand Voice Now"}
            </Button>
            <p className="text-[11px] text-muted-foreground text-center">Takes about 30 seconds</p>
          </div>
        )}

        {/* ── AI Preferences ── */}
        {activeTab === "Automation" && (
          <div className="space-y-4">
            <div className={`rounded-2xl bg-card p-6 ${autopilot ? "autopilot-active-border" : "border border-border"}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-foreground">AI Autopilot</h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">When ON, your AI automatically posts to social media, optimizes campaigns, monitors competitors, sends emails, and responds to reviews — all without any action from you.</p>
                  {autopilot ? (
                    <p className="mt-3 text-sm font-medium text-success">✓ Running everything 24/7</p>
                  ) : (
                    <p className="mt-3 text-sm font-medium text-orange-500">⚠ Manual mode active</p>
                  )}
                </div>
                <button
                  onClick={async () => {
                    const next = !autopilot;
                    setAutopilot(next);
                    if (businessId) {
                      const { error } = await externalSupabase.from("businesses").update({ autopilot_enabled: next }).eq("id", businessId);
                      if (error) { toast.error("Failed to save"); setAutopilot(!next); }
                      else toast.success(next ? "✓ Autopilot enabled" : "Autopilot paused");
                    }
                  }}
                  style={{
                    width: 64, height: 32, borderRadius: 16, position: "relative", border: "none", cursor: "pointer", padding: 0,
                    background: autopilot ? "hsl(var(--primary))" : "hsl(var(--border))", transition: "background 200ms ease",
                  }}
                  aria-label={autopilot ? "Disable autopilot" : "Enable autopilot"} role="switch" aria-checked={autopilot}
                >
                  <span style={{
                    position: "absolute", top: 3, left: autopilot ? 35 : 3, width: 26, height: 26, borderRadius: "50%",
                    background: "white", transition: "left 200ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
                  }} />
                </button>
              </div>
            </div>

            {/* Workflow schedules */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <CalendarClock className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Active AI Schedules</h3>
              </div>
              <div className="divide-y divide-border">
                {workflows.map(w => (
                  <div key={w.name} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-success shrink-0" />
                      <span className="text-[13px] font-medium text-foreground">{w.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[12px] text-muted-foreground">{w.freq}</span>
                      <span className="text-[11px] text-muted-foreground ml-2">({w.schedule})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Notifications ── */}
        {activeTab === "Notifications" && (
          <div className="rounded-xl border border-border bg-card divide-y divide-border">
            {notifConfig.map(n => (
              <div key={n.key} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-start gap-3 pr-4">
                  <span className="text-base mt-0.5">{n.icon}</span>
                  <div>
                    <p className="text-[13px] font-medium text-foreground">{n.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.desc}</p>
                  </div>
                </div>
                <Switch checked={!!notifPrefs[n.key]} onCheckedChange={checked => handleToggleNotif(n.key, checked)} />
              </div>
            ))}
          </div>
        )}

        {/* ── Account ── */}
        {activeTab === "Account" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {(user?.user_metadata?.first_name?.[0] || user?.email?.[0] || "U").toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{user?.user_metadata?.first_name || user?.email?.split("@")[0] || "User"}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-2">Password</h3>
              <p className="text-xs text-muted-foreground mb-3">Send a reset link to your email address.</p>
              <Button variant="outline" size="sm" onClick={async () => {
                if (!user?.email) return;
                const { error } = await externalSupabase.auth.resetPasswordForEmail(user.email, { redirectTo: `${window.location.origin}/reset-password` });
                if (error) toast.error(error.message); else toast.success("Reset link sent to " + user.email);
              }}>Send Reset Link</Button>
            </div>
            <div className="rounded-xl border border-destructive/30 bg-card p-5">
              <h3 className="text-sm font-semibold text-destructive mb-2">Delete Account</h3>
              <p className="text-xs text-muted-foreground mb-3">This will permanently delete all your data, campaigns, leads, and cancel your subscription.</p>
              <Input placeholder='Type "DELETE" to confirm' value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} className="max-w-xs mb-3" />
              <Button variant="destructive" size="sm" disabled={deleteConfirm !== "DELETE"} onClick={async () => {
                if (businessId) await externalSupabase.from("businesses").delete().eq("id", businessId);
                await externalSupabase.auth.signOut();
                window.location.href = "/";
              }}>
                <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Yes, delete everything
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
