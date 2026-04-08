import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const faqs = [
  { q: "Does maroa.ai work for my country?", a: "Yes! We support businesses in 22 countries including Kosovo, Albania, USA, UK, UAE, Germany, France, Turkey, and more. Our AI generates content in 17 languages." },
  { q: "What languages does it support?", a: "17 languages including Albanian, English, Arabic, German, French, Turkish, Italian, Spanish, Portuguese, Hindi, and more." },
  { q: "Do I need marketing experience?", a: "Not at all. maroa.ai handles everything — from content creation to ad optimization. You just approve what you want to publish." },
  { q: "How long does setup take?", a: "About 5 minutes. Answer a few questions about your business, connect your social accounts, and your AI starts working immediately." },
  { q: "Can I cancel anytime?", a: "Yes, absolutely. No contracts, no questions asked. Cancel anytime from your settings." },
  { q: "Will the content sound like my business?", a: "Yes. Our AI learns your brand voice, tone, and language. It uses your real business information to create authentic content." },
  { q: "Does it work with Meta and Google ads?", a: "Yes. We connect directly to Meta Business Suite and Google Ads to create, optimize, and manage your campaigns automatically." },
  { q: "What if the AI makes a mistake?", a: "You control everything. All content goes through an approval queue before publishing. Nothing goes live without your OK." },
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
