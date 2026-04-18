import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Shield, Zap, Sparkles, MapPin, ShoppingCart, Megaphone, TrendingUp, Check, Loader2 } from "lucide-react";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { apiFireAndForget } from "@/lib/apiClient";

import OnboardingShell from "@/components/onboarding/OnboardingShell";
import QuestionCard from "@/components/onboarding/QuestionCard";
import TextInput from "@/components/onboarding/TextInput";
import TextareaInput from "@/components/onboarding/TextareaInput";
import RadioCards from "@/components/onboarding/RadioCards";
import ChipSelect from "@/components/onboarding/ChipSelect";
import DynamicList from "@/components/onboarding/DynamicList";

const STORAGE_KEY = "maroa-onboarding-v3";
const TOTAL_BLOCKS = 5;

const COUNTRIES = ["Kosovo", "Albania", "North Macedonia", "Serbia", "Montenegro", "Bosnia", "Croatia", "Other"];

const PERSONALITY_OPTIONS = [
  { value: "warm", label: "Warm & friendly", icon: Heart },
  { value: "professional", label: "Professional & trusted", icon: Shield },
  { value: "bold", label: "Bold & confident", icon: Zap },
  { value: "playful", label: "Playful & creative", icon: Sparkles },
];

const GOAL_OPTIONS = [
  { value: "local_customers", label: "Get more local customers", icon: MapPin },
  { value: "online_sales", label: "Grow online sales", icon: ShoppingCart },
  { value: "brand_awareness", label: "Build brand awareness", icon: Megaphone },
  { value: "social_media", label: "Dominate social media", icon: TrendingUp },
];

const BUDGET_OPTIONS = [
  { value: "under_100", label: "Under €100", icon: () => <span className="text-lg font-bold">€</span> },
  { value: "100_500", label: "€100 – 500", icon: () => <span className="text-lg font-bold">€€</span> },
  { value: "500_2000", label: "€500 – 2,000", icon: () => <span className="text-lg font-bold">€€€</span> },
  { value: "over_2000", label: "€2,000+", icon: () => <span className="text-lg font-bold">€€€€</span> },
  { value: "not_sure", label: "Not sure yet", icon: () => <span className="text-base">🤷</span> },
];

const LANGUAGES = ["Albanian", "Serbian", "English", "Macedonian", "Turkish", "Other"];

interface FormData {
  business_name: string;
  business_description: string;
  country: string;
  city: string;
  customer_description: string;
  customer_pain: string;
  competitors: string[];
  brand_personality: string;
  languages: string[];
  unique_advantage: string;
  primary_goal: string;
  monthly_budget: string;
}

function detectCountry(): string {
  const lang = navigator.language?.split("-")[0] || "";
  const map: Record<string, string> = { sq: "Kosovo", sr: "Serbia", mk: "North Macedonia", hr: "Croatia", bs: "Bosnia", me: "Montenegro" };
  return map[lang] || "";
}

