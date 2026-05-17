import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { apiPost } from "@/lib/apiClient";
import { Loader2, Check, Target, BarChart3, Zap, ArrowRight, Sun, Moon, Sparkles, Search, MessageCircle, Mail, Link2, Cpu, FileSearch, ShieldCheck, Quote, Film, CreditCard, FileX, Download, ChevronDown } from "lucide-react";
import { PLANS, ENTERPRISE_CONTACT } from "@/lib/constants/plans";
import { INDUSTRIES } from "@/lib/constants/industries";
import FlagStrip from "@/components/FlagStrip";
import StackSection from "@/components/StackSection";

const COUNTRIES = ["Kosovo", "Albania", "USA", "UK", "Germany", "UAE", "Turkey", "Italy", "France", "Other"];

// Apple-style sentence-case titles. Each description is one tight
// sentence (≤ 22 words) — verb-first, leading with the *outcome the
// owner cares about*, then the mechanism. No "automatically" filler.
const FEATURES = [
  { icon: Sparkles, title: "Content, written daily",      desc: "Get your Sunday back. Posts, captions, ads, and emails drafted in your voice — tuned to your city and last week's performance." },
  { icon: Target,   title: "Ads, audited every morning",   desc: "Catch budget bleed before lunch. Meta, Google, and TikTok reviewed at 9 a.m.; pacing alerts every four hours." },
  { icon: Search,   title: "Competitors, watched",         desc: "Know what your competitors shipped before they get traction. Weekly scan + alert when their creative or offer changes." },
  { icon: MessageCircle, title: "One unified inbox",       desc: "Reply to every customer in a single tap. Instagram, Facebook, WhatsApp, email — all in one queue, with drafts pre-written." },
  { icon: Mail,     title: "Lifecycle email on autopilot",desc: "Recover the carts you're losing. Welcome flows, cart recovery, win-back — sent on the day each customer is most likely to buy." },
  { icon: BarChart3,title: "One dashboard that decides",  desc: "Stop staring at charts. Spend, conversions, creative scores, agent decisions — surfaced as the next action to take." },
];

// Differentiators — the four backend capabilities that separate Maroa
// from any "AI marketing assistant" in the category. Each one is a
// load-bearing service in the codebase (services/* in the backend),
// not a roadmap promise. Surfaced as a dedicated row so the visitor
// can tell the difference between a wrapper around GPT and an
// operating system designed around marketing constraints.
// Authority statements, not descriptions. Each card opens with a
// load-bearing fact (cadence, count, model) that proves there's real
// engineering behind it, then explains the why in one tight sentence.
// "Wow factor" target: visitor reads each card and thinks "OK that's
// not a wrapper around GPT — that's actual software."
const DIFFERENTIATORS = [
  {
    icon: FileSearch,
    title: "Every decision logged. Every output explainable.",
    desc: "Framework chosen, audience stage, past-performance signal, voice-fit score, compliance gates passed — captured per draft and queryable for 18 months. Override any choice and re-run.",
  },
  {
    icon: ShieldCheck,
    title: "Compliance refusals before a dollar is spent.",
    desc: "20 industry rulesets — FDA, FTC, FCA, ABA, fair-housing, alcohol, gambling, supplements — enforced at the model layer with citations. Non-compliant claims never reach a campaign.",
  },
  {
    icon: Quote,
    title: "Your brand, tracked across every AI search.",
    desc: "Weekly probes of ChatGPT, Perplexity, Google AI Overviews, and Claude. Citation count, sentiment, and lift recommendations — so you know when an AI starts answering for your category.",
  },
  {
    icon: Film,
    title: "On-brand image + video, generated on demand.",
    desc: "Higgsfield Soul-trained on your founder, products, and brand palette. Hero shots, ad creative, founder reels, restyles — generated in the dashboard, queued for approval, shipped to platforms.",
  },
];

