import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, Check, Sparkles, Calendar, Target, BarChart3, Globe, Zap, Bot } from "lucide-react";

const LAUNCH_DATE = new Date("2026-04-28T00:00:00Z").getTime();
const API_BASE = "https://maroa-api-production.up.railway.app";
const FLAGS = "🇽🇰 🇦🇱 🇬🇧 🇩🇪 🇦🇪 🇺🇸 🇫🇷 🇮🇹";

const PLANS = [
  { key: "starter", name: "Starter", was: 29, now: 19, save: "34%", popular: false },
  { key: "growth", name: "Growth", was: 69, now: 39, save: "43%", popular: true },
  { key: "agency", name: "Agency", was: 149, now: 79, save: "47%", popular: false },
];

const BUSINESS_TYPES = ["Restaurant", "Gym/Fitness", "Retail", "Beauty/Salon", "Real Estate", "Agency", "Café/Bar", "Medical/Dental", "Education", "Other"];
const COUNTRIES = ["Kosovo", "Albania", "USA", "UK", "Germany", "UAE", "Turkey", "Italy", "France", "Brazil", "India", "Other"];

const FEATURES = [
  { icon: Bot, title: "AI writes your content", desc: "Posts, ads, emails generated automatically" },
  { icon: Calendar, title: "Content calendar", desc: "30 days of content planned ahead" },
  { icon: Target, title: "Competitor tracking", desc: "Know what competitors are doing" },
  { icon: BarChart3, title: "Performance analytics", desc: "See what's working" },
  { icon: Globe, title: "22 countries supported", desc: "Your language, your market" },
  { icon: Zap, title: "Runs automatically", desc: "Set it and forget it" },
];

function useCountdown() {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, LAUNCH_DATE - Date.now());
      setTime({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-4xl sm:text-5xl font-bold text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground mt-1">{label}</span>
    </div>
  );
}

export default function Index() {
  const countdown = useCountdown();
  const [form, setForm] = useState({ name: "", email: "", plan: "growth", business_type: "", country: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) { toast.error("Please fill in your name and email"); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/waitlist/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, registered_at: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error();
      setSubmitted(true);
      toast.success("You're on the list!");
    } catch {
      toast.error("Something went wrong — please try again");
    } finally {
      setSubmitting(false);
    }
  };

  const update = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* HERO */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, hsl(var(--primary) / 0.08) 0%, transparent 60%)" }} />
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <Link to="/" className="inline-block text-2xl font-bold tracking-tight mb-10">
            maroa<span className="text-primary">.</span>ai
          </Link>

          <div className="flex items-center justify-center gap-4 sm:gap-8 mb-8">
            <CountdownUnit value={countdown.days} label="Days" />
            <span className="text-2xl text-muted-foreground font-light">:</span>
            <CountdownUnit value={countdown.hours} label="Hours" />
            <span className="text-2xl text-muted-foreground font-light">:</span>
            <CountdownUnit value={countdown.minutes} label="Min" />
            <span className="text-2xl text-muted-foreground font-light">:</span>
            <CountdownUnit value={countdown.seconds} label="Sec" />
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight">
            AI Marketing. Automated.<br />
            <span className="text-primary">Launching April 28.</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            The AI that manages your marketing while you sleep. 22 countries. 17 languages. Zero effort.
          </p>
          <p className="mt-4 text-xl tracking-widest">{FLAGS}</p>
        </div>
      </section>

      {/* PRE-ORDER BOX */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-3xl rounded-2xl p-[2px]" style={{ background: "linear-gradient(135deg, #FFD700, #FFA500, #FF8C00, #FFD700)" }}>
          <div className="rounded-[14px] bg-card p-6 sm:p-8">
            <div className="text-center mb-6">
              <p className="text-lg font-bold text-foreground">🔥 Pre-Launch Black Friday Prices</p>
              <p className="text-sm text-muted-foreground mt-1">Lock in these prices for 12 full months</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 mb-6">
              {PLANS.map(plan => (
                <div key={plan.key} className={`relative rounded-xl border p-4 text-center transition-all ${plan.popular ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border"}`}>
                  {plan.popular && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[10px] font-bold text-primary-foreground uppercase">Most Popular</span>}
                  <p className="text-sm font-bold text-foreground mt-1">{plan.name}</p>
                  <div className="mt-2">
                    <span className="text-sm line-through text-muted-foreground">€{plan.was}/mo</span>
                    <span className="text-2xl font-bold text-foreground ml-2">€{plan.now}</span>
                    <span className="text-sm text-muted-foreground">/mo</span>
                  </div>
                  <span className="inline-block mt-1.5 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">Save {plan.save}</span>
                </div>
              ))}
            </div>
            <div className="text-center space-y-1.5 text-xs text-muted-foreground">
              <p>+ <strong className="text-foreground">1 week FREE trial</strong> for everyone who registers today</p>
              <p>Price locked for 12 months. Cancel anytime.</p>
              <p className="text-warning font-medium">⏰ Pre-launch price expires April 28 at midnight</p>
            </div>
          </div>
        </div>
      </section>

      {/* REGISTRATION FORM */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-lg">
          {submitted ? (
            <div className="rounded-2xl border border-success/30 bg-success/5 p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10 mb-4">
                <Check className="h-7 w-7 text-success" />
              </div>
              <h3 className="text-lg font-bold text-foreground">🎉 You're on the list!</h3>
              <p className="text-sm text-muted-foreground mt-2">Check your email for confirmation. Your pre-launch price is locked.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-4">
              <h3 className="text-lg font-bold text-foreground text-center mb-2">Reserve Your Spot</h3>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Full Name *</label>
                <input type="text" required value={form.name} onChange={e => update("name", e.target.value)} placeholder="Your full name"
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Email *</label>
                <input type="email" required value={form.email} onChange={e => update("email", e.target.value)} placeholder="you@business.com"
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Plan Interest</label>
                <select value={form.plan} onChange={e => update("plan", e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none">
                  <option value="starter">Starter — €19/mo</option>
                  <option value="growth">Growth — €39/mo (Most Popular)</option>
                  <option value="agency">Agency — €79/mo</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Business Type</label>
                  <select value={form.business_type} onChange={e => update("business_type", e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none">
                    <option value="">Select...</option>
                    {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Country</label>
                  <select value={form.country} onChange={e => update("country", e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none">
                    <option value="">Select...</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" disabled={submitting}
                className="w-full rounded-lg bg-primary py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Reserving...</> : <><Sparkles className="h-4 w-4" /> Reserve My Spot — Get Early Access</>}
              </button>
              <p className="text-center text-[11px] text-muted-foreground">✓ Free for 1 week · ✓ Pre-launch price locked · ✓ No credit card needed</p>
            </form>
          )}
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">What You Get</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(f => (
              <div key={f.title} className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-colors">
                <f.icon className="h-6 w-6 text-primary mb-3" />
                <h3 className="text-sm font-semibold text-foreground">{f.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="px-6 pb-16 text-center">
        <p className="text-sm text-muted-foreground">Joining businesses from {FLAGS}</p>
        <p className="mt-2 text-2xl font-bold text-foreground">247 businesses already registered</p>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">© 2026 maroa.ai — All rights reserved</p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/refund" className="hover:text-foreground transition-colors">Refund</Link>
          </div>
        </div>
        <div className="mt-6 text-center">
          <Link to="/access" className="text-[10px] text-muted-foreground/30 hover:text-muted-foreground transition-colors">Team access →</Link>
        </div>
      </footer>
    </div>
  );
}
