import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AppShell } from "./components/shell/AppShell";

const Today = lazy(() => import("./pages/Today"));
const Studio = lazy(() => import("./pages/Studio"));
const GrowthOverview = lazy(() => import("./pages/Growth"));
const GrowthLayout = lazy(() => import("./pages/GrowthLayout"));
const Audience = lazy(() => import("./pages/Audience"));
const Content = lazy(() => import("./pages/Content"));
const Ads = lazy(() => import("./pages/Ads"));
const Settings = lazy(() => import("./pages/Settings"));
const Products = lazy(() => import("./pages/products/Products"));
const InboxPageV2 = lazy(() => import("./pages/audience/Inbox"));
const ContactsPageV2 = lazy(() => import("./pages/audience/Contacts"));
const PipelinePageV2 = lazy(() => import("./pages/audience/Pipeline"));

// Reuse existing module pages for sub-routes
const M = () => import("./pages/modules");
const ContentPage = lazy(() => M().then((m) => ({ default: m.ContentPage })));
const CalendarPage = lazy(() => M().then((m) => ({ default: m.CalendarPage })));
const LibraryPage = lazy(() => M().then((m) => ({ default: m.LibraryPage })));
const VideoPage = lazy(() => M().then((m) => ({ default: m.VideoPage })));
const BrandPage = lazy(() => M().then((m) => ({ default: m.BrandPage })));
const AdsPage = lazy(() => M().then((m) => ({ default: m.AdsPage })));
const SeoPage = lazy(() => M().then((m) => ({ default: m.SeoPage })));
const CroPage = lazy(() => M().then((m) => ({ default: m.CroPage })));
const LandingPagesPage = lazy(() => M().then((m) => ({ default: m.LandingPagesPage })));
const LeadMagnetsPage = lazy(() => M().then((m) => ({ default: m.LeadMagnetsPage })));
const ReferralsPage = lazy(() => M().then((m) => ({ default: m.ReferralsPage })));
const CompetitorsPage = lazy(() => M().then((m) => ({ default: m.CompetitorsPage })));
const AnalyticsPage = lazy(() => M().then((m) => ({ default: m.AnalyticsPage })));
const ForecastPage = lazy(() => M().then((m) => ({ default: m.ForecastPage })));
const EmailPage = lazy(() => M().then((m) => ({ default: m.EmailPage })));
const ReviewsPage = lazy(() => M().then((m) => ({ default: m.ReviewsPage })));
const IntegrationsPage = lazy(() => M().then((m) => ({ default: m.IntegrationsPage })));
const TeamPage = lazy(() => M().then((m) => ({ default: m.TeamPage })));
const BillingPage = lazy(() => M().then((m) => ({ default: m.BillingPage })));

const Loading = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="h-6 w-6 rounded-full animate-spin"
         style={{ border: "2px solid hsl(var(--m-border-subtle))",
                  borderTopColor: "hsl(var(--m-foreground))" }} />
  </div>
);

export function MaroaRoutes() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Today />} />

          {/* Content */}
          <Route path="content" element={<Content />}>
            <Route index element={<Navigate to="posts" replace />} />
            <Route path="posts" element={<ContentPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="library" element={<LibraryPage />} />
            <Route path="brand" element={<BrandPage />} />
          </Route>

          {/* Studio */}
          <Route path="studio" element={<Studio />}>
            <Route index element={<Navigate to="products" replace />} />
            <Route path="products" element={<Products />} />
            <Route path="pipeline" element={<LibraryPage />} />
            <Route path="video" element={<VideoPage />} />
          </Route>

          {/* Ads */}
          <Route path="ads" element={<Ads />}>
            <Route index element={<Navigate to="campaigns" replace />} />
            <Route path="campaigns" element={<AdsPage />} />
            <Route path="budget" element={<AdsPage />} />
            <Route path="landing-pages" element={<LandingPagesPage />} />
          </Route>

          {/* CRM */}
          <Route path="crm" element={<Audience />}>
            <Route index element={<Navigate to="inbox" replace />} />
            <Route path="inbox" element={<InboxPageV2 />} />
            <Route path="contacts" element={<ContactsPageV2 />} />
            <Route path="pipeline" element={<PipelinePageV2 />} />
            <Route path="email" element={<EmailPage />} />
            <Route path="reviews" element={<ReviewsPage />} />
          </Route>

          {/* Growth */}
          <Route path="growth" element={<Growth />}>
            <Route index element={<Navigate to="seo" replace />} />
            <Route path="seo" element={<SeoPage />} />
            <Route path="competitors" element={<CompetitorsPage />} />
            <Route path="lead-magnets" element={<LeadMagnetsPage />} />
            <Route path="referrals" element={<ReferralsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="forecast" element={<ForecastPage />} />
            <Route path="cro" element={<CroPage />} />
          </Route>

          {/* Settings */}
          <Route path="settings" element={<Settings />}>
            <Route index element={<Navigate to="profile" replace />} />
            <Route path="profile" element={<Settings />} />
            <Route path="brand" element={<BrandPage />} />
            <Route path="integrations" element={<IntegrationsPage />} />
            <Route path="autopilot" element={<Settings />} />
            <Route path="team" element={<TeamPage />} />
            <Route path="billing" element={<BillingPage />} />
            <Route path="notifications" element={<Settings />} />
          </Route>

          {/* Legacy redirects */}
          <Route path="audience" element={<Navigate to="/app/crm" replace />} />
          <Route path="audience/*" element={<Navigate to="/app/crm" replace />} />
          <Route path="studio/posts" element={<Navigate to="/app/content/posts" replace />} />
          <Route path="studio/calendar" element={<Navigate to="/app/content/calendar" replace />} />
          <Route path="studio/library" element={<Navigate to="/app/content/library" replace />} />
          <Route path="studio/brand" element={<Navigate to="/app/content/brand" replace />} />
          <Route path="growth/ads" element={<Navigate to="/app/ads/campaigns" replace />} />
          <Route path="brain" element={<Navigate to="/app" replace />} />
          <Route path="*" element={<Navigate to="" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
