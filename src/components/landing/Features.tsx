import {
  Sparkles, Send, Target, ImagePlus,
  Users, Brain, Search, BarChart3,
} from "lucide-react";

const features = [
  { icon: Sparkles, title: "AI Content Generation", desc: "Captions, blogs, and ad copy that sound like you wrote them." },
  { icon: Send, title: "Auto-Posting", desc: "Publish across every platform without lifting a finger." },
  { icon: Target, title: "Meta Ads Management", desc: "Launch and optimize ad campaigns with AI precision." },
  { icon: ImagePlus, title: "AI Image Generation", desc: "On-brand visuals for posts and ads, generated in seconds." },
  { icon: Users, title: "Audience Targeting", desc: "Reach your ideal customers with data-driven precision." },
  { icon: Brain, title: "Self-Improving Strategy", desc: "Gets smarter every week from your real performance data." },
  { icon: Search, title: "Competitor Tracking", desc: "See what competitors do. Stay one step ahead." },
  { icon: BarChart3, title: "Weekly Reports", desc: "Clear, actionable insights on reach, engagement, and ROI." },
];

export function Features() {
  return (
    <section id="features" className="py-28 md:py-40">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            Everything you need.
            <br />
            <span className="text-muted-foreground">Nothing you don't.</span>
          </h2>
        </div>
        <div className="mt-20 grid gap-px rounded-3xl bg-border overflow-hidden sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="bg-background p-8 md:p-10 group">
              <f.icon className="h-6 w-6 text-primary mb-5" strokeWidth={1.5} />
              <h3 className="text-base font-semibold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
