import {
  LayoutGrid, Sparkles, TrendingUp, Users, Settings2,
  CalendarDays, Image as ImageIcon, Film, Package, Palette,
  Megaphone, Search, Wand2, FileText, Magnet, Gift, Eye, BarChart3, LineChart,
  Inbox, GitBranch, Mail, Star,
  User, Plug, UsersRound, CreditCard, Bell, Brain,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface SubNavItem { label: string; to: string; icon: LucideIcon; }
export interface NavItem {
  label: string; to: string; icon: LucideIcon; children?: SubNavItem[];
}

export const NAV: NavItem[] = [
  { label: "Today", to: "", icon: LayoutGrid },
  {
    label: "Studio", to: "studio", icon: Sparkles,
    children: [
      { label: "Posts", to: "posts", icon: Sparkles },
      { label: "Calendar", to: "calendar", icon: CalendarDays },
      { label: "Library", to: "library", icon: ImageIcon },
      { label: "Video", to: "video", icon: Film },
      { label: "Products", to: "products", icon: Package },
      { label: "Brand", to: "brand", icon: Palette },
    ],
  },
  {
    label: "Growth", to: "growth", icon: TrendingUp,
    children: [
      { label: "Ads", to: "ads", icon: Megaphone },
      { label: "SEO", to: "seo", icon: Search },
      { label: "CRO", to: "cro", icon: Wand2 },
      { label: "Landing Pages", to: "landing-pages", icon: FileText },
      { label: "Lead Magnets", to: "lead-magnets", icon: Magnet },
      { label: "Referrals", to: "referrals", icon: Gift },
      { label: "Competitors", to: "competitors", icon: Eye },
      { label: "Analytics", to: "analytics", icon: BarChart3 },
      { label: "Forecast", to: "forecast", icon: LineChart },
    ],
  },
  {
    label: "Audience", to: "audience", icon: Users,
    children: [
      { label: "Inbox", to: "inbox", icon: Inbox },
      { label: "Contacts", to: "contacts", icon: Users },
      { label: "Pipeline", to: "pipeline", icon: GitBranch },
      { label: "Email", to: "email", icon: Mail },
      { label: "Reviews", to: "reviews", icon: Star },
    ],
  },
  {
    label: "Settings", to: "settings", icon: Settings2,
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
