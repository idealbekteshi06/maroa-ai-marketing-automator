import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, Check, Bot, Calendar, Target, BarChart3, Globe, Zap, ArrowRight } from "lucide-react";

const LAUNCH_DATE = new Date("2026-04-28T00:00:00Z").getTime();
const API = "https://maroa-api-production.up.railway.app";
const FLAGS = ["🇽🇰", "🇦🇱", "🇬🇧", "🇩🇪", "🇦🇪", "🇺🇸", "🇫🇷", "🇮🇹"];

const PLANS = [
  {
    key: "starter", name: "Starter", was: 29, now: 19, save: "34%", popular: false,
    features: ["2 social platforms", "15 AI posts/month", "AI runs daily", "22 countries + 17 languages"],
  },
  {
    key: "growth", name: "Growth", was: 69, now: 39, save: "43%", popular: true,
    features: ["5 social platforms", "Unlimited AI content", "AI runs 3× daily", "Paid ads management", "Competitor tracking", "Email + WhatsApp campaigns", "All 28 AI modules"],
  },
  {
    key: "agency", name: "Agency", was: 149, now: 79, save: "47%", popular: false,
    features: ["10 business profiles", "Everything in Growth", "AI runs 5× daily", "White-label", "API access"],
  },
];

const BIZ_TYPES = ["Restaurant", "Gym/Fitness", "Retail", "Beauty/Salon", "Real Estate", "Agency", "Café/Bar", "Medical", "Education", "Other"];
const COUNTRIES = ["Kosovo", "Albania", "USA", "UK", "Germany", "UAE", "Turkey", "Italy", "France", "Other"];

const FEATURES = [
  { icon: Bot, title: "Writes your content", desc: "Posts, captions, ads, and emails — written by AI that knows your business, your city, and your customers." },
  { icon: Calendar, title: "Plans your calendar", desc: "30 days of content scheduled automatically. Holidays, peak times, local events — all considered." },
  { icon: Target, title: "Tracks competitors", desc: "Know what your competitors are posting, what's working for them, and how to beat them." },
  { icon: BarChart3, title: "Reads your analytics", desc: "Understands what content performs best and automatically does more of what works." },
  { icon: Globe, title: "Speaks your language", desc: "Albanian, English, Arabic, German — generates content in your language for your market." },
  { icon: Zap, title: "Never stops working", desc: "While you sleep, serve customers, or take a day off — maroa.ai keeps your marketing running." },
];

/* ── Countdown ── */
function useCountdown() {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, LAUNCH_DATE - Date.now());
      setT({ d: Math.floor(diff / 864e5), h: Math.floor((diff % 864e5) / 36e5), m: Math.floor((diff % 36e5) / 6e4), s: Math.floor((diff % 6e4) / 1e3) });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

/* ── Fade-in on scroll ── */
function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, style: { opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)", transition: "opacity 0.7s ease, transform 0.7s ease" } as React.CSSProperties };
}

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const fade = useFadeIn();
  return <section ref={fade.ref} style={fade.style} className={className}>{children}</section>;
}

