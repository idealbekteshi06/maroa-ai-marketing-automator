import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Testimonials } from "@/components/landing/Testimonials";
import { PricingSection } from "@/components/landing/PricingSection";
import { FAQ } from "@/components/landing/FAQ";
import { Footer } from "@/components/landing/Footer";
import { PlatformLogos } from "@/components/landing/PlatformLogos";
import { PoweredBy } from "@/components/landing/PoweredBy";

function LiveTicker() {
  const stats = [
    "2,847 businesses using maroa.ai",
    "142,000+ posts published this month",
    "3.8x average ROAS across all campaigns",
    "$2.4M in ad spend optimized",
    "98% content approval rate",
    "15,000+ AI images generated this week",
  ];

  return (
    <div className="overflow-hidden border-y border-border bg-muted/30 py-4">
      <div className="flex animate-ticker whitespace-nowrap">
        {[...stats, ...stats].map((s, i) => (
          <span key={i} className="mx-8 flex items-center gap-2 text-sm text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary/50" />
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

const Index = () => (
  <>
    <Navbar />
    <main>
      <Hero />
      <LiveTicker />
      <PlatformLogos />
      <PoweredBy />
      <Features />
      <HowItWorks />
      <Testimonials />
      <PricingSection />
      <FAQ />
    </main>
    <Footer />
  </>
);

export default Index;
