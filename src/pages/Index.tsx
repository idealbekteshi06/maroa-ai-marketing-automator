import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { apiPost } from "@/lib/apiClient";
import { Loader2, Check, Target, BarChart3, Zap, ArrowRight, Sun, Moon, Sparkles, Search, MessageCircle, Mail, Link2, Cpu } from "lucide-react";
import { PLANS } from "@/lib/constants/plans";
import { INDUSTRIES } from "@/lib/constants/industries";
import FlagStrip from "@/components/FlagStrip";

const COUNTRIES = ["Kosovo", "Albania", "USA", "UK", "Germany", "UAE", "Turkey", "Italy", "France", "Other"];

const FEATURES = [
  { icon: Sparkles, title: "AI Content Creation", desc: "Posts, captions, ads, and emails — written by AI that knows your business, your city, and your customers." },
  { icon: Target, title: "Ad Optimization", desc: "Meta and Google ads managed by AI. Budgets shift automatically to what converts, every single day." },
  { icon: Search, title: "Competitor Tracking", desc: "Know what your competitors are posting, what's working for them, and how to outperform them." },
  { icon: MessageCircle, title: "Unified Inbox", desc: "Instagram, Facebook, WhatsApp, and email — every customer message in one place, replies drafted by AI." },
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
  { value: "6", label: "Languages live" },
  { value: "99.9%", label: "Uptime · last 90d" },
  { value: "10min", label: "Setup time" },
];

function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // If already in viewport on mount, skip the fade-in delay (no flash on hard refresh).
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setVis(true);
      return;
    }
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
  textFaint: "text-[#9ca3af] dark:text-[#6b7280]",
  primary: "text-blue-600 dark:text-blue-400",
  primaryBg: "bg-blue-600 dark:bg-blue-500",
  primaryBgHover: "hover:bg-blue-700 dark:hover:bg-blue-400",
  inputBg: "bg-[#f0f0f2] dark:bg-white/[0.03]",
  inputBorder: "border-[#ddd] dark:border-white/[0.06]",
  inputFocus: "focus:border-blue-400 dark:focus:border-white/20",
};

const BIZ_TYPES = INDUSTRIES.slice(0, 12) as readonly string[];

