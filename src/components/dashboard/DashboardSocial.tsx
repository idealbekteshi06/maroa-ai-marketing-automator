import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Share2, CheckCircle2, Facebook, Instagram, Loader2, XCircle, RefreshCw } from "lucide-react";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

const META_APP_ID = "26551713411132003";
const META_PERMISSIONS = ["email", "public_profile", "pages_show_list"].join(",");

interface AccountConfig {
  name: string;
  color: string;
  dbFields: string[];
  icon: React.ReactNode;
  type: "meta_oauth" | "manual";
}

const accounts: AccountConfig[] = [
  { name: "Facebook", color: "#1877F2", dbFields: ["meta_access_token", "facebook_page_id"], icon: <Facebook className="h-5 w-5" />, type: "meta_oauth" },
  { name: "Instagram", color: "#E4405F", dbFields: ["instagram_account_id", "meta_access_token"], icon: <Instagram className="h-5 w-5" />, type: "meta_oauth" },
  { name: "Google Ads", color: "#4285F4", dbFields: ["ad_account_id", "google_ads_id"], icon: <span className="text-sm font-bold">G</span>, type: "manual" },
  { name: "TikTok", color: "#000000", dbFields: ["tiktok_handle", "tiktok_username"], icon: <span className="text-sm font-bold">T</span>, type: "manual" },
];

function getRedirectUri() {
  return `${window.location.origin}/social-callback`;
}

