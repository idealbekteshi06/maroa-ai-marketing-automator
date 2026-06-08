// @ts-nocheck
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle2,
  AlertTriangle,
  X,
  Facebook,
  Instagram,
  Loader2,
  XCircle,
  RefreshCw,
  Zap,
  Linkedin,
  Sparkles,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import ContentCalendar from "@/components/ContentCalendar";
import { timeAgo } from "@/lib/format";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/lib/errorMessages";
import { apiPost, apiGet } from "@/lib/apiClient";

const META_APP_ID = "26551713411132003";
const META_PERMISSIONS =
  "email,public_profile,pages_show_list,pages_read_engagement,pages_manage_posts,pages_manage_engagement,pages_read_user_content,instagram_basic,instagram_content_publish,ads_read,ads_management,business_management,read_insights";
interface AccountConfig {
  name: string;
  color: string;
  dbFields: string[];
  icon: React.ReactNode;
  type: "meta_oauth" | "google_oauth" | "coming_soon";
  comingSoon?: boolean;
  description: string;
}

const accounts: AccountConfig[] = [
  {
    name: "Facebook",
    color: "hsl(214, 89%, 52%)",
    dbFields: ["meta_access_token", "facebook_page_id"],
    icon: <Facebook className="h-5 w-5" />,
    type: "meta_oauth",
    description: "Posts + stories posted automatically",
  },
  {
    name: "Instagram",
    color: "hsl(340, 82%, 52%)",
    dbFields: ["instagram_account_id", "meta_access_token"],
    icon: <Instagram className="h-5 w-5" />,
    type: "meta_oauth",
    description: "Photos and reels posted automatically",
  },
  {
    name: "LinkedIn",
    color: "hsl(210, 80%, 42%)",
    dbFields: ["linkedin_connected", "linkedin_access_token"],
    icon: <Linkedin className="h-5 w-5" />,
    type: "coming_soon",
    comingSoon: true,
    description: "Professional posts published daily",
  },
  {
    name: "Google Ads",
    color: "hsl(217, 71%, 53%)",
    dbFields: ["ad_account_id", "google_ads_id"],
    icon: <span className="text-sm font-bold">G</span>,
    type: "google_oauth",
    description: "Search and display ads managed by AI",
  },
  {
    name: "TikTok",
    color: "hsl(0, 0%, 0%)",
    dbFields: ["tiktok_handle", "tiktok_username"],
    icon: <span className="text-sm font-bold">T</span>,
    type: "coming_soon",
    comingSoon: true,
    description: "Video scripts generated automatically",
  },
];

