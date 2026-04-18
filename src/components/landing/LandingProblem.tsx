import { Monitor, Users, TrendingDown } from "lucide-react";

const VIGNETTES = [
  {
    icon: Monitor,
    title: "You open Buffer. Now you need to write posts.",
    desc: "The tools give you a canvas. You still have to be the marketer — copywriter, designer, strategist, analyst.",
  },
  {
    icon: Users,
    title: "You hire an agency. Now you manage them.",
    desc: "€800 a month and weekly calls about copy you have to approve anyway. Somehow it's still your job.",
  },
  {
    icon: TrendingDown,
    title: "You ignore it. Sales stay flat.",
    desc: "Competitors who market eat your lunch — one Instagram post, one ad, one email at a time.",
  },
];

export default function LandingProblem() {
  return (
    <section className="bg-[var(--bg-subtle)] py-24">
      <div className="mx-auto max-w-[1100px] px-8">
        <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--brand)]">The trap</div>
        <h2 className="mt-3 text-[clamp(32px,4vw,46px)] font-bold leading-[1.08] tracking-[-0.025em]" style={{ maxWidth: "22ch", textWrap: "balance" }}>
          Marketing tools make small business owners do the work of a full marketing team.
        </h2>
        <p className="mt-4 text-[17px] leading-[1.55] text-muted-foreground" style={{ maxWidth: "52ch", textWrap: "pretty" }}>
          The tools promise "easy." They deliver a blank canvas and a long list of things you're now supposed to do yourself.
        </p>

        <div className="mt-14 grid gap-5 max-md:grid-cols-1 md:grid-cols-3">
          {VIGNETTES.map((v) => (
            <div key={v.title} className="rounded-2xl border border-[var(--border-default)] bg-white p-7">
              <div className="mb-[18px] flex h-10 w-10 items-center justify-center rounded-[10px] bg-[var(--bg-muted)] text-muted-foreground">
                <v.icon className="h-5 w-5" strokeWidth={1.8} />
              </div>
              <h3 className="mb-2.5 text-[17px] font-semibold leading-[1.35] tracking-[-0.015em]" style={{ textWrap: "balance" }}>
                {v.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
