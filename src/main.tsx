import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Stale-chunk auto-recovery: after a redeploy, a client that kept an old
// index.html can fail to fetch a lazy-loaded chunk ("Failed to fetch
// dynamically imported module") when navigating in-app. Vite surfaces this
// as `vite:preloadError` — reload ONCE to pick up the fresh manifest; the
// sessionStorage guard prevents a reload loop if the failure persists (in
// that case the ErrorBoundary's "Refresh page" screen still shows).
window.addEventListener("vite:preloadError", (event) => {
  const KEY = "maroa-chunk-reload";
  if (sessionStorage.getItem(KEY)) return; // second failure — let it surface
  event.preventDefault();
  sessionStorage.setItem(KEY, String(Date.now()));
  window.location.reload();
});
// A successful load clears the guard so the NEXT deploy can auto-recover too.
window.addEventListener("load", () => {
  const KEY = "maroa-chunk-reload";
  const at = Number(sessionStorage.getItem(KEY) || 0);
  if (at && Date.now() - at > 10_000) sessionStorage.removeItem(KEY);
});

createRoot(document.getElementById("root")!).render(<App />);
