import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard, FileText, Megaphone, Share2, Target,
  Search, Settings, Menu, X, LogOut, Globe, Star, Mail,
  Users, Home, MoreHorizontal, Gift, Magnet, Rocket,
  Lightbulb, Brain, Code, FileSearch, DollarSign,
  MessageSquare, Briefcase, BarChart3, Wrench, MousePointer,
  UserPlus, TrendingUp, CreditCard, Bot,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import NotificationCenter from "@/components/NotificationCenter";
import AIChatAssistant from "@/components/dashboard/AIChatAssistant";
import AIStatusBar from "@/components/AIStatusBar";
import KeyboardShortcutsModal from "@/components/KeyboardShortcutsModal";
import PerformanceAlert from "@/components/PerformanceAlert";
import CompetitorAlert from "@/components/CompetitorAlert";
import WeeklyReportOverlay from "@/components/WeeklyReportOverlay";
import WelcomeModal from "@/components/WelcomeModal";
import Heartbeat from "@/components/Heartbeat";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

/* Animated logo dot — uses React state, not CSS */
function LogoDot() {
  const [scale, setScale] = useState(1);
  const [growing, setGrowing] = useState(true);
  useEffect(() => {
    const timer = setInterval(() => {
      setScale(s => {
        if (growing && s >= 1.4) { setGrowing(false); return 1.4; }
        if (!growing && s <= 1) { setGrowing(true); return 1; }
        return growing ? s + 0.015 : s - 0.015;
      });
    }, 30);
    return () => clearInterval(timer);
  }, [growing]);
  return (
    <span style={{ color: "#0A84FF", display: "inline-block", transform: `scale(${scale})`, textShadow: `0 0 ${(scale - 1) * 20}px rgba(10,132,255,${(scale - 1) * 2})` }}>.</span>
  );
}

/* ── Lazy-loaded tab components ── */
const DashboardOverview = lazy(() => import("@/components/dashboard/DashboardOverview"));
const DashboardContent = lazy(() => import("@/components/dashboard/DashboardContent"));
const DashboardAds = lazy(() => import("@/components/dashboard/DashboardAds"));
const DashboardSocial = lazy(() => import("@/components/dashboard/DashboardSocial"));
const DashboardCompetitors = lazy(() => import("@/components/dashboard/DashboardCompetitors"));
const DashboardSettings = lazy(() => import("@/components/dashboard/DashboardSettings"));
const DashboardCRM = lazy(() => import("@/components/dashboard/DashboardCRM"));
const DashboardSEO = lazy(() => import("@/components/dashboard/DashboardSEO"));
const DashboardReviews = lazy(() => import("@/components/dashboard/DashboardReviews"));
const DashboardEmail = lazy(() => import("@/components/dashboard/DashboardEmail"));
const DashboardReferral2 = lazy(() => import("@/components/dashboard/DashboardReferral2"));
const DashboardLeadMagnets = lazy(() => import("@/components/dashboard/DashboardLeadMagnets"));
const DashboardLaunch = lazy(() => import("@/components/dashboard/DashboardLaunch"));
const DashboardResearch = lazy(() => import("@/components/dashboard/DashboardResearch"));
const DashboardIdeas = lazy(() => import("@/components/dashboard/DashboardIdeas"));
const DashboardAIBrain = lazy(() => import("@/components/dashboard/DashboardAIBrain"));
const DashboardHealth = lazy(() => import("@/components/dashboard/DashboardHealth"));
const DashboardCampaign = lazy(() => import("@/components/dashboard/DashboardCampaign"));
const DashboardAISEO = lazy(() => import("@/components/dashboard/DashboardAISEO"));
const DashboardSchema = lazy(() => import("@/components/dashboard/DashboardSchema"));
const DashboardSEOPages = lazy(() => import("@/components/dashboard/DashboardSEOPages"));
const DashboardPricing = lazy(() => import("@/components/dashboard/DashboardPricing"));
const DashboardCommunity = lazy(() => import("@/components/dashboard/DashboardCommunity"));
const DashboardSales = lazy(() => import("@/components/dashboard/DashboardSales"));
const DashboardRevOps = lazy(() => import("@/components/dashboard/DashboardRevOps"));
const DashboardABTests = lazy(() => import("@/components/dashboard/DashboardABTests"));
const DashboardFreeTools = lazy(() => import("@/components/dashboard/DashboardFreeTools"));
const DashboardPopupCRO = lazy(() => import("@/components/dashboard/DashboardPopupCRO"));
const DashboardOnboardingCRO = lazy(() => import("@/components/dashboard/DashboardOnboardingCRO"));
const DashboardUpgradeCRO = lazy(() => import("@/components/dashboard/DashboardUpgradeCRO"));
const DashboardSignupCRO = lazy(() => import("@/components/dashboard/DashboardSignupCRO"));
const DashboardOrchestrator = lazy(() => import("@/components/dashboard/DashboardOrchestrator"));

