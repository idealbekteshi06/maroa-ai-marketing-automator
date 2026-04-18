import { useState, useEffect, useCallback } from "react";
import { Check, ChevronDown, Sparkles, Palette, Users, Package, Clock, BarChart3 } from "lucide-react";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";
import type { LucideIcon } from "lucide-react";

/* ── Field definitions per section ── */

interface Field {
  key: string;
  label: string;
  type: "text" | "textarea" | "chips" | "select";
  placeholder?: string;
  options?: string[];
  maxLength?: number;
}

interface Section {
  id: string;
  title: string;
  icon: LucideIcon;
  uplift: string;
  fields: Field[];
}

const SECTIONS: Section[] = [
  {
    id: "voice",
    title: "Brand voice deep dive",
    icon: Sparkles,
    uplift: "Adding brand voice details helps AI write 40% more on-brand content",
    fields: [
      { key: "brand_personality", label: "Brand personality traits", type: "chips", options: ["Energetic", "Warm", "Expert", "Cool", "Bold", "Caring", "Motivating", "Sophisticated", "Down-to-earth", "Inspiring", "Trustworthy", "Fun", "Passionate", "No-nonsense", "Empowering", "Innovative", "Traditional", "Premium", "Accessible", "Ambitious"] },
      { key: "formality", label: "Formality level", type: "select", options: ["Always formal", "Always informal", "Depends on context"] },
      { key: "words_always", label: "Words to always use", type: "text", placeholder: "transformim, rezultate reale, familja jonë" },
      { key: "words_never", label: "Words to never use", type: "text", placeholder: "cheap, budget, competitor names, quick fix" },
      { key: "emoji_usage", label: "Emoji usage", type: "select", options: ["Use often", "Use sparingly", "Never use"] },
      { key: "content_love", label: "Example of content you love", type: "textarea", placeholder: "Paste a social post or ad you think is perfect", maxLength: 500 },
      { key: "content_hate", label: "Example of content you hate", type: "textarea", placeholder: "Show us what bad looks like for your brand", maxLength: 500 },
      { key: "sensitive_topics", label: "Sensitive topics to avoid", type: "textarea", placeholder: "Don't mention alcohol, religion, politics...", maxLength: 300 },
      { key: "never_mention_competitors", label: "Competitors to never mention by name", type: "text", placeholder: "Competitor names to never reference" },
    ],
  },
  {
    id: "visual",
    title: "Visual identity",
    icon: Palette,
    uplift: "Visual preferences help AI generate on-brand creative assets",
    fields: [
      { key: "brand_colors", label: "Brand colors", type: "text", placeholder: "#FF6B35 (orange) and #1A1A2E (dark navy)" },
      { key: "visual_style", label: "Visual style", type: "select", options: ["Clean & Minimal", "Bold & Energetic", "Luxury & Premium", "Warm & Friendly", "Dark & Dramatic", "Colorful & Playful", "Natural & Organic", "Professional & Corporate"] },
      { key: "photo_styles", label: "Photo styles you prefer", type: "chips", options: ["Real photos of space", "Customer photos", "Team photos", "Professional product shots", "Lifestyle imagery", "Before/after", "Behind-the-scenes"] },
      { key: "visual_never", label: "Content to never show visually", type: "textarea", placeholder: "No stock photos of generic businesses...", maxLength: 300 },
      { key: "tagline", label: "Tagline (if you have one)", type: "text", placeholder: "Your transformation starts here" },
      { key: "brand_values", label: "Brand values (pick up to 3)", type: "chips", options: ["Quality", "Trust", "Innovation", "Community", "Affordability", "Luxury", "Speed", "Expertise", "Fun", "Family", "Health", "Sustainability", "Tradition", "Modernity", "Local Pride", "Excellence", "Transparency", "Care", "Results", "Empowerment"] },
    ],
  },
  {
    id: "customer",
    title: "Customer details",
    icon: Users,
    uplift: "Complete customer details for 3x better ad targeting",
    fields: [
      { key: "age_min", label: "Customer minimum age", type: "text", placeholder: "25" },
      { key: "age_max", label: "Customer maximum age", type: "text", placeholder: "45" },
      { key: "gender_mix", label: "Gender mix", type: "select", options: ["Mostly women (80%+)", "Equal mix", "Mostly men (80%+)"] },
      { key: "customer_language", label: "How customers describe their problem", type: "textarea", placeholder: "In their own words, what do they say?", maxLength: 300 },
      { key: "avg_spend", label: "Average monthly spend per customer", type: "select", options: ["Under €20", "€20-50", "€50-100", "€100-200", "€200-500", "Over €500"] },
      { key: "discovery_channels", label: "How customers find you", type: "chips", options: ["Word of mouth", "Instagram", "Facebook", "Google Search", "Google Maps", "TikTok", "Walking by", "Referral program", "Online ads", "Other"] },
      { key: "desired_outcome", label: "What result do customers want?", type: "text", placeholder: "Fresh bread delivered every morning by 7am" },
    ],
  },
  {
    id: "products",
    title: "Product catalog",
    icon: Package,
    uplift: "Product catalog enables automated seasonal campaigns",
    fields: [
      { key: "best_seller", label: "Best-selling product/service", type: "text", placeholder: "Which product sells the most?" },
      { key: "most_profitable", label: "Most profitable product/service", type: "text", placeholder: "Which makes you the most profit?" },
      { key: "current_offer", label: "Current special offer", type: "text", placeholder: "3 days free trial or 50% off first month" },
      { key: "seasonal_offers", label: "Seasonal offers (by month)", type: "textarea", placeholder: "January: New Year package, June: Summer special...", maxLength: 500 },
      { key: "dont_offer", label: "Things you intentionally don't offer", type: "textarea", placeholder: "Services you intentionally don't do and why", maxLength: 300 },
      { key: "price_comparison", label: "How your prices compare", type: "select", options: ["We are cheaper", "Similar pricing", "More expensive but worth it", "Hard to compare"] },
    ],
  },
  {
    id: "operations",
    title: "Operations",
    icon: Clock,
    uplift: "Operations data helps AI schedule posts at optimal times",
    fields: [
      { key: "years_in_business", label: "Years in business", type: "select", options: ["Less than 1 year", "1-2 years", "3-5 years", "6-10 years", "More than 10 years"] },
      { key: "business_stage", label: "Business stage", type: "select", options: ["Just starting", "Growing", "Established", "Scaling"] },
      { key: "operation_model", label: "How do you operate?", type: "select", options: ["Physical location only", "Online only", "Mobile/on-site", "Hybrid"] },
      { key: "busiest_days", label: "Busiest days of the week", type: "chips", options: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] },
      { key: "slowest_days", label: "Slowest days", type: "chips", options: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] },
      { key: "seasonal", label: "Is your business seasonal?", type: "select", options: ["Yes", "No"] },
      { key: "upcoming_events", label: "Upcoming events or launches", type: "textarea", placeholder: "Opening second location in May...", maxLength: 300 },
      { key: "multiple_locations", label: "Multiple locations?", type: "select", options: ["Yes", "No"] },
      { key: "website_url", label: "Website URL", type: "text", placeholder: "https://yourbusiness.com" },
      { key: "booking_url", label: "Booking/order link", type: "text", placeholder: "https://calendly.com/you" },
    ],
  },
  {
    id: "channels",
    title: "Channel performance",
    icon: BarChart3,
    uplift: "Past performance data helps AI learn what works 2x faster",
    fields: [
      { key: "platforms", label: "Active social platforms", type: "chips", options: ["Instagram", "Facebook", "TikTok", "YouTube", "LinkedIn", "Twitter/X", "WhatsApp Business", "Google Business Profile"] },
      { key: "primary_platform", label: "Primary platform", type: "text", placeholder: "Instagram" },
      { key: "current_frequency", label: "Current posting frequency", type: "select", options: ["Never", "Less than once/week", "1-2 times/week", "3-4 times/week", "Daily"] },
      { key: "tried_content_types", label: "Content types you've tried", type: "chips", options: ["Photos", "Videos (Reels)", "Stories", "Carousels", "Text posts", "Before/After", "Behind-the-scenes", "Customer testimonials", "Product demos", "Educational", "Memes", "Promotions", "Live videos"] },
      { key: "best_content", label: "Content that worked best", type: "textarea", placeholder: "Before/after posts always get lots of comments", maxLength: 300 },
      { key: "worst_content", label: "Content that flopped", type: "textarea", placeholder: "Stock photos get ignored", maxLength: 300 },
      { key: "ad_experience", label: "Advertising experience", type: "select", options: ["Never tried ads", "Tried but didn't work", "Basic Facebook/Instagram ads", "Run ads regularly", "Professional experience"] },
      { key: "has_email_list", label: "Do you have an email list?", type: "select", options: ["Yes", "No"] },
      { key: "has_whatsapp", label: "WhatsApp Business?", type: "select", options: ["Yes", "No"] },
      { key: "has_reviews", label: "Google/Facebook Reviews?", type: "select", options: ["Yes", "No"] },
      { key: "communication_channels", label: "How you communicate with customers", type: "chips", options: ["WhatsApp", "SMS", "Email", "Phone calls", "Social media DMs", "In-person"] },
    ],
  },
];

