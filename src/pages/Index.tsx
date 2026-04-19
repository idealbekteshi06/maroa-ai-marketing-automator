import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { apiPost } from "@/lib/apiClient";
import { Loader2, Check, Bot, Calendar, Target, BarChart3, Globe, Zap, ArrowRight, Sun, Moon, Sparkles, Search, MessageCircle, Mail, Link2, Cpu } from "lucide-react";

const LAUNCH_DATE = new Date("2026-04-28T00:00:00Z").getTime();
const FLAGS = ["🇽🇰", "🇦🇱", "🇬🇧", "🇩🇪", "🇦🇪", "🇺🇸", "🇫🇷", "🇮🇹"];

const PLANS = [
  { key: "starter", name: "Starter", was: 29, now: 19, save: "34%", popular: false, features: ["1 platform", "20 AI images/mo", "AI brain 1×/day", "Content calendar", "Email support"] },
  { key: "growth", name: "Growth", was: 59, now: 39, save: "34%", popular: true, features: ["3 platforms", "60 AI images/mo", "25 Kling videos", "5 Sora videos", "AI brain 3×/day", "Paid ads", "Competitor tracking", "Analytics"] },
  { key: "agency", name: "Agency", was: 99, now: 69, save: "30%", popular: false, features: ["Unlimited platforms", "120 AI images/mo", "50 Kling + 15 Sora videos", "3 brands", "White-label", "API access", "AI brain 5×/day"] },
];

const BIZ_TYPES = ["Restaurant", "Gym/Fitness", "Retail", "Beauty/Salon", "Real Estate", "Agency", "Café/Bar", "Medical", "Education", "Other"];
const COUNTRIES = ["Kosovo", "Albania", "USA", "UK", "Germany", "UAE", "Turkey", "Italy", "France", "Other"];

const FEATURES = [
  { icon: Sparkles, title: "AI Content Creation", desc: "Posts, captions, ads, and emails — written by AI that knows your business, your city, and your customers." },
  { icon: Target, title: "Ad Optimization", desc: "Meta and Google ads managed by AI. Budgets shift automatically to what converts, every single day." },
  { icon: Search, title: "Competitor Tracking", desc: "Know what your competitors are posting, what's working for them, and how to outperform them." },
  { icon: MessageCircle, title: "Unified Inbox", desc: "Instagram, Facebook, WhatsApp, and email — every customer conversation in one AI-powered queue." },
  { icon: Mail, title: "Email Automation", desc: "Welcome sequences, cart recovery, re-engagement — all running on autopilot with personalized content." },
  { icon: BarChart3, title: "Analytics Dashboard", desc: "Understands what content performs best and automatically does more of what works across every channel." },
];

const STEPS = [
  { num: "01", icon: Link2, title: "Connect your accounts", desc: "Link Instagram, Facebook, Google, and email in under 2 minutes. We handle the OAuth, you just click." },
  { num: "02", icon: Cpu, title: "AI analyzes your brand", desc: "Maroa reads your brand, studies your competitors, and builds a strategy unique to your business and market." },
  { num: "03", icon: Zap, title: "Everything runs automatically", desc: "Content, ads, emails, and insights — running 24/7. You approve what matters, AI handles the rest." },
];

const PROOF_STATS = [
  { value: "22", label: "Countries supported" },
  { value: "17", label: "Languages" },
  { value: "99%", label: "Uptime" },
  { value: "10min", label: "Setup time" },
];

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