/* ── Navigation (grouped) ── */
const navGroups = [
  {
    items: [
      { key: "overview", label: "Mission Control", icon: Home },
    ],
  },
  {
    label: "MARKETING",
    items: [
      { key: "social", label: "Social Hub", icon: Share2 },
      { key: "campaigns", label: "AI Campaigns", icon: Megaphone },
      { key: "content", label: "Content", icon: FileText },
      { key: "email", label: "Email", icon: Mail },
      { key: "referral", label: "Referral Program", icon: Gift },
      { key: "lead-magnets", label: "Lead Magnets", icon: Magnet },
      { key: "launch", label: "Launch Campaign", icon: Rocket },
      { key: "ideas", label: "Marketing Ideas", icon: Lightbulb },
    ],
  },
  {
    label: "INTELLIGENCE",
    items: [
      { key: "competitors", label: "Competitors", icon: Target },
      { key: "seo", label: "SEO", icon: Search },
      { key: "ai-seo", label: "AI SEO", icon: Brain },
      { key: "research", label: "Customer Research", icon: FileSearch },
      { key: "schema", label: "Schema Markup", icon: Code },
      { key: "seo-pages", label: "SEO Pages", icon: Globe },
    ],
  },
  {
    label: "CUSTOMERS",
    items: [
      { key: "crm", label: "CRM & Leads", icon: Users },
      { key: "reviews", label: "Reviews", icon: Star },
    ],
  },
  {
    label: "OPTIMIZE",
    items: [
      { key: "pricing", label: "Pricing Strategy", icon: DollarSign },
      { key: "ab-tests", label: "A/B Tests", icon: BarChart3 },
      { key: "free-tools", label: "Free Tools", icon: Wrench },
      { key: "popup-cro", label: "Popups", icon: MousePointer },
    ],
  },
  {
    label: "AUTOMATION",
    items: [
      { key: "ai-brain", label: "AI Brain", icon: Brain },
      { key: "campaign", label: "Instant Campaign", icon: Rocket },
      { key: "community", label: "Community", icon: MessageSquare },
      { key: "sales", label: "Sales Assets", icon: Briefcase },
      { key: "revops", label: "RevOps", icon: TrendingUp },
      { key: "onboarding-cro", label: "Onboarding CRO", icon: UserPlus },
      { key: "upgrade-cro", label: "Upgrade CRO", icon: CreditCard },
      { key: "signup-cro", label: "Signup CRO", icon: UserPlus },
      { key: "orchestrator", label: "AI Orchestrator", icon: Bot },
    ],
  },
  {
    label: "ACCOUNT",
    items: [
      { key: "health", label: "Health Score", icon: BarChart3 },
      { key: "settings", label: "Settings", icon: Settings },
    ],
  },
];

const allNavItems = navGroups.flatMap(g => g.items);

