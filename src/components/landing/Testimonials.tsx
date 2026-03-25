const testimonials = [
  {
    quote: "maroa.ai tripled our Instagram engagement in just 3 weeks. It's like having a full marketing team for $49.",
    name: "Sarah Chen",
    role: "Owner, Bloom Bakery",
  },
  {
    quote: "I used to spend 10 hours a week on social media. Now I spend zero. Our ads perform better than ever.",
    name: "Marcus Rivera",
    role: "Founder, FitZone Gym",
  },
  {
    quote: "The competitor tracking alone is worth the price. We're always one step ahead now.",
    name: "Priya Sharma",
    role: "CEO, Luxe Salon Studio",
  },
];

export function Testimonials() {
  return (
    <section className="py-28 md:py-40 bg-card">
      <div className="container">
        <h2 className="text-center text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
          Loved by small businesses.
        </h2>
        <div className="mx-auto mt-20 grid max-w-5xl gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.name} className="flex flex-col justify-between rounded-3xl bg-background p-8 md:p-10">
              <p className="text-base leading-relaxed text-foreground font-light">
                "{t.quote}"
              </p>
              <div className="mt-8 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground">
                  {t.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
