import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Share2, CheckCircle2, Facebook, Instagram, Loader2, XCircle, RefreshCw, Zap } from "lucide-react";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const META_APP_ID = "26551713411132003";
const META_PERMISSIONS = "email,public_profile,pages_show_list,pages_read_engagement,pages_manage_posts,pages_manage_engagement,pages_read_user_content,instagram_basic,instagram_content_publish,ads_read,ads_management,business_management,read_insights";

interface AccountConfig {
  name: string; color: string; dbFields: string[]; icon: React.ReactNode; type: "meta_oauth" | "manual"; comingSoon?: boolean;
}

const accounts: AccountConfig[] = [
  { name: "Facebook", color: "hsl(214, 89%, 52%)", dbFields: ["meta_access_token", "facebook_page_id"], icon: <Facebook className="h-5 w-5" />, type: "meta_oauth" },
  { name: "Instagram", color: "hsl(340, 82%, 52%)", dbFields: ["instagram_account_id", "meta_access_token"], icon: <Instagram className="h-5 w-5" />, type: "meta_oauth" },
  { name: "Google Ads", color: "hsl(217, 71%, 53%)", dbFields: ["ad_account_id", "google_ads_id"], icon: <span className="text-sm font-bold">G</span>, type: "manual" },
  { name: "TikTok", color: "hsl(0, 0%, 0%)", dbFields: ["tiktok_handle", "tiktok_username"], icon: <span className="text-sm font-bold">T</span>, type: "manual", comingSoon: true },
];

const automations = [
  { title: "Weekly posts published automatically", emoji: "📝" },
  { title: "Ad campaigns created and optimized", emoji: "📊" },
  { title: "Performance tracked daily", emoji: "📈" },
  { title: "Lookalike audiences built", emoji: "👥" },
  { title: "Comments managed by AI", emoji: "💬" },
  { title: "Monthly reports with real data", emoji: "📋" },
];

