import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const faqs = [
  { q: "How does maroa.ai create content for my business?", a: "Our AI learns your brand voice, industry, and audience. It generates captions, blog posts, and ad copy that sound like you wrote them." },
  { q: "Which social platforms do you support?", a: "Facebook, Instagram, Google Ads, and TikTok. We're adding LinkedIn and Twitter soon." },
  { q: "Can I review content before it's posted?", a: "Absolutely. Every piece of content goes to your approval queue first. You can approve, edit, or reject with one tap." },
  { q: "How does ad management work?", a: "We create and manage Meta ad campaigns for you. Our AI optimizes targeting, budget, and creative daily based on performance." },
  { q: "Is there a contract or commitment?", a: "No contracts. Cancel anytime with one click. Your content and data are always yours." },
  { q: "How quickly will I see results?", a: "Most businesses see improved engagement within the first week. Ad performance typically improves within 2-3 weeks as our AI learns." },
  { q: "Can I use my own photos?", a: "Yes! Upload your business photos and our AI will use them alongside AI-generated visuals for the best results." },
  { q: "What if I need help?", a: "Growth and Agency plans include priority support. Free plan users get email support with 24-hour response time." },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-28 md:py-40 bg-card">
      <div className="container">
        <h2 className="text-center text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
          Questions? Answers.
        </h2>
        <div className="mx-auto mt-20 max-w-2xl">
          {faqs.map((faq, i) => (
            <div key={i} className={`${i > 0 ? "border-t border-border" : ""}`}>
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex w-full items-center justify-between py-6 text-left group"
              >
                <span className="text-base font-medium text-foreground pr-8 group-hover:text-primary transition-colors">{faq.q}</span>
                {openIndex === i ? (
                  <Minus className="h-5 w-5 shrink-0 text-primary" strokeWidth={1.5} />
                ) : (
                  <Plus className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" strokeWidth={1.5} />
                )}
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === i ? "max-h-40 pb-6" : "max-h-0"
                }`}
              >
                <p className="text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
