import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AppShell } from "./components/shell/AppShell";

const Home = lazy(() => import("./pages/Home"));
const Modules = () => import("./pages/modules");

// Lazy wrappers — single file, named exports
const lazyNamed = (name: string) =>
  lazy(() => Modules().then((m) => ({ default: (m as any)[name] })));

const InboxPage = lazyNamed("InboxPage");
const NotificationsPage = lazyNamed("NotificationsPage");
const ContentPage = lazyNamed("ContentPage");
const ContentDetailPage = lazyNamed("ContentDetailPage");
const CalendarPage = lazyNamed("CalendarPage");
const LibraryPage = lazyNamed("LibraryPage");
const VideoPage = lazyNamed("VideoPage");
const BrandPage = lazyNamed("BrandPage");
const AdsPage = lazyNamed("AdsPage");
const CampaignDetailPage = lazyNamed("CampaignDetailPage");
const SeoPage = lazyNamed("SeoPage");
const CroPage = lazyNamed("CroPage");
const LandingPagesPage = lazyNamed("LandingPagesPage");
const LandingPageDetailPage = lazyNamed("LandingPageDetailPage");
const LeadMagnetsPage = lazyNamed("LeadMagnetsPage");
const ReferralsPage = lazyNamed("ReferralsPage");
const AudiencePage = lazyNamed("AudiencePage");
const ContactDetailPage = lazyNamed("ContactDetailPage");
const PipelinePage = lazyNamed("PipelinePage");
const EmailPage = lazyNamed("EmailPage");
const SequenceDetailPage = lazyNamed("SequenceDetailPage");
const ReviewsPage = lazyNamed("ReviewsPage");
const AnalyticsPage = lazyNamed("AnalyticsPage");
const CompetitorsPage = lazyNamed("CompetitorsPage");
const ForecastPage = lazyNamed("ForecastPage");
const BrainPage = lazyNamed("BrainPage");
const StrategyPage = lazyNamed("StrategyPage");
const IntegrationsPage = lazyNamed("IntegrationsPage");
const TeamPage = lazyNamed("TeamPage");
const BillingPage = lazyNamed("BillingPage");
const SettingsPage = lazyNamed("SettingsPage");

const Loading = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div
      className="h-6 w-6 rounded-full animate-spin"
      style={{
        border: "2px solid hsl(var(--m-border))",
        borderTopColor: "hsl(var(--m-accent))",
      }}
    />
  </div>
);

export function MaroaRoutes() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Home />} />
          <Route path="inbox" element={<InboxPage />} />
          <Route path="notifications" element={<NotificationsPage />} />

          <Route path="content" element={<ContentPage />} />
          <Route path="content/:id" element={<ContentDetailPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="library" element={<LibraryPage />} />
          <Route path="video" element={<VideoPage />} />
          <Route path="brand" element={<BrandPage />} />

          <Route path="ads" element={<AdsPage />} />
          <Route path="ads/:id" element={<CampaignDetailPage />} />
          <Route path="seo" element={<SeoPage />} />
          <Route path="cro" element={<CroPage />} />
          <Route path="landing-pages" element={<LandingPagesPage />} />
          <Route path="landing-pages/:id" element={<LandingPageDetailPage />} />
          <Route path="lead-magnets" element={<LeadMagnetsPage />} />
          <Route path="referrals" element={<ReferralsPage />} />

          <Route path="audience" element={<AudiencePage />} />
          <Route path="audience/:id" element={<ContactDetailPage />} />
          <Route path="pipeline" element={<PipelinePage />} />
          <Route path="email" element={<EmailPage />} />
          <Route path="email/:id" element={<SequenceDetailPage />} />
          <Route path="reviews" element={<ReviewsPage />} />

          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="competitors" element={<CompetitorsPage />} />
          <Route path="forecast" element={<ForecastPage />} />
          <Route path="brain" element={<BrainPage />} />
          <Route path="strategy" element={<StrategyPage />} />

          <Route path="integrations" element={<IntegrationsPage />} />
          <Route path="team" element={<TeamPage />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="settings" element={<SettingsPage />} />

          <Route path="*" element={<Navigate to="" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