export default function DashboardSocial() {
  const { businessId, isReady } = useAuth();
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connectDialog, setConnectDialog] = useState<AccountConfig | null>(null);
  const [connectForm, setConnectForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  const fetchBusiness = useCallback(async () => {
    if (!businessId || !isReady) return;
    setLoading(true);
    const { data } = await externalSupabase.from("businesses").select("*").eq("id", businessId).maybeSingle();
    setBusiness(data); setLoading(false);
  }, [businessId, isReady]);

  useEffect(() => { fetchBusiness(); }, [fetchBusiness]);
  useEffect(() => {
    const handle = () => { if (document.visibilityState === "visible") fetchBusiness(); };
    document.addEventListener("visibilitychange", handle);
    window.addEventListener("focus", handle);
    return () => { document.removeEventListener("visibilitychange", handle); window.removeEventListener("focus", handle); };
  }, [fetchBusiness]);

  const hasValue = (v: unknown) => typeof v === "string" ? v.trim() !== "" : v != null;
  const isConnected = (a: AccountConfig) => business && a.dbFields.some(f => hasValue(business[f]));
  const connectedCount = accounts.filter(a => isConnected(a)).length;

  const handleMetaOAuth = useCallback(() => {
    const redirectUri = "https://maroa-ai-marketing-automator.lovable.app/social-callback";
    const url = `https://www.facebook.com/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${META_PERMISSIONS}&response_type=code&state=maroa_oauth`;
    localStorage.setItem("meta_oauth_business_id", businessId || "");
    window.location.href = url;
  }, [businessId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code) return;
    window.history.replaceState({}, "", window.location.pathname);
    const storedBizId = localStorage.getItem("meta_oauth_business_id") || businessId;
    if (!storedBizId) { toast.error("No business found"); return; }
    setConnecting("Facebook & Instagram");
    (async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/meta-oauth-callback`, {
          method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
          body: JSON.stringify({ code, redirect_uri: "https://maroa-ai-marketing-automator.lovable.app/social-callback" }),
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || "OAuth failed");
        const updateData: Record<string, any> = { meta_access_token: data.access_token, social_accounts_connected: true };
        if (data.page_id) updateData.facebook_page_id = data.page_id;
        if (data.instagram_account_id) updateData.instagram_account_id = data.instagram_account_id;
        await externalSupabase.from("businesses").update(updateData).eq("id", storedBizId);
        localStorage.removeItem("meta_oauth_business_id");
        await fetchBusiness();
        void fetch("https://maroa-api-production.up.railway.app/webhook/account-connected", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ business_id: storedBizId, facebook_page_id: data.page_id ?? null, meta_access_token: data.access_token }),
        }).catch(console.warn);
        toast.success("Connected!");
      } catch (err: any) { toast.error(err.message); }
      finally { setConnecting(null); }
    })();
  }, []);

  const handleConnect = (a: AccountConfig) => { if (a.type === "meta_oauth") handleMetaOAuth(); else { setConnectForm({}); setConnectDialog(a); } };

  const handleDisconnect = async (a: AccountConfig) => {
    if (!businessId) return;
    setDisconnecting(a.name);
    const update: Record<string, any> = {};
    if (a.name === "Facebook") { update.meta_access_token = null; update.facebook_page_id = null; }
    else if (a.name === "Instagram") update.instagram_account_id = null;
    else if (a.name === "Google Ads") update.ad_account_id = null;
    else if (a.name === "TikTok") update.tiktok_handle = null;
    await externalSupabase.from("businesses").update(update).eq("id", businessId);
    setDisconnecting(null);
    toast.success(`${a.name} disconnected`);
    await fetchBusiness();
  };

  const handleSaveConnection = async () => {
    if (!businessId || !connectDialog) return;
    setSaving(true);
    const update: Record<string, any> = { social_accounts_connected: true };
    if (connectDialog.name === "Google Ads") update.ad_account_id = connectForm.account_id?.trim() || "";
    else if (connectDialog.name === "TikTok") update.tiktok_handle = connectForm.handle?.trim() || "";
    await externalSupabase.from("businesses").update(update).eq("id", businessId);
    setSaving(false); toast.success(`${connectDialog.name} connected!`);
    setConnectDialog(null); await fetchBusiness();
  };

  if (loading) return <div className="grid gap-4 sm:grid-cols-2">{[1,2,3,4].map(i => <div key={i} className="h-24 rounded-lg border border-border bg-card animate-pulse" />)}</div>;

  return (
    <div className="space-y-4">
      {connecting && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <p className="text-sm font-medium text-primary">Connecting {connecting}...</p>
        </div>
      )}

      {connectedCount === 0 && !connecting && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <p className="text-sm font-medium text-primary">🔗 Connect your social accounts to unlock automatic posting and ad management.</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {accounts.map(a => {
          const connected = isConnected(a);
          return (
            <div key={a.name} className="rounded-lg border border-border bg-card p-5 shadow-meta transition-shadow hover:shadow-meta-hover">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-foreground">
                    {a.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-semibold text-foreground">{a.name}</p>
                      {a.comingSoon && <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">Coming Soon</span>}
                    </div>
                    {connected ? (
                      <p className="text-xs text-success flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Connected</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Not connected</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {connected ? (
                    <>
                      <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleConnect(a)}><RefreshCw className="mr-1 h-3 w-3" /> Reconnect</Button>
                      <Button size="sm" variant="ghost" className="h-8 text-xs text-destructive hover:text-destructive" onClick={() => handleDisconnect(a)} disabled={disconnecting === a.name}>
                        {disconnecting === a.name ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                      </Button>
                    </>
                  ) : !a.comingSoon ? (
                    <Button size="sm" className="h-8 text-xs" onClick={() => handleConnect(a)} disabled={!!connecting}>Connect</Button>
                  ) : null}
                </div>
              </div>
              {connected && a.name === "Facebook" && business?.facebook_page_id && (
                <div className="mt-3 rounded bg-muted p-2.5"><p className="text-[11px] text-muted-foreground">Page ID: {business.facebook_page_id}</p></div>
              )}
              {connected && a.name === "Instagram" && business?.instagram_account_id && (
                <div className="mt-3 rounded bg-muted p-2.5"><p className="text-[11px] text-muted-foreground">Account: {business.instagram_account_id}</p></div>
              )}
              {a.name === "Instagram" && !connected && (
                <p className="mt-3 text-[11px] text-muted-foreground">Connects through Facebook Business.</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Automations */}
      <div className="rounded-lg border border-border bg-card p-5 shadow-meta">
        <div className="flex items-center gap-2 mb-3"><Zap className="h-4 w-4 text-primary" /><h3 className="text-sm font-semibold text-foreground">What gets automated</h3></div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {automations.map(a => (
            <div key={a.title} className="flex items-center gap-3 rounded bg-muted px-3 py-2.5">
              <span className="text-base">{a.emoji}</span>
              <p className="text-xs text-foreground">{a.title}</p>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={!!connectDialog} onOpenChange={open => { if (!open) setConnectDialog(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Connect {connectDialog?.name}</DialogTitle><DialogDescription>Enter your {connectDialog?.name} details.</DialogDescription></DialogHeader>
          <div className="space-y-4 mt-4">
            {connectDialog?.name === "Google Ads" && <div><Label>Account ID</Label><Input placeholder="123-456-7890" value={connectForm.account_id ?? ""} onChange={e => setConnectForm(f => ({ ...f, account_id: e.target.value }))} className="mt-1" /></div>}
            {connectDialog?.name === "TikTok" && <div><Label>TikTok Handle</Label><Input placeholder="@yourbusiness" value={connectForm.handle ?? ""} onChange={e => setConnectForm(f => ({ ...f, handle: e.target.value }))} className="mt-1" /></div>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConnectDialog(null)}>Cancel</Button>
              <Button onClick={handleSaveConnection} disabled={saving}>{saving ? "Saving..." : "Connect"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
