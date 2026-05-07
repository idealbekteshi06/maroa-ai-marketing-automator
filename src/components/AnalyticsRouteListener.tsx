import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { pageview } from "@/lib/analytics";

/**
 * Mounted once inside <BrowserRouter> to capture SPA pageviews. PostHog's
 * built-in capture_pageview is disabled (it only fires on hard navigation),
 * so we hook into react-router's location and emit $pageview manually.
 */
export default function AnalyticsRouteListener() {
  const location = useLocation();

  useEffect(() => {
    const path = `${location.pathname}${location.search}`;
    pageview(path);
  }, [location.pathname, location.search]);

  return null;
}