const automations = [
  { title: "Posts published automatically 5x per week", emoji: "\u{1F4C5}" },
  { title: "Ad campaigns created and optimized daily", emoji: "\u{1F4B0}" },
  { title: "Performance tracked and reported weekly", emoji: "\u{1F4CA}" },
  { title: "Lookalike audiences built from your customers", emoji: "\u{1F465}" },
  { title: "Comments monitored and responded to by AI", emoji: "\u{1F4AC}" },
  { title: "Monthly reports with real performance data", emoji: "\u{1F4C8}" },
];

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  pending_approval: { label: "\u26A0 Needs Review", classes: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  approved: { label: "\u2713 Approved", classes: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  published: { label: "\u2713 Published", classes: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
};

/* Maps a platform card to the live-status key from
 * GET /api/business/:businessId/integrations. TikTok isn't returned by the
 * endpoint (it's coming soon), so it has no key. */
const INTEGRATION_KEY: Record<string, string> = {
  Facebook: "meta",
  Instagram: "meta",
  "Google Ads": "google",
  LinkedIn: "linkedin",
};

/* OAuth return banner copy (?meta / ?google = connected|error|cancelled). */
function bannerFor(name: string, value: string): { tone: "success" | "error" | "warning" | "info"; message: string } {
  if (value === "connected")
    return {
      tone: "success",
      message:
        name === "Meta"
          ? "Meta connected \u2014 Maroa can now manage Facebook & Instagram."
          : "Google connected \u2014 Maroa can now manage your Google channels.",
    };
  if (value === "error") return { tone: "error", message: `We couldn't connect ${name}. Please try again.` };
  if (value === "cancelled") return { tone: "warning", message: `${name} connection was cancelled.` };
  return { tone: "info", message: `${name}: ${value}` };
}

const BANNER_CLASSES: Record<string, string> = {
  success: "border-green-500/30 bg-green-50 dark:bg-green-900/15 text-green-700 dark:text-green-300",
  error: "border-destructive/30 bg-destructive/5 text-destructive",
  warning: "border-yellow-500/30 bg-yellow-50 dark:bg-yellow-900/15 text-yellow-700 dark:text-yellow-300",
  info: "border-primary/20 bg-primary/5 text-primary",
};

export default function DashboardSocial({ oauthCode }: { oauthCode?: string | null }) {
  const { businessId, user, isReady } = useAuth();
  const [business, setBusiness] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connectDialog, setConnectDialog] = useState<AccountConfig | null>(null);
  const [connectForm, setConnectForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [recentPosts, setRecentPosts] = useState<Array<Record<string, unknown>>>([]);
  const [generating, setGenerating] = useState(false);
  const [integrations, setIntegrations] = useState<Array<Record<string, unknown>>>([]);
  const [recommended, setRecommended] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  /* ---- Fetch business ---- */
  const fetchBusiness = useCallback(async () => {
    if (!businessId || !isReady) { setLoading(false); return; }
    setLoading(true);
    const { data } = await externalSupabase
      .from("businesses")
      .select("*")
      .eq("id", businessId)
      .maybeSingle();
    setBusiness(data);
    setLoading(false);
  }, [businessId, isReady]);

  useEffect(() => {
    fetchBusiness();
  }, [fetchBusiness]);

  /* ---- Fetch recent posts ---- */
  const fetchRecentPosts = useCallback(async () => {
    if (!businessId) return;
    const { data } = await externalSupabase
      .from("generated_content")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(10);
    setRecentPosts(data || []);
  }, [businessId]);

  useEffect(() => {
    fetchRecentPosts();
  }, [fetchRecentPosts]);

  /* ---- Helpers ---- */
  const hasValue = (v: unknown) => (typeof v === "string" ? v.trim() !== "" : v != null);

  const integrationFor = (a: AccountConfig) =>
    integrations.find((i) => i?.key === INTEGRATION_KEY[a.name]);

  const isConnected = (a: AccountConfig) => {
    // Live status (GET /api/business/:id/integrations) is the source of truth;
    // fall back to the businesses row for legacy connections.
    if (integrationFor(a)?.connected) return true;
    if (!business) return false;
    if (a.name === "LinkedIn") {
      return business.linkedin_connected === true || !!business.linkedin_access_token;
    }
    return a.dbFields.some((f) => hasValue(business[f]));
  };

  const connectedCount = accounts.filter((a) => isConnected(a)).length;

  const connectedPlatforms = accounts.filter((a) => isConnected(a) && !a.comingSoon);

  /* ---- Live integration status (B) ---- */
  const loadIntegrations = useCallback(async () => {
    if (!businessId || !isReady) return;
    try {
      const data = await apiGet<{ integrations?: Array<Record<string, unknown>>; recommended_action?: string | null }>(
        `/api/business/${businessId}/integrations`,
      );
      setIntegrations(Array.isArray(data?.integrations) ? data.integrations : []);
      setRecommended(data?.recommended_action ?? null);
    } catch {
      setIntegrations([]);
    }
  }, [businessId, isReady]);

  useEffect(() => { loadIntegrations(); }, [loadIntegrations]);

  /* ---- OAuth return banner (?meta / ?google = connected|error|cancelled) ---- */
  const metaResult = searchParams.get("meta");
  const googleResult = searchParams.get("google");
  const banner = metaResult
    ? bannerFor("Meta", metaResult)
    : googleResult
      ? bannerFor("Google", googleResult)
      : null;
  useEffect(() => {
    if (banner?.tone === "success") loadIntegrations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [banner?.tone]);
  const dismissBanner = () => {
    setSearchParams((prev) => {
      prev.delete("meta");
      prev.delete("google");
      return prev;
    }, { replace: true });
  };

  /* ---- Connect via backend OAuth (A) — full-page nav with a fresh JWT ----
   * Meta + Google go through ${VITE_API_BASE}/webhook/oauth/{provider}/start.
   * The JWT rides the query string because a redirect can't set an
   * Authorization header. LinkedIn + TikTok are "coming soon" (their backend
   * redirect URIs are pinned to a legacy domain), so no working button shows. */
  const startBackendOAuth = useCallback(async (provider: "meta" | "google") => {
    if (!businessId) {
      toast.error("Still loading your account — try again in a moment.");
      return;
    }
    setConnecting(provider === "meta" ? "Facebook & Instagram" : "Google");
    try {
      const { data } = await externalSupabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        toast.error("Your session has expired. Please sign in again.");
        setConnecting(null);
        return;
      }
      const base = (import.meta.env.VITE_API_BASE || "https://maroa-api-production.up.railway.app").replace(/\/+$/, "");
      window.location.assign(
        `${base}/webhook/oauth/${provider}/start?businessId=${encodeURIComponent(businessId)}&token=${encodeURIComponent(token)}`,
      );
    } catch {
      toast.error("Couldn't start the connection. Please try again.");
      setConnecting(null);
    }
  }, [businessId]);

  /* ---- Connect handler ---- */
  const handleConnect = (a: AccountConfig) => {
    if (a.type === "meta_oauth") startBackendOAuth("meta");
    else if (a.type === "google_oauth") startBackendOAuth("google");
    // coming_soon (LinkedIn, TikTok): no working button is shown
  };

  /* ---- Disconnect handler ---- */
  const handleDisconnect = async (a: AccountConfig) => {
    if (!businessId) return;
    setDisconnecting(a.name);
    const update: Record<string, unknown> = {};
    if (a.name === "Facebook") {
      update.meta_access_token = null;
      update.facebook_page_id = null;
    } else if (a.name === "Instagram") {
      update.instagram_account_id = null;
    } else if (a.name === "LinkedIn") {
      update.linkedin_connected = null;
      update.linkedin_access_token = null;
    } else if (a.name === "Google Ads") {
      update.ad_account_id = null;
    } else if (a.name === "TikTok") {
      update.tiktok_handle = null;
    }
    await externalSupabase.from("businesses").update(update).eq("id", businessId);
    setDisconnecting(null);
    toast.success(SUCCESS_MESSAGES.SAVED);
    await fetchBusiness();
  };

  /* ---- Save manual connection ---- */
  const handleSaveConnection = async () => {
    if (!businessId || !connectDialog) return;
    setSaving(true);
    const update: Record<string, unknown> = { social_accounts_connected: true };
    if (connectDialog.name === "Google Ads")
      update.ad_account_id = connectForm.account_id?.trim() || "";
    else if (connectDialog.name === "TikTok")
      update.tiktok_handle = connectForm.handle?.trim() || "";
    await externalSupabase.from("businesses").update(update).eq("id", businessId);
    setSaving(false);
    toast.success(SUCCESS_MESSAGES.SAVED);
    setConnectDialog(null);
    await fetchBusiness();
  };

  /* ---- Generate post ---- */
  const handleGeneratePost = async () => {
    if (!businessId) return;
    setGenerating(true);
    try {
      await apiPost("/webhook/instant-content", {
        user_id: user?.id ?? "", // server expects user_id — this is auth.user.id = businesses.id
        business_id: businessId,
        email: user?.email,
      });
      toast.success(SUCCESS_MESSAGES.GENERATED);
      await fetchRecentPosts();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : ERROR_MESSAGES.GENERATION_FAILED);
    } finally {
      setGenerating(false);
    }
  };

  /* ---- Render helpers ---- */
  const getConnectedLabel = (name: string) => {
    if (name === "Facebook") return "\u2713 Facebook Page connected";
    if (name === "Instagram") return "\u2713 Instagram Account connected";
    if (name === "LinkedIn") return "\u2713 LinkedIn Page connected";
    return "\u2713 Connected";
  };

  const getInitials = (caption: string) => {
    const words = (caption || "P").trim().split(/\s+/);
    return (words[0]?.[0] || "P").toUpperCase();
  };

  const platformPillColor = (name: string) => {
    if (name === "Facebook") return "bg-blue-600 text-white";
    if (name === "Instagram") return "bg-pink-500 text-white";
    if (name === "LinkedIn") return "bg-blue-700 text-white";
    return "bg-gray-500 text-white";
  };

  /* ---- Loading skeleton ---- */
  if (loading)
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-28 rounded-lg border border-border bg-card animate-pulse" />
        ))}
      </div>
    );

  return (
    <div className="space-y-6">
      {/* OAuth return banner */}
      {banner && (
        <div className={`flex items-start gap-3 rounded-lg border p-4 ${BANNER_CLASSES[banner.tone]}`} role="status">
          {banner.tone === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0" />
          ) : banner.tone === "error" ? (
            <XCircle className="h-5 w-5 shrink-0" />
          ) : (
            <AlertTriangle className="h-5 w-5 shrink-0" />
          )}
          <p className="text-sm font-medium flex-1">{banner.message}</p>
          <button onClick={dismissBanner} aria-label="Dismiss" className="opacity-70 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Connecting banner */}
      {connecting && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <p className="text-sm font-medium text-primary">Connecting {connecting}...</p>
        </div>
      )}

      {/* No connections prompt */}
      {connectedCount === 0 && !connecting && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <p className="text-sm font-medium text-primary">
            Connect your social accounts to unlock automatic posting and ad management.
          </p>
          {recommended && (
            <p className="text-xs text-muted-foreground mt-1">{recommended}</p>
          )}
        </div>
      )}

      {/* ==================== GENERATE POST SECTION ==================== */}
      {connectedPlatforms.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Generate New Post
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                AI creates content for all connected platforms
              </p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {connectedPlatforms.map((p) => (
                  <span
                    key={p.name}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${platformPillColor(p.name)}`}
                  >
                    {p.name}
                  </span>
                ))}
              </div>
            </div>
            <Button
              size="lg"
              className="shrink-0"
              onClick={handleGeneratePost}
              disabled={generating}
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  AI is writing your post...
                </>
              ) : (
                "Generate Now"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ==================== PLATFORM CARDS ==================== */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((a) => {
          const connected = isConnected(a);

          return (
            <div
              key={a.name}
              className={`rounded-lg border bg-card p-5 shadow-sm transition-shadow hover:shadow-md ${
                connected ? "border-l-[3px] border-l-green-500 border-t border-r border-b border-t-border border-r-border border-b-border" : ""
              } ${isTikTok && !connected ? "border-dashed" : "border-border"}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-white"
                    style={{ backgroundColor: a.color }}
                  >
                    {a.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{a.name}</p>
                      {a.comingSoon && (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          Coming Soon
                        </span>
                      )}
                    </div>
                    {connected ? (
                      <div>
                        <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="h-3 w-3" />
                          {getConnectedLabel(a.name)}
                        </p>
                        {(a.name === "Facebook" || a.name === "Instagram" || a.name === "LinkedIn") && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Posting automatically
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex items-center gap-1.5">
                {connected ? (
                  <>
                    {(a.type === "meta_oauth" || a.type === "google_oauth") && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => handleConnect(a)}
                        disabled={!!connecting}
                      >
                        <RefreshCw className="mr-1 h-3 w-3" /> Reconnect
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-xs text-destructive hover:text-destructive"
                      onClick={() => handleDisconnect(a)}
                      disabled={disconnecting === a.name}
                    >
                      {disconnecting === a.name ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </>
                ) : a.comingSoon ? (
                  <Button size="sm" variant="secondary" className="h-8 text-xs" disabled>
                    Coming soon
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => handleConnect(a)}
                    disabled={!!connecting}
                  >
                    Connect
                  </Button>
                )}
              </div>

              {/* Instagram hint */}
              {a.name === "Instagram" && !connected && (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Connects through Facebook Business.
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* ==================== CONTENT CALENDAR ==================== */}
      <ContentCalendar businessId={businessId} />

      {/* ==================== RECENT POSTS ==================== */}
      {recentPosts.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground mb-4">Recent Posts</h3>
          <div className="space-y-3">
            {recentPosts.map((post) => {
              const status = STATUS_CONFIG[post.status] || STATUS_CONFIG.pending_approval;
              return (
                <div
                  key={post.id}
                  className="flex items-center gap-3 rounded-lg border border-border p-3"
                >
                  {/* Thumbnail */}
                  {post.image_url ? (
                    <img
                      src={post.image_url}
                      alt=""
                      className="h-12 w-12 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-lg text-white text-sm font-bold shrink-0"
                      style={{
                        backgroundColor:
                          post.platform === "instagram"
                            ? "hsl(340, 82%, 52%)"
                            : post.platform === "linkedin"
                            ? "hsl(210, 80%, 42%)"
                            : "hsl(214, 89%, 52%)",
                      }}
                    >
                      {getInitials(post.caption || post.content || "")}
                    </div>
                  )}

                  {/* Caption */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground line-clamp-2">
                      {post.caption || post.content || "Untitled post"}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {timeAgo(post.created_at)}
                    </p>
                  </div>

                  {/* Status badge */}
                  {status && (
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${status.classes}`}
                    >
                      {status.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== AUTOMATIONS ==================== */}
      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            Everything Your AI Handles Automatically
          </h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          You set it up once. AI does the rest.
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {automations.map((a) => (
            <div
              key={a.title}
              className="flex items-center gap-3 rounded-lg bg-muted px-3 py-2.5"
            >
              <span className="text-base">{a.emoji}</span>
              <p className="text-xs text-foreground">{a.title}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ==================== MANUAL CONNECT DIALOG ==================== */}
      <Dialog
        open={!!connectDialog}
        onOpenChange={(open) => {
          if (!open) setConnectDialog(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect {connectDialog?.name}</DialogTitle>
            <DialogDescription>Enter your {connectDialog?.name} details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {connectDialog?.name === "Google Ads" && (
              <div>
                <Label>Account ID</Label>
                <Input
                  placeholder="123-456-7890"
                  value={connectForm.account_id ?? ""}
                  onChange={(e) =>
                    setConnectForm((f) => ({ ...f, account_id: e.target.value }))
                  }
                  className="mt-1"
                />
              </div>
            )}
            {connectDialog?.name === "TikTok" && (
              <div>
                <Label>TikTok Handle</Label>
                <Input
                  placeholder="@yourbusiness"
                  value={connectForm.handle ?? ""}
                  onChange={(e) =>
                    setConnectForm((f) => ({ ...f, handle: e.target.value }))
                  }
                  className="mt-1"
                />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConnectDialog(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveConnection} disabled={saving}>
                {saving ? "Saving..." : "Connect"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}