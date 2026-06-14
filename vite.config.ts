import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const RAILWAY_DEFAULT = "https://maroa-api-production.up.railway.app";

// https://vitejs.dev/config/
/** Trim whitespace and strip accidental surrounding quotes from an env value. */
const cleanEnv = (v?: string) => (v ?? "").trim().replace(/^['"]+|['"]+$/g, "").trim();

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.VITE_API_BASE || RAILWAY_DEFAULT;

  // Bridge the Supabase creds a Vercel project may carry under un-prefixed or
  // legacy names into the VITE_-prefixed names the client reads. Vite only
  // exposes VITE_*-prefixed vars to the browser bundle, so a correctly-set but
  // differently-named var (e.g. SUPABASE_URL / SUPABASE_ANON_KEY injected by the
  // Supabase↔Vercel integration) is otherwise silently ignored and the app falls
  // back to the built-in project. Writing the resolved value back to process.env
  // (before Vite computes import.meta.env) feeds Vite's native exposure path.
  // Public publishable values only — never a service-role key.
  const resolveUrl = (...vals: Array<string | undefined>) => {
    const c = vals.map(cleanEnv).filter(Boolean);
    return c.find((v) => v.startsWith("https://")) ?? c[0] ?? "";
  };
  const resolveKey = (...vals: Array<string | undefined>) => {
    const c = vals.map(cleanEnv).filter(Boolean);
    return c.find((v) => v.length > 20) ?? c[0] ?? "";
  };
  const supabaseUrl = resolveUrl(
    env.VITE_SUPABASE_URL, env.VITE_PUBLIC_SUPABASE_URL,
    env.SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_URL,
  );
  const supabaseKey = resolveKey(
    env.VITE_SUPABASE_PUBLISHABLE_KEY, env.VITE_SUPABASE_ANON_KEY, env.VITE_PUBLIC_SUPABASE_ANON_KEY,
    env.SUPABASE_PUBLISHABLE_KEY, env.SUPABASE_ANON_KEY, env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  if (supabaseUrl) process.env.VITE_SUPABASE_URL = supabaseUrl;
  if (supabaseKey) process.env.VITE_SUPABASE_PUBLISHABLE_KEY = supabaseKey;

  return {
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api": { target: apiTarget, changeOrigin: true, secure: true },
      "/webhook": { target: apiTarget, changeOrigin: true, secure: true },
      "/meta-oauth-exchange": { target: apiTarget, changeOrigin: true, secure: true },
      "/linkedin-oauth-start": { target: apiTarget, changeOrigin: true, secure: true },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-ui": ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu", "@radix-ui/react-tooltip", "@radix-ui/react-popover", "@radix-ui/react-tabs", "@radix-ui/react-accordion"],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-charts": ["recharts"],
          "vendor-supabase": ["@supabase/supabase-js"],
        },
      },
    },
  },
};
});
