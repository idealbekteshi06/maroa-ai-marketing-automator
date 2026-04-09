import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle2,
  Facebook,
  Instagram,
  Loader2,
  XCircle,
  RefreshCw,
  Zap,
  Linkedin,
  Sparkles,
} from "lucide-react";
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

const META_APP_ID = "26551713411132003";
const META_PERMISSIONS =
  "email,public_profile,pages_show_list,pages_read_engagement,pages_manage_posts,pages_manage_engagement,pages_read_user_content,instagram_basic,instagram_content_publish,ads_read,ads_management,business_management,read_insights";
const API_BASE = import.meta.env.VITE_API_BASE;

interface AccountConfig {
  name: string;
  color: string;
  dbFields: string[];
  icon: React.ReactNode;
  type: "meta_oauth" | "linkedin_oauth" | "manual";
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
    type: "linkedin_oauth",
    description: "Professional posts published daily",
  },
  {
    name: "Google Ads",
    color: "hsl(217, 71%, 53%)",
    dbFields: ["ad_account_id", "google_ads_id"],
    icon: <span className="text-sm font-bold">G</span>,
    type: "manual",
    description: "Search and display ads managed by AI",
  },
  {
    name: "TikTok",
    color: "hsl(0, 0%, 0%)",
    dbFields: ["tiktok_handle", "tiktok_username"],
    icon: <span className="text-sm font-bold">T</span>,
    type: "manual",
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

export default function DashboardSocial({ oauthCode }: { oauthCode?: string | null }) {
  const { businessId, user, isReady } = useAuth();
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connectDialog, setConnectDialog] = useState<AccountConfig | null>(null);
  const [connectForm, setConnectForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);

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

  const isConnected = (a: AccountConfig) => {
    if (!business) return false;
    if (a.name === "LinkedIn") {
      return business.linkedin_connected === true || !!business.linkedin_access_token;
    }
    return a.dbFields.some((f) => hasValue(business[f]));
  };

  const connectedCount = accounts.filter((a) => isConnected(a)).length;

  const connectedPlatforms = accounts.filter((a) => isConnected(a) && !a.comingSoon);

  /* ---- Meta OAuth ---- */
  const handleMetaOAuth = useCallback(() => {
    const redirectUri = "https://maroa-ai-marketing-automator.lovable.app/social-callback";
    const url = `https://www.facebook.com/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${META_PERMISSIONS}&response_type=code&state=maroa_oauth`;
    localStorage.setItem("meta_oauth_business_id", businessId || "");
    window.location.href = url;
  }, [businessId]);

  /* ---- OAuth callback ---- */
  useEffect(() => {
    const code = oauthCode;
    if (!code) return;
    const storedBizId = localStorage.getItem("meta_oauth_business_id") || businessId;
    if (!storedBizId) {
      toast.error("No business found");
      return;
    }
    setConnecting("Facebook & Instagram");
    (async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/meta-oauth-callback`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              code,
              redirect_uri: "https://maroa-ai-marketing-automator.lovable.app/social-callback",
            }),
          }
        );
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || "OAuth failed");
        const updateData: Record<string, any> = {
          meta_access_token: data.access_token,
          social_accounts_connected: true,
        };
        if (data.page_id) updateData.facebook_page_id = data.page_id;
        if (data.instagram_account_id) updateData.instagram_account_id = data.instagram_account_id;
        await externalSupabase.from("businesses").update(updateData).eq("id", storedBizId);
        localStorage.removeItem("meta_oauth_business_id");
        await fetchBusiness();
        void fetch("https://maroa-api-production.up.railway.app/webhook/account-connected", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            business_id: storedBizId,
            facebook_page_id: data.page_id ?? null,
            meta_access_token: data.access_token,
          }),
        }).catch(console.warn);
        toast.success("Connected!");
      } catch (err: any) {
        toast.error(err.message);
      } finally {
        setConnecting(null);
      }
    })();
  }, [oauthCode]);

  /* ---- Connect handler ---- */
  const handleConnect = (a: AccountConfig) => {
    if (a.type === "meta_oauth") {
      handleMetaOAuth();
    } else if (a.type === "linkedin_oauth") {
      window.location.href = API_BASE + "/linkedin-oauth-start?business_id=" + businessId;
    } else {
      setConnectForm({});
      setConnectDialog(a);
    }
  };

  /* ---- Disconnect handler ---- */
  const handleDisconnect = async (a: AccountConfig) => {
    if (!businessId) return;
    setDisconnecting(a.name);
    const update: Record<string, any> = {};
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
    toast.success(`${a.name} disconnected`);
    await fetchBusiness();
  };

  /* ---- Save manual connection ---- */
  const handleSaveConnection = async () => {
    if (!businessId || !connectDialog) return;
    setSaving(true);
    const update: Record<string, any> = { social_accounts_connected: true };
    if (connectDialog.name === "Google Ads")
      update.ad_account_id = connectForm.account_id?.trim() || "";
    else if (connectDialog.name === "TikTok")
      update.tiktok_handle = connectForm.handle?.trim() || "";
    await externalSupabase.from("businesses").update(update).eq("id", businessId);
    setSaving(false);
    toast.success(`${connectDialog.name} connected!`);
    setConnectDialog(null);
    await fetchBusiness();
  };

  /* ---- Generate post ---- */
  const handleGeneratePost = async () => {
    if (!businessId) return;
    setGenerating(true);
    try {
      const res = await fetch(`${API_BASE}/webhook/instant-content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: businessId, email: user?.email }),
      });
      if (!res.ok) throw new Error("Failed to generate post");
      toast.success("\u2713 Post created! Check Content tab");
      await fetchRecentPosts();
    } catch (err: any) {
      toast.error(err.message || "Failed to generate post");
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
          const isTikTok = a.name === "TikTok";
          const isGoogleAds = a.name === "Google Ads";

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
                      {isTikTok && (
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
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={() => handleConnect(a)}
                    >
                      <RefreshCw className="mr-1 h-3 w-3" /> Reconnect
                    </Button>
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
                ) : isTikTok ? (
                  <p className="text-[11px] italic text-muted-foreground">
                    TikTok posting available after app review
                  </p>
                ) : isGoogleAds ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 text-xs"
                    onClick={() =>
                      window.dispatchEvent(
                        new CustomEvent("dashboard-navigate", { detail: "settings" })
                      )
                    }
                  >
                    Configure in Settings
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
