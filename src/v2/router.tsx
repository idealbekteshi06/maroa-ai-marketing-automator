import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AppShell } from "./components/shell/AppShell";

const Today = lazy(() => import("./pages/Today"));
const Content = lazy(() => import("./pages/Content"));
const Growth = lazy(() => import("./pages/Growth"));
const Brain = lazy(() => import("./pages/Brain"));
const Settings = lazy(() => import("./pages/Settings"));

const Loading = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div
      className="h-6 w-6 rounded-full animate-spin"
      style={{
        border: "2px solid hsl(var(--m-border-subtle))",
        borderTopColor: "hsl(var(--m-foreground))",
      }}
    />
  </div>
);

export function MaroaRoutes() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Today />} />
          <Route path="content" element={<Content />} />
          <Route path="growth" element={<Growth />} />
          <Route path="brain" element={<Brain />} />
          <Route path="settings" element={<Settings />} />

          {/* Legacy paths fold into the 5-section model */}
          <Route path="inbox" element={<Navigate to="/app" replace />} />
          <Route path="notifications" element={<Navigate to="/app" replace />} />
          <Route path="calendar" element={<Navigate to="/app/content" replace />} />
          <Route path="library" element={<Navigate to="/app/content" replace />} />
          <Route path="video" element={<Navigate to="/app/content" replace />} />
          <Route path="brand" element={<Navigate to="/app/settings" replace />} />
          <Route path="ads" element={<Navigate to="/app/growth" replace />} />
          <Route path="seo" element={<Navigate to="/app/growth" replace />} />
          <Route path="cro" element={<Navigate to="/app/growth" replace />} />
          <Route path="landing-pages" element={<Navigate to="/app/growth" replace />} />
          <Route path="lead-magnets" element={<Navigate to="/app/growth" replace />} />
          <Route path="referrals" element={<Navigate to="/app/growth" replace />} />
          <Route path="audience" element={<Navigate to="/app/growth" replace />} />
          <Route path="pipeline" element={<Navigate to="/app/growth" replace />} />
          <Route path="email" element={<Navigate to="/app/content" replace />} />
          <Route path="reviews" element={<Navigate to="/app/growth" replace />} />
          <Route path="analytics" element={<Navigate to="/app/growth" replace />} />
          <Route path="competitors" element={<Navigate to="/app/growth" replace />} />
          <Route path="forecast" element={<Navigate to="/app/growth" replace />} />
          <Route path="strategy" element={<Navigate to="/app/brain" replace />} />
          <Route path="integrations" element={<Navigate to="/app/settings" replace />} />
          <Route path="team" element={<Navigate to="/app/settings" replace />} />
          <Route path="billing" element={<Navigate to="/app/settings" replace />} />

          <Route path="*" element={<Navigate to="" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
