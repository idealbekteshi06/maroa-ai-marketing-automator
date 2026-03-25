import { Star } from "lucide-react";

const testimonials = [
  {
    quote: "maroa.ai tripled our Instagram engagement in just 3 weeks. It's like having a full marketing team for $49.",
    name: "Sarah Chen",
    role: "Owner, Bloom Bakery",
    rating: 5,
  },
  {
    quote: "I used to spend 10 hours a week on social media. Now I spend zero. Our ads perform better than ever.",
    name: "Marcus Rivera",
    role: "Founder, FitZone Gym",
    rating: 5,
  },
  {
    quote: "The competitor tracking alone is worth the price. We're always one step ahead now.",
    name: "Priya Sharma",
    role: "CEO, Luxe Salon Studio",
    rating: 5,
  },
];

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-primary text-primary" />
      ))}
    </div>
  );
}

export function Testimonials() {
  return (
    <section className="py-28 md:py-40">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Loved by small businesses.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">See what our customers are saying.</p>
        </div>
        <div className="mx-auto mt-16 grid max-w-5xl gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.name} className="flex flex-col justify-between rounded-2xl border border-border bg-card p-8 transition-all hover:shadow-card-hover hover:-translate-y-0.5">
              <div>
                <StarRating count={t.rating} />
                <p className="mt-5 text-[15px] leading-relaxed text-foreground">
                  "{t.quote}"
                </p>
              </div>
              <div className="mt-8 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
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