export default function DashboardSocial() {
  const { businessId, isReady } = useAuth();
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connectDialog, setConnectDialog] = useState<AccountConfig | null>(null);
  const [connectForm, setConnectForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  const fetchBusiness = async () => {
    if (!businessId || !isReady) return;
    setLoading(true);
    const { data } = await externalSupabase.from("businesses").select("*").eq("id", businessId).maybeSingle();
    setBusiness(data);
    setLoading(false);
  };

  useEffect(() => { fetchBusiness(); }, [businessId, isReady]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchBusiness();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
    };
  }, [businessId, isReady]);

  const hasValue = (value: unknown) => {
    if (typeof value === "string") return value.trim() !== "";
    return value !== null && value !== undefined;
  };

  const isConnected = (account: AccountConfig) => {
    if (!business) return false;
    return account.dbFields.some((field) => hasValue(business[field]));
  };

  const getExistingField = (fields: string[]) => {
    if (!business) return fields[0];
    return fields.find((field) => Object.prototype.hasOwnProperty.call(business, field)) ?? fields[0];
  };

  const handleMetaOAuth = useCallback(() => {
    const redirectUri = getRedirectUri();
    const oauthUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${META_PERMISSIONS}&response_type=code`;
    localStorage.setItem("meta_oauth_business_id", businessId || "");
    window.location.href = oauthUrl;
  }, [businessId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code) return;
    window.history.replaceState({}, "", window.location.pathname);
    const storedBusinessId = localStorage.getItem("meta_oauth_business_id") || businessId;
    if (!storedBusinessId) { toast.error("No business found for OAuth callback"); return; }
    setConnecting("Facebook & Instagram");
    const exchangeToken = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const res = await fetch(`${supabaseUrl}/functions/v1/meta-oauth-callback`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${supabaseKey}` },
          body: JSON.stringify({ code, redirect_uri: getRedirectUri() }),
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || "OAuth token exchange failed");
        const updateData: Record<string, any> = { meta_access_token: data.access_token, social_accounts_connected: true };
        if (data.page_id) updateData.facebook_page_id = data.page_id;
        if (data.instagram_account_id) updateData.instagram_account_id = data.instagram_account_id;
        const { error } = await externalSupabase.from("businesses").update(updateData).eq("id", storedBusinessId);
        if (error) throw new Error("Failed to save connection");
        localStorage.removeItem("meta_oauth_business_id");
        await fetchBusiness();
        void fetch("https://ideal.app.n8n.cloud/webhook/account-connected", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ business_id: storedBusinessId, facebook_page_id: data.page_id ?? null, meta_access_token: data.access_token, ad_account_id: null }),
        }).catch(console.warn);
        toast.success("Facebook & Instagram connected successfully!");
      } catch (err: any) {
        toast.error(err.message || "Failed to connect Facebook");
      } finally { setConnecting(null); }
    };
    exchangeToken();
  }, []);

  const handleConnect = (account: AccountConfig) => {
    if (account.type === "meta_oauth") handleMetaOAuth();
    else { setConnectForm({}); setConnectDialog(account); }
  };

  const handleDisconnect = async (account: AccountConfig) => {
    if (!businessId) return;
    setDisconnecting(account.name);
    const updateData: Record<string, any> = {};
    if (account.name === "Facebook") {
      updateData.meta_access_token = null;
      updateData.facebook_page_id = null;
    } else if (account.name === "Instagram") {
      updateData.instagram_account_id = null;
    } else if (account.name === "Google Ads") {
      updateData.ad_account_id = null;
    } else if (account.name === "TikTok") {
      updateData.tiktok_handle = null;
    }
    const { error } = await externalSupabase.from("businesses").update(updateData).eq("id", businessId);
    setDisconnecting(null);
    if (error) { toast.error("Failed to disconnect"); return; }
    toast.success(`${account.name} disconnected`);
    await fetchBusiness();
  };

  const handleSaveConnection = async () => {
    if (!businessId || !connectDialog) return;
    setSaving(true);
    const updateData: Record<string, string | boolean> = { social_accounts_connected: true };
    if (connectDialog.name === "Google Ads") {
      const field = getExistingField(["ad_account_id", "google_ads_id"]);
      updateData[field] = (connectForm.account_id || "").trim();
    } else if (connectDialog.name === "TikTok") {
      const field = getExistingField(["tiktok_handle", "tiktok_username"]);
      updateData[field] = (connectForm.handle || "").trim();
    }
    const { error } = await externalSupabase.from("businesses").update(updateData).eq("id", businessId);
    setSaving(false);
    if (error) { toast.error("Failed to save connection"); return; }
    toast.success(`${connectDialog.name} connected!`);
    setConnectDialog(null);
    await fetchBusiness();
  };

  const connectedCount = accounts.filter(a => isConnected(a)).length;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-48 rounded bg-muted animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-20 rounded-2xl border border-border bg-card animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {connecting && (
        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <p className="text-sm font-medium text-primary">Connecting {connecting}...</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {accounts.map((a) => {
          const connected = isConnected(a);
          return (
            <div key={a.name} className="rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: a.color + "15" }}>
                    <span style={{ color: a.color }}>{a.icon}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-card-foreground">{a.name}</p>
                    {connected ? (
                      <p className="text-xs text-success flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Connected
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Not connected</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {connected ? (
                    <>
                      <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleConnect(a)}>
                        <RefreshCw className="mr-1 h-3 w-3" /> Reconnect
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 text-xs text-destructive hover:text-destructive" onClick={() => handleDisconnect(a)} disabled={disconnecting === a.name}>
                        {disconnecting === a.name ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" className="h-8 text-xs" onClick={() => handleConnect(a)} disabled={!!connecting}>
                      {connecting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Connect"}
                    </Button>
                  )}
                </div>
              </div>
              {/* Show extra info for connected Facebook */}
              {connected && a.name === "Facebook" && business?.facebook_page_id && (
                <div className="mt-3 rounded-lg bg-muted/50 p-3">
                  <p className="text-[10px] text-muted-foreground">Page ID: {business.facebook_page_id}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {connectedCount === 0 && !connecting && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/8">
            <Share2 className="h-7 w-7 text-primary" />
          </div>
          <h3 className="mt-5 text-lg font-semibold text-foreground">Connect your accounts to start posting automatically</h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
            maroa.ai will post to Instagram and Facebook at the perfect times for your audience every week.
          </p>
        </div>
      )}

      <Dialog open={!!connectDialog} onOpenChange={(open) => { if (!open) setConnectDialog(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect {connectDialog?.name}</DialogTitle>
            <DialogDescription>Enter your {connectDialog?.name} details to connect.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {connectDialog?.name === "Google Ads" && (
              <div><Label>Google Ads Account ID</Label><Input placeholder="123-456-7890" value={connectForm.account_id ?? ""} onChange={(e) => setConnectForm(f => ({ ...f, account_id: e.target.value }))} className="mt-1" /></div>
            )}
            {connectDialog?.name === "TikTok" && (
              <div><Label>TikTok Handle</Label><Input placeholder="@yourbusiness" value={connectForm.handle ?? ""} onChange={(e) => setConnectForm(f => ({ ...f, handle: e.target.value }))} className="mt-1" /></div>
            )}
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
