import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-32 pt-28 md:pb-44 md:pt-40">
      <div className="container text-center">
        <p className="text-sm font-medium tracking-widest uppercase text-primary animate-fade-in">
          AI Marketing Platform
        </p>
        <h1 className="mx-auto mt-6 max-w-4xl text-5xl font-semibold leading-[1.08] tracking-tight text-foreground md:text-7xl lg:text-[5.5rem] text-balance animate-fade-in" style={{ animationDelay: "0.05s" }}>
          Your marketing
          <br />
          on autopilot.
        </h1>
        <p className="mx-auto mt-8 max-w-lg text-lg font-normal leading-relaxed text-muted-foreground md:text-xl animate-fade-in" style={{ animationDelay: "0.15s" }}>
          maroa.ai uses AI to write your content, run your ads,
          and post everything automatically.
        </p>
        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row animate-fade-in" style={{ animationDelay: "0.25s" }}>
          <Link to="/signup">
            <Button variant="hero" size="xl">Start free trial</Button>
          </Link>
          <a href="#how-it-works">
            <Button variant="hero-outline" size="xl">See how it works</Button>
          </a>
        </div>
        <p className="mt-5 text-xs text-muted-foreground animate-fade-in" style={{ animationDelay: "0.3s" }}>
          No credit card required · Plans from $49/mo
        </p>
      </div>
    </section>
  );
}
