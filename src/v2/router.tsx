import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AppShell } from "./components/shell/AppShell";

const Home = lazy(() => import("./pages/Home"));
const Stub = lazy(() => import("./pages/ModuleStub"));

const stub = (title: string, subtitle?: string) => <Stub title={title} subtitle={subtitle} />;

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

/** Maroa shell routes, mounted under /app/* by App.tsx */
export function MaroaRoutes() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Home />} />
          <Route path="inbox" element={stub("Inbox", "Conversations across every platform.")} />
          <Route path="notifications" element={stub("Notifications")} />

          <Route path="content" element={stub("Content Studio", "Generate, score, approve, publish.")} />
          <Route path="content/:id" element={stub("Content")} />
          <Route path="calendar" element={stub("Calendar")} />
          <Route path="library" element={stub("Library")} />
          <Route path="video" element={stub("Video Studio")} />
          <Route path="brand" element={stub("Brand DNA")} />

          <Route path="ads" element={stub("Ads")} />
          <Route path="ads/:id" element={stub("Campaign")} />
          <Route path="seo" element={stub("SEO")} />
          <Route path="cro" element={stub("CRO")} />
          <Route path="landing-pages" element={stub("Landing Pages")} />
          <Route path="landing-pages/:id" element={stub("Landing editor")} />
          <Route path="lead-magnets" element={stub("Lead Magnets")} />
          <Route path="referrals" element={stub("Referrals")} />

          <Route path="audience" element={stub("CRM")} />
          <Route path="audience/:id" element={stub("Contact")} />
          <Route path="pipeline" element={stub("Pipeline")} />
          <Route path="email" element={stub("Email Sequences")} />
          <Route path="email/:id" element={stub("Sequence")} />
          <Route path="reviews" element={stub("Reviews")} />

          <Route path="analytics" element={stub("Analytics")} />
          <Route path="competitors" element={stub("Competitors")} />
          <Route path="forecast" element={stub("Forecasting")} />
          <Route path="brain" element={stub("AI Brain")} />
          <Route path="strategy" element={stub("Strategy")} />

          <Route path="integrations" element={stub("Integrations")} />
          <Route path="team" element={stub("Team")} />
          <Route path="team/workspaces" element={stub("Workspaces")} />
          <Route path="team/white-label" element={stub("White-label")} />
          <Route path="billing" element={stub("Billing")} />
          <Route path="settings" element={stub("Settings")} />

          <Route path="*" element={<Navigate to="" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
