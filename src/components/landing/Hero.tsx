import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden py-24 md:py-36">
      <div className="container text-center">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight tracking-tight text-foreground md:text-6xl lg:text-7xl text-balance animate-fade-in">
          Your marketing on autopilot.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground md:text-xl animate-fade-in" style={{ animationDelay: "0.1s" }}>
          maroa.ai uses AI to write your content, run your ads, and post everything automatically. <strong className="text-foreground">$49/month.</strong>
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <Link to="/signup">
            <Button variant="hero" size="xl">Start free trial</Button>
          </Link>
          <a href="#how-it-works">
            <Button variant="hero-outline" size="xl">See how it works</Button>
          </a>
        </div>
      </div>
    </section>
  );
}
