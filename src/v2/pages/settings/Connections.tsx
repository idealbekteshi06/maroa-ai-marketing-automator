/**
 * Connections — OAuth connect + live status (PR #20 A + B).
 *
 * A. Connect:
 *    - Meta + Google → a FULL-PAGE navigation (not fetch) to
 *        ${VITE_API_BASE}/webhook/oauth/{meta|google}/start?businessId=<ID>&token=<JWT>
 *      The token rides in the query string because a redirect can't set an
 *      Authorization header; we fetch a FRESH Supabase session at click time.
 *    - LinkedIn + TikTok → "Coming soon": their backend redirect URIs are
 *      hard-coded to a legacy domain, so we never render a working button.
 *    - On return the backend redirects to /settings/connections?meta=…|?google=…;
 *      we surface a success / error / cancelled banner.
 *
 * B. Live status: GET /api/business/:businessId/integrations (no hard-coded
 *    "Not connected"). Real data or an honest empty/error hint — never mocked.
 */
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  Brain,
  Briefcase,
  CheckCircle2,
  Clapperboard,
  Globe,
  Mail,
  Music2,
  Plug,
  Share2,
  TriangleAlert,
  X,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { PageHeader } from "../../components/common/PageHeader";
import { Btn, Pill } from "../../components/common/Card";
import { EmptyState } from "../../components/common/EmptyState";
import {
  useIntegrations,
  type Integration,
} from "../../lib/api/hooks/useIntegrations";

const API_BASE = (
  (import.meta.env.VITE_API_BASE as string | undefined)?.trim() ||
  "https://maroa-api-production.up.railway.app"
).replace(/\/+$/, "");

type ConnectMode = "oauth" | "soon" | "managed";

interface ChannelDef {
  key: string;
  label: string;
  blurb: string;
  icon: LucideIcon;
  mode: ConnectMode;
  group: "Ad & social channels" | "Maroa services";
}

/**
 * Display registry. STATUS comes from the live endpoint (merged by key);
 * the connect AFFORDANCE comes from here so we never offer a button the
 * backend can't honour.
 */
const CHANNELS: ChannelDef[] = [
  { key: "meta", label: "Meta (Facebook & Instagram)", blurb: "Pages, Instagram, and ad account.", icon: Share2, mode: "oauth", group: "Ad & social channels" },
  { key: "google", label: "Google", blurb: "Google Ads, Business Profile, and Search Console.", icon: Globe, mode: "oauth", group: "Ad & social channels" },
  { key: "linkedin", label: "LinkedIn", blurb: "Company page posting.", icon: Briefcase, mode: "soon", group: "Ad & social channels" },
  { key: "tiktok", label: "TikTok", blurb: "Organic posting and ads.", icon: Music2, mode: "soon", group: "Ad & social channels" },
  { key: "email", label: "Email", blurb: "Transactional and lifecycle sends.", icon: Mail, mode: "managed", group: "Maroa services" },
  { key: "higgsfield", label: "Higgsfield", blurb: "AI video and image generation.", icon: Clapperboard, mode: "managed", group: "Maroa services" },
  { key: "brand_memory", label: "Brand memory", blurb: "What Maroa has learned about your brand.", icon: Brain, mode: "managed", group: "Maroa services" },
];

const MUTED = "hsl(var(--m-muted-foreground))";

/* ── OAuth start ─────────────────────────────────────────────────── */

async function startOAuth(provider: "meta" | "google", businessId: string) {
  // Fetch a FRESH session token at click time (auto-refreshes if needed).
  const { data } = await externalSupabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    throw new Error("Your session has expired. Please sign in again.");
  }
  const url =
    `${API_BASE}/webhook/oauth/${provider}/start` +
    `?businessId=${encodeURIComponent(businessId)}` +
    `&token=${encodeURIComponent(token)}`;
  // Full-page navigation — a redirect can't carry an Authorization header.
  window.location.assign(url);
}

/* ── Return banner ───────────────────────────────────────────────── */

type BannerTone = "success" | "error" | "warning" | "info";

interface BannerModel {
  tone: BannerTone;
  message: string;
}

function bannerFor(name: string, value: string): BannerModel {
  switch (value) {
    case "connected":
      return {
        tone: "success",
        message:
          name === "Meta"
            ? "Meta connected — Maroa can now manage Facebook & Instagram."
            : "Google connected — Maroa can now read and manage your Google channels.",
      };
    case "error":
      return { tone: "error", message: `We couldn't connect ${name}. Please try again.` };
    case "cancelled":
      return { tone: "warning", message: `${name} connection was cancelled.` };
    default:
      return { tone: "info", message: `${name}: ${value}` };
  }
}

const BANNER_STYLE: Record<BannerTone, { bg: string; border: string; fg: string; Icon: LucideIcon }> = {
  success: { bg: "hsl(var(--m-success) / 0.1)", border: "hsl(var(--m-success) / 0.3)", fg: "hsl(var(--m-success))", Icon: CheckCircle2 },
  error: { bg: "hsl(var(--m-destructive) / 0.08)", border: "hsl(var(--m-destructive) / 0.25)", fg: "hsl(var(--m-destructive))", Icon: XCircle },
  warning: { bg: "hsl(var(--m-warning) / 0.12)", border: "hsl(var(--m-warning) / 0.3)", fg: "hsl(var(--m-warning))", Icon: TriangleAlert },
  info: { bg: "hsl(var(--m-accent) / 0.08)", border: "hsl(var(--m-accent) / 0.25)", fg: "hsl(var(--m-accent))", Icon: Plug },
};

/* ── Status pill ─────────────────────────────────────────────────── */

