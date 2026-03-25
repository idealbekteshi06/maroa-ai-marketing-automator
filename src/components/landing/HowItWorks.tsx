import { Building2, Link2, DollarSign, Rocket } from "lucide-react";

const steps = [
  { num: "01", title: "Tell us about your business", desc: "Industry, audience, brand tone — we learn what makes you unique.", icon: Building2 },
  { num: "02", title: "Connect your accounts", desc: "Link Facebook, Instagram, Google Ads, and TikTok in one click.", icon: Link2 },
  { num: "03", title: "Set your budget", desc: "Choose how much to spend on ads. We handle the rest.", icon: DollarSign },
  { num: "04", title: "Walk away", desc: "We create, post, and optimize every day. You focus on your business.", icon: Rocket },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-28 md:py-40 bg-muted/30">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Up and running
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">in five minutes.</p>
        </div>
        <div className="mx-auto mt-20 grid max-w-4xl gap-6 md:grid-cols-2">
          {steps.map((s) => (
            <div key={s.num} className="group flex gap-5 rounded-2xl border border-border bg-card p-8 transition-all hover:shadow-card-hover hover:-translate-y-0.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/8 group-hover:bg-primary/12 transition-colors">
                <s.icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <span className="text-xs font-medium text-primary">{s.num}</span>
                <h3 className="mt-1 text-base font-semibold text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