const EMPTY_FORM: FormData = {
  business_name: "",
  business_description: "",
  country: detectCountry(),
  city: "",
  customer_description: "",
  customer_pain: "",
  competitors: [""],
  brand_personality: "",
  languages: [],
  unique_advantage: "",
  primary_goal: "",
  monthly_budget: "",
};

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, businessId, refreshBusiness } = useAuth();

  const [block, setBlock] = useState(0);
  const [form, setForm] = useState<FormData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...EMPTY_FORM, ...parsed.form };
      }
    } catch {}
    return EMPTY_FORM;
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [launching, setLaunching] = useState(false);
  const [showLegacyPrompt, setShowLegacyPrompt] = useState(false);

  // Check for legacy onboarding data
  useEffect(() => {
    if (!user?.id) return;
    externalSupabase.from("businesses").select("onboarding_data").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (!data?.onboarding_data) return;
        try {
          const od = typeof data.onboarding_data === "string" ? JSON.parse(data.onboarding_data) : data.onboarding_data;
          // Old wizard had fields like formality, emoji_usage, brand_values
          if (od.form && (od.form.formality || od.form.emoji_usage || od.form.brand_values) && od.block > 0) {
            setShowLegacyPrompt(true);
          }
        } catch {}
      });
  }, [user?.id]);

  // Auto-save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ block, form }));
  }, [block, form]);

  const update = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }, []);

  // Save block progress to Supabase
  const saveBlock = useCallback(async () => {
    if (!user?.id) return;
    try {
      await externalSupabase.from("businesses").update({
        onboarding_data: JSON.stringify({ block, form }),
      }).eq("user_id", user.id);
    } catch {}
  }, [user?.id, block, form]);

  // Validation per block
  const validate = (): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (block === 0) {
      if (!form.business_name.trim()) e.business_name = "Business name is required";
      if (!form.business_description.trim()) e.business_description = "Tell us what you do";
    } else if (block === 1) {
      if (!form.country) e.country = "Select a country";
      if (!form.city.trim()) e.city = "Enter your city";
    } else if (block === 2) {
      if (!form.customer_description.trim()) e.customer_description = "Describe your ideal customer";
      if (!form.customer_pain.trim()) e.customer_pain = "What problem do you solve?";
      if (!form.competitors.some((c) => c.trim())) e.competitors = "Add at least one competitor";
    } else if (block === 3) {
      if (!form.brand_personality) e.brand_personality = "Pick a personality";
      if (form.languages.length === 0) e.languages = "Select at least one language";
      if (!form.unique_advantage.trim()) e.unique_advantage = "What makes you different?";
    } else if (block === 4) {
      if (!form.primary_goal) e.primary_goal = "Pick a goal";
      if (!form.monthly_budget) e.monthly_budget = "Select a budget range";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = async () => {
    if (!validate()) return;
    await saveBlock();
    if (block < TOTAL_BLOCKS - 1) {
      setBlock((b) => b + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      await handleFinish();
    }
  };

  const handleBack = () => {
    setBlock((b) => Math.max(0, b - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFinish = async () => {
    setLaunching(true);
    await saveBlock();

    const userId = user?.id || "";
    const email = user?.email || "";
    const firstName = user?.user_metadata?.first_name || "";

    // Transform to backend-compatible payload
    const profilePayload = {
      user_id: userId,
      business_name: form.business_name,
      business_type: form.business_description,
      usp: form.unique_advantage,
      audience_description: form.customer_description,
      pain_point: form.customer_pain,
      primary_goal: form.primary_goal,
      monthly_budget: form.monthly_budget,
      tone_keywords: [form.brand_personality],
      primary_language: form.languages[0] || "Albanian",
      secondary_languages: form.languages.slice(1),
      competitors: form.competitors.filter((c) => c.trim()).map((c) => ({ name: c.trim() })),
      physical_locations: [{ city: form.city, country: form.country }],
    };

    // Fire-and-forget to backend
    apiFireAndForget("/api/onboarding/save", profilePayload);
    apiFireAndForget("/webhook/new-user-signup", {
      user_id: userId,
      email,
      first_name: firstName,
      business_name: form.business_name,
      industry: form.business_description,
      location: `${form.city}, ${form.country}`,
      target_audience: form.customer_description,
      brand_tone: form.brand_personality,
      marketing_goal: form.primary_goal,
      competitors: form.competitors.filter((c) => c.trim()).join(", "),
      onboarding_data: { ...form },
    });
    apiFireAndForget("/webhook/instant-content", { user_id: userId, business_id: businessId, email });
    apiFireAndForget("/api/ideas/generate", { user_id: userId, business_id: businessId });

    // Mark onboarding complete
    if (userId) {
      await externalSupabase.from("businesses").update({ onboarding_complete: true }).eq("user_id", userId);
    }
    await refreshBusiness();
    localStorage.removeItem(STORAGE_KEY);
  };

  // Legacy prompt modal
  if (showLegacyPrompt) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-6">
        <div className="w-full max-w-md space-y-6 text-center">
          <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
          <p className="text-muted-foreground">You have progress from a previous onboarding version. What would you like to do?</p>
          <div className="flex flex-col gap-3">
            <button onClick={() => navigate("/onboarding-legacy")} className="rounded-2xl border border-[var(--border-default)] px-6 py-4 text-sm font-medium text-foreground transition-all hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-xs)]">
              Continue where I left off
            </button>
            <button onClick={() => { setShowLegacyPrompt(false); setBlock(0); setForm(EMPTY_FORM); }} className="rounded-2xl bg-[var(--brand)] px-6 py-4 text-sm font-semibold text-white transition-all hover:bg-[var(--brand-hover)]">
              Start fresh (recommended)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success / launch screen
  if (launching) {
    return <LaunchScreen businessName={form.business_name} onDone={() => navigate("/dashboard")} />;
  }

  return (
    <OnboardingShell
      block={block}
      totalBlocks={TOTAL_BLOCKS}
      onBack={handleBack}
      onContinue={handleNext}
      continueDisabled={false}
      continueLabel={block === TOTAL_BLOCKS - 1 ? "Launch my AI" : "Continue"}
      loading={false}
    >
      {block === 0 && (
        <QuestionCard heading="Let's meet your business">
          <TextInput label="Business name" value={form.business_name} onChange={(v) => update("business_name", v)} placeholder="e.g. Furra e Prishtines" required error={errors.business_name} />
          <TextareaInput label="What do you sell?" value={form.business_description} onChange={(v) => update("business_description", v)} placeholder="Fresh bread, pastries, cakes for weddings and events" help="One sentence is enough. This teaches our AI what you do." required maxLength={200} error={errors.business_description} rows={2} />
        </QuestionCard>
      )}

      {block === 1 && (
        <QuestionCard heading="Where you sell">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-foreground">Country<span className="ml-0.5 text-[var(--brand)]">*</span></label>
            <select
              value={form.country}
              onChange={(e) => update("country", e.target.value)}
              className={`w-full appearance-none rounded-xl border bg-white px-4 py-3 text-sm text-foreground transition-all focus:outline-none focus:ring-1 ${
                errors.country
                  ? "border-red-400 focus:border-red-400 focus:ring-red-200"
                  : "border-[var(--border-default)] focus:border-[var(--brand)] focus:ring-[var(--brand)]/20 hover:border-[var(--border-strong)]"
              }`}
            >
              <option value="">Select a country</option>
              {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.country && <p className="mt-1.5 text-[12px] text-red-500">{errors.country}</p>}
          </div>
          <TextInput label="City or area" value={form.city} onChange={(v) => update("city", v)} placeholder="Prishtina" required error={errors.city} />
        </QuestionCard>
      )}

      {block === 2 && (
        <QuestionCard heading="Who buys from you">
          <TextareaInput label="Who is your ideal customer?" value={form.customer_description} onChange={(v) => update("customer_description", v)} placeholder="Young professionals 25-40 who value quality bread for their families" required maxLength={300} error={errors.customer_description} rows={2} />
          <TextareaInput label="What problem do you solve for them?" value={form.customer_pain} onChange={(v) => update("customer_pain", v)} placeholder="They want bakery-quality bread without having to go to the bakery every morning" required maxLength={300} error={errors.customer_pain} rows={2} />
          <DynamicList label="Top competitors" items={form.competitors} onChange={(v) => update("competitors", v)} placeholder="Competitor name + Instagram handle if known" min={1} max={5} required error={errors.competitors} />
        </QuestionCard>
      )}

      {block === 3 && (
        <QuestionCard heading="Your voice">
          <RadioCards label="Brand personality" options={PERSONALITY_OPTIONS} value={form.brand_personality} onChange={(v) => update("brand_personality", v)} required error={errors.brand_personality} />
          <ChipSelect label="Languages your customers speak" options={LANGUAGES} selected={form.languages} onChange={(v) => update("languages", v)} min={1} required error={errors.languages} />
          <TextareaInput label="What's your unique advantage?" value={form.unique_advantage} onChange={(v) => update("unique_advantage", v)} placeholder="Only bakery in Prishtina using stone-ground organic flour from Sharr mountains" help="Why should someone choose you over a competitor?" required maxLength={250} error={errors.unique_advantage} rows={2} />
        </QuestionCard>
      )}

      {block === 4 && (
        <QuestionCard heading="Your goals">
          <RadioCards label="Primary goal" options={GOAL_OPTIONS} value={form.primary_goal} onChange={(v) => update("primary_goal", v)} required error={errors.primary_goal} />
          <RadioCards label="Monthly marketing budget" options={BUDGET_OPTIONS} value={form.monthly_budget} onChange={(v) => update("monthly_budget", v)} required error={errors.monthly_budget} />
          <p className="text-[12px] text-muted-foreground">This helps us scale ad recommendations appropriately.</p>
        </QuestionCard>
      )}
    </OnboardingShell>
  );
}

/* ── Launch / Success Screen ── */

function LaunchScreen({ businessName, onDone }: { businessName: string; onDone: () => void }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 1500),
      setTimeout(() => setStep(2), 3000),
      setTimeout(() => setStep(3), 4500),
      setTimeout(onDone, 6000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onDone]);

  const steps = [
    "Analyzing your brand",
    "Studying your competitors",
    "Preparing your dashboard",
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6">
      <div className="w-full max-w-md text-center">
        <h1 className="text-[clamp(28px,4vw,40px)] font-bold tracking-[-0.025em]">
          Welcome to Maroa, {businessName}.
        </h1>
        <p className="mt-3 text-[17px] leading-[1.55] text-muted-foreground">
          Your AI team is learning about your business right now. First campaign draft ready in about 90 seconds.
        </p>

        <div className="mx-auto mt-10 max-w-xs space-y-4">
          {steps.map((label, i) => (
            <div key={label} className="flex items-center gap-3 text-left">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-500 ${
                step > i
                  ? "bg-[var(--brand)] text-white scale-100"
                  : step === i
                  ? "border-2 border-[var(--brand)] text-[var(--brand)] scale-110"
                  : "border border-[var(--border-default)] text-muted-foreground"
              }`}>
                {step > i ? (
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                ) : step === i ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-current opacity-30" />
                )}
              </div>
              <span className={`text-sm font-medium transition-colors duration-300 ${
                step > i ? "text-foreground" : step === i ? "text-[var(--brand)]" : "text-muted-foreground"
              }`}>
                {step > i ? `${label}` : label}
                {step > i && <span className="ml-1.5 text-[var(--brand)]">✓</span>}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
