import {
  LayoutGrid, Inbox, Bell, Sparkles, Calendar, Image, Film, Palette,
  Megaphone, Search, Wand2, FileText, Magnet, Gift, Users, GitBranch,
  Mail, Star, BarChart3, Eye, TrendingUp, Brain, Compass, Plug,
  UsersRound, CreditCard, Settings2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  badge?: string;
  gated?: "starter" | "growth" | "agency";
}
export interface NavGroup {
  label: string;
  items: NavItem[];
}

// Mounted under /app/*. Spec uses bare paths (§12); we map them inside the shell.
export const NAV: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Home", to: "", icon: LayoutGrid },
      { label: "Inbox", to: "inbox", icon: Inbox },
      { label: "Notifications", to: "notifications", icon: Bell },
    ],
  },
  {
    label: "Creative",
    items: [
      { label: "Content Studio", to: "content", icon: Sparkles },
      { label: "Calendar", to: "calendar", icon: Calendar },
      { label: "Library", to: "library", icon: Image },
      { label: "Video Studio", to: "video", icon: Film, gated: "growth" },
      { label: "Brand DNA", to: "brand", icon: Palette },
    ],
  },
  {
    label: "Growth",
    items: [
      { label: "Ads", to: "ads", icon: Megaphone, gated: "growth" },
      { label: "SEO", to: "seo", icon: Search },
      { label: "CRO", to: "cro", icon: Wand2 },
      { label: "Landing Pages", to: "landing-pages", icon: FileText },
      { label: "Lead Magnets", to: "lead-magnets", icon: Magnet },
      { label: "Referrals", to: "referrals", icon: Gift },
    ],
  },
  {
    label: "Audience",
    items: [
      { label: "CRM", to: "audience", icon: Users },
      { label: "Pipeline", to: "pipeline", icon: GitBranch },
      { label: "Email Sequences", to: "email", icon: Mail },
      { label: "Reviews", to: "reviews", icon: Star },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { label: "Analytics", to: "analytics", icon: BarChart3 },
      { label: "Competitors", to: "competitors", icon: Eye },
      { label: "Forecasting", to: "forecast", icon: TrendingUp, gated: "growth" },
      { label: "AI Brain", to: "brain", icon: Brain },
      { label: "Strategy", to: "strategy", icon: Compass },
    ],
  },
  {
    label: "Platform",
    items: [
      { label: "Integrations", to: "integrations", icon: Plug },
      { label: "Team", to: "team", icon: UsersRound, gated: "agency" },
      { label: "Billing", to: "billing", icon: CreditCard },
      { label: "Settings", to: "settings", icon: Settings2 },
    ],
  },
];