const mobileNav = [
  { key: "overview", label: "Home", icon: Home },
  { key: "content", label: "Content", icon: FileText },
  { key: "ideas", label: "Ideas", icon: Lightbulb },
  { key: "ai-brain", label: "AI Brain", icon: Brain },
  { key: "settings", label: "Settings", icon: Settings },
];

/* FIX 7: Updated page titles and subtitles */
const pageMeta: Record<string, { title: string; subtitle: string }> = {
  overview: { title: "Mission Control", subtitle: "Your AI is running your marketing" },
  social: { title: "Social Hub", subtitle: "Connected platforms and recent posts" },
  campaigns: { title: "AI Campaigns", subtitle: "AI-created and optimized campaigns" },
  content: { title: "Content & Posts", subtitle: "Generated content ready to review" },
  email: { title: "Email Marketing", subtitle: "Automated sequences running 24/7" },
  competitors: { title: "Competitor Intelligence", subtitle: "Weekly competitor monitoring" },
  seo: { title: "SEO Optimization", subtitle: "Automated recommendations" },
  crm: { title: "CRM & Leads", subtitle: "Lead pipeline and scoring" },
  reviews: { title: "Reviews", subtitle: "Reputation management" },
  settings: { title: "Settings", subtitle: "Configure your AI engine" },
  referral: { title: "Referral Program", subtitle: "Earn rewards by referring businesses" },
  "lead-magnets": { title: "Lead Magnets", subtitle: "AI-generated guides and checklists" },
  launch: { title: "Launch Campaign", subtitle: "Plan and execute product launches" },
  research: { title: "Customer Research", subtitle: "AI-powered market insights" },
  ideas: { title: "Marketing Ideas", subtitle: "AI-generated campaign ideas" },
  "ai-seo": { title: "AI SEO", subtitle: "Content optimization for search" },
  schema: { title: "Schema Markup", subtitle: "Structured data for better rankings" },
  "seo-pages": { title: "SEO Pages", subtitle: "AI-generated landing pages" },
  pricing: { title: "Pricing Strategy", subtitle: "Optimize your pricing" },
  community: { title: "Community", subtitle: "Generate engagement content" },
  sales: { title: "Sales Assets", subtitle: "Pitches and objection handlers" },
  revops: { title: "RevOps", subtitle: "Revenue operations and lead scoring" },
  "ab-tests": { title: "A/B Tests", subtitle: "Test and optimize everything" },
  "free-tools": { title: "Free Tools", subtitle: "Lead generation tools" },
  "popup-cro": { title: "Popups", subtitle: "High-converting popup copy" },
  "onboarding-cro": { title: "Onboarding CRO", subtitle: "Optimize customer onboarding" },
  "upgrade-cro": { title: "Upgrade CRO", subtitle: "Increase upgrade conversions" },
  "signup-cro": { title: "Signup CRO", subtitle: "Optimize your signup flow" },
  orchestrator: { title: "AI Orchestrator", subtitle: "View and control AI automation" },
  "ai-brain": { title: "AI Brain", subtitle: "Your autonomous marketing manager" },
  health: { title: "Health Score", subtitle: "Your marketing health assessment" },
  campaign: { title: "Instant Campaign", subtitle: "One-click multi-channel campaigns" },
};

/* FIX 1: Name capitalization */
function capitalizeName(name: string): string {
  if (!name) return "";
  return name.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}

