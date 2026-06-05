import {
  Home, FileText, Sparkles, Megaphone, Users, TrendingUp, Settings2,
  CalendarDays, Image as ImageIcon, Film, Package, Palette,
  Search, Wand2, Magnet, Gift, Eye, BarChart3, LineChart,
  Inbox, GitBranch, Mail, Star,
  User, Plug, UsersRound, CreditCard, Bell, Brain, Layers, Target, Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface SubNavItem { label: string; to: string; icon: LucideIcon; }
export interface NavItem {
  label: string; to: string; icon: LucideIcon; children?: SubNavItem[]; group?: string;
}

export const NAV: NavItem[] = [
  { label: "Home", to: "", icon: Home, group: "Workspace" },

  {
    label: "Content", to: "content", icon: FileText, group: "Create",
    children: [
      { label: "Posts", to: "posts", icon: Sparkles },
      { label: "Calendar", to: "calendar", icon: CalendarDays },
      { label: "Library", to: "library", icon: ImageIcon },
      { label: "Brand voice", to: "brand", icon: Palette },
    ],
  },
  {
    label: "Studio", to: "studio", icon: Sparkles, group: "Create",
    children: [
      { label: "Products", to: "products", icon: Package },
      { label: "AI pipeline", to: "pipeline", icon: Layers },
      { label: "Video", to: "video", icon: Film },
    ],
  },

  {
    label: "Ads", to: "ads", icon: Megaphone, group: "Distribute",
    children: [
      { label: "Campaigns", to: "campaigns", icon: Target },
      { label: "Budget", to: "budget", icon: Wallet },
      { label: "Landing pages", to: "landing-pages", icon: FileText },
    ],
  },

  {
    label: "CRM", to: "crm", icon: Users, group: "Customers",
    children: [
      { label: "Inbox", to: "inbox", icon: Inbox },
      { label: "Contacts", to: "contacts", icon: Users },
      { label: "Pipeline", to: "pipeline", icon: GitBranch },
      { label: "Email", to: "email", icon: Mail },
      { label: "Reviews", to: "reviews", icon: Star },
    ],
  },

  {
    label: "Growth", to: "growth", icon: TrendingUp, group: "Customers",
    children: [
      { label: "SEO", to: "seo", icon: Search },
      { label: "Competitors", to: "competitors", icon: Eye },
      { label: "Lead magnets", to: "lead-magnets", icon: Magnet },
      { label: "Referrals", to: "referrals", icon: Gift },
      { label: "Analytics", to: "analytics", icon: BarChart3 },
      { label: "Forecast", to: "forecast", icon: LineChart },
      { label: "CRO", to: "cro", icon: Wand2 },
    ],
  },

  {
    label: "Settings", to: "settings", icon: Settings2, group: "Workspace",
    children: [
      { label: "Profile", to: "profile", icon: User },
      { label: "Brand voice", to: "brand", icon: Palette },
      { label: "Connections", to: "integrations", icon: Plug },
      { label: "Autopilot", to: "autopilot", icon: Brain },
      { label: "Team", to: "team", icon: UsersRound },
      { label: "Billing", to: "billing", icon: CreditCard },
      { label: "Notifications", to: "notifications", icon: Bell },
    ],
  },
];

export function findSection(pathname: string): NavItem | undefined {
  const seg = pathname.replace(/^\/app\/?/, "").split("/")[0] ?? "";
  if (!seg) return NAV[0];
  return NAV.find((n) => n.to === seg);
}
