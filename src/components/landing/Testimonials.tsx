import { Star } from "lucide-react";

const testimonials = [
  {
    quote: "Before maroa.ai I was posting maybe twice a week and struggling for ideas. Now my AI posts every day in Albanian, my engagement tripled, and I haven't touched it in weeks.",
    name: "Blerim K.",
    role: "Gym Owner, Prishtina",
    rating: 5,
  },
  {
    quote: "We tried three different marketing agencies. None of them understood our local market. maroa.ai does — it knows our city, our language, our customers.",
    name: "Sarah M.",
    role: "Restaurant Owner, London",
    rating: 5,
  },
  {
    quote: "The competitor tracking alone is worth it. I wake up every morning knowing exactly what my competitors did yesterday and what to do about it.",
    name: "Ahmed R.",
    role: "Retail Owner, Dubai",
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
    <section className="py-20 sm:py-28 md:py-40">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center px-4">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Loved by small businesses.
          </h2>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-muted-foreground">See what our customers are saying.</p>
        </div>
        <div className="mx-auto mt-10 sm:mt-16 grid max-w-5xl gap-4 sm:gap-6 px-2 sm:px-0 md:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.name} className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 sm:p-8 transition-all hover:shadow-card-hover hover:-translate-y-0.5">
              <div>
                <StarRating count={t.rating} />
                <p className="mt-4 sm:mt-5 text-[15px] leading-relaxed text-foreground">
                  "{t.quote}"
                </p>
              </div>
              <div className="mt-6 sm:mt-8 flex items-center gap-3">
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
