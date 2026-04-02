import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Check, Upload, Building2, Users, Target, Rocket, PartyPopper,
  MapPin, Heart, Swords, Palette, DollarSign, Share2, Link2, Loader2,
} from "lucide-react";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const steps = [
  { label: "Business", icon: Building2 },
  { label: "Location", icon: MapPin },
  { label: "Customer", icon: Heart },
  { label: "Competitors", icon: Swords },
  { label: "Brand", icon: Palette },
  { label: "Goals", icon: Target },
  { label: "Platforms", icon: Share2 },
  { label: "Connect", icon: Link2 },
];

const businessTypes = [
  "Restaurant & Food", "Retail Store", "Beauty & Salon", "Health & Fitness",
  "Professional Services", "Home Services", "Medical & Dental", "Real Estate",
  "Education", "Photography", "Events & Entertainment", "Ecommerce",
  "Technology", "Automotive", "Legal", "Financial Services", "Nonprofit",
  "Bakery", "Café", "Other",
];

const employeeCounts = ["Just me", "2 to 5", "6 to 20", "21 to 100", "100+"];

const serviceAreas = [
  "My physical location only", "Within 5 miles", "Within 10 miles",
  "Within 25 miles", "Within 50 miles", "Nationwide", "International",
];

const customerInterests = [
  "Food & dining", "Health & fitness", "Fashion & beauty", "Home & garden",
  "Family & parenting", "Business", "Sports", "Travel", "Technology",
  "Arts", "Real estate", "Finance",
];

const marketingChallenges = [
  "Not enough new customers", "Low social media engagement", "Too expensive to advertise",
  "Not enough time for content", "Don't know what to post", "Competitors outranking me",
  "Low conversion rate", "Need more reviews",
];

const spendOptions = [
  "Nothing currently", "Under $100/month", "$100–$500", "$500–$1,000", "$1,000–$3,000", "Over $3,000/month",
];

const brandPersonalities = [
  { key: "professional", label: "Professional & Authoritative", emoji: "👔", example: "Our certified team delivers exceptional results backed by 20 years of expertise." },
  { key: "friendly", label: "Friendly & Warm", emoji: "🤗", example: "Hey neighbor! We're so excited to be part of your community." },
  { key: "fun", label: "Fun & Playful", emoji: "🎉", example: "Life's short — eat the cake first! And yes, we deliver. 🍰" },
  { key: "inspirational", label: "Inspirational & Motivating", emoji: "🌟", example: "Every day is a chance to be better. Let us help you get there." },
  { key: "luxury", label: "Luxurious & Exclusive", emoji: "✨", example: "Crafted for those who appreciate the finest things. Limited availability." },
  { key: "educational", label: "Educational & Helpful", emoji: "📚", example: "Did you know sourdough fermentation increases nutrient absorption? Here's why." },
];

const goalCards = [
  { key: "walk-ins", label: "Get more customers walking in", emoji: "🏪" },
  { key: "online-orders", label: "Drive more online orders", emoji: "🛒" },
  { key: "followers", label: "Grow social media following", emoji: "❤️" },
  { key: "email-list", label: "Build email list", emoji: "📧" },
  { key: "awareness", label: "Increase brand awareness", emoji: "📣" },
  { key: "leads", label: "Generate leads & inquiries", emoji: "📞" },
  { key: "promote", label: "Promote a product or event", emoji: "⭐" },
];

const platformCards = [
  { key: "instagram", label: "Instagram", desc: "Best for visual businesses", color: "#E4405F" },
  { key: "facebook", label: "Facebook", desc: "Largest reach, 30-60 age group", color: "#1877F2" },
  { key: "linkedin", label: "LinkedIn", desc: "Best for B2B & professional", color: "#0A66C2" },
  { key: "tiktok", label: "TikTok", desc: "Fastest growing, 18-40", color: "#000" },
  { key: "google_ads", label: "Google Ads", desc: "People actively searching for you", color: "#4285F4" },
  { key: "gmb", label: "Google My Business", desc: "Free local SEO posting", color: "#34A853" },
];

const postFrequencies = ["3 posts/week (recommended)", "5 posts/week", "Daily posts", "1 post/week"];
const postTimes = ["Early morning", "Morning", "Afternoon", "Evening", "Night", "Auto (let AI decide)"];

const META_APP_ID = "26551713411132003";
const META_PERMISSIONS = "email,public_profile,pages_show_list,pages_read_engagement,pages_manage_posts,pages_manage_engagement,pages_read_user_content,instagram_basic,instagram_content_publish,ads_read,ads_management,business_management,read_insights";

