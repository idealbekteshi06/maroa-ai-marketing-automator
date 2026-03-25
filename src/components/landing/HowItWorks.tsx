import { Building2, Link2, DollarSign, Coffee } from "lucide-react";

const steps = [
  { icon: Building2, title: "Tell us about your business", desc: "Industry, audience, brand tone — we learn what makes you unique." },
  { icon: Link2, title: "Connect your accounts", desc: "Link Facebook, Instagram, Google Ads, and TikTok in one click." },
  { icon: DollarSign, title: "Set your budget", desc: "Choose how much to spend on ads. We handle the rest." },
  { icon: Coffee, title: "Walk away", desc: "We create, post, and optimize. You focus on your business." },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-border py-24 md:py-32">
      <div className="container">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            How it works
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
            Get started in under 5 minutes. No marketing experience needed.
          </p>
        </div>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.title} className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-xl font-bold">
                {i + 1}
              </div>
              <h3 className="mt-5 font-semibold text-foreground">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
