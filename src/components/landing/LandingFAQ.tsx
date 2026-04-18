import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQS = [
  {
    q: "Will the AI sound like me or like a robot?",
    a: "Like you. Maroa reads your existing posts, website, and replies, and builds a voice model before it writes a single thing. First week, review everything before it ships. After that most owners let it ship on autopilot and only step in when they want to say something new.",
  },
  {
    q: "What if I already use Instagram or Meta Business Suite?",
    a: "Keep using them. Maroa connects through the official Meta APIs — your followers, DMs, ad accounts, and history stay where they are. Maroa just does the work on top.",
  },
  {
    q: "Do I need to know anything about marketing?",
    a: "No. The onboarding asks in plain language — what you sell, who buys it, what a good week looks like. You never have to choose an audience, write a headline, or set a bid.",
  },
  {
    q: "Can I turn it off if I don't like it?",
    a: "Anytime. One toggle pauses all agents. Cancel in one click from your account. Nothing you made in Maroa — posts, audiences, reports — is held hostage.",
  },
  {
    q: "What languages does it support?",
    a: "English, Albanian, and Serbian today. Macedonian, Bosnian, and Croatian are in testing and will be on by summer. Tell Maroa which language your customers speak and it stays in that language across every channel.",
  },
  {
    q: "Is my customer data safe?",
    a: "Your customer data is stored in EU data centers, encrypted at rest, and never used to train outside models. GDPR-aligned by default. You can export everything or delete it all in a single click.",
  },
];

export default function LandingFAQ() {
  return (
    <section className="py-24" id="faq">
      <div className="mx-auto max-w-[1100px] px-8">
        <div className="text-center">
          <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--brand)]">Questions</div>
          <h2 className="mx-auto mt-3 text-[clamp(32px,4vw,46px)] font-bold leading-[1.08] tracking-[-0.025em]" style={{ maxWidth: "22ch", textWrap: "balance" }}>
            Everything owners ask before they start.
          </h2>
        </div>

        <Accordion type="single" collapsible defaultValue="item-0" className="mx-auto mt-12 max-w-[780px] border-t border-[var(--border-default)]">
          {FAQS.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-b border-[var(--border-default)]">
              <AccordionTrigger className="py-[22px] px-1 text-left text-[17px] font-medium tracking-[-0.01em] text-foreground hover:text-[var(--brand)] hover:no-underline [&[data-state=open]>svg]:text-[var(--brand)]">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="px-1 pb-[22px] text-[15px] leading-relaxed text-muted-foreground" style={{ maxWidth: "65ch" }}>
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
