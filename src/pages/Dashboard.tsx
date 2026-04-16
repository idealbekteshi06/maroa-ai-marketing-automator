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
  UserPlus, TrendingUp, CreditCard, Bot, Palette, Inbox,
  ChevronRight, Sparkles, Scale,
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

/* ── v2 workflow pages (MAROA_15_WORKFLOWS_V2) ── */
const WF1DailyContentEngine = lazy(() => import("@/pages/workflows/DailyContentEngine"));
const WF13WeeklyStrategyBrief = lazy(() => import("@/pages/workflows/WeeklyStrategyBrief"));
const WF15AiBrain = lazy(() => import("@/pages/workflows/AiBrain"));
const WF2LeadScoring = lazy(() => import("@/pages/workflows/LeadScoring"));
const WF4ReviewsReputation = lazy(() => import("@/pages/workflows/ReviewsReputation"));

/* ── v2 premium pages ── */
const AdOptimization = lazy(() => import("@/pages/AdOptimization"));
const LocalPresence = lazy(() => import("@/pages/LocalPresence"));
const EmailLifecycle = lazy(() => import("@/pages/EmailLifecycle"));
const UnifiedInbox = lazy(() => import("@/pages/UnifiedInbox"));
const HiggsfieldStudio = lazy(() => import("@/pages/HiggsfieldStudio"));
const CompetitorIntelligence = lazy(() => import("@/pages/CompetitorIntelligence"));
const CustomerInsights = lazy(() => import("@/pages/CustomerInsights"));
const LaunchOrchestrator = lazy(() => import("@/pages/LaunchOrchestrator"));
const BudgetROI = lazy(() => import("@/pages/BudgetROI"));

/* ── v2 Navigation (REFACTOR_BRIEF_V2 section 2.1) ────────────
 * 7 primary items per Miller's 7±2 law. Workflows expand into 4 categories
 * per the V2 spec. Legacy pages are kept reachable via direct URL (?tab=key)
 * but removed from sidebar to eliminate cognitive overload (Hick's Law).
 */
type NavItem = { key: string; label: string; icon: typeof Home };
type WorkflowGroup = { label: string; items: NavItem[] };

const primaryNav: NavItem[] = [
  { key: "overview", label: "Home", icon: Home },
  { key: "inbox", label: "Inbox", icon: Inbox },
  { key: "studio", label: "Studio", icon: Palette },
  { key: "insights", label: "Insights", icon: BarChart3 },
  { key: "crm", label: "Customers", icon: Users },
  { key: "ai-brain", label: "Ask Maroa", icon: Sparkles },
];

const workflowGroups: WorkflowGroup[] = [
  {
    label: "Audience Growth",
    items: [
      { key: "wf1-daily-content", label: "Daily Content Engine", icon: FileText },
      { key: "wf6-local-presence", label: "Local + Digital Presence", icon: Globe },
      { key: "wf12-launch", label: "Launch Orchestrator", icon: Rocket },
    ],
  },
  {
    label: "Revenue Generation",
    items: [
      { key: "wf3-ads", label: "Ad Optimization", icon: Megaphone },
      { key: "wf7-email", label: "Email Lifecycle", icon: Mail },
      { key: "wf2-leads", label: "Lead Scoring", icon: TrendingUp },
    ],
  },
  {
    label: "Customer Operations",
    items: [
      { key: "wf4-reviews", label: "Reviews & Reputation", icon: Star },
      { key: "wf11-inbox", label: "Unified Inbox", icon: MessageSquare },
      { key: "wf8-insights", label: "Customer Insights", icon: FileSearch },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { key: "wf5-competitors", label: "Competitor Intelligence", icon: Target },
      { key: "wf13-brief", label: "Weekly Strategy Brief", icon: Scale },
      { key: "wf14-budget", label: "Budget & ROI Optimizer", icon: DollarSign },
    ],
  },
];

/* Every key reachable anywhere in the app — used for route resolution and shortcuts */
const allNavItems: NavItem[] = [
  ...primaryNav,
  ...workflowGroups.flatMap((g) => g.items),
  { key: "settings", label: "Settings", icon: Settings },
];

