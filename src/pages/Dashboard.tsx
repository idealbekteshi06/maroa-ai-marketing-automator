import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, FileText, Megaphone, Share2,
  Search, Settings, Menu, X, ImageIcon, LogOut, Gift, PenSquare,
  Sparkles, Send, Eye, Plus, Globe,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardOverview from "@/components/dashboard/DashboardOverview";
import DashboardContent from "@/components/dashboard/DashboardContent";
import DashboardAds from "@/components/dashboard/DashboardAds";
import DashboardSocial from "@/components/dashboard/DashboardSocial";
import DashboardCompetitors from "@/components/dashboard/DashboardCompetitors";
import DashboardSettings from "@/components/dashboard/DashboardSettings";
import PhotoLibrary from "@/components/dashboard/PhotoLibrary";
import ReferralPage from "@/components/dashboard/ReferralPage";
import DashboardPublish from "@/components/dashboard/DashboardPublish";
import DashboardLandingPages from "@/components/dashboard/DashboardLandingPages";
import NotificationDropdown from "@/components/dashboard/NotificationDropdown";
import AIChatAssistant from "@/components/dashboard/AIChatAssistant";

const navItems = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "content", label: "Content", icon: FileText },
  { key: "ads", label: "Ad Campaigns", icon: Megaphone },
  { key: "social", label: "Social Accounts", icon: Share2 },
  { key: "competitors", label: "Competitor Intel", icon: Search },
  { key: "photos", label: "Photo Library", icon: ImageIcon },
  { key: "publish", label: "Publish", icon: PenSquare },
  { key: "landing", label: "Landing Pages", icon: Globe },
  { key: "referral", label: "Refer & Earn", icon: Gift },
  { key: "settings", label: "Settings", icon: Settings },
];

const mobileNav = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "content", label: "Content", icon: FileText },
  { key: "publish", label: "Publish", icon: PenSquare },
  { key: "social", label: "Social", icon: Share2 },
  { key: "settings", label: "Settings", icon: Settings },
];

const pageTitles: Record<string, string> = {
  overview: "Overview", content: "Content", ads: "Ad Campaigns",
  social: "Social Accounts", competitors: "Competitor Intel",
  photos: "Photo Library", publish: "Publish", landing: "Landing Pages",
  referral: "Refer & Earn", settings: "Settings",
};

export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const [active, setActive] = useState(tabFromUrl || "overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [publishPhotoUrl, setPublishPhotoUrl] = useState<string | null>(null);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { if (tabFromUrl) setActive(tabFromUrl); }, [tabFromUrl]);

  const firstName = user?.user_metadata?.first_name || user?.email?.split("@")[0] || "there";
  const initials = user?.user_metadata?.first_name
    ? `${user.user_metadata.first_name[0]}${user.user_metadata.last_name?.[0] ?? ""}`.toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? "U";

  const handleSignOut = async () => { await signOut(); navigate("/login"); };
  const handleUseInPost = (photoUrl: string) => { setPublishPhotoUrl(photoUrl); setActive("publish"); };

  const renderPage = () => {
    switch (active) {
      case "overview": return <DashboardOverview />;
      case "content": return <DashboardContent />;
      case "ads": return <DashboardAds />;
      case "social": return <DashboardSocial />;
      case "competitors": return <DashboardCompetitors />;
      case "photos": return <PhotoLibrary onUseInPost={handleUseInPost} />;
      case "publish": return <DashboardPublish />;
      case "landing": return <DashboardLandingPages />;
      case "referral": return <ReferralPage />;
      case "settings": return <DashboardSettings />;
      default: return <DashboardOverview />;
    }
  };

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-sidebar-border bg-sidebar md:flex md:flex-col">
        <div className="flex h-14 items-center px-5">
          <Link to="/" className="text-base font-bold text-sidebar-foreground">maroa<span className="text-primary">.ai</span></Link>
        </div>
        <nav className="flex-1 space-y-0.5 px-3 py-3">
          {navItems.map(item => (
            <button key={item.key} onClick={() => setActive(item.key)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[13px] transition-all duration-200 ${
                active === item.key ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}>
              <item.icon className="h-4 w-4" strokeWidth={active === item.key ? 2 : 1.5} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-3 space-y-2">
          <div className="flex items-center gap-2 px-3">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] text-sidebar-foreground/50">31 workflows active</span>
          </div>
          <button onClick={handleSignOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[13px] text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors">
            <LogOut className="h-4 w-4" strokeWidth={1.5} /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 border-r border-sidebar-border bg-sidebar" style={{ animation: "slide-in-right 0.2s ease-out" }}>
            <div className="flex h-14 items-center justify-between px-5">
              <span className="text-base font-bold text-sidebar-foreground">maroa<span className="text-primary">.ai</span></span>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="h-8 w-8"><X className="h-4 w-4" /></Button>
            </div>
            <nav className="space-y-0.5 px-3 py-3">
              {navItems.map(item => (
                <button key={item.key} onClick={() => { setActive(item.key); setSidebarOpen(false); }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[13px] transition-colors ${
                    active === item.key ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50"
                  }`}>
                  <item.icon className="h-4 w-4" />{item.label}
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
            <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setSidebarOpen(true)}><Menu className="h-4 w-4" /></Button>
            <h2 className="text-sm font-semibold text-foreground">
              {active === "overview" ? `Welcome back, ${firstName} 👋` : pageTitles[active]}
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <NotificationDropdown />
            <div className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{initials}</div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-5 pb-24 md:pb-5">{renderPage()}</main>
      </div>

      {/* Mobile bottom tab bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-border bg-background/80 backdrop-blur-xl md:hidden safe-area-inset-bottom">
        {mobileNav.map(item => (
          <button key={item.key} onClick={() => setActive(item.key)}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] transition-colors ${active === item.key ? "text-primary" : "text-muted-foreground"}`}>
            <item.icon className="h-5 w-5" strokeWidth={active === item.key ? 2 : 1.5} />
            {item.label}
          </button>
        ))}
      </div>

      <AIChatAssistant />
    </div>
  );
}
