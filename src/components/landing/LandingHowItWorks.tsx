const STEPS = [
  {
    num: 1,
    label: "STEP ONE",
    title: "Tell Maroa about your business.",
    desc: "Eight questions. Takes four minutes. No marketing jargon — we ask in plain language what you sell, who buys it, and what a good week looks like.",
  },
  {
    num: 2,
    label: "STEP TWO",
    title: "Maroa learns your brand.",
    desc: "Reads your website, analyzes your past posts, studies your competitors. Builds a Brain that knows your voice, your offers, and your customers.",
  },
  {
    num: 3,
    label: "STEP THREE",
    title: "Autopilot runs your marketing.",
    desc: "Social posts, ads, emails, lead replies — all on. You get a weekly one-page report. You approve or edit anything, anytime.",
  },
];

export default function LandingHowItWorks() {
  return (
    <section className="border-t border-[var(--border-default)] py-24" id="how">
      <div className="mx-auto max-w-[1100px] px-8">
        <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--brand)]">How it works</div>
        <h2 className="mt-3 text-[clamp(32px,4vw,46px)] font-bold leading-[1.08] tracking-[-0.025em]" style={{ maxWidth: "22ch", textWrap: "balance" }}>
          From signup to first live campaign in under an afternoon.
        </h2>

        <div className="relative mt-16 grid gap-6 max-md:grid-cols-1 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.num}>
              <div className="flex items-center justify-between border-t border-[var(--border-default)] pb-4 pt-4">
                <span className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-full bg-foreground text-[11px] font-semibold text-white">
                  {s.num}
                </span>
                <span className="font-mono text-[12px] font-medium tracking-[0.04em] text-muted-foreground">{s.label}</span>
              </div>
              <h3 className="mb-2.5 text-[22px] font-bold leading-[1.2] tracking-[-0.02em]">{s.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
