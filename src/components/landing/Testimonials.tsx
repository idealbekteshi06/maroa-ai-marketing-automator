const testimonials = [
  {
    quote: "maroa.ai tripled our Instagram engagement in just 3 weeks. It's like having a full marketing team for $49.",
    name: "Sarah Chen",
    role: "Owner, Bloom Bakery",
  },
  {
    quote: "I used to spend 10 hours a week on social media. Now I spend zero. Our ads are performing better than ever.",
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
    <section className="border-t border-border py-24 md:py-32">
      <div className="container">
        <h2 className="text-center text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Loved by small businesses
        </h2>
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.name} className="rounded-2xl bg-card p-8">
              <p className="text-foreground leading-relaxed">"{t.quote}"</p>
              <div className="mt-6">
                <p className="font-semibold text-foreground">{t.name}</p>
                <p className="text-sm text-muted-foreground">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
