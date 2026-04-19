import { FileText, Sparkles, Users, BookOpen, Link2, BarChart3, ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface ActionCard {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  tabKey: string;
}

interface WhatsNextCardsProps {
  pendingDrafts: number;
  profileComplete: boolean;
  newLeads: number;
  onNavigate: (tab: string) => void;
}

export default function WhatsNextCards({ pendingDrafts, profileComplete, newLeads, onNavigate }: WhatsNextCardsProps) {
  const cards: ActionCard[] = [];

  if (pendingDrafts > 0) {
    cards.push({
      icon: FileText,
      title: `Review ${pendingDrafts} draft${pendingDrafts !== 1 ? "s" : ""}`,
      subtitle: "Awaiting your approval before publishing",
      tabKey: "inbox",
    });
  }

  if (!profileComplete) {
    cards.push({
      icon: Sparkles,
      title: "Complete your AI setup",
      subtitle: "Unlock better content and sharper targeting",
      tabKey: "profile-enhancement",
    });
  }

  if (newLeads > 0) {
    cards.push({
      icon: Users,
      title: "Check new leads",
      subtitle: `${newLeads} new lead${newLeads !== 1 ? "s" : ""} since yesterday`,
      tabKey: "crm",
    });
  }

  // Fill remaining slots with educational cards
  const educational: ActionCard[] = [
    { icon: BookOpen, title: "Explore the Studio", subtitle: "Generate images, videos, and ad creatives", tabKey: "studio" },
    { icon: Link2, title: "Set up integrations", subtitle: "Connect Instagram, Facebook, and Google", tabKey: "social" },
    { icon: BarChart3, title: "Read your insights", subtitle: "See what your AI discovered this week", tabKey: "insights" },
  ];

  while (cards.length < 3) {
    const next = educational.shift();
    if (next) cards.push(next);
    else break;
  }

  return (
    <div className="mb-8">
      <h3 className="mb-4 text-lg font-semibold">What's next</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {cards.slice(0, 3).map((card) => (
          <button
            key={card.tabKey}
            onClick={() => onNavigate(card.tabKey)}
            className="group flex flex-col items-start rounded-2xl border border-[var(--border-default)] bg-white p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--brand)] hover:shadow-[var(--shadow-xs)]"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-subtle)] text-[var(--brand)]">
              <card.icon className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div className="text-[15px] font-semibold text-foreground">{card.title}</div>
            <div className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{card.subtitle}</div>
            <div className="mt-auto flex w-full justify-end pt-3">
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:text-[var(--brand)]" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