/* Mobile bottom tab bar — 5 items per REFACTOR_BRIEF_V2 section 2.7 */
const mobileNav: NavItem[] = [
  { key: "overview", label: "Home", icon: Home },
  { key: "inbox", label: "Inbox", icon: Inbox },
  { key: "wf1-daily-content", label: "Content", icon: FileText },
  { key: "studio", label: "Studio", icon: Palette },
  { key: "ai-brain", label: "Ask", icon: Sparkles },
];

/* Page titles and subtitles — keyed by nav key */
const pageMeta: Record<string, { title: string; subtitle: string }> = {
  overview: { title: "Mission Control", subtitle: "Your AI is running your marketing" },
  inbox: { title: "Unified Inbox", subtitle: "Every conversation, one queue" },
  studio: { title: "Studio", subtitle: "Cinematic creative generation" },
  insights: { title: "Insights", subtitle: "Reports, briefs, analytics" },
  "wf1-daily-content": { title: "Daily Content Engine", subtitle: "Workflow #1 · Senior strategist running daily" },
  "wf2-leads": { title: "Lead Scoring", subtitle: "Workflow #2 · Intent over identity" },
  "wf3-ads": { title: "Ad Optimization", subtitle: "Workflow #3 · Daily optimization loop" },
  "wf4-reviews": { title: "Reviews & Reputation", subtitle: "Workflow #4 · Brand voice responses" },
  "wf5-competitors": { title: "Competitor Intelligence", subtitle: "Workflow #5 · Continuous monitoring" },
  "wf6-local-presence": { title: "Local + Digital Presence", subtitle: "Workflow #6 · GBP + schema + citations" },
  "wf7-email": { title: "Email Lifecycle", subtitle: "Workflow #7 · Behavioral triggers" },
  "wf8-insights": { title: "Customer Insights", subtitle: "Workflow #8 · JTBD + review mining" },
  "wf11-inbox": { title: "Unified Inbox + Smart Routing", subtitle: "Workflow #9/#11 · All channels, one queue" },
  "wf10-studio": { title: "Higgsfield Studio", subtitle: "Workflow #10 · Segmind pipeline" },
  "wf12-launch": { title: "Launch Orchestrator", subtitle: "Workflow #12 · Pre / launch / post" },
  "wf13-brief": { title: "Weekly Strategy Brief", subtitle: "Workflow #13 · KPI narrative + action items" },
  "wf14-budget": { title: "Budget & ROI Optimizer", subtitle: "Workflow #14 · CFO-grade financial intelligence" },
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
  "ad-optimization": { title: "Ad Optimization", subtitle: "AI-powered Meta Ads performance" },
  "local-presence": { title: "Local Presence", subtitle: "Google Business Profile + local SEO" },
  "email-lifecycle": { title: "Email Lifecycle", subtitle: "Automated sequences and nurture flows" },
  "unified-inbox": { title: "Unified Inbox", subtitle: "Every conversation, one queue" },
  "higgsfield-studio": { title: "Studio", subtitle: "AI video and image generation" },
  "competitor-intel": { title: "Competitor Intelligence", subtitle: "Track and outperform competitors" },
  "customer-insights": { title: "Customer Insights", subtitle: "AI-analyzed behavior and segments" },
  "launch-orchestrator": { title: "Launch Orchestrator", subtitle: "Coordinate product and campaign launches" },
  "budget-roi": { title: "Budget & ROI", subtitle: "Marketing spend allocation and returns" },
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
        case "ai-brain": return <WF15AiBrain />;
        case "ai-brain-legacy": return <DashboardAIBrain />;
        case "health": return <DashboardHealth />;
        case "campaign": return <DashboardCampaign />;
        /* v2 workflow routes (MAROA_15_WORKFLOWS_V2) */
        case "wf1-daily-content": return <WF1DailyContentEngine />;
        case "wf13-brief": return <WF13WeeklyStrategyBrief />;
        /* The following v2 routes will be added in subsequent commits as each
         * workflow is implemented per its spec. Until then they fall through
         * to the legacy component closest in meaning. */
        case "wf2-leads": return <WF2LeadScoring />;
        case "wf3-ads": return <AdOptimization />;
        case "wf4-reviews": return <WF4ReviewsReputation />;
        case "wf5-competitors": return <CompetitorIntelligence />;
        case "wf6-local-presence": return <LocalPresence />;
        case "wf7-email": return <EmailLifecycle />;
        case "wf8-insights": return <CustomerInsights />;
        case "wf11-inbox": return <UnifiedInbox />;
        case "wf12-launch": return <LaunchOrchestrator />;
        // wf13-brief handled above
        case "wf14-budget": return <BudgetROI />;
        case "inbox": return <UnifiedInbox />;
        case "studio": return <HiggsfieldStudio />;
        case "insights": return <CustomerInsights />;
        /* v2 premium page direct routes */
        case "ad-optimization": return <AdOptimization />;
        case "local-presence": return <LocalPresence />;
        case "email-lifecycle": return <EmailLifecycle />;
        case "unified-inbox": return <UnifiedInbox />;
        case "higgsfield-studio": return <HiggsfieldStudio />;
        case "competitor-intel": return <CompetitorIntelligence />;
        case "customer-insights": return <CustomerInsights />;
        case "launch-orchestrator": return <LaunchOrchestrator />;
        case "budget-roi": return <BudgetROI />;
        default: return <DashboardOverview />;
      }
    })();
    return <Suspense fallback={<TabSpinner />}>{page}</Suspense>;
  };

  /* ── Sidebar content (shared desktop + mobile) ──
   * 7-item primary nav + expandable Workflows group (4 categories per
   * REFACTOR_BRIEF_V2 section 2.1). Expanded state persists per user in
   * localStorage. Keyboard navigation is handled by useKeyboardShortcuts.
   */
  const [workflowsOpen, setWorkflowsOpen] = useState<boolean>(
    () => localStorage.getItem("maroa.nav.workflowsOpen") === "1",
  );
  useEffect(() => {
    localStorage.setItem("maroa.nav.workflowsOpen", workflowsOpen ? "1" : "0");
  }, [workflowsOpen]);

  const activeIsWorkflow = workflowGroups.some((g) =>
    g.items.some((i) => i.key === active),
  );
  useEffect(() => {
    if (activeIsWorkflow && !workflowsOpen) setWorkflowsOpen(true);
  }, [activeIsWorkflow, workflowsOpen]);

  const NavItemButton = ({
    item,
    onItemClick,
    indent = false,
  }: {
    item: NavItem;
    onItemClick?: () => void;
    indent?: boolean;
  }) => (
    <button
      onClick={() => {
        setActive(item.key);
        onItemClick?.();
      }}
      className={`flex w-full items-center gap-3 rounded-lg ${
        indent ? "pl-9 pr-3" : "px-3"
      } py-2 text-[13px] font-medium transition-colors ${
        active === item.key
          ? "border-l-[3px] border-primary bg-primary/10 text-primary"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
      }`}
    >
      <item.icon
        className="h-[18px] w-[18px]"
        strokeWidth={active === item.key ? 2 : 1.5}
      />
      {item.label}
    </button>
  );

  const SidebarNav = ({ onItemClick }: { onItemClick?: () => void }) => (
    <nav className="flex-1 overflow-y-auto px-2 py-2">
      <div className="space-y-0.5">
        {primaryNav.map((item) => (
          <NavItemButton key={item.key} item={item} onItemClick={onItemClick} />
        ))}
      </div>

      {/* Expandable Workflows group */}
      <div className="mt-2">
        <button
          type="button"
          onClick={() => setWorkflowsOpen((v) => !v)}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
            activeIsWorkflow && !workflowsOpen
              ? "bg-primary/5 text-primary"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
          }`}
          aria-expanded={workflowsOpen}
        >
          <Bot className="h-[18px] w-[18px]" strokeWidth={1.5} />
          <span className="flex-1 text-left">Workflows</span>
          <ChevronRight
            className={`h-3.5 w-3.5 transition-transform ${
              workflowsOpen ? "rotate-90" : ""
            }`}
          />
        </button>
        {workflowsOpen && (
          <div className="mt-1 space-y-2 pb-1">
            {workflowGroups.map((group) => (
              <div key={group.label}>
                <p className="px-5 pb-0.5 pt-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/40">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => (
                    <NavItemButton
                      key={item.key}
                      item={item}
                      onItemClick={onItemClick}
                      indent
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 border-t border-sidebar-border pt-2">
        <NavItemButton
          item={{ key: "settings", label: "Settings", icon: Settings }}
          onItemClick={onItemClick}
        />
      </div>
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
