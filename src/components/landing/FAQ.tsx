import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const faqs = [
  { q: "How does maroa.ai create content for my business?", a: "Our AI learns your brand voice, industry, and audience. It generates captions, blog posts, and ad copy that sound like you wrote them. Every piece goes through your approval queue first." },
  { q: "Which social platforms do you support?", a: "Facebook, Instagram, Google Ads, and TikTok. We're adding LinkedIn and Twitter soon." },
  { q: "Can I review content before it's posted?", a: "Absolutely. Every piece of content goes to your approval queue first. You can approve, edit, or reject with one tap." },
  { q: "How does ad management work?", a: "We create and manage Meta ad campaigns for you. Our AI optimizes targeting, budget, and creative daily based on performance data." },
  { q: "Is there a contract or commitment?", a: "No contracts. Cancel anytime with one click. Your content and data are always yours." },
  { q: "How quickly will I see results?", a: "Most businesses see improved engagement within the first week. Ad performance typically improves within 2-3 weeks as our AI learns what works for your audience." },
  { q: "Can I use my own photos?", a: "Yes! Upload your business photos and our AI will use them alongside AI-generated visuals for the best results." },
  { q: "What if I need help?", a: "Growth and Agency plans include priority support. Free plan users get email support with 24-hour response time." },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-20 sm:py-28 md:py-40">
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
              <div
                className={`overflow-hidden transition-all duration-300 ease-out ${
                  openIndex === i ? "max-h-48 pb-5 sm:pb-6" : "max-h-0"
                }`}
              >
                <p className="text-sm leading-relaxed text-muted-foreground pr-8 sm:pr-12">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