const TabSpinner = () => (
  <div className="flex items-center justify-center py-20">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const oauthCode = searchParams.get("code");
  const [active, setActive] = useState(tabFromUrl || "overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [signOutConfirm, setSignOutConfirm] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [showReport, setShowReport] = useState(true);
  const { user, businessId, signOut } = useAuth();
  const navigate = useNavigate();

  const handleNavigate = useCallback((tab: string) => setActive(tab), []);
  const handleToggleHelp = useCallback(() => setShortcutsOpen(p => !p), []);
  const handleEscape = useCallback(() => { setShortcutsOpen(false); setSidebarOpen(false); }, []);
  const handleToggleChat = useCallback(() => setChatOpen(p => !p), []);

  useKeyboardShortcuts({ onNavigate: handleNavigate, onToggleHelp: handleToggleHelp, onEscape: handleEscape, onToggleChat: handleToggleChat });

  useEffect(() => { if (tabFromUrl) setActive(tabFromUrl); }, [tabFromUrl]);
  useEffect(() => {
    const handler = (e: Event) => { const tab = (e as CustomEvent).detail; if (tab) setActive(tab); };
    window.addEventListener("dashboard-navigate", handler);
    return () => window.removeEventListener("dashboard-navigate", handler);
  }, []);
  useEffect(() => {
    if (oauthCode) setSearchParams(prev => { prev.delete("code"); return prev; }, { replace: true });
  }, [oauthCode, setSearchParams]);

  const rawName = user?.user_metadata?.first_name || user?.user_metadata?.full_name?.split(" ")[0] || user?.user_metadata?.name?.split(" ")[0] || user?.email?.split("@")[0] || "there";
  const firstName = capitalizeName(rawName);
  const initials = user?.user_metadata?.first_name
    ? `${user.user_metadata.first_name[0]}${user.user_metadata.last_name?.[0] ?? ""}`.toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? "U";

  const handleSignOut = async () => { await signOut(); navigate("/login"); };
  const meta = pageMeta[active] || { title: "Dashboard", subtitle: "" };

  const renderPage = () => {
    const page = (() => {
      switch (active) {
        case "overview": return <DashboardOverview />;
        case "content": return <DashboardContent />;
        case "campaigns": return <DashboardAds />;
        case "social": return <DashboardSocial oauthCode={oauthCode} />;
        case "competitors": return <DashboardCompetitors />;
        case "seo": return <DashboardSEO />;
        case "crm": return <DashboardCRM />;
        case "reviews": return <DashboardReviews />;
        case "email": return <DashboardEmail />;
        case "settings": return <DashboardSettings />;
        case "referral": return <DashboardReferral2 />;
        case "lead-magnets": return <DashboardLeadMagnets />;
        case "launch": return <DashboardLaunch />;
        case "research": return <DashboardResearch />;
        case "ideas": return <DashboardIdeas />;
        case "ai-seo": return <DashboardAISEO />;
        case "schema": return <DashboardSchema />;
        case "seo-pages": return <DashboardSEOPages />;
        case "pricing": return <DashboardPricing />;
        case "community": return <DashboardCommunity />;
        case "sales": return <DashboardSales />;
        case "revops": return <DashboardRevOps />;
        case "ab-tests": return <DashboardABTests />;
        case "free-tools": return <DashboardFreeTools />;
        case "popup-cro": return <DashboardPopupCRO />;
        case "onboarding-cro": return <DashboardOnboardingCRO />;
        case "upgrade-cro": return <DashboardUpgradeCRO />;
        case "signup-cro": return <DashboardSignupCRO />;
        case "orchestrator": return <DashboardOrchestrator />;
        case "ai-brain": return <DashboardAIBrain />;
        case "health": return <DashboardHealth />;
        case "campaign": return <DashboardCampaign />;
        default: return <DashboardOverview />;
      }
    })();
    return <Suspense fallback={<TabSpinner />}>{page}</Suspense>;
  };

  /* ── Sidebar content (shared desktop + mobile) ── */
  const SidebarNav = ({ onItemClick }: { onItemClick?: () => void }) => (
    <nav className="flex-1 py-1 px-2 overflow-y-auto">
      {navGroups.map((group, gi) => (
        <div key={gi}>
          {group.label && (
            <p className="px-4 pt-5 pb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/40">
              {group.label}
            </p>
          )}
          {group.items.map(item => (
            <button
              key={item.key}
              onClick={() => { setActive(item.key); onItemClick?.(); }}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors ${
                active === item.key
                  ? "border-l-[3px] border-primary bg-primary/10 text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
              }`}
            >
              <item.icon className="h-[18px] w-[18px]" strokeWidth={active === item.key ? 2 : 1.5} />
              {item.label}
            </button>
          ))}
        </div>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* ── Desktop sidebar ── */}
      <aside className="hidden w-[260px] shrink-0 border-r border-sidebar-border bg-sidebar md:flex md:flex-col">
        <div className="flex h-14 items-center px-4 border-b border-sidebar-border">
          <Link to="/" className="text-[15px] font-bold text-sidebar-foreground tracking-tight">
            maroa<LogoDot />ai
          </Link>
        </div>

        <SidebarNav />

        <div className="border-t border-sidebar-border px-3 py-3 space-y-2">
          <div className="flex items-center gap-2 px-2">
            <Heartbeat active={true} />
            <span className="text-[11px] font-medium text-success">Autopilot Active</span>
          </div>
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{initials}</div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-foreground truncate">{firstName}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          {signOutConfirm ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/5 border border-destructive/20">
              <span className="text-xs text-foreground">Sign out?</span>
              <Button size="sm" variant="destructive" className="h-6 text-[10px] px-2" onClick={handleSignOut}>Sign out</Button>
              <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={() => setSignOutConfirm(false)}>Cancel</Button>
            </div>
          ) : (
            <button
              onClick={() => setSignOutConfirm(true)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.5} /> Sign out
            </button>
          )}
        </div>
      </aside>

      {/* ── Mobile sidebar overlay ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-[280px] border-r border-sidebar-border bg-sidebar animate-fade-in flex flex-col">
            <div className="flex h-14 items-center justify-between px-4 border-b border-sidebar-border shrink-0">
              <span className="text-[15px] font-bold text-sidebar-foreground">maroa<LogoDot />ai</span>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="h-8 w-8" aria-label="Close menu"><X className="h-4 w-4" /></Button>
            </div>
            <SidebarNav onItemClick={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* ── Main content ── */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/80 backdrop-blur-xl px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="md:hidden h-9 w-9" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-[15px] font-semibold text-foreground leading-tight">
                {active === "overview" ? `Welcome, ${firstName}` : meta.title}
              </h2>
              <p className="text-[11px] text-muted-foreground hidden sm:block">{meta.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationCenter />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground cursor-pointer" aria-label="User menu">
                  {initials}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-foreground">{firstName}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setActive("settings")}>Settings</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActive("settings")}>Billing</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <PerformanceAlert businessId={businessId} onNavigate={handleNavigate} />
        <AIStatusBar businessId={businessId} />

        <main className="flex-1 overflow-y-auto p-4 pb-24 md:pb-4">
          <div className="animate-fade-in">
            {renderPage()}
          </div>
        </main>
      </div>

      {/* ── Mobile bottom tab bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-border bg-card/80 backdrop-blur-xl md:hidden safe-area-inset-bottom">
        {mobileNav.map(item => (
          <button
            key={item.key}
            onClick={() => setActive(item.key)}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors min-h-[48px] ${
              active === item.key ? "text-primary" : "text-muted-foreground"
            }`}
            aria-label={item.label}
          >
            <item.icon className="h-5 w-5" strokeWidth={active === item.key ? 2.5 : 1.5} />
            {item.label}
          </button>
        ))}
      </div>

      <AIChatAssistant externalOpen={chatOpen} onExternalOpenChange={setChatOpen} />
      <KeyboardShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <CompetitorAlert businessId={businessId} onNavigate={handleNavigate} />
      {showReport && <WeeklyReportOverlay businessId={businessId} onDismiss={() => setShowReport(false)} />}
      <WelcomeModal />
    </div>
  );
}
