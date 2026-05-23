import { LayoutGrid, Sparkles, TrendingUp, Brain, Settings2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  badge?: string;
}

// Mounted under /app/*. Five-section operating model.
export const NAV: NavItem[] = [
  { label: "Today", to: "", icon: LayoutGrid },
  { label: "Content", to: "content", icon: Sparkles },
  { label: "Growth", to: "growth", icon: TrendingUp },
  { label: "AI Brain", to: "brain", icon: Brain },
  { label: "Settings", to: "settings", icon: Settings2 },
];
