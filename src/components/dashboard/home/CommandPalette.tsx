import { useEffect, useState, useCallback } from "react";
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty,
  CommandGroup, CommandItem,
} from "@/components/ui/command";
import {
  Home, Inbox, Palette, BarChart3, Users, Sparkles, Settings,
  FileText, Megaphone, Target, TrendingUp, Star, Mail, Search,
  Bot, Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (tab: string) => void;
}

interface PaletteItem {
  label: string;
  icon: LucideIcon;
  tab: string;
  group: "jump" | "action" | "recent";
}

const JUMP_ITEMS: PaletteItem[] = [
  { label: "Home", icon: Home, tab: "overview", group: "jump" },
  { label: "Inbox", icon: Inbox, tab: "inbox", group: "jump" },
  { label: "Studio", icon: Palette, tab: "studio", group: "jump" },
  { label: "Insights", icon: BarChart3, tab: "insights", group: "jump" },
  { label: "Customers", icon: Users, tab: "crm", group: "jump" },
  { label: "Ask Maroa", icon: Sparkles, tab: "ai-brain", group: "jump" },
  { label: "Ad Optimization", icon: Target, tab: "ad-optimization", group: "jump" },
  { label: "Competitors", icon: Search, tab: "competitor-intel", group: "jump" },
  { label: "Email Lifecycle", icon: Mail, tab: "email-lifecycle", group: "jump" },
  { label: "Reviews", icon: Star, tab: "wf4-reviews", group: "jump" },
  { label: "Budget & ROI", icon: TrendingUp, tab: "budget-roi", group: "jump" },
  { label: "Improve your AI", icon: Sparkles, tab: "profile-enhancement", group: "jump" },
  { label: "Settings", icon: Settings, tab: "settings", group: "jump" },
];

const ACTION_ITEMS: PaletteItem[] = [
  { label: "Generate a post", icon: FileText, tab: "wf1-daily-content", group: "action" },
  { label: "Launch a campaign", icon: Megaphone, tab: "campaign", group: "action" },
  { label: "Run competitor analysis", icon: Target, tab: "wf5-competitors", group: "action" },
  { label: "Create ad creative", icon: Zap, tab: "ad-optimization", group: "action" },
  { label: "Ask AI Brain", icon: Bot, tab: "ai-brain", group: "action" },
];

const RECENT_KEY = "maroa-cmd-recent";

function getRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); } catch { return []; }
}

function pushRecent(tab: string) {
  const recent = getRecent().filter((t) => t !== tab);
  recent.unshift(tab);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 3)));
}

export default function CommandPalette({ open, onOpenChange, onNavigate }: CommandPaletteProps) {
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    if (open) setRecent(getRecent());
  }, [open]);

  // ⌘K global shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  const handleSelect = useCallback((tab: string) => {
    pushRecent(tab);
    onNavigate(tab);
    onOpenChange(false);
  }, [onNavigate, onOpenChange]);

  const recentItems = recent.map((tab) => [...JUMP_ITEMS, ...ACTION_ITEMS].find((i) => i.tab === tab)).filter(Boolean) as PaletteItem[];

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search or jump to..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {recentItems.length > 0 && (
          <CommandGroup heading="Recent">
            {recentItems.map((item) => (
              <CommandItem key={`recent-${item.tab}`} onSelect={() => handleSelect(item.tab)} className="gap-3">
                <item.icon className="h-4 w-4 text-muted-foreground" />
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandGroup heading="Jump to">
          {JUMP_ITEMS.map((item) => (
            <CommandItem key={item.tab} onSelect={() => handleSelect(item.tab)} className="gap-3">
              <item.icon className="h-4 w-4 text-muted-foreground" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Quick actions">
          {ACTION_ITEMS.map((item) => (
            <CommandItem key={item.tab} onSelect={() => handleSelect(item.tab)} className="gap-3">
              <item.icon className="h-4 w-4 text-muted-foreground" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