function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } }, { threshold: 0.12 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, style: { opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(20px)", transition: "opacity 0.6s ease, transform 0.6s ease" } as React.CSSProperties };
}

function Fade({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const f = useFadeIn();
  return <section ref={f.ref} style={f.style} className={className}>{children}</section>;
}

/* ── Theme colors: resolved dynamically ── */
const c = {
  bg: "bg-white dark:bg-[#0a0a0a]",
  card: "bg-[#f5f5f7] dark:bg-[#111]",
  cardBorder: "border-[#e5e5e5] dark:border-[#222]",
  cardHover: "hover:border-[#ccc] dark:hover:border-[#333]",
  text: "text-[#0a0a0a] dark:text-white",
  textSub: "text-[#6b7280] dark:text-[#9ca3af]",
  textFaint: "text-[#9ca3af] dark:text-[#555]",
  primary: "text-blue-600 dark:text-blue-400",
  primaryBg: "bg-blue-600 dark:bg-blue-500",
  primaryBgHover: "hover:bg-blue-700 dark:hover:bg-blue-400",
  inputBg: "bg-[#f0f0f2] dark:bg-white/[0.03]",
  inputBorder: "border-[#ddd] dark:border-white/[0.06]",
  inputFocus: "focus:border-blue-400 dark:focus:border-white/20",
};

export default function Index() {
  const cd = useCountdown();
  const [form, setForm] = useState({ name: "", email: "", plan: "growth", business_type: "", country: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  /* ── Theme ── */
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem("maroa-theme");
    return saved === "dark";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("maroa-theme", isDark ? "dark" : "light");
  }, [isDark]);

  const up = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: "smooth" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) { toast.error("Name and email are required"); return; }
    setSubmitting(true);
    try {
      await apiPost("/api/waitlist/register", { ...form, registered_at: new Date().toISOString() });
      setSubmitted(true);
      toast.success("You're on the list!");
    } catch { toast.error("Something went wrong — try again"); }
    finally { setSubmitting(false); }
  };

  const inputCls = `w-full rounded-xl border ${c.inputBorder} ${c.inputBg} px-4 py-3 text-sm ${c.text} placeholder:${c.textFaint} ${c.inputFocus} focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-all`;

  return (
    <div className={`min-h-screen ${c.bg} ${c.text} transition-colors duration-300`}>

      {/* ── NAV ── */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <Link to="/" className={`text-lg font-bold tracking-tight ${c.text}`}>
          maroa<span className={c.primary}>.</span>ai
        </Link>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsDark(!isDark)} className={`rounded-full p-2 ${c.card} ${c.cardBorder} border transition-colors`} aria-label="Toggle theme">
            {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-blue-500" />}
          </button>
          <Link to="/access" className={`text-sm ${c.textSub} hover:${c.text} transition-colors`}>Sign in</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="pt-16 sm:pt-28 pb-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <span className={`inline-flex items-center gap-2 rounded-full border ${c.cardBorder} ${c.card} px-4 py-1.5 text-xs ${c.textSub} mb-8`}>
            🚀 Launching April 28, 2026
          </span>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08]">
            Your Marketing.<br />
            <span className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 dark:from-blue-400 dark:via-blue-500 dark:to-blue-400 bg-clip-text text-transparent">
              Automated by AI.
            </span><br />
            While You Sleep.
          </h1>

          <p className={`mt-6 text-base sm:text-lg ${c.textSub} max-w-xl mx-auto leading-relaxed`}>
            maroa.ai creates your posts, writes your ads, tracks your competitors, and grows your business — automatically. In 22 countries and 17 languages.
          </p>

          {/* Countdown */}
          <div className="mt-10 inline-flex items-center gap-3 sm:gap-4">
            {[{ v: cd.d, l: "Days" }, { v: cd.h, l: "Hours" }, { v: cd.m, l: "Min" }, { v: cd.s, l: "Sec" }].map((u, i) => (
              <div key={u.l} className="flex items-center gap-3 sm:gap-4">
                {i > 0 && <span className={c.textFaint}>:</span>}
                <div className="flex flex-col items-center">
                  <div className={`rounded-xl ${c.card} border ${c.cardBorder} px-3 sm:px-4 py-2`}>
                    <span className="text-2xl sm:text-3xl font-bold" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {String(u.v).padStart(2, "0")}
                    </span>
                  </div>
                  <span className={`text-[10px] uppercase tracking-widest ${c.textFaint} mt-1.5`}>{u.l}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-center gap-2 text-lg">{FLAGS.map((f, i) => <span key={i} className="opacity-60">{f}</span>)}</div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <Fade className="px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          <p className={`text-xs uppercase tracking-[0.2em] ${c.primary} text-center mb-3`}>Pre-Launch Offer</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-center tracking-tight">Lock in your price before April 28.</h2>
          <p className={`text-center ${c.textSub} mt-2 text-sm`}>These prices disappear at launch. Forever.</p>

          <div className="mt-12 grid gap-4 sm:gap-5 lg:grid-cols-3">
            {PLANS.map(p => (
              <div key={p.key}
                className={`relative group rounded-2xl border p-6 sm:p-7 transition-all duration-300 ${
                  p.popular
                    ? `border-blue-500/40 dark:border-blue-400/40 ${c.card} shadow-[0_0_40px_-12px_rgba(59,130,246,0.25)] dark:shadow-[0_0_40px_-12px_rgba(96,165,250,0.2)]`
                    : `${c.cardBorder} ${c.card} ${c.cardHover}`
                }`}
                style={p.popular ? { transform: "scale(1.03)" } : undefined}
              >
                {p.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 dark:bg-blue-500 px-4 py-1 text-[10px] font-semibold text-white uppercase tracking-wider">
                    Most Popular
                  </span>
                )}
                <p className={`text-[11px] uppercase tracking-[0.15em] ${c.textSub}`}>{p.name}</p>
                <div className="mt-4">
                  <span className={`text-sm line-through ${c.textFaint}`}>€{p.was}/mo</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-4xl font-bold">€{p.now}</span>
                    <span className={`text-sm ${c.textSub}`}>/mo</span>
                  </div>
                  <p className={`text-[11px] ${c.textFaint} mt-1`}>per month · billed annually</p>
                </div>
                <span className="inline-block mt-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                  Save {p.save}
                </span>
                <ul className="mt-5 space-y-2.5">
                  {p.features.map(f => (
                    <li key={f} className={`flex items-start gap-2.5 text-[13px] ${c.textSub}`}>
                      <Check className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />{f}
                    </li>
                  ))}
                </ul>
                <button onClick={scrollToForm}
                  className={`mt-6 w-full rounded-xl py-3 text-sm font-medium transition-all ${
                    p.popular
                      ? `${c.primaryBg} text-white ${c.primaryBgHover}`
                      : `${c.card} border ${c.cardBorder} ${c.text} ${c.cardHover}`
                  }`}>
                  Get Early Access
                </button>
              </div>
            ))}
          </div>
          <p className={`mt-8 text-center text-xs ${c.textFaint}`}>
            ⏰ Pre-launch prices expire April 28 at midnight · 1 week free trial · No credit card needed
          </p>
        </div>
      </Fade>

      {/* ── FORM ── */}
      <Fade className="px-6 pb-24">
        <div ref={formRef} className="max-w-md mx-auto">
          {submitted ? (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/[0.04] p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/10 mb-4">
                <Check className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold">🎉 You're on the list!</h3>
              <p className={`text-sm ${c.textSub} mt-2`}>Check your email for confirmation. Your pre-launch price is locked.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold tracking-tight">Reserve your spot. It's free.</h3>
                <p className={`text-sm ${c.textSub} mt-1.5`}>Join 247+ businesses getting early access.</p>
              </div>
              <input type="text" required value={form.name} onChange={e => up("name", e.target.value)} placeholder="Full name" className={inputCls} />
              <input type="email" required value={form.email} onChange={e => up("email", e.target.value)} placeholder="Email address" className={inputCls} />
              <select value={form.plan} onChange={e => up("plan", e.target.value)} className={inputCls}>
                <option value="starter">Starter — €19/mo (was €29)</option>
                <option value="growth">Growth — €39/mo (Most Popular)</option>
                <option value="agency">Agency — €69/mo (was €99)</option>
              </select>
              <div className="grid grid-cols-2 gap-3">
                <select value={form.business_type} onChange={e => up("business_type", e.target.value)} className={inputCls}>
                  <option value="">Business type</option>
                  {BIZ_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={form.country} onChange={e => up("country", e.target.value)} className={inputCls}>
                  <option value="">Country</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button type="submit" disabled={submitting}
                className={`w-full rounded-xl ${c.primaryBg} py-3.5 text-sm font-semibold text-white ${c.primaryBgHover} transition-all disabled:opacity-50 flex items-center justify-center gap-2`}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><span>Reserve My Spot</span><ArrowRight className="h-4 w-4" /></>}
              </button>
              <p className={`text-center text-[11px] ${c.textFaint}`}>No credit card · 1 week free trial · Cancel anytime</p>
            </form>
          )}
        </div>
      </Fade>

      {/* ── FEATURES ── */}
      <Fade className="px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          <p className={`text-xs uppercase tracking-[0.2em] ${c.primary} text-center mb-3`}>What Maroa.ai Does</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-center tracking-tight">Set it up once. Let AI handle everything.</h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(f => (
              <div key={f.title} className={`group rounded-2xl border ${c.cardBorder} ${c.card} p-6 ${c.cardHover} transition-all duration-300`}>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 dark:bg-blue-400/10 mb-4 group-hover:scale-110 transition-transform">
                  <f.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-sm font-semibold">{f.title}</h3>
                <p className={`text-[13px] ${c.textSub} mt-1.5 leading-relaxed`}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Fade>

      {/* ── HOW IT WORKS ── */}
      <Fade className="px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          <p className={`text-xs uppercase tracking-[0.2em] ${c.primary} text-center mb-3`}>How It Works</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-center tracking-tight">Three steps. Ten minutes. Done forever.</h2>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.num} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-full w-6 z-10">
                    <ArrowRight className={`h-4 w-4 ${c.textFaint}`} />
                  </div>
                )}
                <div className={`rounded-2xl border ${c.cardBorder} ${c.card} p-6 h-full transition-all duration-300 ${c.cardHover}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 dark:bg-blue-500 text-white text-xs font-bold">{s.num}</span>
                    <s.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-sm font-semibold">{s.title}</h3>
                  <p className={`text-[13px] ${c.textSub} mt-1.5 leading-relaxed`}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Fade>

      {/* ── PROOF STRIP ── */}
      <Fade className="px-6 pb-24">
        <div className={`max-w-4xl mx-auto rounded-2xl border ${c.cardBorder} ${c.card} py-8 px-6`}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {PROOF_STATS.map(s => (
              <div key={s.label} className="text-center">
                <p className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-400 dark:to-blue-300 bg-clip-text text-transparent">{s.value}</p>
                <p className={`text-xs ${c.textSub} mt-1 uppercase tracking-wider`}>{s.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-center gap-2 text-lg">{FLAGS.map((f, i) => <span key={i} className="opacity-50">{f}</span>)}</div>
          <p className={`text-xs ${c.textFaint} mt-2 text-center`}>From Kosovo to Dubai to London — choosing AI over agencies.</p>
        </div>
      </Fade>

      {/* ── PRICING CTA ── */}
      <Fade className="px-6 pb-24 text-center">
        <p className={`text-xs uppercase tracking-[0.2em] ${c.primary} mb-3`}>Pricing</p>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Start free, upgrade as you grow.</h2>
        <p className={`text-sm ${c.textSub} mt-3 max-w-md mx-auto`}>
          No credit card required. Try every feature free for 7 days, then pick the plan that fits your business.
        </p>
        <Link to="/pricing"
          className={`mt-8 inline-flex items-center gap-2 rounded-xl ${c.primaryBg} px-8 py-3.5 text-sm font-semibold text-white ${c.primaryBgHover} transition-all`}>
          View Plans & Pricing <ArrowRight className="h-4 w-4" />
        </Link>
      </Fade>

      {/* ── FINAL CTA ── */}
      <Fade className="px-6 pb-24">
        <div className="max-w-3xl mx-auto text-center rounded-3xl border border-blue-500/20 dark:border-blue-400/20 bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-500/[0.04] dark:to-transparent p-10 sm:p-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Ready to put your marketing<br />on autopilot?
          </h2>
          <p className={`text-sm ${c.textSub} mt-4 max-w-lg mx-auto`}>
            Join 247+ businesses that replaced their marketing agency with AI. Setup takes 10 minutes. Results start on day one.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button onClick={scrollToForm}
              className={`inline-flex items-center gap-2 rounded-xl ${c.primaryBg} px-8 py-3.5 text-sm font-semibold text-white ${c.primaryBgHover} transition-all`}>
              Start Free Trial <ArrowRight className="h-4 w-4" />
            </button>
            <Link to="/pricing"
              className={`inline-flex items-center gap-2 rounded-xl border ${c.cardBorder} px-6 py-3.5 text-sm font-medium ${c.text} ${c.cardHover} transition-all`}>
              Book a Demo
            </Link>
          </div>
          <p className={`text-xs ${c.textFaint} mt-4`}>No credit card · 7-day free trial · Cancel anytime</p>
        </div>
      </Fade>

      {/* ── FOOTER ── */}
      <footer className={`border-t ${c.cardBorder} px-6 py-8`}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className={`text-xs ${c.textFaint}`}>© 2026 maroa.ai</span>
          <div className={`flex gap-5 text-xs ${c.textFaint}`}>
            <Link to="/terms" className={`hover:${c.textSub} transition-colors`}>Terms</Link>
            <Link to="/privacy" className={`hover:${c.textSub} transition-colors`}>Privacy</Link>
            <Link to="/data-deletion" className={`hover:${c.textSub} transition-colors`}>Data Deletion</Link>
          </div>
        </div>
        <div className="mt-6 text-center">
          <Link to="/access" className={`text-[10px] ${c.textFaint} opacity-30 hover:opacity-70 transition-opacity`}>Team access →</Link>
        </div>
      </footer>
    </div>
  );
}