/* ── Page ── */
export default function Index() {
  const cd = useCountdown();
  const [form, setForm] = useState({ name: "", email: "", plan: "growth", business_type: "", country: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const up = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) { toast.error("Name and email are required"); return; }
    setSubmitting(true);
    try {
      const r = await fetch(`${API}/api/waitlist/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, registered_at: new Date().toISOString() }) });
      if (!r.ok) throw 0;
      setSubmitted(true);
      toast.success("You're on the list!");
    } catch { toast.error("Something went wrong — try again"); }
    finally { setSubmitting(false); }
  };

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: "smooth" });

  const inputCls = "w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10 transition-all";
  const selectCls = inputCls;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-primary/30">

      {/* ── NAV ── */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <Link to="/" className="text-lg font-bold tracking-tight">maroa<span className="text-primary">.</span>ai</Link>
        <Link to="/access" className="text-sm text-white/40 hover:text-white/70 transition-colors">Sign in</Link>
      </nav>

      {/* ── HERO ── */}
      <section className="pt-16 sm:pt-28 pb-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1.5 text-xs text-white/50 mb-8">
            🚀 Launching April 28, 2026
          </span>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08]">
            Your Marketing.<br />
            <span className="bg-gradient-to-r from-primary via-purple-400 to-primary bg-clip-text text-transparent">Automated by AI.</span><br />
            While You Sleep.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-white/40 max-w-xl mx-auto leading-relaxed">
            maroa.ai creates your posts, writes your ads, tracks your competitors, and grows your business — automatically. In 22 countries and 17 languages.
          </p>

          {/* Countdown */}
          <div className="mt-10 inline-flex items-center gap-3 sm:gap-4">
            {[
              { v: cd.d, l: "Days" }, { v: cd.h, l: "Hours" }, { v: cd.m, l: "Min" }, { v: cd.s, l: "Sec" },
            ].map((u, i) => (
              <div key={u.l} className="flex items-center gap-3 sm:gap-4">
                {i > 0 && <span className="text-white/10 text-lg">:</span>}
                <div className="flex flex-col items-center">
                  <span className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {String(u.v).padStart(2, "0")}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-white/25 mt-1">{u.l}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-center gap-2 text-lg">{FLAGS.map((f, i) => <span key={i} className="opacity-60">{f}</span>)}</div>
        </div>
      </section>

      {/* ── PRE-ORDER ── */}
      <Section className="px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs uppercase tracking-[0.2em] text-primary text-center mb-3">Pre-Launch Offer</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-center tracking-tight">Lock in your price before April 28.</h2>
          <p className="text-center text-white/35 mt-2 text-sm">These prices disappear at launch. Forever.</p>

          <div className="mt-12 grid gap-4 sm:gap-5 lg:grid-cols-3">
            {PLANS.map(p => (
              <div key={p.key}
                className={`relative group rounded-2xl border p-6 sm:p-7 transition-all duration-300 ${
                  p.popular
                    ? "border-primary/40 bg-white/[0.03] shadow-[0_0_40px_-12px_hsl(var(--primary)/0.3)]"
                    : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]"
                }`}
                style={p.popular ? { transform: "scale(1.03)" } : undefined}
              >
                {p.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-[10px] font-semibold text-white uppercase tracking-wider">
                    Most Popular
                  </span>
                )}
                <p className="text-[11px] uppercase tracking-[0.15em] text-white/40">{p.name}</p>
                <div className="mt-4">
                  <span className="text-sm line-through text-white/20">€{p.was}/mo</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-4xl font-bold">€{p.now}</span>
                    <span className="text-sm text-white/30">/mo</span>
                  </div>
                  <p className="text-[11px] text-white/25 mt-1">per month · billed annually</p>
                </div>
                <span className="inline-block mt-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400">
                  Save {p.save}
                </span>
                <ul className="mt-5 space-y-2.5">
                  {p.features.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-[13px] text-white/50">
                      <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button onClick={scrollToForm}
                  className={`mt-6 w-full rounded-xl py-3 text-sm font-medium transition-all ${
                    p.popular
                      ? "bg-primary text-white hover:bg-primary/90"
                      : "bg-white/[0.06] text-white/70 hover:bg-white/[0.1] hover:text-white"
                  }`}>
                  Get Early Access
                </button>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-xs text-white/25">
            ⏰ Pre-launch prices expire April 28 at midnight · 1 week free trial included · No credit card needed
          </p>
        </div>
      </Section>

      {/* ── FORM ── */}
      <Section className="px-6 pb-24">
        <div ref={formRef} className="max-w-md mx-auto">
          {submitted ? (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 mb-4">
                <Check className="h-7 w-7 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold">🎉 You're on the list!</h3>
              <p className="text-sm text-white/40 mt-2">Check your email for confirmation. Your pre-launch price is locked.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold tracking-tight">Reserve your spot. It's free.</h3>
                <p className="text-sm text-white/35 mt-1.5">Join 247+ businesses getting early access.</p>
              </div>

              <input type="text" required value={form.name} onChange={e => up("name", e.target.value)} placeholder="Full name" className={inputCls} />
              <input type="email" required value={form.email} onChange={e => up("email", e.target.value)} placeholder="Email address" className={inputCls} />

              <select value={form.plan} onChange={e => up("plan", e.target.value)} className={selectCls}>
                <option value="starter">Starter — €19/mo</option>
                <option value="growth">Growth — €39/mo (Most Popular)</option>
                <option value="agency">Agency — €79/mo</option>
              </select>

              <div className="grid grid-cols-2 gap-3">
                <select value={form.business_type} onChange={e => up("business_type", e.target.value)} className={selectCls}>
                  <option value="">Business type</option>
                  {BIZ_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={form.country} onChange={e => up("country", e.target.value)} className={selectCls}>
                  <option value="">Country</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <button type="submit" disabled={submitting}
                className="w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-white hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><span>Reserve My Spot</span><ArrowRight className="h-4 w-4" /></>}
              </button>

              <p className="text-center text-[11px] text-white/20">No credit card · 1 week free trial · Cancel anytime</p>
            </form>
          )}
        </div>
      </Section>

      {/* ── FEATURES ── */}
      <Section className="px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs uppercase tracking-[0.2em] text-primary text-center mb-3">What Maroa.ai Does</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-center tracking-tight">Set it up once. Let AI handle everything.</h2>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(f => (
              <div key={f.title} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-300">
                <f.icon className="h-5 w-5 text-primary mb-4" />
                <h3 className="text-sm font-semibold text-white/90">{f.title}</h3>
                <p className="text-[13px] text-white/35 mt-1.5 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── SOCIAL PROOF ── */}
      <Section className="px-6 pb-24 text-center">
        <p className="text-5xl sm:text-6xl font-bold tracking-tight">247+</p>
        <p className="text-sm text-white/35 mt-2">businesses registered for early access</p>
        <div className="mt-4 flex justify-center gap-2 text-lg">{FLAGS.map((f, i) => <span key={i} className="opacity-50">{f}</span>)}</div>
        <p className="text-xs text-white/20 mt-3">From Kosovo to Dubai to London — choosing AI over agencies.</p>
      </Section>

      {/* ── FINAL CTA ── */}
      <Section className="px-6 pb-24">
        <div className="max-w-2xl mx-auto text-center rounded-3xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent p-10 sm:p-14">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Stop paying agencies.<br />Start using AI.</h2>
          <p className="text-sm text-white/35 mt-3 max-w-md mx-auto">
            For €39/month, maroa.ai does everything a €2,000/month marketing agency does — automatically.
          </p>
          <button onClick={scrollToForm}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-white hover:bg-primary/90 transition-all">
            Get Early Access <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </Section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/[0.04] px-6 py-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-white/20">© 2026 maroa.ai</span>
          <div className="flex gap-5 text-xs text-white/20">
            <Link to="/terms" className="hover:text-white/50 transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-white/50 transition-colors">Privacy</Link>
            <Link to="/refund" className="hover:text-white/50 transition-colors">Refund</Link>
          </div>
        </div>
        <div className="mt-6 text-center">
          <Link to="/access" className="text-[10px] text-white/[0.08] hover:text-white/20 transition-colors">Team access →</Link>
        </div>
      </footer>
    </div>
  );
}
