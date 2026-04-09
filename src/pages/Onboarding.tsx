import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Check, Building2, Users, Target, MapPin, Heart, Swords, Palette,
  Share2, Clock, Image, Settings, Loader2, ArrowLeft, PartyPopper, Package,
} from "lucide-react";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  BUSINESS_TYPES, BRAND_VALUES, BRAND_PERSONALITY, LANGUAGES, SOCIAL_PLATFORMS,
  CONTENT_TYPES, BLOCKS, BUDGET_OPTIONS, GOAL_OPTIONS, AD_EXPERIENCE,
  YEARS_OPTIONS, STAGE_OPTIONS, OPERATION_MODELS, SERVICE_AREA_OPTIONS,
  SPEND_OPTIONS, LIFETIME_OPTIONS, DISCOVERY_CHANNELS, EMOJI_OPTIONS,
  APPROVAL_OPTIONS, POSTING_FREQUENCY, VISUAL_STYLES,
} from "@/lib/onboardingQuestions";

const API_BASE = "https://maroa-api-production.up.railway.app";
const STORAGE_KEY = "maroa-onboarding-v2";

const blockIcons = [Building2, MapPin, Users, Package, Palette, Target, Share2, Swords, Clock, Image, Heart, Settings];

const launchSteps = [
  "Business profile created",
  "AI strategy generated",
  "Content calendar built",
  "Competitor tracking activated",
  "Your AI is ready!",
];

