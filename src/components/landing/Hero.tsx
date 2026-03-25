import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Sparkles, Send } from "lucide-react";

function DashboardMockup() {
  return (
    <div className="relative mx-auto mt-16 max-w-4xl opacity-0 animate-fade-in-up hidden sm:block" style={{ animationDelay: "0.4s" }}>
      <div className="rounded-2xl border border-border bg-card shadow-elevated overflow-hidden">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-destructive/30" />
            <div className="h-3 w-3 rounded-full bg-muted-foreground/20" />
            <div className="h-3 w-3 rounded-full bg-muted-foreground/20" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="rounded-lg bg-muted px-4 py-1 text-xs text-muted-foreground">dashboard.maroa.ai</div>
          </div>
        </div>
        {/* Dashboard content */}
        <div className="p-6">
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Total Reach", value: "142,839", icon: BarChart3, change: "+24%" },
              { label: "Posts Published", value: "47", icon: Send, change: "+12" },
              { label: "Avg ROAS", value: "4.2x", icon: TrendingUp, change: "+0.8x" },
              { label: "AI Actions", value: "1,204", icon: Sparkles, change: "This week" },
            ].map((s, i) => (
              <div key={s.label} className="rounded-2xl border border-border bg-background p-4 opacity-0 animate-fade-in" style={{ animationDelay: `${0.6 + i * 0.1}s` }}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">{s.label}</span>
                  <s.icon className="h-3.5 w-3.5 text-muted-foreground/60" />
                </div>
                <p className="mt-2 text-xl font-bold text-foreground">{s.value}</p>
                <p className="mt-1 text-[10px] text-success font-medium">{s.change}</p>
              </div>
            ))}
          </div>
          {/* Chart mockup */}
          <div className="mt-4 flex h-32 items-end gap-1 rounded-2xl border border-border bg-background p-4">
            {[40, 55, 35, 65, 50, 70, 60, 80, 75, 90, 85, 95, 88, 92, 78, 85, 90, 95, 88, 100].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-primary/15 hover:bg-primary/30 transition-colors"
                style={{ height: `${h}%`, opacity: 0, animation: `fade-in 0.3s ease-out ${0.8 + i * 0.03}s forwards` }}
              />
            ))}
          </div>
        </div>
      </div>
      {/* Gradient fade at bottom */}
      <div className="absolute -bottom-1 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-16 pt-20 sm:pb-32 sm:pt-36">
      <div className="container text-center">
        <div className="opacity-0 animate-fade-in" style={{ animationDelay: "0s" }}>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-xs font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-soft" />
            AI Marketing Platform
          </span>
        </div>
        <h1 className="mx-auto mt-6 sm:mt-8 max-w-3xl text-4xl sm:text-5xl md:text-7xl font-bold leading-[1.08] tracking-tight text-foreground text-balance opacity-0 animate-fade-in" style={{ animationDelay: "0.05s" }}>
          Your marketing
          <br />
          on autopilot.
        </h1>
        <p className="mx-auto mt-5 sm:mt-6 max-w-lg text-base sm:text-lg leading-relaxed text-muted-foreground px-4 sm:px-0 opacity-0 animate-fade-in" style={{ animationDelay: "0.15s" }}>
          maroa.ai uses AI to write your content, run your ads,
          and post everything automatically.
        </p>
        <div className="mt-8 sm:mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row px-4 sm:px-0 opacity-0 animate-fade-in" style={{ animationDelay: "0.25s" }}>
          <Link to="/signup" className="w-full sm:w-auto">
            <Button variant="hero" size="xl" className="w-full sm:w-auto">Start free trial</Button>
          </Link>
          <a href="#how-it-works" className="w-full sm:w-auto">
            <Button variant="hero-outline" size="xl" className="w-full sm:w-auto">See how it works</Button>
          </a>
        </div>
        <p className="mt-4 text-xs text-muted-foreground opacity-0 animate-fade-in" style={{ animationDelay: "0.3s" }}>
          No credit card required · Plans from $49/mo
        </p>
      </div>

      <DashboardMockup />
    </section>
  );
}