const STEPS = [
  { num: "01", icon: Link2, title: "Connect your accounts",  desc: "Link Meta, Google, TikTok, and your inbox in under two minutes. We handle OAuth and token rotation." },
  { num: "02", icon: Cpu,   title: "Maroa learns your brand", desc: "Voice signature, competitors, regulatory profile, locale tone — captured in fifteen minutes, refined weekly." },
  { num: "03", icon: Zap,   title: "Decisions ship every day",desc: "Content drafts, ad audits, and weekly scorecards land on time. You approve the brand-sensitive ones; the rest run." },
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
  // Apple's standard motion curve (cubic-bezier 0.25, 0.1, 0.25, 1) —
  // softer than plain `ease`, 0.55s lets fast scrolls still land cleanly.
  return {
    ref,
    style: {
      opacity: vis ? 1 : 0,
      transform: vis ? "translateY(0)" : "translateY(18px)",
      transition: "opacity 0.55s cubic-bezier(0.25, 0.1, 0.25, 1), transform 0.55s cubic-bezier(0.25, 0.1, 0.25, 1)",
      willChange: vis ? "auto" : "opacity, transform",
    } as React.CSSProperties,
  };
}

function Fade({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const f = useFadeIn();
  return <section ref={f.ref} style={f.style} className={className}>{children}</section>;
}

/* ── Theme colors: resolved dynamically ──
 * Apple-style design system inlined here. Brand switched from generic
 * Tailwind blue-600 (#2563EB, leans purple) to Apple system blue
 * (#0A84FF — the iOS/macOS native). Card hover now uses a soft lift
 * (shadow + transform) instead of a border-colour change, which used
 * to jump visually and felt cheap. Buttons and inputs ramp through
 * tighter Apple-blue stops on hover/focus. All transitions land at
 * 200ms with the standard Apple ease curve. */
const c = {
  bg: "bg-white dark:bg-[#000]",
  card: "bg-[#fafafa] dark:bg-[#0a0a0a]",
  cardBorder: "border-[#e8e8ed] dark:border-white/[0.08]",
  // Lift on hover: shadow + tiny translate, no border-colour change.
  // Apple-clean — the card "rises" instead of getting re-outlined.
  cardHover: "hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.08)] dark:hover:border-white/[0.14] dark:hover:bg-[#141414]",
  text: "text-[#1d1d1f] dark:text-[#f5f5f7]",
  textSub: "text-[#6e6e73] dark:text-[#a1a1a6]",
  textFaint: "text-[#86868b] dark:text-[#6e6e73]",
  // Apple system blue: #0A84FF in dark, #0066CC in light (Apple uses a
  // slightly deeper blue on white surfaces for accessibility contrast).
  primary: "text-[#0066CC] dark:text-[#0A84FF]",
  primaryBg: "bg-[#0066CC] dark:bg-[#0A84FF]",
  primaryBgHover: "hover:bg-[#0052A3] dark:hover:bg-[#409CFF] active:bg-[#003D7A] dark:active:bg-[#60B4FF]",
  inputBg: "bg-[#f5f5f7] dark:bg-white/[0.04]",
  inputBorder: "border-[#d2d2d7] dark:border-white/[0.10]",
  inputFocus: "focus:border-[#0A84FF] dark:focus:border-[#0A84FF] focus:ring-[3px] focus:ring-[#0A84FF]/20",
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

  const inputCls = `w-full rounded-xl border ${c.inputBorder} ${c.inputBg} px-4 py-3 text-sm ${c.text} placeholder:${c.textFaint} ${c.inputFocus} focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/25 transition-all`;

  return (
    <div className={`min-h-screen ${c.bg} ${c.text} transition-colors duration-300`}>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded focus:bg-[#0066CC] focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-white">
        Skip to content
      </a>

      {/* ── NAV ── */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <Link to="/" className={`text-lg font-bold tracking-tight ${c.text}`}>
          maroa<span className={c.primary}>.</span>ai
        </Link>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsDark(!isDark)} className={`rounded-full p-2 ${c.card} ${c.cardBorder} border transition-colors`} aria-label="Toggle theme">
            {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-[#0A84FF]" />}
          </button>
          <Link to="/login" className={`text-sm ${c.textSub} hover:${c.text} transition-colors`}>Sign in</Link>
          <Link to="/signup?plan=growth" className={`hidden sm:inline-flex items-center gap-1.5 rounded-full ${c.primaryBg} px-4 py-1.5 text-xs font-semibold text-white ${c.primaryBgHover} transition-all`}>
            Start with Growth <ArrowRight className="h-3 w-3" />
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
            Live in 22 countries · 6 languages · 99.9% uptime
          </span>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.04]">
            Marketing operations,<br />
            <span className="bg-gradient-to-r from-[#0066CC] via-[#0A84FF] to-[#0066CC] dark:from-[#0A84FF] dark:via-[#409CFF] dark:to-[#0A84FF] bg-clip-text text-transparent">
              fully automated.
            </span>
          </h1>

          <p className={`mt-7 text-base sm:text-lg ${c.textSub} max-w-2xl mx-auto leading-relaxed`}>
            Drafts 60+ posts a month. Audits Meta, Google, and TikTok ads at 9 a.m. Refuses
            non-compliant claims before they spend a dollar. Writes its reasoning down so you
            can audit every decision. For one business or fifty.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/signup?plan=growth"
              className={`inline-flex items-center justify-center gap-2 rounded-xl ${c.primaryBg} px-8 py-3.5 text-sm font-semibold text-white ${c.primaryBgHover} transition-all shadow-sm`}>
              Start with Growth <ArrowRight className="h-4 w-4" />
            </Link>
            <button onClick={scrollToForm}
              className={`inline-flex items-center justify-center gap-2 rounded-xl border ${c.cardBorder} ${c.card} px-8 py-3.5 text-sm font-medium ${c.text} ${c.cardHover} transition-all`}>
              See a 2-minute demo
            </button>
          </div>
          <p className={`text-xs ${c.textFaint} mt-4`}>Credit card required · Cancel anytime · No contracts</p>

          {/* ── Operations strip — concrete proof of "real software."
              Four spec-style facts that telegraph engineering depth
              without needing screenshots or testimonials. Each one is
              a backend reality (Sonnet/Opus auto-routing, 4-hour
              pacing loop, 20 compliance rulesets, full decision log).
              Mono font + uppercase labels = the status-page treatment
              that B2B buyers read as "engineering team built this." */}
          <ul
            className={`mt-10 mx-auto inline-flex flex-wrap items-stretch divide-x divide-[#e8e8ed] dark:divide-white/[0.08] rounded-2xl border ${c.cardBorder} ${c.card} overflow-hidden text-left`}
            aria-label="Operational specs"
          >
            {[
              { value: "Sonnet 4.5 + Opus 4.7", label: "Auto-routed" },
              { value: "Every 4h",              label: "Pacing alerts" },
              { value: "20 industries",         label: "Compliance gates" },
              { value: "100%",                  label: "Decisions logged" },
            ].map((s) => (
              <li key={s.label} className="px-4 sm:px-5 py-3 flex-1 min-w-[140px]">
                <p className={`font-mono text-[12px] sm:text-[13px] ${c.text} leading-tight`}>{s.value}</p>
                <p className={`mt-1 text-[9px] uppercase tracking-[0.16em] ${c.textFaint} font-medium`}>{s.label}</p>
              </li>
            ))}
          </ul>

          <FlagStrip className="mt-10" ariaLabel="Live in 22 countries" />
        </div>
      </section>

      {/* ── FEATURES ── */}
      <Fade className="px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          <p className={`text-xs uppercase tracking-[0.2em] ${c.primary} text-center mb-3`}>What it does, every day</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-center tracking-tight">Set up once. The work happens.</h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(f => (
              <div key={f.title} className={`group rounded-2xl border ${c.cardBorder} ${c.card} p-6 ${c.cardHover} transition-all duration-300`}>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0066CC]/10 dark:bg-[#0A84FF]/10 mb-4 group-hover:scale-110 transition-transform">
                  <f.icon className="h-5 w-5 text-[#0066CC] dark:text-[#0A84FF]" />
                </div>
                <h3 className="text-sm font-semibold">{f.title}</h3>
                <p className={`text-[13px] ${c.textSub} mt-1.5 leading-relaxed`}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Fade>

      {/* ── DIFFERENTIATORS ──
          Four backend capabilities the homepage was hiding. Each one
          maps to a load-bearing service folder in the backend, not a
          roadmap promise. Lives between Features and How-it-works so
          the visitor sees "what it does" → "why it's not just a GPT
          wrapper" → "how to start." */}
      <Fade className="px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          <p className={`text-xs uppercase tracking-[0.2em] ${c.primary} text-center mb-3`}>Why Maroa, not a generic AI tool</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-center tracking-tight">An operating system, not a prompt wrapper.</h2>
          <p className={`text-center ${c.textSub} mt-3 text-sm max-w-2xl mx-auto`}>
            The four things that separate Maroa from any "AI marketing assistant" in the category.
            Every one is a service running in production today, not a roadmap promise.
          </p>
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {DIFFERENTIATORS.map(d => (
              <div key={d.title} className={`group rounded-2xl border ${c.cardBorder} ${c.card} p-6 ${c.cardHover} transition-all duration-300`}>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0066CC]/10 dark:bg-[#0A84FF]/10 mb-4 group-hover:scale-110 transition-transform">
                  <d.icon className="h-5 w-5 text-[#0066CC] dark:text-[#0A84FF]" />
                </div>
                <h3 className="text-sm font-semibold">{d.title}</h3>
                <p className={`text-[13px] ${c.textSub} mt-1.5 leading-relaxed`}>{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Fade>

      {/* ── STACK / "BUILT ON THE BEST" ──
          Two grouped rows: AI engines + infrastructure (5 tiles) and
          ad platforms + social channels (10 tiles, with explicit
          Ads vs Publishing role tags so we don't over-claim paid-ad
          management for channels we only publish to). */}
      <Fade className="px-6 pb-24">
        <StackSection />
      </Fade>

      {/* ── HOW IT WORKS ── */}
      <Fade className="px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          <p className={`text-xs uppercase tracking-[0.2em] ${c.primary} text-center mb-3`}>How it works</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-center tracking-tight">Ten minutes to set up. Decisions every morning.</h2>
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
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0066CC] dark:bg-[#0A84FF] text-white text-xs font-bold">{s.num}</span>
                    <s.icon className="h-5 w-5 text-[#0066CC] dark:text-[#0A84FF]" />
                  </div>
                  <h3 className="text-sm font-semibold">{s.title}</h3>
                  <p className={`text-[13px] ${c.textSub} mt-1.5 leading-relaxed`}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Fade>

      {/* ── PRICING — 3-card grid: Growth / Agency / Enterprise ── */}
      <Fade className="px-6 pb-24">
        <div className="max-w-6xl mx-auto">
          <p className={`text-xs uppercase tracking-[0.2em] ${c.primary} text-center mb-3`}>Pricing</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-center tracking-tight">Two plans. Cancel anytime. No contracts.</h2>
          <p className={`text-center ${c.textSub} mt-3 text-sm`}>Replace your agency at 10% the cost.</p>

          <div className="mt-12 grid gap-5 lg:grid-cols-3 items-stretch">
            {PLANS.map(p => (
              <div key={p.key}
                className={`relative group rounded-2xl border p-7 transition-all duration-300 flex flex-col ${
                  p.popular
                    ? `border-[#0A84FF]/30 dark:border-[#0A84FF]/30 ${c.card} shadow-[0_0_40px_-12px_rgba(10,132,255,0.25)] dark:shadow-[0_0_40px_-12px_rgba(10,132,255,0.2)]`
                    : `${c.cardBorder} ${c.card} ${c.cardHover}`
                }`}
                style={p.popular ? { transform: "scale(1.04)" } : undefined}
              >
                {p.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#0066CC] dark:bg-[#0A84FF] px-4 py-1 text-[10px] font-semibold text-white uppercase tracking-wider">
                    Most popular
                  </span>
                )}
                <p className={`text-[11px] uppercase tracking-[0.15em] ${c.textSub}`}>{p.name}</p>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-5xl font-bold tracking-tight">${p.monthlyPrice}</span>
                  <span className={`text-sm ${c.textSub}`}>/mo</span>
                </div>
                <p className={`text-[11px] ${c.textFaint} mt-1`}>
                  or ${p.annualTotal.toLocaleString("en-US")}/yr — save ${p.annualSavings.toLocaleString("en-US")}
                </p>
                <p className={`mt-3 text-[13px] ${c.textSub} leading-relaxed`}>{p.desc}</p>
                <Link to={`/signup?plan=${p.key}`}
                  className={`mt-6 w-full inline-flex items-center justify-center gap-1 rounded-xl py-3 text-center text-sm font-semibold transition-all ${
                    p.popular
                      ? `${c.primaryBg} text-white ${c.primaryBgHover} shadow-sm`
                      : `${c.card} border ${c.cardBorder} ${c.text} ${c.cardHover}`
                  }`}>
                  {p.ctaLabel} <ArrowRight className="h-4 w-4" />
                </Link>
                <ul className="mt-7 space-y-2 flex-1">
                  {p.features.map(f => (
                    <li key={f} className={`flex items-start gap-2 text-[12px] ${c.textSub}`}>
                      <Check className="h-3.5 w-3.5 text-[#0A84FF] dark:text-[#0A84FF] shrink-0 mt-0.5" />{f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Enterprise — contact-only, no posted number. */}
            <div className={`relative rounded-2xl border p-7 transition-all duration-300 flex flex-col ${c.cardBorder} ${c.card} ${c.cardHover}`}>
              <p className={`text-[11px] uppercase tracking-[0.15em] ${c.textSub}`}>{ENTERPRISE_CONTACT.cta === "Talk to sales" ? "Enterprise" : "Enterprise"}</p>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-5xl font-bold tracking-tight">Custom</span>
              </div>
              <p className={`text-[11px] ${c.textFaint} mt-1`}>10+ brands or regulated industries</p>
              <p className={`mt-3 text-[13px] ${c.textSub} leading-relaxed`}>{ENTERPRISE_CONTACT.headline}</p>
              <Link to={ENTERPRISE_CONTACT.href}
                className={`mt-6 w-full inline-flex items-center justify-center gap-1 rounded-xl py-3 text-center text-sm font-semibold transition-all ${c.card} border ${c.cardBorder} ${c.text} ${c.cardHover}`}>
                {ENTERPRISE_CONTACT.cta} <ArrowRight className="h-4 w-4" />
              </Link>
              <ul className="mt-7 space-y-2 flex-1">
                {ENTERPRISE_CONTACT.features.map(f => (
                  <li key={f} className={`flex items-start gap-2 text-[12px] ${c.textSub}`}>
                    <Check className="h-3.5 w-3.5 text-[#0A84FF] dark:text-[#0A84FF] shrink-0 mt-0.5" />{f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className={`mt-8 text-center text-sm ${c.textFaint} max-w-3xl mx-auto`}>
            Cancel anytime. No contracts. No lock-in.
          </p>
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
              <h3 className="text-lg font-bold">We'll be in touch within one business day.</h3>
              <p className={`text-sm ${c.textSub} mt-2`}>A calendar invite is on the way. In the meantime, you can <Link to="/signup" className={c.primary}>start your subscription</Link> and see the dashboard for yourself.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold tracking-tight">Want to see it on a business like yours?</h3>
                <p className={`text-sm ${c.textSub} mt-1.5`}>Tell us about your business — we'll walk you through a real Maroa workspace already running it.</p>
              </div>
              <input type="text" required value={form.name} onChange={e => up("name", e.target.value)} placeholder="Full name" className={inputCls} />
              <input type="email" required value={form.email} onChange={e => up("email", e.target.value)} placeholder="Email address" className={inputCls} />
              <select value={form.plan} onChange={e => up("plan", e.target.value)} className={inputCls}>
                {PLANS.map(p => (
                  <option key={p.key} value={p.key}>{p.name} — ${p.monthlyPrice}/mo{p.popular ? " (Most Popular)" : ""}</option>
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
              <p className={`text-center text-[11px] ${c.textFaint}`}>Or skip the demo and <Link to="/signup" className={c.primary}>start your subscription</Link> right now.</p>
            </form>
          )}
        </div>
      </Fade>

      {/* ── FAQ — homepage objection-handler ──
          Four questions, chosen to hit the four most-common
          conversion-killing objections in B2B SaaS at this stage:
          (1) hidden-cost fear, (2) lock-in fear, (3) content-ownership
          fear, (4) trial-end / billing-shock fear. Lives right above
          the final CTA so a wavering visitor doesn't have to leave
          the page to get an answer. Uses native <details> so it works
          without JS state and is keyboard-accessible by default. */}
      <Fade className="px-6 pb-24">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center tracking-tight">Things people ask before signing up.</h2>
          <div className="mt-10 space-y-3">
            {[
              {
                q: "Do I need a credit card to start?",
                a: "Yes — Maroa is a paid subscription. There's no free tier and no trial. You pick a plan, enter your card, and we charge for the first month immediately.",
              },
              {
                q: "Who owns the content Maroa writes?",
                a: "You do. Every post, ad, email, and image is yours forever — even if you cancel. Export everything as a .zip from Settings any day.",
              },
              {
                q: "How do I cancel?",
                a: "Two clicks in Settings → Plan. No phone call, no email back-and-forth, no exit interview. Cancellation takes effect at the end of your current billing cycle — your data stays exportable.",
              },
              {
                q: "Are there refunds?",
                a: "No refunds on the current billing cycle, but cancelling stops every future charge immediately. That's the entire risk-reversal: no contracts, no lock-in, no surprise renewals.",
              },
            ].map((item) => (
              <details
                key={item.q}
                className={`group rounded-2xl border ${c.cardBorder} ${c.card} px-5 py-4 transition-colors`}
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 list-none">
                  <span className={`text-[15px] font-medium ${c.text}`}>{item.q}</span>
                  <ChevronDown className={`h-4 w-4 flex-shrink-0 ${c.textSub} transition-transform group-open:rotate-180`} />
                </summary>
                <p className={`mt-3 text-sm leading-relaxed ${c.textSub}`}>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </Fade>

      {/* ── FINAL CTA ── */}
      <Fade className="px-6 pb-24">
        <div className="max-w-3xl mx-auto text-center rounded-3xl border border-[#0A84FF]/15 dark:border-[#0A84FF]/15 bg-gradient-to-b from-[#E5F1FF]/50 to-transparent dark:from-[#0A84FF]/[0.04] dark:to-transparent p-10 sm:p-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Stop choosing between<br />a marketing team and your margin.
          </h2>
          <p className={`text-sm ${c.textSub} mt-4 max-w-lg mx-auto`}>
            Ten minutes to connect. First content draft and ad audit land tomorrow morning. Cancel anytime — no contracts.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/signup?plan=growth"
              className={`inline-flex items-center gap-2 rounded-xl ${c.primaryBg} px-8 py-3.5 text-sm font-semibold text-white ${c.primaryBgHover} transition-all shadow-sm`}>
              Start with Growth — $149/mo <ArrowRight className="h-4 w-4" />
            </Link>
            <button onClick={scrollToForm}
              className={`inline-flex items-center gap-2 rounded-xl border ${c.cardBorder} px-6 py-3.5 text-sm font-medium ${c.text} ${c.cardHover} transition-all`}>
              Talk to a human
            </button>
          </div>

          {/* ── Risk-reversal triple — the whole guarantee, stated as
              three commitments we actually keep: cancel-anytime monthly
              billing, no annual lock-in, your content exports any day.
              No refund, no trial — premium positioning. */}
          <ul className="mt-8 flex flex-wrap items-center justify-center gap-2">
            <li className={`inline-flex items-center gap-2 rounded-full border ${c.cardBorder} ${c.card} px-3.5 py-1.5 text-[12px] ${c.text}`}>
              <CreditCard className={`h-3.5 w-3.5 ${c.primary}`} />
              Cancel anytime
            </li>
            <li className={`inline-flex items-center gap-2 rounded-full border ${c.cardBorder} ${c.card} px-3.5 py-1.5 text-[12px] ${c.text}`}>
              <FileX className={`h-3.5 w-3.5 ${c.primary}`} />
              No annual contract
            </li>
            <li className={`inline-flex items-center gap-2 rounded-full border ${c.cardBorder} ${c.card} px-3.5 py-1.5 text-[12px] ${c.text}`}>
              <Download className={`h-3.5 w-3.5 ${c.primary}`} />
              Your content exports any day
            </li>
          </ul>

          <p className={`text-xs ${c.textFaint} mt-5`}>Credit card required · Cancel anytime · No lock-in</p>
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