/* ── Helpers ── */
function ChipSelect({ options, selected, onChange, max }: { options: string[]; selected: string[]; onChange: (v: string[]) => void; max?: number }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => {
        const active = selected.includes(opt);
        return (
          <button key={opt} type="button" onClick={() => {
            if (active) onChange(selected.filter(s => s !== opt));
            else if (!max || selected.length < max) onChange([...selected, opt]);
          }}
            className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function RadioCards({ options, value, onChange }: { options: { label: string; desc?: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map(opt => (
        <button key={opt.label} type="button" onClick={() => onChange(opt.label)}
          className={`rounded-xl border p-3 text-left transition-all ${value === opt.label ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
          <p className="text-sm font-medium text-foreground">{opt.label}</p>
          {opt.desc && <p className="text-[11px] text-muted-foreground mt-0.5">{opt.desc}</p>}
        </button>
      ))}
    </div>
  );
}

function DynamicList({ items, onChange, fields, max = 5 }: { items: any[]; onChange: (v: any[]) => void; fields: { key: string; placeholder: string }[]; max?: number }) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 items-start">
          {fields.map(f => (
            <Input key={f.key} placeholder={f.placeholder} value={item[f.key] || ""} onChange={e => {
              const next = [...items]; next[i] = { ...next[i], [f.key]: e.target.value }; onChange(next);
            }} className="flex-1 h-10 text-sm" />
          ))}
          {items.length > 1 && (
            <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="shrink-0 h-10 w-10 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive/30">×</button>
          )}
        </div>
      ))}
      {items.length < max && (
        <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => onChange([...items, {}])}>+ Add another</Button>
      )}
    </div>
  );
}

/* ── Main ── */
export default function Onboarding() {
  const navigate = useNavigate();
  const { user, businessId, refreshBusiness } = useAuth();
  const [block, setBlock] = useState(0);
  const [showLaunch, setShowLaunch] = useState(false);
  const [launchStep, setLaunchStep] = useState(-1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Complete form state — all 83 questions
  const [form, setForm] = useState<Record<string, any>>(() => {
    try { const saved = localStorage.getItem(STORAGE_KEY); return saved ? JSON.parse(saved) : {}; } catch { return {}; }
  });

  // Auto-detect country
  useEffect(() => {
    if (!form.country) {
      try {
        const locale = navigator.language || "en-US";
        const countryHints: Record<string, string> = { sq: "Kosovo", en: "United States", de: "Germany", fr: "France", ar: "UAE", tr: "Turkey", it: "Italy", pt: "Brazil", hi: "India", sr: "Serbia", mk: "Macedonia" };
        const lang = locale.split("-")[0];
        if (countryHints[lang]) update("country", countryHints[lang]);
      } catch {}
    }
  }, []);

  // Load saved progress from Supabase
  useEffect(() => {
    if (!businessId) return;
    externalSupabase.from("businesses").select("*").eq("id", businessId).maybeSingle().then(({ data }) => {
      if (data?.onboarding_data) {
        try {
          const saved = typeof data.onboarding_data === "string" ? JSON.parse(data.onboarding_data) : data.onboarding_data;
          if (saved?.form) setForm(f => ({ ...saved.form, ...f }));
          if (saved?.block != null) setBlock(saved.block);
        } catch {}
      }
      // Pre-fill from existing business data
      if (data && !form.business_name) {
        setForm(f => ({
          ...f,
          business_name: f.business_name || data.business_name || "",
          business_type: f.business_type || data.industry || "",
          city: f.city || data.location || "",
          primary_language: f.primary_language || "Albanian",
        }));
      }
    });
  }, [businessId]);

  // Save to localStorage on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
  }, [form]);

  const update = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));
  const toggleArray = (key: string, val: string) => {
    setForm(f => {
      const arr = Array.isArray(f[key]) ? f[key] : [];
      return { ...f, [key]: arr.includes(val) ? arr.filter((x: string) => x !== val) : [...arr, val] };
    });
  };

  const progress = Math.round(((block + 1) / BLOCKS.length) * 100);

  // Save progress to Supabase after each block
  const saveBlock = async () => {
    if (!businessId) return;
    try {
      await externalSupabase.from("businesses").update({ onboarding_data: JSON.stringify({ block, form }) }).eq("id", businessId);
    } catch {}
  };

  const handleNext = async () => {
    await saveBlock();
    if (block < BLOCKS.length - 1) setBlock(block + 1);
  };

  const handleBack = () => { if (block > 0) setBlock(block - 1); };

  const handleFinish = async () => {
    await saveBlock();
    setShowLaunch(true);

    for (let i = 0; i < launchSteps.length; i++) {
      await new Promise(r => setTimeout(r, 1200));
      setLaunchStep(i);
    }

    if (businessId) {
      await externalSupabase.from("businesses").update({ onboarding_complete: true }).eq("id", businessId);
      await refreshBusiness();

      const { data: biz } = await externalSupabase.from("businesses").select("*").eq("id", businessId).maybeSingle();
      if (biz) {
        // Build profile payload from all 83 questions
        const profilePayload = {
          user_id: biz.user_id || businessId,
          business_name: form.business_name || biz.business_name,
          business_type: form.business_type || biz.industry,
          business_age: form.business_stage === "Just starting" ? "new" : form.business_stage === "Growing" ? "growing" : "established",
          usp: form.usp || "",
          tagline: form.tagline || "",
          physical_locations: form.city ? [{ city: form.city, neighborhood: form.neighborhood || "", address: form.address || "" }] : [],
          operation_model: form.operation_model === "Physical location" ? "location_based" : form.operation_model === "Online only" ? "online" : form.operation_model === "We go to customers" ? "mobile" : "hybrid",
          service_area: form.ad_targeting_cities || (form.city ? [form.city] : []),
          ad_targeting_area: form.ad_targeting_cities || (form.city ? [form.city] : []),
          primary_language: form.primary_language || "Albanian",
          secondary_languages: (form.languages || []).filter((l: string) => l !== form.primary_language),
          audience_age_min: form.age_min || 25,
          audience_age_max: form.age_max || 45,
          audience_gender: form.gender_mix === "Mostly women (80%+)" ? "female" : form.gender_mix === "Mostly men (80%+)" ? "male" : "mixed",
          audience_description: form.customer_description || "",
          pain_point: [form.pain1, form.pain2, form.pain3].filter(Boolean).join(". "),
          avg_spend: form.avg_spend || "",
          products: (form.products || []).filter((p: any) => p?.name),
          current_offer: form.current_offer || "",
          primary_goal: form.primary_goal || "",
          monthly_budget: form.budget || "",
          ads_experience: form.ad_experience === "Never — I'm completely new to ads" ? "never" : form.ad_experience?.includes("didn't see results") ? "failed" : form.ad_experience?.includes("regularly") ? "active" : "never",
          tone_keywords: form.brand_personality || [],
          never_do: form.words_never || "",
          business_hours: form.business_hours || {},
          seasonal: form.seasonal === "yes" ? "busy_season" : "year_round",
          busy_months: form.busy_months || [],
          best_posting_times: form.posting_times ? "custom" : "auto",
          competitors: (form.competitors || []).filter((c: any) => c?.name).map((c: any) => ({ name: c.name, city: c.city || form.city })),
          they_do_better: form.competitor_strengths || "",
          we_do_better: form.competitor_weaknesses || "",
        };

        void fetch(`${API_BASE}/api/onboarding/save`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profilePayload),
        }).catch(console.warn);

        void fetch(`${API_BASE}/webhook/new-user-signup`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: biz.user_id, email: biz.email, first_name: biz.first_name,
            business_name: biz.business_name, industry: biz.industry,
            location: biz.location, target_audience: biz.target_audience,
            brand_tone: biz.brand_tone, marketing_goal: biz.marketing_goal,
            plan: biz.plan, competitors: biz.competitors, daily_budget: biz.daily_budget,
            onboarding_data: { ...form },
          }),
        }).catch(console.warn);

        void fetch(`${API_BASE}/webhook/instant-content`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ business_id: businessId, email: biz.email }),
        }).catch(console.warn);

        void fetch(`${API_BASE}/api/ideas/generate`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ business_id: businessId }),
        }).catch(console.warn);
      }
    }

    localStorage.removeItem(STORAGE_KEY);
    setTimeout(() => navigate("/dashboard"), 2500);
  };

  // ── Launch screen ──
  if (showLaunch) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
        <div className="animate-pulse mb-8">
          <span className="text-3xl font-bold text-foreground">maroa<span className="text-primary">.ai</span></span>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Your AI Marketing Manager is Starting</h2>
        <p className="text-muted-foreground mb-8">Setting up everything automatically</p>
        <div className="w-full max-w-md space-y-3">
          {launchSteps.map((s, i) => (
            <div key={i} className={`flex items-center gap-3 rounded-xl border p-3 transition-all duration-500 ${i <= launchStep ? "border-primary/30 bg-primary/5" : "border-border bg-card opacity-40"}`}>
              {i <= launchStep ? (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check className="h-3 w-3" /></div>
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
            <p className="mt-3 text-lg font-semibold text-foreground">You're all set!</p>
            <p className="text-sm text-muted-foreground">Redirecting to your dashboard...</p>
          </div>
        )}
      </div>
    );
  }

  // ── Render current block ──
  const currentBlock = BLOCKS[block];
  const BlockIcon = blockIcons[block] || Building2;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card sticky top-0 z-10">
        <div className="mx-auto max-w-2xl px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Block {block + 1} of {BLOCKS.length} — {currentBlock.label}</span>
            <span className="text-xs text-muted-foreground">~{currentBlock.time}</span>
          </div>
          <div className="h-[3px] w-full rounded-full bg-border overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          {block > 0 && (
            <button onClick={handleBack} className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div>
            <h2 className="text-xl font-bold text-foreground">{currentBlock.label}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{currentBlock.questions} questions · About {currentBlock.time}</p>
          </div>
        </div>

        <div className="space-y-5 animate-fade-in">
          {/* ── BLOCK 0: Business Identity ── */}
          {block === 0 && (<>
            <div><Label>Business Name *</Label><Input value={form.business_name || ""} onChange={e => update("business_name", e.target.value)} className="mt-1" placeholder="Exactly as you want it in all marketing" /></div>
            <div><Label>Business Type *</Label>
              <select value={form.business_type || ""} onChange={e => update("business_type", e.target.value)} className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm mt-1">
                <option value="">Select your business type</option>
                {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div><Label>Describe your business *</Label><Textarea value={form.business_description || ""} onChange={e => update("business_description", e.target.value)} className="mt-1" rows={3} placeholder="What do you do, who do you serve, and what makes you special?" /></div>
            <div><Label>Years in Business</Label>
              <div className="flex flex-wrap gap-2 mt-1">{YEARS_OPTIONS.map(y => (
                <button key={y} type="button" onClick={() => update("years_in_business", y)} className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${form.years_in_business === y ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>{y}</button>
              ))}</div>
            </div>
            <div><Label>Business Stage</Label><RadioCards options={STAGE_OPTIONS} value={form.business_stage || ""} onChange={v => update("business_stage", v)} /></div>
            <div><Label>What makes you different? *</Label><Textarea value={form.usp || ""} onChange={e => update("usp", e.target.value)} className="mt-1" rows={2} placeholder="Unlike other [business type], we are the only ones who..." /></div>
            <div><Label>Tagline (optional)</Label><Input value={form.tagline || ""} onChange={e => update("tagline", e.target.value)} className="mt-1" placeholder="Your transformation starts here" /></div>
            <div><Label>Brand Values (pick up to 3)</Label><ChipSelect options={BRAND_VALUES} selected={form.brand_values || []} onChange={v => update("brand_values", v)} max={3} /></div>
          </>)}

          {/* ── BLOCK 1: Location ── */}
          {block === 1 && (<>
            <div><Label>Country *</Label><Input value={form.country || ""} onChange={e => update("country", e.target.value)} className="mt-1" placeholder="Kosovo" /></div>
            <div><Label>City / Area *</Label><Input value={form.city || ""} onChange={e => update("city", e.target.value)} className="mt-1" placeholder="Prishtina" /></div>
            <div><Label>Neighborhood or Street</Label><Input value={form.neighborhood || ""} onChange={e => update("neighborhood", e.target.value)} className="mt-1" placeholder="Mati 1, near the main square" /></div>
            <div><Label>How does your business operate? *</Label><RadioCards options={OPERATION_MODELS} value={form.operation_model || ""} onChange={v => update("operation_model", v)} /></div>
            <div><Label>Service Area</Label>
              <div className="flex flex-wrap gap-2 mt-1">{SERVICE_AREA_OPTIONS.map(s => (
                <button key={s} type="button" onClick={() => update("service_area_range", s)} className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${form.service_area_range === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>{s}</button>
              ))}</div>
            </div>
            <div><Label>Ad Targeting Cities</Label><Input value={(form.ad_targeting_cities || []).join(", ")} onChange={e => update("ad_targeting_cities", e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean))} className="mt-1" placeholder="Prishtina, Fushe Kosove, Podujeve" /><p className="text-[11px] text-muted-foreground mt-1">Separate cities with commas</p></div>
            <div><Label>Multiple Locations?</Label>
              <div className="flex gap-2 mt-1">
                {["No", "Yes"].map(v => (
                  <button key={v} type="button" onClick={() => update("multiple_locations", v)} className={`rounded-full px-4 py-1.5 text-xs font-medium border ${form.multiple_locations === v ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>{v}</button>
                ))}
              </div>
            </div>
          </>)}

          {/* ── BLOCK 2: Target Audience ── */}
          {block === 2 && (<>
            <div><Label>Customer Age Range</Label>
              <div className="mt-3 flex items-center gap-4">
                <span className="text-sm font-medium w-10">{form.age_min || 25}</span>
                <Slider value={[form.age_min || 25, form.age_max || 45]} min={16} max={75} step={1} onValueChange={v => { update("age_min", v[0]); update("age_max", v[1]); }} className="flex-1" />
                <span className="text-sm font-medium w-10">{form.age_max || 45}+</span>
              </div>
            </div>
            <div><Label>Gender Mix</Label>
              <div className="flex flex-wrap gap-2 mt-1">{["Mostly women (80%+)", "Equal mix", "Mostly men (80%+)"].map(g => (
                <button key={g} type="button" onClick={() => update("gender_mix", g)} className={`rounded-full px-3 py-1.5 text-xs font-medium border ${form.gender_mix === g ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>{g}</button>
              ))}</div>
            </div>
            <div><Label>Describe your ideal customer *</Label><Textarea value={form.customer_description || ""} onChange={e => update("customer_description", e.target.value)} className="mt-1" rows={3} placeholder="Working professionals aged 28-40, earning €800-1500/month, living in Prishtina..." /></div>
            <div><Label>Customer Pain #1 *</Label><Input value={form.pain1 || ""} onChange={e => update("pain1", e.target.value)} className="mt-1" placeholder="They tried other gyms but quit because they didn't see results" /></div>
            <div><Label>Customer Pain #2</Label><Input value={form.pain2 || ""} onChange={e => update("pain2", e.target.value)} className="mt-1" placeholder="They feel embarrassed working out as beginners" /></div>
            <div><Label>Customer Pain #3</Label><Input value={form.pain3 || ""} onChange={e => update("pain3", e.target.value)} className="mt-1" placeholder="They don't know what exercises to do" /></div>
            <div><Label>What result do customers want? *</Label><Input value={form.desired_outcome || ""} onChange={e => update("desired_outcome", e.target.value)} className="mt-1" placeholder="Lose 10kg and feel confident within 3 months" /></div>
            <div><Label>Customer's exact words</Label><Textarea value={form.customer_language || ""} onChange={e => update("customer_language", e.target.value)} className="mt-1" rows={2} placeholder="How do customers describe their problem? Write in their language." /></div>
            <div><Label>Average spend per month</Label>
              <div className="flex flex-wrap gap-2 mt-1">{SPEND_OPTIONS.map(s => (
                <button key={s} type="button" onClick={() => update("avg_spend", s)} className={`rounded-full px-3 py-1.5 text-xs font-medium border ${form.avg_spend === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>{s}</button>
              ))}</div>
            </div>
            <div><Label>How do customers find you now?</Label><ChipSelect options={DISCOVERY_CHANNELS} selected={form.discovery_channels || []} onChange={v => update("discovery_channels", v)} /></div>
          </>)}

          {/* ── BLOCK 3: Products ── */}
          {block === 3 && (<>
            <div><Label>Products / Services (name + price)</Label>
              <DynamicList items={form.products?.length ? form.products : [{ name: "", price: "" }]} onChange={v => update("products", v)} fields={[{ key: "name", placeholder: "Product name" }, { key: "price", placeholder: "Price (e.g. €45)" }]} max={10} />
            </div>
            <div><Label>Best Seller</Label><Input value={form.best_seller || ""} onChange={e => update("best_seller", e.target.value)} className="mt-1" placeholder="Which product/service sells the most?" /></div>
            <div><Label>Most Profitable</Label><Input value={form.most_profitable || ""} onChange={e => update("most_profitable", e.target.value)} className="mt-1" placeholder="Which makes you the most profit?" /></div>
            <div><Label>Current Special Offer</Label><Input value={form.current_offer || ""} onChange={e => update("current_offer", e.target.value)} className="mt-1" placeholder="3 days free trial or 50% off first month" /></div>
            <div><Label>Seasonal Offers</Label><Textarea value={form.seasonal_offers || ""} onChange={e => update("seasonal_offers", e.target.value)} className="mt-1" rows={2} placeholder="January: New Year package. Summer: outdoor classes free." /></div>
            <div><Label>What you DON'T offer</Label><Textarea value={form.dont_offer || ""} onChange={e => update("dont_offer", e.target.value)} className="mt-1" rows={2} placeholder="Services you intentionally don't offer or don't want mentioned" /></div>
          </>)}

          {/* ── BLOCK 4: Brand Voice ── */}
          {block === 4 && (<>
            <div><Label>Brand Personality (pick up to 3)</Label><ChipSelect options={BRAND_PERSONALITY} selected={form.brand_personality || []} onChange={v => update("brand_personality", v)} max={3} /></div>
            <div><Label>Formality</Label>
              <div className="flex flex-wrap gap-2 mt-1">{["Always formal", "Always informal", "Depends on context"].map(v => (
                <button key={v} type="button" onClick={() => update("formality", v)} className={`rounded-full px-3 py-1.5 text-xs font-medium border ${form.formality === v ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>{v}</button>
              ))}</div>
            </div>
            <div><Label>Words to ALWAYS use</Label><Input value={form.words_always || ""} onChange={e => update("words_always", e.target.value)} className="mt-1" placeholder="transformim, rezultate reale, familja FitZone" /></div>
            <div><Label>Words to NEVER use</Label><Input value={form.words_never || ""} onChange={e => update("words_never", e.target.value)} className="mt-1" placeholder="cheap, budget, competitor names, quick fix" /></div>
            <div><Label>Emoji Usage</Label>
              <div className="flex flex-wrap gap-2 mt-1">{EMOJI_OPTIONS.map(e => (
                <button key={e} type="button" onClick={() => update("emoji_usage", e)} className={`rounded-full px-3 py-1.5 text-xs font-medium border ${form.emoji_usage === e ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>{e}</button>
              ))}</div>
            </div>
            <div><Label>Example of content you LOVE</Label><Textarea value={form.content_love || ""} onChange={e => update("content_love", e.target.value)} className="mt-1" rows={3} placeholder="Paste a social post or ad you think is perfect" /></div>
            <div><Label>Example of content you HATE</Label><Textarea value={form.content_hate || ""} onChange={e => update("content_hate", e.target.value)} className="mt-1" rows={3} placeholder="Show us what bad looks like for your brand" /></div>
            <div><Label>Languages *</Label><ChipSelect options={LANGUAGES} selected={form.languages || ["Albanian"]} onChange={v => update("languages", v)} /><p className="text-[11px] text-muted-foreground mt-1">Primary language for all content</p></div>
          </>)}

          {/* ── BLOCK 5: Goals ── */}
          {block === 5 && (<>
            <div><Label>Primary Goal *</Label><RadioCards options={GOAL_OPTIONS.map(g => ({ label: g }))} value={form.primary_goal || ""} onChange={v => update("primary_goal", v)} /></div>
            <div><Label>Monthly Ad Budget *</Label>
              <div className="flex flex-wrap gap-2 mt-1">{BUDGET_OPTIONS.map(b => (
                <button key={b} type="button" onClick={() => update("budget", b)} className={`rounded-full px-3 py-1.5 text-xs font-medium border ${form.budget === b ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>{b}</button>
              ))}</div>
            </div>
            <div><Label>Advertising Experience</Label>
              <div className="space-y-2 mt-1">{AD_EXPERIENCE.map(a => (
                <button key={a} type="button" onClick={() => update("ad_experience", a)} className={`w-full rounded-xl border p-3 text-left text-sm transition-all ${form.ad_experience === a ? "border-primary bg-primary/5" : "border-border"}`}>{a}</button>
              ))}</div>
            </div>
            <div><Label>Biggest Marketing Challenge *</Label><Textarea value={form.biggest_challenge || ""} onChange={e => update("biggest_challenge", e.target.value)} className="mt-1" rows={3} placeholder="I post on Instagram but get no engagement. I tried ads but wasted money." /></div>
            <div><Label>Success Metric</Label>
              <div className="flex flex-wrap gap-2 mt-1">{["New customers/month", "Revenue/month", "Social followers", "Website visitors", "Bookings/week"].map(m => (
                <button key={m} type="button" onClick={() => update("success_metric", m)} className={`rounded-full px-3 py-1.5 text-xs font-medium border ${form.success_metric === m ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>{m}</button>
              ))}</div>
            </div>
          </>)}

          {/* ── BLOCK 6: Social Media ── */}
          {block === 6 && (<>
            <div><Label>Active Platforms *</Label><ChipSelect options={SOCIAL_PLATFORMS} selected={form.platforms || []} onChange={v => update("platforms", v)} /></div>
            <div><Label>Primary Platform</Label>
              <div className="flex flex-wrap gap-2 mt-1">{(form.platforms || []).map((p: string) => (
                <button key={p} type="button" onClick={() => update("primary_platform", p)} className={`rounded-full px-3 py-1.5 text-xs font-medium border ${form.primary_platform === p ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>{p}</button>
              ))}</div>
            </div>
            <div><Label>Current Posting Frequency</Label>
              <div className="flex flex-wrap gap-2 mt-1">{["Never", "Less than once/week", "1-2 times/week", "3-4 times/week", "Daily"].map(f => (
                <button key={f} type="button" onClick={() => update("current_frequency", f)} className={`rounded-full px-3 py-1.5 text-xs font-medium border ${form.current_frequency === f ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>{f}</button>
              ))}</div>
            </div>
            <div><Label>Content Types You've Tried</Label><ChipSelect options={CONTENT_TYPES} selected={form.tried_content_types || []} onChange={v => update("tried_content_types", v)} /></div>
            <div><Label>Content That Worked Best</Label><Textarea value={form.best_content || ""} onChange={e => update("best_content", e.target.value)} className="mt-1" rows={2} placeholder="Before/after posts always get lots of comments" /></div>
            <div><Label>Content That Flopped</Label><Textarea value={form.worst_content || ""} onChange={e => update("worst_content", e.target.value)} className="mt-1" rows={2} placeholder="Stock photos get ignored" /></div>
            <div><Label>Website URL</Label><Input type="url" value={form.website_url || ""} onChange={e => update("website_url", e.target.value)} className="mt-1" placeholder="https://yourbusiness.com" /></div>
            <div><Label>Booking / Order Link</Label><Input type="url" value={form.booking_url || ""} onChange={e => update("booking_url", e.target.value)} className="mt-1" placeholder="https://calendly.com/you or order link" /></div>
          </>)}

          {/* ── BLOCK 7: Competitors ── */}
          {block === 7 && (<>
            <div><Label>Top 3 Competitors *</Label>
              <DynamicList items={form.competitors?.length ? form.competitors : [{ name: "", city: "" }]} onChange={v => update("competitors", v)} fields={[{ key: "name", placeholder: "Competitor name" }, { key: "city", placeholder: "City" }]} max={5} />
            </div>
            <div><Label>Competitor Social Media Links</Label><Textarea value={form.competitor_socials || ""} onChange={e => update("competitor_socials", e.target.value)} className="mt-1" rows={2} placeholder="@competitor on Instagram, facebook.com/competitor" /></div>
            <div><Label>What they do BETTER than you *</Label><Textarea value={form.competitor_strengths || ""} onChange={e => update("competitor_strengths", e.target.value)} className="mt-1" rows={2} placeholder="Better equipment, bigger space, more consistent posting" /></div>
            <div><Label>What they do WORSE than you *</Label><Textarea value={form.competitor_weaknesses || ""} onChange={e => update("competitor_weaknesses", e.target.value)} className="mt-1" rows={2} placeholder="High trainer turnover, no personal attention, prices went up" /></div>
            <div><Label>Price Comparison</Label>
              <div className="flex flex-wrap gap-2 mt-1">{["We are cheaper", "Similar prices", "We are more expensive but worth it", "Hard to compare"].map(p => (
                <button key={p} type="button" onClick={() => update("price_comparison", p)} className={`rounded-full px-3 py-1.5 text-xs font-medium border ${form.price_comparison === p ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>{p}</button>
              ))}</div>
            </div>
            <div><Label>Why customers choose you over competitors</Label><Textarea value={form.why_choose_us || ""} onChange={e => update("why_choose_us", e.target.value)} className="mt-1" rows={2} placeholder="Trainers know their name, more personal attention, real results" /></div>
          </>)}

          {/* ── BLOCK 8: Operations ── */}
          {block === 8 && (<>
            <div><Label>Business Hours</Label><p className="text-[11px] text-muted-foreground mb-2">Set your open/close times for each day</p>
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                <div key={day} className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium w-20 text-foreground">{day}</span>
                  <Input type="time" value={form.business_hours?.[day.toLowerCase()]?.open || "09:00"} onChange={e => update("business_hours", { ...form.business_hours, [day.toLowerCase()]: { ...form.business_hours?.[day.toLowerCase()], open: e.target.value } })} className="w-24 h-8 text-xs" />
                  <span className="text-xs text-muted-foreground">to</span>
                  <Input type="time" value={form.business_hours?.[day.toLowerCase()]?.close || "21:00"} onChange={e => update("business_hours", { ...form.business_hours, [day.toLowerCase()]: { ...form.business_hours?.[day.toLowerCase()], close: e.target.value } })} className="w-24 h-8 text-xs" />
                </div>
              ))}
            </div>
            <div><Label>Busiest Days</Label><ChipSelect options={["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]} selected={form.busiest_days || []} onChange={v => update("busiest_days", v)} /></div>
            <div><Label>Slowest Days</Label><ChipSelect options={["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]} selected={form.slowest_days || []} onChange={v => update("slowest_days", v)} /></div>
            <div><Label>Seasonal Business?</Label>
              <div className="flex gap-2 mt-1">{["No — year round", "Yes — seasonal"].map(v => (
                <button key={v} type="button" onClick={() => update("seasonal", v.includes("Yes") ? "yes" : "no")} className={`rounded-full px-4 py-1.5 text-xs font-medium border ${(form.seasonal === "yes" && v.includes("Yes")) || (form.seasonal !== "yes" && v.includes("No")) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>{v}</button>
              ))}</div>
            </div>
            <div><Label>Upcoming Events or Launches</Label><Textarea value={form.upcoming_events || ""} onChange={e => update("upcoming_events", e.target.value)} className="mt-1" rows={2} placeholder="Opening second location in May. 5-year anniversary in July." /></div>
          </>)}

          {/* ── BLOCK 9: Visual Identity ── */}
          {block === 9 && (<>
            <div><Label>Brand Colors</Label><Input value={form.brand_colors || ""} onChange={e => update("brand_colors", e.target.value)} className="mt-1" placeholder="#FF6B35 (orange) and #1A1A2E (dark navy)" /></div>
            <div><Label>Visual Style</Label>
              <div className="flex flex-wrap gap-2 mt-1">{VISUAL_STYLES.map(s => (
                <button key={s} type="button" onClick={() => update("visual_style", s)} className={`rounded-full px-3 py-1.5 text-xs font-medium border ${form.visual_style === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>{s}</button>
              ))}</div>
            </div>
            <div><Label>Photo Style (select all that apply)</Label><ChipSelect options={["Real photos of our space", "Real photos of customers", "Real photos of team", "Professional product photography", "Lifestyle photography", "Before/after photos", "Behind the scenes"]} selected={form.photo_styles || []} onChange={v => update("photo_styles", v)} /></div>
            <div><Label>Content to NEVER show visually</Label><Textarea value={form.visual_never || ""} onChange={e => update("visual_never", e.target.value)} className="mt-1" rows={2} placeholder="No stock photos of generic gyms. No prices in images." /></div>
            <div><Label>Logo Upload (optional)</Label>
              <input ref={fileInputRef} type="file" accept="image/*" className="mt-1 block w-full text-sm text-muted-foreground file:mr-4 file:rounded-lg file:border file:border-border file:bg-muted file:px-4 file:py-2 file:text-sm file:font-medium" />
            </div>
          </>)}

          {/* ── BLOCK 10: Customer Relations ── */}
          {block === 10 && (<>
            <div><Label>Do you have an email list?</Label>
              <div className="flex gap-2 mt-1">{["No", "Yes"].map(v => (
                <button key={v} type="button" onClick={() => update("has_email_list", v)} className={`rounded-full px-4 py-1.5 text-xs font-medium border ${form.has_email_list === v ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>{v}</button>
              ))}</div>
            </div>
            <div><Label>WhatsApp Business?</Label>
              <div className="flex gap-2 mt-1">{["No", "Yes"].map(v => (
                <button key={v} type="button" onClick={() => update("has_whatsapp", v)} className={`rounded-full px-4 py-1.5 text-xs font-medium border ${form.has_whatsapp === v ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>{v}</button>
              ))}</div>
            </div>
            <div><Label>Google/Facebook Reviews?</Label>
              <div className="flex gap-2 mt-1">{["No", "Yes"].map(v => (
                <button key={v} type="button" onClick={() => update("has_reviews", v)} className={`rounded-full px-4 py-1.5 text-xs font-medium border ${form.has_reviews === v ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>{v}</button>
              ))}</div>
              {form.has_reviews === "Yes" && <Input value={form.avg_rating || ""} onChange={e => update("avg_rating", e.target.value)} className="mt-2" placeholder="Average rating (e.g. 4.7)" />}
            </div>
            <div><Label>Referral or Loyalty Program?</Label>
              <div className="flex gap-2 mt-1">{["No", "Yes"].map(v => (
                <button key={v} type="button" onClick={() => update("has_referral", v)} className={`rounded-full px-4 py-1.5 text-xs font-medium border ${form.has_referral === v ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>{v}</button>
              ))}</div>
            </div>
            <div><Label>How do you communicate with customers?</Label><ChipSelect options={["WhatsApp", "SMS", "Email", "Phone calls", "Social media DMs", "In-person", "We don't communicate regularly"]} selected={form.communication_channels || []} onChange={v => update("communication_channels", v)} /></div>
          </>)}

          {/* ── BLOCK 11: AI Preferences ── */}
          {block === 11 && (<>
            <div><Label>Content Approval Mode *</Label><RadioCards options={APPROVAL_OPTIONS} value={form.approval_mode || ""} onChange={v => update("approval_mode", v)} /></div>
            <div><Label>Content Language *</Label><ChipSelect options={LANGUAGES} selected={form.content_languages || [form.primary_language || "Albanian"]} onChange={v => update("content_languages", v)} /></div>
            <div><Label>Posting Frequency Goal</Label>
              <div className="space-y-2 mt-1">{POSTING_FREQUENCY.map(f => (
                <button key={f} type="button" onClick={() => update("posting_goal", f)} className={`w-full rounded-xl border p-3 text-left text-sm transition-all ${form.posting_goal === f ? "border-primary bg-primary/5" : "border-border"}`}>{f}</button>
              ))}</div>
            </div>
            <div><Label>Sensitive Topics to Avoid</Label><Textarea value={form.sensitive_topics || ""} onChange={e => update("sensitive_topics", e.target.value)} className="mt-1" rows={2} placeholder="Don't mention alcohol (Muslim audience). Don't discuss politics." /></div>
            <div><Label>Competitors to NEVER mention by name</Label><Input value={form.never_mention_competitors || ""} onChange={e => update("never_mention_competitors", e.target.value)} className="mt-1" placeholder="Competitor names to never reference" /></div>
          </>)}
        </div>

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          <div>{block > 0 && <Button variant="outline" onClick={handleBack}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>}</div>
          <div>
            {block < BLOCKS.length - 1 ? (
              <Button onClick={handleNext}>Continue →</Button>
            ) : (
              <Button size="lg" className="gap-2" onClick={handleFinish}>
                <PartyPopper className="h-4 w-4" /> Launch My AI
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
