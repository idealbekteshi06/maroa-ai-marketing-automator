import {
  Sparkles, Send, Target, ImagePlus,
  Users, Brain, Search, BarChart3,
} from "lucide-react";

const features = [
  { icon: Sparkles, title: "AI Content Generation", desc: "Captions, blogs, and ad copy that sound like you wrote them. Trained on your brand voice." },
  { icon: Send, title: "Auto-Posting", desc: "Publish across every platform without lifting a finger. Scheduled at optimal times." },
  { icon: Target, title: "Meta Ads Management", desc: "Launch and optimize ad campaigns with AI precision. Automated budget allocation." },
  { icon: ImagePlus, title: "AI Image Generation", desc: "On-brand visuals for posts and ads, generated in seconds. No designer needed." },
  { icon: Users, title: "Audience Targeting", desc: "Reach your ideal customers with data-driven precision. Lookalike audiences built automatically." },
  { icon: Brain, title: "Self-Improving Strategy", desc: "Gets smarter every week from your real performance data. Adapts to what works." },
  { icon: Search, title: "Competitor Tracking", desc: "See what competitors do and stay one step ahead. Real-time market intelligence." },
  { icon: BarChart3, title: "Weekly Reports", desc: "Clear, actionable insights on reach, engagement, and ROI. Delivered every Monday." },
];

export function Features() {
  return (
    <section id="features" className="py-28 md:py-40">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Everything you need.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Nothing you don't.
          </p>
        </div>
        <div className="mt-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-border bg-card p-8 transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/8 transition-colors group-hover:bg-primary/12">
                <f.icon className="h-6 w-6 text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="mt-5 text-base font-semibold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
