import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, FileText, Megaphone, Share2,
  Search, Settings, Menu, X, ImageIcon, LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardOverview from "@/components/dashboard/DashboardOverview";
import DashboardContent from "@/components/dashboard/DashboardContent";
import DashboardAds from "@/components/dashboard/DashboardAds";
import DashboardSocial from "@/components/dashboard/DashboardSocial";
import DashboardCompetitors from "@/components/dashboard/DashboardCompetitors";
import DashboardSettings from "@/components/dashboard/DashboardSettings";
import PhotoLibrary from "@/components/dashboard/PhotoLibrary";
import NotificationDropdown from "@/components/dashboard/NotificationDropdown";

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

const pageTitles: Record<string, string> = {
  overview: "Overview",
  content: "Content",
  ads: "Ad Campaigns",
  social: "Social Accounts",
  competitors: "Competitor Intel",
  photos: "Photo Library",
  settings: "Settings",
};

export default function Dashboard() {
  const [active, setActive] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const Page = pages[active] || DashboardOverview;

  const firstName = user?.user_metadata?.first_name || user?.email?.split("@")[0] || "there";
  const initials = user?.user_metadata?.first_name
    ? `${user.user_metadata.first_name[0]}${user.user_metadata.last_name?.[0] ?? ""}`.toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? "U";

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar - desktop */}
      <aside className="hidden w-60 shrink-0 border-r border-sidebar-border bg-sidebar md:flex md:flex-col">
        <div className="flex h-14 items-center px-5">
          <Link to="/" className="text-base font-bold text-sidebar-foreground">
            maroa<span className="text-primary">.ai</span>
          </Link>
        </div>
        <nav className="flex-1 space-y-0.5 px-3 py-3">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActive(item.key)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[13px] transition-all duration-200 ${
                active === item.key
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" strokeWidth={active === item.key ? 2 : 1.5} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <button onClick={handleSignOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[13px] text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors">
            <LogOut className="h-4 w-4" strokeWidth={1.5} /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 border-r border-sidebar-border bg-sidebar animate-slide-up" style={{ animation: "slide-in-right 0.2s ease-out" }}>
            <div className="flex h-14 items-center justify-between px-5">
              <span className="text-base font-bold text-sidebar-foreground">maroa<span className="text-primary">.ai</span></span>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="h-8 w-8"><X className="h-4 w-4" /></Button>
            </div>
            <nav className="space-y-0.5 px-3 py-3">
              {navItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => { setActive(item.key); setSidebarOpen(false); }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[13px] transition-colors ${
                    active === item.key
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50"
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
      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 backdrop-blur-xl px-5">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-4 w-4" />
            </Button>
            <div>
              {active === "overview" ? (
                <h2 className="text-sm font-semibold text-foreground">Welcome back, {firstName} 👋</h2>
              ) : (
                <h2 className="text-sm font-semibold text-foreground">{pageTitles[active]}</h2>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="relative h-8 w-8">
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
            </Button>
            <div className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{initials}</div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-5 pb-24 md:pb-5">
          <Page />
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-border bg-background/80 backdrop-blur-xl md:hidden safe-area-inset-bottom">
        {navItems.slice(0, 5).map((item) => (
          <button
            key={item.key}
            onClick={() => setActive(item.key)}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] transition-colors ${
              active === item.key ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <item.icon className="h-5 w-5" strokeWidth={active === item.key ? 2 : 1.5} />
            {item.label.split(" ")[0]}
          </button>
        ))}
      </div>
    </div>
  );
}
