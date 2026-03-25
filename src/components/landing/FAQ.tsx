import { useState } from "react";
import { ChevronDown } from "lucide-react";

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
    <section id="faq" className="border-t border-border py-24 md:py-32">
      <div className="container">
        <h2 className="text-center text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Frequently asked questions
        </h2>
        <div className="mx-auto mt-16 max-w-2xl divide-y divide-border">
          {faqs.map((faq, i) => (
            <div key={i}>
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex w-full items-center justify-between py-5 text-left"
              >
                <span className="font-medium text-foreground pr-4">{faq.q}</span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 ${
                    openIndex === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openIndex === i && (
                <p className="pb-5 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