function statusPill(int: Integration | undefined) {
  if (int?.connected && int.status === "healthy") return <Pill tone="success">Connected</Pill>;
  if (int?.status === "degraded") return <Pill tone="warning">Needs attention</Pill>;
  return <Pill tone="muted">Not connected</Pill>;
}

/* ── Page ────────────────────────────────────────────────────────── */

export default function ConnectionsPage() {
  const { businessId } = useAuth();
  const { data, isLoading } = useIntegrations(businessId);
  const [params, setParams] = useSearchParams();
  const queryClient = useQueryClient();

  const metaV = params.get("meta");
  const googleV = params.get("google");
  const banner: BannerModel | null = metaV
    ? bannerFor("Meta", metaV)
    : googleV
      ? bannerFor("Google", googleV)
      : null;

  // After a successful return, pull fresh status so the list reflects it.
  useEffect(() => {
    if (banner?.tone === "success" && businessId) {
      queryClient.invalidateQueries({ queryKey: ["integrations", businessId] });
    }
  }, [banner?.tone, businessId, queryClient]);

  function dismissBanner() {
    const next = new URLSearchParams(params);
    next.delete("meta");
    next.delete("google");
    setParams(next, { replace: true });
  }

  const byKey = new Map((data?.integrations ?? []).map((i) => [i.key, i]));
  const loadFailed = !isLoading && data && data.ok === false;
  const groups: ChannelDef["group"][] = ["Ad & social channels", "Maroa services"];

  function renderAction(def: ChannelDef, int: Integration | undefined) {
    if (def.mode === "managed") {
      return <span className="text-caption" style={{ color: MUTED }}>Managed by Maroa</span>;
    }
    if (def.mode === "soon") {
      // If a legacy connection already exists, the status pill says so; don't
      // offer a broken connect button on top of it.
      if (int?.connected) return null;
      return (
        <Btn variant="secondary" disabled>
          Coming soon
        </Btn>
      );
    }
    // oauth (meta | google)
    const connected = !!int?.connected && int?.status === "healthy";
    return (
      <Btn
        variant={connected ? "ghost" : "primary"}
        onClick={() => {
          if (!businessId) return;
          void startOAuth(def.key as "meta" | "google", businessId).catch(() => {
            // Surface failure honestly via the error banner.
            setParams({ [def.key]: "error" }, { replace: true });
          });
        }}
      >
        {connected ? "Reconnect" : "Connect"}
      </Btn>
    );
  }

  return (
    <div>
      <PageHeader
        title="Connections"
        subtitle="Connect your channels so Maroa can read live metrics and act on your behalf."
      />

      {banner && (
        <div
          className="mb-6 rounded-xl px-4 py-3 flex items-start gap-3"
          style={{ background: BANNER_STYLE[banner.tone].bg, border: `1px solid ${BANNER_STYLE[banner.tone].border}` }}
          role="status"
        >
          {(() => {
            const Icon = BANNER_STYLE[banner.tone].Icon;
            return <Icon size={17} className="mt-0.5 shrink-0" style={{ color: BANNER_STYLE[banner.tone].fg }} />;
          })()}
          <div className="flex-1 text-[13px]">{banner.message}</div>
          <button onClick={dismissBanner} aria-label="Dismiss" className="opacity-60 hover:opacity-100 transition-opacity">
            <X size={14} />
          </button>
        </div>
      )}

      {!isLoading && (
        <div className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
          <span className="font-medium">
            {data?.connected_count ?? 0} connected
          </span>
          {data?.recommended_action && (
            <span style={{ color: MUTED }}>· {data.recommended_action}</span>
          )}
        </div>
      )}

      {loadFailed && (
        <div className="mb-6 rounded-xl px-4 py-3 text-[12.5px]" style={{ background: "hsl(var(--m-warning) / 0.1)", border: "1px solid hsl(var(--m-warning) / 0.25)", color: MUTED }}>
          We couldn't load live status right now. You can still start a connection below — status will refresh once it's back.
        </div>
      )}

      <div className="space-y-8">
        {groups.map((group) => {
          const defs = CHANNELS.filter((c) => c.group === group);
          return (
            <section key={group}>
              <h2 className="text-[12px] font-semibold uppercase tracking-[0.06em] mb-2" style={{ color: MUTED }}>
                {group}
              </h2>
              <div className="rounded-xl overflow-hidden" style={{ border: "1px solid hsl(var(--m-border-subtle))", background: "hsl(var(--m-surface-elevated))" }}>
                {defs.map((def, idx) => {
                  const int = byKey.get(def.key);
                  const Icon = def.icon;
                  return (
                    <div
                      key={def.key}
                      className="flex items-center gap-3 px-4 py-3.5"
                      style={{ borderBottom: idx === defs.length - 1 ? "none" : "1px solid hsl(var(--m-border-subtle))" }}
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: "hsl(var(--m-surface))", border: "1px solid hsl(var(--m-border-subtle))" }}
                      >
                        <Icon size={16} strokeWidth={1.75} style={{ color: "hsl(var(--m-foreground))" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13.5px] font-medium truncate">{def.label}</div>
                        <div className="text-[11.5px] truncate" style={{ color: MUTED }}>
                          {int?.detail || def.blurb}
                        </div>
                      </div>
                      {isLoading ? (
                        <div className="h-5 w-20 rounded-md animate-pulse" style={{ background: "hsl(var(--m-border-subtle))" }} />
                      ) : (
                        <>
                          {statusPill(int)}
                          <div className="ml-1">{renderAction(def, int)}</div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {!isLoading && data && data.ok && data.integrations.length === 0 && (
        <div className="mt-8">
          <EmptyState
            icon={Plug}
            title="Nothing connected yet"
            helper="Connect Meta or Google to unlock live ad metrics, analytics snapshots, and competitor signals."
          />
        </div>
      )}
    </div>
  );
}
