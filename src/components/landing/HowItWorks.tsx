const steps = [
  { num: "01", title: "Tell us about your business", desc: "Industry, audience, brand tone — we learn what makes you unique." },
  { num: "02", title: "Connect your accounts", desc: "Link Facebook, Instagram, Google Ads, and TikTok in one click." },
  { num: "03", title: "Set your budget", desc: "Choose how much to spend on ads. We handle the rest." },
  { num: "04", title: "Walk away", desc: "We create, post, and optimize every day. You focus on your business." },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-28 md:py-40">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            Up and running
            <br />
            <span className="text-muted-foreground">in five minutes.</span>
          </h2>
        </div>
        <div className="mx-auto mt-20 max-w-3xl">
          {steps.map((s, i) => (
            <div key={s.num} className={`flex gap-8 py-10 ${i < steps.length - 1 ? "border-b border-border" : ""}`}>
              <span className="text-4xl font-light tracking-tight text-muted-foreground/40 tabular-nums">{s.num}</span>
              <div>
                <h3 className="text-lg font-semibold text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground max-w-md">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
