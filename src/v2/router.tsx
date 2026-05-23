import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AppShell } from "./components/shell/AppShell";

const Today = lazy(() => import("./pages/Today"));
const Studio = lazy(() => import("./pages/Studio"));
const Growth = lazy(() => import("./pages/Growth"));
const Audience = lazy(() => import("./pages/Audience"));
const Settings = lazy(() => import("./pages/Settings"));
const Products = lazy(() => import("./pages/products/Products"));

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
const InboxPage = lazy(() => M().then((m) => ({ default: m.InboxPage })));
const AudiencePageMod = lazy(() => M().then((m) => ({ default: m.AudiencePage })));
const PipelinePage = lazy(() => M().then((m) => ({ default: m.PipelinePage })));
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

          {/* Studio */}
          <Route path="studio" element={<Studio />}>
            <Route index element={<Navigate to="posts" replace />} />
            <Route path="posts" element={<ContentPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="library" element={<LibraryPage />} />
            <Route path="video" element={<VideoPage />} />
            <Route path="products" element={<Products />} />
            <Route path="brand" element={<BrandPage />} />
          </Route>

          {/* Growth */}
          <Route path="growth" element={<Growth />}>
            <Route index element={<Navigate to="ads" replace />} />
            <Route path="ads" element={<AdsPage />} />
            <Route path="seo" element={<SeoPage />} />
            <Route path="cro" element={<CroPage />} />
            <Route path="landing-pages" element={<LandingPagesPage />} />
            <Route path="lead-magnets" element={<LeadMagnetsPage />} />
            <Route path="referrals" element={<ReferralsPage />} />
            <Route path="competitors" element={<CompetitorsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="forecast" element={<ForecastPage />} />
          </Route>

          {/* Audience */}
          <Route path="audience" element={<Audience />}>
            <Route index element={<Navigate to="inbox" replace />} />
            <Route path="inbox" element={<InboxPage />} />
            <Route path="contacts" element={<AudiencePageMod />} />
            <Route path="pipeline" element={<PipelinePage />} />
            <Route path="email" element={<EmailPage />} />
            <Route path="reviews" element={<ReviewsPage />} />
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
          <Route path="content" element={<Navigate to="/app/studio/posts" replace />} />
          <Route path="brain" element={<Navigate to="/app" replace />} />
          <Route path="*" element={<Navigate to="" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
