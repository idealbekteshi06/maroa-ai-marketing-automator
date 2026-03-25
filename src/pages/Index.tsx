import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Testimonials } from "@/components/landing/Testimonials";
import { PricingSection } from "@/components/landing/PricingSection";
import { FAQ } from "@/components/landing/FAQ";
import { Footer } from "@/components/landing/Footer";

const Index = () => (
  <>
    <Navbar />
    <main>
      <Hero />
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
