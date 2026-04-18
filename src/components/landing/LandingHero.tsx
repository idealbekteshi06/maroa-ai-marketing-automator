import { Link } from "react-router-dom";
import { Check, Play } from "lucide-react";

export default function LandingHero() {
  return (
    <section className="relative overflow-hidden pt-[72px]">
      {/* Radial glow */}
      <div className="pointer-events-none absolute left-1/2 top-[-200px] h-[600px] w-[900px] -translate-x-1/2" style={{ background: "radial-gradient(ellipse at top, rgba(10,132,255,0.08), transparent 60%)" }} />

      <div className="mx-auto grid max-w-[1200px] items-center gap-[72px] px-8 max-md:grid-cols-1 md:grid-cols-[1.05fr_1fr]" style={{ position: "relative" }}>
        {/* Left — copy */}
        <div>
          <div className="inline-flex items-center gap-2.5 rounded-full border border-[var(--border-default)] bg-white px-3.5 py-1.5 text-[13px] font-medium text-muted-foreground shadow-[var(--shadow-xs)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" style={{ boxShadow: "0 0 0 3px rgba(34,197,94,0.18)" }} />
            For small businesses who want marketing done, not managed
          </div>

          <h1 className="mt-6 text-[clamp(48px,6.2vw,80px)] font-extrabold leading-[1.02] tracking-[-0.035em]" style={{ maxWidth: "14ch", textWrap: "balance" }}>
            Your AI marketing team, <span className="text-[var(--brand)]">always on.</span>
          </h1>

          <p className="mt-6 text-[19px] leading-[1.55] text-muted-foreground" style={{ maxWidth: "48ch", textWrap: "pretty" }}>
            Set a goal. Maroa's agents plan the campaigns, write the content, run the ads, and report what worked — while you run your business.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link to="/signup" className="inline-flex items-center rounded-full bg-[var(--brand)] px-7 py-[15px] text-[15px] font-semibold text-white shadow-[0_1px_2px_rgba(10,132,255,0.25)] transition-all hover:-translate-y-px hover:bg-[var(--brand-hover)] hover:shadow-[0_4px_12px_rgba(10,132,255,0.3)]">
              Start 14-day free trial
            </Link>
            <a href="#demo" className="inline-flex items-center gap-2 px-4 py-[15px] text-[15px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              onClick={(e) => { e.preventDefault(); document.getElementById("demo")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>
              <Play className="h-4 w-4" fill="currentColor" />
              See a 2-minute demo
            </a>
          </div>

          <div className="mt-4 flex items-center gap-1.5 text-[13px] text-muted-foreground">
            <Check className="h-3.5 w-3.5 text-[var(--success)]" strokeWidth={2.5} />
            No credit card required
          </div>
        </div>

        {/* Right — product shot */}
        <div className="overflow-hidden rounded-2xl border border-[var(--border-default)] bg-white shadow-[0_30px_60px_-20px_rgba(10,132,255,0.18),0_12px_30px_-8px_rgba(15,23,42,0.08),0_0_0_1px_rgba(15,23,42,0.02)] max-md:[transform:none] md:[transform:perspective(1600px)_rotateY(-4deg)_rotateX(2deg)]">
          {/* Browser bar */}
          <div className="flex items-center gap-1.5 border-b border-[var(--border-default)] bg-[var(--bg-subtle)] px-3.5 py-2.5">
            <div className="h-2.5 w-2.5 rounded-full" style={{ background: "#FF5F57" }} />
            <div className="h-2.5 w-2.5 rounded-full" style={{ background: "#FEBC2E" }} />
            <div className="h-2.5 w-2.5 rounded-full" style={{ background: "#28C840" }} />
            <span className="mx-auto rounded-md border border-[var(--border-default)] bg-white px-2.5 py-0.5 font-mono text-[11px] text-muted-foreground">app.maroa.ai/today</span>
          </div>

          <div className="p-5">
            <div className="text-lg font-bold tracking-[-0.015em]">Good morning, Sarah.</div>
            <div className="mt-0.5 text-xs text-muted-foreground">Here's what your agents shipped while you were away · 7:42 AM</div>

            {/* Stats */}
            <div className="mt-[18px] grid grid-cols-3 gap-2.5">
              {[
                { label: "Reach · 7d", value: "18,402", delta: "↑ 24.1%", color: "text-[var(--success)]" },
                { label: "Leads", value: "47", delta: "↑ 11 new", color: "text-[var(--success)]" },
                { label: "Ad spend", value: "€128", delta: "€22 under plan", color: "text-muted-foreground" },
              ].map((s) => (
                <div key={s.label} className="rounded-[10px] border border-[var(--border-default)] bg-white p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{s.label}</div>
                  <div className="mt-1 text-[22px] font-bold tracking-[-0.02em]" style={{ fontFeatureSettings: '"tnum"' }}>{s.value}</div>
                  <div className={`mt-0.5 text-[11px] font-medium ${s.color}`}>{s.delta}</div>
                </div>
              ))}
            </div>

            {/* Activity */}
            <div className="mt-[18px]">
              <div className="mb-2.5 flex items-center justify-between text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                <span>Last 12 hours</span>
                <span className="normal-case tracking-normal font-medium text-[var(--brand)]">3 agents active</span>
              </div>

              <div className="space-y-2">
                {[
                  { title: "Posted Thursday's Instagram reel", sub: "Scheduled at 7pm · 2.1k views · 89 likes so far", badge: "Shipped", badgeCls: "bg-[var(--success-subtle)] text-[var(--success)]", iconCls: "bg-[var(--brand-subtle)] text-[var(--brand)]" },
                  { title: "Drafting 3 variants of weekend promo", sub: "A/B testing hero image · ready for review in 4 min", badge: "Drafting", badgeCls: "bg-[var(--brand-subtle)] text-[var(--brand)]", iconCls: "bg-[rgba(191,90,242,0.12)] text-[#BF5AF2]" },
                  { title: "Reallocated €18 from cold ad set to winner", sub: "CPL dropped from €3.20 → €1.80 · auto-optimized", badge: "Auto", badgeCls: "bg-[var(--success-subtle)] text-[var(--success)]", iconCls: "bg-[rgba(48,209,88,0.12)] text-[#30D158]" },
                ].map((r) => (
                  <div key={r.title} className="flex items-center gap-3 rounded-[10px] border border-[var(--border-default)] bg-white px-3 py-[11px]">
                    <div className={`flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg ${r.iconCls}`}>
                      <div className="h-[15px] w-[15px] rounded-full border-2 border-current" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold tracking-[-0.005em]">{r.title}</div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">{r.sub}</div>
                    </div>
                    <span className={`rounded-full px-[7px] py-[3px] text-[10px] font-medium ${r.badgeCls}`}>{r.badge}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