export default function Index() {
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
      toast.success("Thanks — we'll be in touch.");
    } catch { toast.error("Something went wrong — try again"); }
    finally { setSubmitting(false); }
  };

  const inputCls = `w-full rounded-xl border ${c.inputBorder} ${c.inputBg} px-4 py-3 text-sm ${c.text} placeholder:${c.textFaint} ${c.inputFocus} focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-all`;

  return (
    <div className={`min-h-screen ${c.bg} ${c.text} transition-colors duration-300`}>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded focus:bg-blue-600 focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-white">
        Skip to content
      </a>

      {/* ── NAV ── */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <Link to="/" className={`text-lg font-bold tracking-tight ${c.text}`}>
          maroa<span className={c.primary}>.</span>ai
        </Link>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsDark(!isDark)} className={`rounded-full p-2 ${c.card} ${c.cardBorder} border transition-colors`} aria-label="Toggle theme">
            {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-blue-500" />}
          </button>
          <Link to="/login" className={`text-sm ${c.textSub} hover:${c.text} transition-colors`}>Sign in</Link>
          <Link to="/signup" className={`hidden sm:inline-flex items-center gap-1.5 rounded-full ${c.primaryBg} px-4 py-1.5 text-xs font-semibold text-white ${c.primaryBgHover} transition-all`}>
            Start free trial <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <main id="main">
      <section className="pt-16 sm:pt-28 pb-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <span className={`inline-flex items-center gap-2 rounded-full border ${c.cardBorder} ${c.card} px-4 py-1.5 text-xs ${c.textSub} mb-8`}>
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            Live now · 22 countries · 6 languages
          </span>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08]">
            Your Marketing.<br />
            <span className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 dark:from-blue-400 dark:via-blue-500 dark:to-blue-400 bg-clip-text text-transparent">
              Automated by AI.
            </span><br />
            While You Sleep.
          </h1>

          <p className={`mt-6 text-base sm:text-lg ${c.textSub} max-w-xl mx-auto leading-relaxed`}>
            maroa.ai creates your posts, writes your ads, tracks your competitors, and grows your business — automatically.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/signup"
              className={`inline-flex items-center justify-center gap-2 rounded-xl ${c.primaryBg} px-8 py-3.5 text-sm font-semibold text-white ${c.primaryBgHover} transition-all`}>
              Start free trial <ArrowRight className="h-4 w-4" />
            </Link>
            <button onClick={scrollToForm}
              className={`inline-flex items-center justify-center gap-2 rounded-xl border ${c.cardBorder} ${c.card} px-8 py-3.5 text-sm font-medium ${c.text} ${c.cardHover} transition-all`}>
              Book a demo
            </button>
          </div>
          <p className={`text-xs ${c.textFaint} mt-4`}>7-day free trial · No credit card required · Cancel anytime</p>

          <FlagStrip className="mt-10" ariaLabel="Available in 22 countries" />
        </div>
      </section>

      {/* ── FEATURES ── */}
      <Fade className="px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          <p className={`text-xs uppercase tracking-[0.2em] ${c.primary} text-center mb-3`}>What Maroa does</p>
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
          <p className={`text-xs uppercase tracking-[0.2em] ${c.primary} text-center mb-3`}>How it works</p>
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

      {/* ── PRICING ── */}
      <Fade className="px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          <p className={`text-xs uppercase tracking-[0.2em] ${c.primary} text-center mb-3`}>Pricing</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-center tracking-tight">Start free. Upgrade as you grow.</h2>
          <p className={`text-center ${c.textSub} mt-3 text-sm`}>7-day free trial on every paid plan. No credit card required.</p>

          <div className="mt-12 grid gap-4 sm:gap-5 lg:grid-cols-4">
            {PLANS.map(p => (
              <div key={p.key}
                className={`relative group rounded-2xl border p-6 transition-all duration-300 flex flex-col ${
                  p.popular
                    ? `border-blue-500/40 dark:border-blue-400/40 ${c.card} shadow-[0_0_40px_-12px_rgba(59,130,246,0.25)] dark:shadow-[0_0_40px_-12px_rgba(96,165,250,0.2)]`
                    : `${c.cardBorder} ${c.card} ${c.cardHover}`
                }`}
                style={p.popular ? { transform: "scale(1.02)" } : undefined}
              >
                {p.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 dark:bg-blue-500 px-4 py-1 text-[10px] font-semibold text-white uppercase tracking-wider">
                    Most Popular
                  </span>
                )}
                <p className={`text-[11px] uppercase tracking-[0.15em] ${c.textSub}`}>{p.name}</p>
                <div className="mt-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{p.monthlyPrice === 0 ? "Free" : `€${p.annualPrice}`}</span>
                    {p.monthlyPrice > 0 && <span className={`text-sm ${c.textSub}`}>/mo</span>}
                  </div>
                  <p className={`text-[11px] ${c.textFaint} mt-1`}>
                    {p.monthlyPrice === 0 ? "7-day trial · no card" : `billed annually · €${p.monthlyPrice}/mo monthly`}
                  </p>
                </div>
                <p className={`mt-3 text-[12px] ${c.textSub}`}>{p.desc}</p>
                <ul className="mt-5 space-y-2 flex-1">
                  {p.features.map(f => (
                    <li key={f} className={`flex items-start gap-2 text-[12px] ${c.textSub}`}>
                      <Check className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />{f}
                    </li>
                  ))}
                </ul>
                <Link to="/signup"
                  className={`mt-6 w-full rounded-xl py-3 text-center text-sm font-medium transition-all ${
                    p.popular
                      ? `${c.primaryBg} text-white ${c.primaryBgHover}`
                      : `${c.card} border ${c.cardBorder} ${c.text} ${c.cardHover}`
                  }`}>
                  {p.monthlyPrice === 0 ? "Start free" : "Start free trial"}
                </Link>
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
          <FlagStrip className="mt-6" opacity={0.5} ariaLabel="" />
          <p className={`text-xs ${c.textFaint} mt-2 text-center`}>From Kosovo to Dubai to London — choosing AI over agencies.</p>
        </div>
      </Fade>

      {/* ── DEMO BOOKING FORM ── */}
      <Fade className="px-6 pb-24">
        <div ref={formRef} className="max-w-md mx-auto">
          {submitted ? (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/[0.04] p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/10 mb-4">
                <Check className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold">Thanks — we'll be in touch.</h3>
              <p className={`text-sm ${c.textSub} mt-2`}>We'll send a calendar invite within 24 hours. In the meantime, you can <Link to="/signup" className={c.primary}>start your free trial</Link> right now.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold tracking-tight">Prefer a demo first?</h3>
                <p className={`text-sm ${c.textSub} mt-1.5`}>Tell us about your business — we'll show you Maroa running on a similar one.</p>
              </div>
              <input type="text" required value={form.name} onChange={e => up("name", e.target.value)} placeholder="Full name" className={inputCls} />
              <input type="email" required value={form.email} onChange={e => up("email", e.target.value)} placeholder="Email address" className={inputCls} />
              <select value={form.plan} onChange={e => up("plan", e.target.value)} className={inputCls}>
                {PLANS.filter(p => p.monthlyPrice > 0).map(p => (
                  <option key={p.key} value={p.key}>{p.name} — €{p.annualPrice}/mo{p.popular ? " (Most Popular)" : ""}</option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <select value={form.business_type} onChange={e => up("business_type", e.target.value)} className={inputCls}>
                  <option value="">Business type</option>
                  {BIZ_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={form.country} onChange={e => up("country", e.target.value)} className={inputCls}>
                  <option value="">Country</option>
                  {COUNTRIES.map(co => <option key={co} value={co}>{co}</option>)}
                </select>
              </div>
              <button type="submit" disabled={submitting}
                className={`w-full rounded-xl ${c.primaryBg} py-3.5 text-sm font-semibold text-white ${c.primaryBgHover} transition-all disabled:opacity-50 flex items-center justify-center gap-2`}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><span>Request a demo</span><ArrowRight className="h-4 w-4" /></>}
              </button>
              <p className={`text-center text-[11px] ${c.textFaint}`}>Or skip the demo and <Link to="/signup" className={c.primary}>start your free trial</Link> right now.</p>
            </form>
          )}
        </div>
      </Fade>

      {/* ── FINAL CTA ── */}
      <Fade className="px-6 pb-24">
        <div className="max-w-3xl mx-auto text-center rounded-3xl border border-blue-500/20 dark:border-blue-400/20 bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-500/[0.04] dark:to-transparent p-10 sm:p-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Ready to put your marketing<br />on autopilot?
          </h2>
          <p className={`text-sm ${c.textSub} mt-4 max-w-lg mx-auto`}>
            Setup takes 10 minutes. Your AI marketing team starts working the moment you connect your first account.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/signup"
              className={`inline-flex items-center gap-2 rounded-xl ${c.primaryBg} px-8 py-3.5 text-sm font-semibold text-white ${c.primaryBgHover} transition-all`}>
              Start free trial <ArrowRight className="h-4 w-4" />
            </Link>
            <button onClick={scrollToForm}
              className={`inline-flex items-center gap-2 rounded-xl border ${c.cardBorder} px-6 py-3.5 text-sm font-medium ${c.text} ${c.cardHover} transition-all`}>
              Book a demo
            </button>
          </div>
          <p className={`text-xs ${c.textFaint} mt-4`}>No credit card · 7-day free trial · Cancel anytime</p>
        </div>
      </Fade>
      </main>

      {/* ── FOOTER ── */}
      <footer className={`border-t ${c.cardBorder} px-6 py-8`}>
        <div className="max-w-5xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className={`text-xs ${c.textFaint} text-center sm:text-left`}>
            <p>© {new Date().getFullYear()} maroa.ai · All rights reserved.</p>
            <p className="mt-1 opacity-80">Maroa AI · Prishtina, Kosovo · <a href="mailto:hello@maroa.ai" className={`hover:${c.textSub} transition-colors`}>hello@maroa.ai</a></p>
          </div>
          <div className={`flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs ${c.textFaint}`}>
            <Link to="/terms" className={`hover:${c.textSub} transition-colors`}>Terms</Link>
            <Link to="/privacy" className={`hover:${c.textSub} transition-colors`}>Privacy</Link>
            <Link to="/refund" className={`hover:${c.textSub} transition-colors`}>Refund</Link>
            <Link to="/data-deletion" className={`hover:${c.textSub} transition-colors`}>Data Deletion</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
