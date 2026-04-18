import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingHero from "@/components/landing/LandingHero";
import LandingProblem from "@/components/landing/LandingProblem";
import LandingShift from "@/components/landing/LandingShift";
import LandingHowItWorks from "@/components/landing/LandingHowItWorks";
import LandingFeatures from "@/components/landing/LandingFeatures";
import LandingPricing from "@/components/landing/LandingPricing";
import LandingFAQ from "@/components/landing/LandingFAQ";
import LandingClosing from "@/components/landing/LandingClosing";
import LandingFooter from "@/components/landing/LandingFooter";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-foreground" style={{ fontFamily: "var(--font-sans)" }}>
      <LandingNavbar />
      <LandingHero />
      <LandingProblem />
      <LandingShift />
      <LandingHowItWorks />
      <LandingFeatures />
      <LandingPricing />
      <LandingFAQ />
      <LandingClosing />
      <LandingFooter />
    </div>
  );
}
