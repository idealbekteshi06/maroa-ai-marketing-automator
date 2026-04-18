import { MessageSquare, BarChart3, Monitor, Mail, LayoutGrid, Shield } from "lucide-react";

const FEATURES = [
  {
    icon: MessageSquare,
    title: "Social Media Autopilot",
    desc: "Posts 3–5 times a week on the platforms your customers actually use.",
  },
  {
    icon: BarChart3,
    title: "Paid Ads",
    desc: "Runs and optimizes Facebook & Instagram ads. Reallocates budget to winners automatically.",
  },
  {
    icon: Monitor,
    title: "CRM & Leads",
    desc: "Captures every inquiry, scores it, replies in your tone within two minutes.",
  },
  {
    icon: Mail,
    title: "Email & SMS",
    desc: "Sends the right message to the right segment. No list-building or templates required.",
  },
  {
    icon: LayoutGrid,
    title: "Unified Dashboard",
    desc: "One screen. Real metrics. Plain-language explanations of what's working and what isn't.",
  },
  {
    icon: Shield,
    title: "AI Content Engine",
    desc: "Writes in your voice. Never goes off-brand. You approve what goes live — or let it ship on autopilot.",
  },
];

export default function LandingFeatures() {
  return (
    <section className="bg-[var(--bg-subtle)] py-24" id="agents">
      <div className="mx-auto max-w-[1100px] px-8">
        <div className="text-center">
          <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--brand)]">What the agents do</div>
          <h2 className="mx-auto mt-3 text-[clamp(32px,4vw,46px)] font-bold leading-[1.08] tracking-[-0.025em]" style={{ maxWidth: "22ch", textWrap: "balance" }}>
            Six agents. One dashboard. Zero busywork.
          </h2>
          <p className="mx-auto mt-4 text-[17px] leading-[1.55] text-muted-foreground" style={{ maxWidth: "52ch", textWrap: "pretty" }}>
            Each agent owns a channel end-to-end. They don't suggest — they ship. You stay in control of what goes live.
          </p>
        </div>

        <div className="mt-14 grid gap-4 max-md:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-[18px] border border-[var(--border-default)] bg-white p-7 transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgba(10,132,255,0.35)] hover:shadow-[0_4px_14px_rgba(10,132,255,0.08),0_2px_4px_rgba(0,0,0,0.04)]"
            >
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-[10px] bg-[var(--brand-subtle)] text-[var(--brand)]">
                <f.icon className="h-5 w-5" strokeWidth={2} />
              </div>
              <h3 className="mb-2 text-[17px] font-semibold tracking-[-0.015em]">{f.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
