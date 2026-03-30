import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, FileText, Megaphone, Share2,
  Search, Settings, Menu, X, ImageIcon, LogOut, Gift, PenSquare,
  MessageCircle, Globe, Bell, Home, PlusCircle, MoreHorizontal,
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
import DashboardInbox from "@/components/dashboard/DashboardInbox";
import NotificationDropdown from "@/components/dashboard/NotificationDropdown";
import AIChatAssistant from "@/components/dashboard/AIChatAssistant";

const navItems = [
  { key: "overview", label: "Overview", icon: Home },
  { key: "inbox", label: "Inbox", icon: MessageCircle },
  { key: "content", label: "Content", icon: FileText },
  { key: "ads", label: "Ad Campaigns", icon: Megaphone },
  { key: "social", label: "Social Accounts", icon: Share2 },
  { key: "competitors", label: "Competitor Intel", icon: Search },
  { key: "photos", label: "Photo Library", icon: ImageIcon },
  { key: "publish", label: "Publish", icon: PlusCircle },
  { key: "landing", label: "Landing Pages", icon: Globe },
  { key: "settings", label: "Settings", icon: Settings },
];

const mobileNav = [
  { key: "overview", label: "Home", icon: Home },
  { key: "inbox", label: "Inbox", icon: MessageCircle },
  { key: "publish", label: "Create", icon: PlusCircle },
  { key: "content", label: "Content", icon: FileText },
  { key: "settings", label: "Menu", icon: MoreHorizontal },
];

const pageTitles: Record<string, string> = {
  overview: "Overview", inbox: "Inbox", content: "Content", ads: "Ad Campaigns",
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
      case "inbox": return <DashboardInbox />;
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
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar — Meta Business Suite style */}
      <aside className="hidden w-[240px] shrink-0 border-r border-sidebar-border bg-sidebar md:flex md:flex-col">
        <div className="flex h-14 items-center px-4 border-b border-sidebar-border">
          <Link to="/" className="text-[15px] font-bold text-sidebar-foreground tracking-tight">
            maroa<span className="text-primary">.ai</span>
          </Link>
        </div>
        <nav className="flex-1 py-2 px-2">
          {navItems.map(item => (
            <button
              key={item.key}
              onClick={() => setActive(item.key)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors ${
                active === item.key
                  ? "bg-primary/10 text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              }`}
            >
              <item.icon className="h-[18px] w-[18px]" strokeWidth={active === item.key ? 2 : 1.5} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="border-t border-sidebar-border px-3 py-3 space-y-3">
          <div className="flex items-center gap-2 px-2">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="text-[11px] text-muted-foreground">31 workflows active</span>
          </div>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.5} /> Sign out
          </button>
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{initials}</div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{firstName}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-[280px] border-r border-sidebar-border bg-sidebar animate-fade-in">
            <div className="flex h-14 items-center justify-between px-4 border-b border-sidebar-border">
              <span className="text-[15px] font-bold text-sidebar-foreground">maroa<span className="text-primary">.ai</span></span>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="h-8 w-8"><X className="h-4 w-4" /></Button>
            </div>
            <nav className="py-2 px-2">
              {navItems.map(item => (
                <button key={item.key} onClick={() => { setActive(item.key); setSidebarOpen(false); }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors ${
                    active === item.key ? "bg-primary/10 text-primary" : "text-sidebar-foreground hover:bg-sidebar-accent"
                  }`}>
                  <item.icon className="h-[18px] w-[18px]" />{item.label}
                </button>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top header — Meta style */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card px-4 shadow-meta">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="md:hidden h-9 w-9" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <h2 className="text-[15px] font-semibold text-foreground">
              {active === "overview" ? `Welcome, ${firstName}` : pageTitles[active]}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationDropdown />
            <div className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground cursor-pointer">
              {initials}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 pb-24 md:pb-4">
          {renderPage()}
        </main>
      </div>

      {/* Mobile bottom tab bar — Facebook app style */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-border bg-card md:hidden safe-area-inset-bottom shadow-meta-elevated">
        {mobileNav.map(item => (
          <button
            key={item.key}
            onClick={() => setActive(item.key)}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors min-h-[48px] ${
              active === item.key ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <item.icon className="h-5 w-5" strokeWidth={active === item.key ? 2.5 : 1.5} />
            {item.label}
          </button>
        ))}
      </div>

      <AIChatAssistant />
    </div>
  );
}
