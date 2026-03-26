import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Share2, CheckCircle2 } from "lucide-react";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

interface AccountConfig {
  name: string;
  color: string;
  dbField: string; // field on businesses table to check connection
  tokenField?: string;
}

const accounts: AccountConfig[] = [
  { name: "Facebook", color: "#1877F2", dbField: "facebook_page_id", tokenField: "meta_access_token" },
  { name: "Instagram", color: "#E4405F", dbField: "instagram_handle" },
  { name: "Google Ads", color: "#4285F4", dbField: "google_ads_id" },
  { name: "TikTok", color: "#000000", dbField: "tiktok_handle" },
];

export default function DashboardSocial() {
  const { businessId } = useAuth();
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [connectDialog, setConnectDialog] = useState<AccountConfig | null>(null);
  const [connectForm, setConnectForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const fetchBusiness = async () => {
    if (!businessId) return;
    setLoading(true);
    const { data } = await externalSupabase
      .from("businesses")
      .select("*")
      .eq("id", businessId)
      .maybeSingle();
    setBusiness(data);
    setLoading(false);
  };

  useEffect(() => { fetchBusiness(); }, [businessId]);

  const isConnected = (account: AccountConfig) => {
    return business && business[account.dbField] && business[account.dbField] !== "";
  };

  const handleConnect = (account: AccountConfig) => {
    setConnectForm({});
    setConnectDialog(account);
  };

  const handleSaveConnection = async () => {
    if (!businessId || !connectDialog) return;
    setSaving(true);
    const updateData: Record<string, string> = {};

    if (connectDialog.name === "Facebook") {
      updateData.facebook_page_id = connectForm.page_id || "";
      updateData.meta_access_token = connectForm.access_token || "";
    } else if (connectDialog.name === "Instagram") {
      updateData.instagram_handle = connectForm.handle || "";
    } else if (connectDialog.name === "Google Ads") {
      updateData.google_ads_id = connectForm.account_id || "";
    } else if (connectDialog.name === "TikTok") {
      updateData.tiktok_handle = connectForm.handle || "";
    }

    const { error } = await externalSupabase
      .from("businesses")
      .update(updateData)
      .eq("id", businessId);

    setSaving(false);
    if (error) { toast.error("Failed to save connection"); return; }
    toast.success(`${connectDialog.name} connected!`);
    setConnectDialog(null);
    fetchBusiness();
  };

  const connectedCount = accounts.filter(a => isConnected(a)).length;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-48 rounded bg-muted animate-pulse-soft" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-20 rounded-2xl border border-border bg-card animate-pulse-soft" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        {accounts.map((a) => {
          const connected = isConnected(a);
          return (
            <div key={a.name} className="flex items-center justify-between rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-card">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: a.color + "15" }}>
                  <span className="text-sm font-bold" style={{ color: a.color }}>{a.name[0]}</span>
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
              {connected ? (
                <span className="rounded-full bg-success/10 px-3 py-1 text-[11px] font-medium text-success">Connected</span>
              ) : (
                <Button size="sm" className="h-8 text-xs" onClick={() => handleConnect(a)}>Connect</Button>
              )}
            </div>
          );
        })}
      </div>

      {connectedCount === 0 && (
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

      {/* Connect Dialog */}
      <Dialog open={!!connectDialog} onOpenChange={(open) => { if (!open) setConnectDialog(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect {connectDialog?.name}</DialogTitle>
            <DialogDescription>
              Enter your {connectDialog?.name} details to connect your account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {connectDialog?.name === "Facebook" && (
              <>
                <div><Label>Facebook Page ID</Label><Input placeholder="123456789" value={connectForm.page_id ?? ""} onChange={(e) => setConnectForm(f => ({ ...f, page_id: e.target.value }))} className="mt-1" /></div>
                <div><Label>Meta Access Token</Label><Input placeholder="EAAx..." value={connectForm.access_token ?? ""} onChange={(e) => setConnectForm(f => ({ ...f, access_token: e.target.value }))} className="mt-1" /></div>
              </>
            )}
            {connectDialog?.name === "Instagram" && (
              <div><Label>Instagram Handle</Label><Input placeholder="@yourbusiness" value={connectForm.handle ?? ""} onChange={(e) => setConnectForm(f => ({ ...f, handle: e.target.value }))} className="mt-1" /></div>
            )}
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
