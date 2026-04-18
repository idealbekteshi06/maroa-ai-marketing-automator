import { Link } from "react-router-dom";
import { Check } from "lucide-react";

const PLANS = [
  {
    name: "GROWTH",
    price: "€49",
    forLine: "For solo owners and small shops. Everything needed to replace one part-time marketer.",
    features: [
      "Social autopilot on Instagram, Facebook, TikTok",
      "Paid ads on Meta — up to €500 / month spend managed",
      "Email & SMS to 2,000 contacts",
      "Lead inbox with 2-minute AI replies",
      "Weekly one-page performance report",
      "English, Albanian, Serbian",
      "Email support, 24-hour response",
    ],
    featured: false,
  },
  {
    name: "AGENCY",
    price: "€99",
    forLine: "For agencies managing multiple clients. White-label, multi-brand, client reporting included.",
    features: [
      "Everything in Growth",
      "Up to 10 client brands on one workspace",
      "White-label reports with your logo and domain",
      "Up to €5,000 / month managed ad spend per client",
      "Team seats & client approval workflows",
      "Shared Brain library across brands",
      "Priority support, 2-hour response",
    ],
    featured: true,
  },
];

export default function LandingPricing() {
  return (
    <section className="bg-[var(--bg-subtle)] py-24" id="pricing">
      <div className="mx-auto max-w-[1100px] px-8">
        <div className="text-center">
          <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--brand)]">Pricing</div>
          <h2 className="mx-auto mt-3 text-[clamp(32px,4vw,46px)] font-bold leading-[1.08] tracking-[-0.025em]" style={{ maxWidth: "22ch", textWrap: "balance" }}>
            Two plans. No asterisks.
          </h2>
          <p className="mx-auto mt-4 text-[17px] leading-[1.55] text-muted-foreground" style={{ maxWidth: "52ch" }}>
            Pay for the outcome, not the seats.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-[880px] gap-5 max-md:grid-cols-1 md:grid-cols-2">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={`relative flex flex-col rounded-[20px] p-9 ${
                p.featured
                  ? "border border-foreground bg-[#0F172A] text-white shadow-[0_20px_50px_-12px_rgba(15,23,42,0.3)]"
                  : "border border-[var(--border-default)] bg-white"
              }`}
            >
              {p.featured && (
                <span className="absolute -top-3 right-6 rounded-full bg-[var(--brand)] px-2.5 py-[5px] text-[11px] font-semibold uppercase tracking-[0.06em] text-white">
                  Most chosen
                </span>
              )}

              <h3 className={`mb-5 text-sm font-semibold uppercase tracking-[0.08em] ${p.featured ? "text-[#94A3B8]" : "text-muted-foreground"}`}>
                {p.name}
              </h3>

              <div className="flex items-baseline gap-1.5">
                <span className={`text-[52px] font-extrabold leading-none tracking-[-0.035em] ${p.featured ? "text-white" : ""}`} style={{ fontFeatureSettings: '"tnum"' }}>
                  {p.price}
                </span>
                <span className={`text-[15px] font-medium ${p.featured ? "text-[#94A3B8]" : "text-muted-foreground"}`}>/ month</span>
              </div>

              <p className={`mt-3 text-sm leading-[1.5] ${p.featured ? "text-[#94A3B8]" : "text-muted-foreground"}`}>
                {p.forLine}
              </p>

              <div className={`my-6 h-px ${p.featured ? "bg-white/10" : "bg-[var(--border-default)]"}`} />

              <ul className="mb-7 flex flex-col gap-3">
                {p.features.map((f) => (
                  <li key={f} className={`flex items-start gap-2.5 text-sm leading-[1.45] ${p.featured ? "text-white" : "text-muted-foreground"}`}>
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand)]" strokeWidth={2.5} />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                to="/signup"
                className={`mt-auto inline-flex w-full items-center justify-center rounded-[14px] py-3.5 text-sm font-medium transition-all ${
                  p.featured
                    ? "bg-[var(--brand)] text-white shadow-[0_1px_2px_rgba(10,132,255,0.25)] hover:-translate-y-px hover:bg-[var(--brand-hover)]"
                    : "border border-[var(--border-default)] bg-white text-foreground hover:bg-[var(--bg-subtle)] hover:border-[var(--border-strong)]"
                }`}
              >
                Start 14-day free trial
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-[13px] text-muted-foreground">
          14-day free trial. Cancel anytime. No credit card to start.
        </p>
      </div>
    </section>
  );
}
