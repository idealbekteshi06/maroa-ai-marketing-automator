import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, FileText, Megaphone, Share2,
  Search, Settings, Bell, Menu, X, ImageIcon,
} from "lucide-react";
import DashboardOverview from "@/components/dashboard/DashboardOverview";
import DashboardContent from "@/components/dashboard/DashboardContent";
import DashboardAds from "@/components/dashboard/DashboardAds";
import DashboardSocial from "@/components/dashboard/DashboardSocial";
import DashboardCompetitors from "@/components/dashboard/DashboardCompetitors";
import DashboardSettings from "@/components/dashboard/DashboardSettings";
import PhotoLibrary from "@/components/dashboard/PhotoLibrary";

const navItems = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "content", label: "Content", icon: FileText },
  { key: "ads", label: "Ad Campaigns", icon: Megaphone },
  { key: "social", label: "Social Accounts", icon: Share2 },
  { key: "competitors", label: "Competitor Intel", icon: Search },
  { key: "photos", label: "Photo Library", icon: ImageIcon },
  { key: "settings", label: "Settings", icon: Settings },
];

const pages: Record<string, React.FC> = {
  overview: DashboardOverview,
  content: DashboardContent,
  ads: DashboardAds,
  social: DashboardSocial,
  competitors: DashboardCompetitors,
  photos: PhotoLibrary,
  settings: DashboardSettings,
};

export default function Dashboard() {
  const [active, setActive] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const Page = pages[active] || DashboardOverview;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar - desktop */}
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar md:flex md:flex-col">
        <div className="flex h-16 items-center px-6">
          <Link to="/" className="text-lg font-bold text-sidebar-foreground">
            maroa<span className="text-primary">.ai</span>
          </Link>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActive(item.key)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                active === item.key
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-foreground/20" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 border-r border-sidebar-border bg-sidebar">
            <div className="flex h-16 items-center justify-between px-6">
              <span className="text-lg font-bold text-sidebar-foreground">maroa<span className="text-primary">.ai</span></span>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}><X className="h-5 w-5" /></Button>
            </div>
            <nav className="space-y-1 px-3 py-4">
              {navItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => { setActive(item.key); setSidebarOpen(false); }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                    active === item.key
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-background px-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-semibold text-foreground capitalize">{active === "ads" ? "Ad Campaigns" : active === "competitors" ? "Competitor Intel" : active}</h2>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon"><Bell className="h-5 w-5" /></Button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">JD</div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Page />
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-border bg-background md:hidden">
        {navItems.slice(0, 5).map((item) => (
          <button
            key={item.key}
            onClick={() => setActive(item.key)}
            className={`flex flex-1 flex-col items-center gap-1 py-2 text-[10px] ${
              active === item.key ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <item.icon className="h-5 w-5" />
            {item.label.split(" ")[0]}
          </button>
        ))}
      </div>
    </div>
  );
}
