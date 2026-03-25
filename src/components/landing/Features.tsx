import {
  Sparkles, Send, Target, ImagePlus,
  Users, Brain, Search, BarChart3,
} from "lucide-react";

const features = [
  { icon: Sparkles, title: "AI Content Generation", desc: "Automatically write captions, blogs, and ad copy tailored to your brand voice." },
  { icon: Send, title: "Auto-Posting", desc: "Schedule and publish across all your social platforms without lifting a finger." },
  { icon: Target, title: "Meta Ads Management", desc: "Create, launch, and optimize Facebook and Instagram ad campaigns with AI." },
  { icon: ImagePlus, title: "AI Image Generation", desc: "Generate on-brand visuals for posts and ads in seconds." },
  { icon: Users, title: "Audience Targeting", desc: "Find and reach your ideal customers with AI-powered audience analysis." },
  { icon: Brain, title: "Self-Improving Strategy", desc: "Your marketing strategy gets smarter every week based on real performance data." },
  { icon: Search, title: "Competitor Tracking", desc: "See what your competitors are doing and stay one step ahead." },
  { icon: BarChart3, title: "Weekly Reports", desc: "Get clear, actionable reports on reach, engagement, and ROI every week." },
];

export function Features() {
  return (
    <section id="features" className="py-24 md:py-32">
      <div className="container">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Everything you need to grow
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
            One platform replaces your social media manager, ad agency, and content writer.
          </p>
        </div>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="group rounded-2xl bg-card p-6 transition-all duration-200 hover:shadow-md"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-card-foreground">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
