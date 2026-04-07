import { Users, FileText, Target, Star, Megaphone, Mail, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type EmptyType = "crm" | "content" | "competitors" | "reviews" | "ads" | "email" | "seo";

interface EmptyStateProps {
  type: EmptyType;
  onAction?: () => void;
  isGenerating?: boolean;
}

const config: Record<EmptyType, {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: string;
  generating?: { title: string; description: string };
}> = {
  crm: {
    icon: <Users className="h-10 w-10 text-muted-foreground/30" />,
    title: "Your first leads will appear here",
    description: "Run a campaign or share your website to start capturing leads automatically.",
    action: "Launch AI Campaign",
  },
  content: {
    icon: <FileText className="h-10 w-10 text-muted-foreground/30" />,
    title: "No content yet",
    description: "Your AI is warming up. Content will appear here once generated.",
    action: "Generate Content Now",
    generating: {
      title: "Your AI is creating content",
      description: "Your first posts are being generated. They'll appear here in a few minutes.",
    },
  },
  competitors: {
    icon: <Target className="h-10 w-10 text-muted-foreground/30" />,
    title: "Add competitors to start tracking",
    description: "Your AI monitors competitors every Sunday and alerts you to major changes.",
    action: "Add Competitors",
  },
  reviews: {
    icon: <Star className="h-10 w-10 text-muted-foreground/30" />,
    title: "No reviews yet",
    description: "Send review requests to your first customers to start building your reputation.",
    action: "Send Review Request",
  },
  ads: {
    icon: <Megaphone className="h-10 w-10 text-muted-foreground/30" />,
    title: "No campaigns running",
    description: "Let AI create and optimize ad campaigns that reach your ideal customers.",
    action: "Create AI Campaign",
  },
  email: {
    icon: <Mail className="h-10 w-10 text-muted-foreground/30" />,
    title: "No email sequences yet",
    description: "Set up automated email sequences to nurture leads and retain customers.",
    action: "Create Sequence",
  },
  seo: {
    icon: <Search className="h-10 w-10 text-muted-foreground/30" />,
    title: "No SEO data yet",
    description: "Run your first SEO audit to discover optimization opportunities.",
    action: "Run SEO Audit",
  },
};

export default function EmptyState({ type, onAction, isGenerating }: EmptyStateProps) {
  const c = config[type];
  const showGenerating = isGenerating && c.generating;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {showGenerating ? (
        <>
          <div className="relative">
            <FileText className="h-10 w-10 text-primary/30" />
            <Loader2 className="absolute -right-1 -bottom-1 h-5 w-5 text-primary animate-spin" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-foreground">{c.generating!.title}</h3>
          <p className="mt-1.5 max-w-xs text-xs text-muted-foreground">{c.generating!.description}</p>
          <div className="mt-4 flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-xs text-primary font-medium">Working...</span>
          </div>
        </>
      ) : (
        <>
          {c.icon}
          <h3 className="mt-4 text-sm font-semibold text-foreground">{c.title}</h3>
          <p className="mt-1.5 max-w-xs text-xs text-muted-foreground">{c.description}</p>
          {c.action && onAction && (
            <Button onClick={onAction} size="sm" className="mt-4 h-9">
              {c.action}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