const budgetReach: Record<number, string> = {
  50: "2,000–5,000 people", 100: "5,000–12,000 people", 200: "12,000–30,000 people",
  500: "30,000–80,000 people", 1000: "80,000–200,000 people",
};

function getBudgetEstimate(v: number) {
  const thresholds = [50, 100, 200, 500, 1000];
  for (const t of thresholds) { if (v <= t) return budgetReach[t]; }
  return "200,000+ people";
}

const launchSteps = [
  "Saving your business profile",
  "Extracting your brand voice",
  "Finding your top competitors",
  "Building your 30-day AI strategy",
  "Writing your first week of content",
  "Generating images with AI",
  "Setting up 33 automation workflows",
  "Preparing your first report",
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, businessId, refreshBusiness } = useAuth();
  const [step, setStep] = useState(0);
  const [showLaunch, setShowLaunch] = useState(false);
  const [launchStep, setLaunchStep] = useState(-1);
  const [connectLoading, setConnectLoading] = useState<string | null>(null);
  const [connected, setConnected] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    business_name: "", business_type: "", website_url: "", business_description: "", employees: "",
    address: "", city: "", state: "", zip: "", service_area: "", target_cities: "",
    age_min: 18, age_max: 65, gender: "all", interests: [] as string[],
    pain_points: "", dream_customer: "",
    competitors: [{ name: "", website: "" }], differentiator: "",
    challenges: [] as string[], current_spend: "",
    brand_tone: "", topics_to_avoid: "",
    marketing_goal: "", monthly_budget: [150], billing: "monthly",
    platforms: [] as string[], post_frequency: "3 posts/week (recommended)", post_times: ["Auto (let AI decide)"],
  });

  const progress = Math.round(((step + 1) / steps.length) * 100);

  useEffect(() => {
    if (!businessId) return;
    externalSupabase.from("businesses").select("*").eq("id", businessId).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setForm(f => ({
            ...f,
            business_name: data.business_name ?? "",
            business_type: data.industry ?? "",
            city: data.location ?? "",
            target_cities: data.location ?? "",
            dream_customer: data.target_audience ?? "",
            brand_tone: data.brand_tone ?? "",
            marketing_goal: data.marketing_goal ?? "",
            competitors: data.competitors
              ? data.competitors.split(",").map((c: string) => ({ name: c.trim(), website: "" }))
              : [{ name: "", website: "" }],
            monthly_budget: [data.daily_budget ? data.daily_budget * 30 : 150],
          }));
          // Restore saved onboarding_data if exists
          if (data.onboarding_data) {
            try {
              const saved = typeof data.onboarding_data === "string" ? JSON.parse(data.onboarding_data) : data.onboarding_data;
              if (saved.step != null) setStep(saved.step);
              if (saved.form) setForm(f => ({ ...f, ...saved.form }));
            } catch {}
          }
        }
      });
  }, [businessId]);

  const update = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));
  const toggleArray = (key: string, val: string) => {
    setForm(f => {
      const arr = (f as any)[key] as string[];
      return { ...f, [key]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] };
    });
  };

  const saveProgress = async () => {
    if (!businessId) return;
    await externalSupabase.from("businesses").update({
      onboarding_data: JSON.stringify({ step, form }),
    }).eq("id", businessId);
  };

  const saveStepData = async () => {
    if (!businessId) return;
    const d: Record<string, any> = {};
    if (step === 0) {
      d.business_name = form.business_name;
      d.industry = form.business_type;
    } else if (step === 1) {
      d.location = [form.city, form.state].filter(Boolean).join(", ");
    } else if (step === 2) {
      d.target_audience = form.dream_customer || `${form.gender}, ages ${form.age_min}-${form.age_max}, interests: ${form.interests.join(", ")}`;
    } else if (step === 3) {
      d.competitors = form.competitors.map(c => c.name).filter(Boolean).join(", ");
    } else if (step === 4) {
      d.brand_tone = form.brand_tone;
    } else if (step === 5) {
      d.marketing_goal = form.marketing_goal;
      d.daily_budget = Math.round(form.monthly_budget[0] / 30);
    } else if (step === 6) {
      // platforms saved as part of onboarding_data
    }
    await externalSupabase.from("businesses").update(d).eq("id", businessId);
    await saveProgress();
  };

  const handleNext = async () => {
    await saveStepData();
    if (step < steps.length - 1) setStep(step + 1);
  };
  const handleBack = () => { if (step > 0) setStep(step - 1); };

  const handleMetaOAuth = () => {
    const redirectUri = "https://maroa-ai-marketing-automator.lovable.app/social-callback";
    const url = `https://www.facebook.com/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${META_PERMISSIONS}&response_type=code&state=maroa_oauth`;
    localStorage.setItem("meta_oauth_business_id", businessId || "");
    window.location.href = url;
  };

  const handleConnect = async (platform: string) => {
    if (connected.includes(platform)) return;
    if (platform === "facebook" || platform === "instagram") {
      handleMetaOAuth();
      return;
    }
    setConnectLoading(platform);
    setConnected(prev => [...prev, platform]);
    try {
      const { data: biz } = await externalSupabase.from("businesses").select("*").eq("id", businessId).maybeSingle();
      await fetch("https://maroa-api-production.up.railway.app/webhook/account-connected", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: businessId, business_name: biz?.business_name, email: biz?.email, platform }),
      });
      toast.success(`${platform} connected!`);
    } catch { toast.success(`${platform} saved!`); }
    setConnectLoading(null);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !businessId) return;
    for (const file of Array.from(files)) {
      const fileName = `${businessId}/${Date.now()}_${file.name}`;
      const { error } = await externalSupabase.storage.from("business-photos").upload(fileName, file);
      if (error) { toast.error(`Failed: ${file.name}`); continue; }
      const { data: urlData } = externalSupabase.storage.from("business-photos").getPublicUrl(fileName);
      await externalSupabase.from("business_photos").insert({
        business_id: businessId, photo_url: urlData.publicUrl, photo_type: "Product", description: file.name, is_active: true,
      });
    }
    toast.success("Photos uploaded!");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFinish = async () => {
    await saveStepData();
    setShowLaunch(true);

    // Animate launch steps
    for (let i = 0; i < launchSteps.length; i++) {
      await new Promise(r => setTimeout(r, 1500));
      setLaunchStep(i);
    }

    if (businessId) {
      await externalSupabase.from("businesses").update({ onboarding_complete: true }).eq("id", businessId);
      await refreshBusiness();

      const { data: biz } = await externalSupabase.from("businesses").select("*").eq("id", businessId).maybeSingle();
      if (biz) {
        void fetch("https://maroa-api-production.up.railway.app/webhook/new-user-signup", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: biz.user_id, email: biz.email, first_name: biz.first_name,
            business_name: biz.business_name, industry: biz.industry,
            location: biz.location, target_audience: biz.target_audience,
            brand_tone: biz.brand_tone, marketing_goal: biz.marketing_goal,
            plan: biz.plan, competitors: biz.competitors,
            daily_budget: biz.daily_budget,
            onboarding_data: { ...form },
          }),
        }).catch(console.warn);

        void fetch("https://maroa-api-production.up.railway.app/webhook/instant-content", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ business_id: businessId, email: biz.email }),
        }).catch(console.warn);
      }
    }
    setTimeout(() => navigate("/dashboard"), 3000);
  };

  const selectClass = "flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring";

  // Launch animation screen
  if (showLaunch) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
        <div className="animate-pulse-soft mb-8">
          <span className="text-3xl font-bold text-foreground">maroa<span className="text-primary">.ai</span></span>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Your marketing engine is starting</h2>
        <p className="text-muted-foreground mb-8">Setting up your fully automated AI marketing system</p>
        <div className="w-full max-w-md space-y-3">
          {launchSteps.map((s, i) => (
            <div key={i} className={`flex items-center gap-3 rounded-xl border p-3 transition-all duration-500 ${
              i <= launchStep ? "border-primary/30 bg-primary/5" : "border-border bg-card opacity-40"
            }`}>
              {i <= launchStep ? (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3 w-3" />
                </div>
              ) : (
                <div className="h-6 w-6 shrink-0 rounded-full border border-border" />
              )}
              <span className={`text-sm ${i <= launchStep ? "text-foreground font-medium" : "text-muted-foreground"}`}>{s}</span>
              {i === launchStep + 1 && <Loader2 className="ml-auto h-4 w-4 animate-spin text-primary" />}
            </div>
          ))}
        </div>
        {launchStep >= launchSteps.length - 1 && (
          <div className="mt-8 animate-fade-in">
            <PartyPopper className="mx-auto h-12 w-12 text-primary" />
            <p className="mt-3 text-lg font-semibold text-foreground">You're all set! 🎉</p>
            <p className="text-sm text-muted-foreground">Redirecting to your dashboard...</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Progress header */}
      <div className="border-b border-border bg-card sticky top-0 z-10 shadow-meta">
        <div className="mx-auto max-w-3xl px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground">Step {step + 1} of {steps.length}</span>
            <span className="text-xs font-bold text-primary">{progress}%</span>
          </div>
          <div className="h-1 w-full rounded-full bg-border overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-4 flex items-center gap-1 overflow-x-auto">
            {steps.map((s, i) => (
              <div key={s.label} className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => { if (i < step) setStep(i); }}
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] transition-all ${
                    i < step ? "bg-primary text-primary-foreground cursor-pointer" : i === step ? "bg-primary text-primary-foreground ring-2 ring-primary/20" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i < step ? <Check className="h-3 w-3" /> : <s.icon className="h-3 w-3" />}
                </button>
                <span className="hidden sm:block text-[10px] text-muted-foreground whitespace-nowrap">{s.label}</span>
                {i < steps.length - 1 && <div className={`h-px w-3 sm:w-6 ${i < step ? "bg-primary" : "bg-border"}`} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-8">
        {/* Step 1: Business Basics */}
        {step === 0 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Tell us about your business</h2>
              <p className="mt-2 text-sm text-muted-foreground">This is the only setup you'll ever need to do.</p>
            </div>
            <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-meta">
              <div>
                <Label>Business name *</Label>
                <Input value={form.business_name} onChange={e => update("business_name", e.target.value)} className="mt-1" placeholder="e.g. Sweet Delights Bakery" />
              </div>
              <div>
                <Label>Business type</Label>
                <select value={form.business_type} onChange={e => update("business_type", e.target.value)} className={selectClass + " mt-1"}>
                  <option value="">Select your business type</option>
                  {businessTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <Label>Website URL (optional)</Label>
                <Input value={form.website_url} onChange={e => update("website_url", e.target.value)} className="mt-1" placeholder="https://yourbusiness.com" />
                <p className="text-[11px] text-muted-foreground mt-1">We'll automatically extract your brand voice from your website.</p>
              </div>
              <div>
                <Label>Business description</Label>
                <Textarea value={form.business_description} onChange={e => update("business_description", e.target.value)} className="mt-1" rows={3}
                  placeholder="Describe what you sell and what makes you special — e.g. We're a family-owned Italian bakery in Brooklyn specializing in fresh sourdough bread" />
              </div>
              <div>
                <Label>Number of employees</Label>
                <select value={form.employees} onChange={e => update("employees", e.target.value)} className={selectClass + " mt-1"}>
                  <option value="">Select</option>
                  {employeeCounts.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Location */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Where is your business?</h2>
              <p className="mt-2 text-sm text-muted-foreground">We target your ads to exactly these areas — no wasted spend.</p>
            </div>
            <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-meta">
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label>City</Label><Input value={form.city} onChange={e => update("city", e.target.value)} className="mt-1" placeholder="Brooklyn" /></div>
                <div><Label>State</Label><Input value={form.state} onChange={e => update("state", e.target.value)} className="mt-1" placeholder="New York" /></div>
              </div>
              <div><Label>Full address (optional)</Label><Input value={form.address} onChange={e => update("address", e.target.value)} className="mt-1" placeholder="123 Main Street" /></div>
              <div><Label>ZIP code</Label><Input value={form.zip} onChange={e => update("zip", e.target.value)} className="mt-1 max-w-[200px]" placeholder="11201" /></div>
              <div>
                <Label className="mb-2 block">Service area</Label>
                <div className="space-y-2">
                  {serviceAreas.map(a => (
                    <label key={a} className={`flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-all ${form.service_area === a ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                      <input type="radio" name="service_area" value={a} checked={form.service_area === a} onChange={() => update("service_area", a)} className="accent-primary" />
                      <span className="text-sm text-foreground">{a}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <Label>Target cities for ads</Label>
                <Input value={form.target_cities} onChange={e => update("target_cities", e.target.value)} className="mt-1" placeholder="e.g. Brooklyn, Manhattan, Queens" />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Dream Customer */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Who is your perfect customer?</h2>
              <p className="mt-2 text-sm text-muted-foreground">The more specific you are, the better your AI content performs.</p>
            </div>
            <div className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-meta">
              <div>
                <Label>Age range</Label>
                <div className="mt-3 flex items-center gap-4">
                  <span className="text-sm font-medium text-foreground w-12">{form.age_min}</span>
                  <Slider value={[form.age_min, form.age_max]} min={18} max={65} step={1} onValueChange={v => { update("age_min", v[0]); update("age_max", v[1]); }} className="flex-1" />
                  <span className="text-sm font-medium text-foreground w-12">{form.age_max}+</span>
                </div>
              </div>
              <div>
                <Label className="mb-2 block">Gender</Label>
                <div className="flex gap-2">
                  {["all", "women", "men"].map(g => (
                    <button key={g} onClick={() => update("gender", g)}
                      className={`rounded-lg border px-4 py-2 text-sm font-medium capitalize transition-all ${form.gender === g ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                      {g === "all" ? "All genders" : `Mostly ${g}`}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="mb-2 block">Customer interests (select up to 8)</Label>
                <div className="flex flex-wrap gap-2">
                  {customerInterests.map(i => (
                    <button key={i} onClick={() => toggleArray("interests", i)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${form.interests.includes(i) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                      {i}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Customer pain points</Label>
                <Textarea value={form.pain_points} onChange={e => update("pain_points", e.target.value)} className="mt-1" rows={2}
                  placeholder="What problem does your customer have before they find you?" />
              </div>
              <div>
                <Label>Describe your perfect customer</Label>
                <Textarea value={form.dream_customer} onChange={e => update("dream_customer", e.target.value)} className="mt-1" rows={3}
                  placeholder="e.g. Sarah is a 35-year-old mom in Brooklyn who cares about quality food for her family. She shops local and discovers businesses through Instagram." />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Competitors */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Who are your competitors?</h2>
              <p className="mt-2 text-sm text-muted-foreground">We'll analyze them every Friday and tell you how to beat them.</p>
            </div>
            <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-meta">
              {form.competitors.map((comp, i) => (
                <div key={i} className="grid gap-3 sm:grid-cols-2">
                  <div><Label>Competitor {i + 1} name</Label><Input value={comp.name} onChange={e => { const c = [...form.competitors]; c[i] = { ...c[i], name: e.target.value }; update("competitors", c); }} className="mt-1" placeholder="e.g. Joe's Bakery" /></div>
                  <div><Label>Website</Label><Input value={comp.website} onChange={e => { const c = [...form.competitors]; c[i] = { ...c[i], website: e.target.value }; update("competitors", c); }} className="mt-1" placeholder="joesbakery.com" /></div>
                </div>
              ))}
              {form.competitors.length < 5 && (
                <Button variant="outline" size="sm" onClick={() => update("competitors", [...form.competitors, { name: "", website: "" }])}>+ Add competitor</Button>
              )}
              <div>
                <Label>What makes you different?</Label>
                <Textarea value={form.differentiator} onChange={e => update("differentiator", e.target.value)} className="mt-1" rows={2}
                  placeholder="What do you do better than everyone else?" />
              </div>
              <div>
                <Label className="mb-2 block">Biggest marketing challenges</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {marketingChallenges.map(c => (
                    <label key={c} className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-all text-sm ${form.challenges.includes(c) ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                      <input type="checkbox" checked={form.challenges.includes(c)} onChange={() => toggleArray("challenges", c)} className="accent-primary" />
                      {c}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <Label>Current marketing spend</Label>
                <select value={form.current_spend} onChange={e => update("current_spend", e.target.value)} className={selectClass + " mt-1"}>
                  <option value="">Select</option>
                  {spendOptions.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Brand Personality */}
        {step === 4 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-bold text-foreground">What's your brand personality?</h2>
              <p className="mt-2 text-sm text-muted-foreground">This shapes how your AI-generated content sounds.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {brandPersonalities.map(p => (
                <button key={p.key} onClick={() => update("brand_tone", p.key)}
                  className={`text-left rounded-xl border-2 p-4 transition-all ${form.brand_tone === p.key ? "border-primary bg-primary/5 shadow-meta-hover" : "border-border bg-card hover:border-primary/30"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{p.emoji}</span>
                    <span className="text-sm font-semibold text-foreground">{p.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground italic">"{p.example}"</p>
                </button>
              ))}
            </div>
            <div className="rounded-xl border border-border bg-card p-6 shadow-meta">
              <Label>Topics to avoid</Label>
              <Textarea value={form.topics_to_avoid} onChange={e => update("topics_to_avoid", e.target.value)} className="mt-1" rows={2}
                placeholder="e.g. politics, religion, competitors" />
            </div>
          </div>
        )}

        {/* Step 6: Goals & Budget */}
        {step === 5 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-bold text-foreground">What do you want to achieve?</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {goalCards.map(g => (
                <button key={g.key} onClick={() => update("marketing_goal", g.key)}
                  className={`text-left rounded-xl border-2 p-4 transition-all ${form.marketing_goal === g.key ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30"}`}>
                  <span className="text-2xl">{g.emoji}</span>
                  <p className="mt-2 text-sm font-semibold text-foreground">{g.label}</p>
                </button>
              ))}
            </div>
            <div className="rounded-xl border border-border bg-card p-6 shadow-meta space-y-4">
              <Label>Monthly advertising budget</Label>
              <div className="text-center">
                <span className="text-4xl font-bold text-foreground">${form.monthly_budget[0]}</span>
                <span className="text-lg text-muted-foreground">/month</span>
              </div>
              <Slider value={form.monthly_budget} min={0} max={2000} step={50} onValueChange={v => update("monthly_budget", v)} />
              <div className="flex justify-between text-xs text-muted-foreground"><span>$0</span><span>$2,000</span></div>
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-center">
                <p className="text-xs text-primary font-medium">Estimated reach: {getBudgetEstimate(form.monthly_budget[0])}</p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground font-medium mb-1">Budget split:</p>
                <div className="flex gap-2">
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">40% awareness</span>
                  <span className="rounded bg-warning/10 px-2 py-0.5 text-[10px] font-medium text-warning">35% retargeting</span>
                  <span className="rounded bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">25% engagement</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 7: Platforms */}
        {step === 6 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Which platforms do you want to dominate?</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {platformCards.map(p => (
                <button key={p.key} onClick={() => toggleArray("platforms", p.key)}
                  className={`text-left rounded-xl border-2 p-4 transition-all ${form.platforms.includes(p.key) ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30"}`}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg mb-3" style={{ backgroundColor: p.color + "15" }}>
                    <span className="text-sm font-bold" style={{ color: p.color }}>{p.label[0]}</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{p.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{p.desc}</p>
                </button>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 rounded-xl border border-border bg-card p-6 shadow-meta">
              <div>
                <Label>Posting frequency</Label>
                <select value={form.post_frequency} onChange={e => update("post_frequency", e.target.value)} className={selectClass + " mt-1"}>
                  {postFrequencies.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <Label className="mb-2 block">Best posting times</Label>
                <div className="flex flex-wrap gap-1.5">
                  {postTimes.map(t => (
                    <button key={t} onClick={() => toggleArray("post_times", t)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${form.post_times.includes(t) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 8: Connect & Launch */}
        {step === 7 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Connect your accounts to go live</h2>
              <p className="mt-2 text-sm text-muted-foreground">Connect now or skip and do it later from your dashboard.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {platformCards.filter(p => form.platforms.includes(p.key) || ["facebook", "instagram"].includes(p.key)).map(p => (
                <div key={p.key} className={`rounded-xl border-2 p-4 transition-all ${connected.includes(p.key) ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: p.color + "15" }}>
                      <span className="text-sm font-bold" style={{ color: p.color }}>{p.label[0]}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{p.label}</p>
                      <p className="text-[11px] text-muted-foreground">{connected.includes(p.key) ? "✓ Connected" : "Not connected"}</p>
                    </div>
                  </div>
                  {!connected.includes(p.key) ? (
                    <Button size="sm" className="w-full" onClick={() => handleConnect(p.key)} disabled={connectLoading === p.key}>
                      {connectLoading === p.key ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : null}
                      Connect {p.label}
                    </Button>
                  ) : (
                    <p className="text-xs text-success font-medium text-center">Connected ✓</p>
                  )}
                </div>
              ))}
            </div>

            {/* Photo upload */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-meta">
              <Label className="mb-3 block">Upload photos of your business (optional)</Label>
              <div
                className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-8 text-center cursor-pointer hover:border-primary/30 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-6 w-6 text-primary mb-2" />
                <p className="text-sm font-medium text-foreground">Drag & drop or click to browse</p>
                <p className="text-xs text-muted-foreground mt-1">Your real photos get 3x more engagement than stock images</p>
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <Button variant="outline" onClick={handleBack} disabled={step === 0}>Back</Button>
          {step < steps.length - 1 ? (
            <Button onClick={handleNext}>Continue</Button>
          ) : (
            <Button size="lg" className="gap-2" onClick={handleFinish}>
              <Rocket className="h-4 w-4" /> Start my marketing engine
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