/* ── Component ── */

export default function ProfileEnhancement() {
  const { user } = useAuth();
  const [data, setData] = useState<Record<string, unknown>>({});
  const [open, setOpen] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  // Load existing profile data
  useEffect(() => {
    if (!user?.id) return;
    externalSupabase.from("businesses").select("onboarding_data").eq("user_id", user.id).maybeSingle()
      .then(({ data: row }) => {
        if (!row?.onboarding_data) return;
        try {
          const od = typeof row.onboarding_data === "string" ? JSON.parse(row.onboarding_data) : row.onboarding_data;
          setData(od.form || {});
        } catch {}
      });
  }, [user?.id]);

  const updateField = useCallback(async (key: string, value: unknown) => {
    setData((d) => ({ ...d, [key]: value }));
    setSaving(key);
    if (user?.id) {
      const updated = { ...data, [key]: value };
      await externalSupabase.from("businesses").update({
        onboarding_data: JSON.stringify({ form: updated }),
      }).eq("user_id", user.id);
    }
    setTimeout(() => setSaving(null), 800);
  }, [user?.id, data]);

  // Calculate completion
  const totalFields = SECTIONS.reduce((sum, s) => sum + s.fields.length, 0);
  const filledFields = SECTIONS.reduce((sum, s) => sum + s.fields.filter((f) => {
    const v = data[f.key];
    if (Array.isArray(v)) return v.length > 0;
    return Boolean(v);
  }).length, 0);
  const pct = Math.round((filledFields / totalFields) * 100);
  const tier = pct >= 85 ? "Gold" : pct >= 60 ? "Silver" : pct >= 30 ? "Bronze" : "Starter";
  const tierColor = pct >= 85 ? "text-amber-500" : pct >= 60 ? "text-gray-400" : pct >= 30 ? "text-orange-600" : "text-muted-foreground";

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div>
        <h1 className="text-[clamp(28px,4vw,36px)] font-bold tracking-[-0.025em]">Improve your AI performance</h1>
        <p className="mt-2 text-[17px] leading-[1.55] text-muted-foreground" style={{ maxWidth: "60ch" }}>
          Maroa performs better the more it knows about your business. Complete these optional sections to unlock better content, smarter ads, and sharper targeting.
        </p>
      </div>

      {/* Progress ring + badge */}
      <div className="flex items-center gap-6 rounded-2xl border border-[var(--border-default)] bg-white p-6 shadow-[var(--shadow-xs)]">
        <div className="relative h-20 w-20 shrink-0">
          <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
            <circle cx="40" cy="40" r="34" fill="none" stroke="var(--bg-muted)" strokeWidth="6" />
            <circle cx="40" cy="40" r="34" fill="none" stroke="var(--brand)" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 34}`} strokeDashoffset={`${2 * Math.PI * 34 * (1 - pct / 100)}`} className="transition-all duration-700" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-lg font-bold tabular-nums">{pct}%</span>
        </div>
        <div>
          <div className="text-sm font-medium text-foreground">Profile strength</div>
          <div className={`text-sm font-semibold ${tierColor}`}>{tier} tier</div>
          <div className="mt-1 text-[12px] text-muted-foreground">{filledFields} of {totalFields} fields completed</div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {SECTIONS.map((section) => {
          const filled = section.fields.filter((f) => {
            const v = data[f.key];
            return Array.isArray(v) ? v.length > 0 : Boolean(v);
          }).length;
          const isOpen = open === section.id;

          return (
            <div key={section.id} className="overflow-hidden rounded-2xl border border-[var(--border-default)] bg-white transition-shadow hover:shadow-[var(--shadow-xs)]">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : section.id)}
                className="flex w-full items-center gap-4 px-6 py-5 text-left"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-subtle)] text-[var(--brand)]">
                  <section.icon className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-foreground">{section.title}</div>
                  <div className="mt-0.5 text-[12px] text-muted-foreground">{filled} of {section.fields.length} completed</div>
                </div>
                <div className="flex items-center gap-3">
                  {filled === section.fields.length && <Check className="h-4 w-4 text-[var(--brand)]" />}
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-[var(--border-default)] px-6 py-6">
                  <p className="mb-6 rounded-xl bg-[var(--brand-subtle)] px-4 py-3 text-[13px] text-[var(--brand)]">
                    {section.uplift}
                  </p>
                  <div className="space-y-5">
                    {section.fields.map((field) => (
                      <FieldRenderer key={field.key} field={field} value={data[field.key]} onChange={(v) => updateField(field.key, v)} isSaving={saving === field.key} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Generic field renderer ── */

function FieldRenderer({ field, value, onChange, isSaving }: { field: Field; value: unknown; onChange: (v: unknown) => void; isSaving: boolean }) {
  const strVal = typeof value === "string" ? value : "";
  const arrVal = Array.isArray(value) ? (value as string[]) : [];

  if (field.type === "text") {
    return (
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-[13px] font-medium text-foreground">{field.label}</label>
          {isSaving && <span className="text-[11px] text-[var(--brand)]">Saved</span>}
        </div>
        <input type="text" value={strVal} onBlur={(e) => onChange(e.target.value)} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} className="w-full rounded-xl border border-[var(--border-default)] bg-white px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-all hover:border-[var(--border-strong)] focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]/20" />
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-[13px] font-medium text-foreground">{field.label}</label>
          <div className="flex items-center gap-2">
            {isSaving && <span className="text-[11px] text-[var(--brand)]">Saved</span>}
            {field.maxLength && <span className="text-[11px] tabular-nums text-muted-foreground">{strVal.length}/{field.maxLength}</span>}
          </div>
        </div>
        <textarea value={strVal} onChange={(e) => onChange(field.maxLength ? e.target.value.slice(0, field.maxLength) : e.target.value)} onBlur={(e) => onChange(e.target.value)} placeholder={field.placeholder} rows={3} className="w-full resize-none rounded-xl border border-[var(--border-default)] bg-white px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-all hover:border-[var(--border-strong)] focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]/20" />
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-[13px] font-medium text-foreground">{field.label}</label>
          {isSaving && <span className="text-[11px] text-[var(--brand)]">Saved</span>}
        </div>
        <select value={strVal} onChange={(e) => onChange(e.target.value)} className="w-full appearance-none rounded-xl border border-[var(--border-default)] bg-white px-4 py-3 text-sm text-foreground transition-all hover:border-[var(--border-strong)] focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]/20">
          <option value="">Select...</option>
          {field.options?.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    );
  }

  if (field.type === "chips") {
    const toggle = (opt: string) => {
      if (arrVal.includes(opt)) {
        onChange(arrVal.filter((s) => s !== opt));
      } else {
        onChange([...arrVal, opt]);
      }
    };
    return (
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-[13px] font-medium text-foreground">{field.label}</label>
          {isSaving && <span className="text-[11px] text-[var(--brand)]">Saved</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          {field.options?.map((opt) => {
            const active = arrVal.includes(opt);
            return (
              <button key={opt} type="button" onClick={() => toggle(opt)} className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-all ${active ? "border-[var(--brand)] bg-[var(--brand)] text-white" : "border-[var(--border-default)] bg-white text-muted-foreground hover:border-[var(--border-strong)]"}`}>
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}
