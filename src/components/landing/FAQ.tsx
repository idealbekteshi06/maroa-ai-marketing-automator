import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const faqs = [
  { q: "What is maroa.ai?", a: "maroa.ai is an AI-powered marketing platform that automates content creation, social media posting, and ad management for small businesses. It replaces the need for a marketing agency at a fraction of the cost." },
  { q: "How long does setup take?", a: "Setup takes under 5 minutes. Answer a few questions about your business, connect your social accounts, and our AI starts working immediately. Your first batch of content is ready within 24 hours." },
  { q: "Do I need marketing experience?", a: "Not at all. maroa.ai is designed for business owners with zero marketing experience. Our AI handles strategy, content creation, posting schedules, and ad optimization automatically." },
  { q: "What platforms does it post to?", a: "Currently we support Facebook, Instagram, Google Ads, and TikTok. We're adding LinkedIn and Twitter soon. All posts are scheduled at optimal times for your specific audience." },
  { q: "How does the AI learn my business?", a: "During onboarding, you tell us about your industry, target audience, brand tone, and goals. Our AI uses this to craft content that sounds authentically like your brand and improves each week based on performance data." },
  { q: "Can I edit content before it posts?", a: "Absolutely. Every piece of content goes to your approval queue first. You can approve, edit, or reject with one tap. Nothing gets published without your explicit approval." },
  { q: "What happens to my existing ads?", a: "Your existing ads continue running. When you connect your ad account, our AI monitors performance and gradually introduces optimized campaigns alongside your current ones. We never delete or modify existing campaigns without your permission." },
  { q: "How do I cancel?", a: "No contracts, no commitments. Cancel anytime with one click from your Settings page. Your content and data are always yours to keep." },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };

  return (
    <section id="faq" className="py-20 sm:py-28 md:py-40">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <div className="container">
        <div className="mx-auto max-w-2xl text-center px-4">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Questions? Answers.
          </h2>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-muted-foreground">Everything you need to know about maroa.ai.</p>
        </div>
        <div className="mx-auto mt-10 sm:mt-16 max-w-2xl px-2 sm:px-0">
          {faqs.map((faq, i) => (
            <div key={i} className={`${i > 0 ? "border-t border-border" : ""}`}>
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex w-full items-center justify-between py-5 sm:py-6 text-left group"
              >
                <span className="text-sm sm:text-[15px] font-medium text-foreground pr-4 group-hover:text-primary transition-colors duration-200">{faq.q}</span>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border transition-colors group-hover:border-primary/30">
                  {openIndex === i ? (
                    <Minus className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
                  ) : (
                    <Plus className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" strokeWidth={2} />
                  )}
                </div>
              </button>
              <div className={`overflow-hidden transition-all duration-300 ease-out ${openIndex === i ? "max-h-48 pb-5 sm:pb-6" : "max-h-0"}`}>
                <p className="text-sm leading-relaxed text-muted-foreground pr-8 sm:pr-12">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
