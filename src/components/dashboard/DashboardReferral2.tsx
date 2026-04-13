import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Gift, Loader2, Copy, Share2, Users, DollarSign } from "lucide-react";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/lib/errorMessages";
import { apiGet, apiPost } from "@/lib/apiClient";

interface ReferralStatus {
  referral_link: string;
  stats: { sent: number; converted: number; earned: number };
  active: boolean;
}

export default function DashboardReferral2() {
  const { businessId, user, isReady } = useAuth();
  const [status, setStatus] = useState<ReferralStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [setting, setSetting] = useState(false);

  useEffect(() => {
    if (!businessId || !isReady) { setLoading(false); return; }
    const load = async () => {
      setLoading(true);
      try {
        const data = await apiGet<ReferralStatus>(`/api/referral/status/${businessId}`);
        setStatus(data);
      } catch {
        /* no referral yet */
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [businessId, isReady]);

  const handleSetup = async () => {
    if (!businessId) return;
    setSetting(true);
    try {
      const data = await apiPost<ReferralStatus>("/api/referral/setup", {
        user_id: user?.id ?? "", // server expects user_id — this is auth.user.id = businesses.id
        business_id: businessId,
      });
      setStatus(data);
      toast.success(SUCCESS_MESSAGES.GENERATED);
    } catch {
      toast.error(ERROR_MESSAGES.GENERATION_FAILED);
    } finally {
      setSetting(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(SUCCESS_MESSAGES.COPIED);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 rounded-lg border border-border bg-card animate-pulse" />
        ))}
      </div>
    );
  }

  if (!status) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <Gift className="mx-auto h-10 w-10 text-muted-foreground/30" />
        <h3 className="mt-4 text-sm font-semibold text-foreground">Set up your referral program</h3>
        <p className="mt-1.5 text-xs text-muted-foreground max-w-xs mx-auto">
          Reward customers for spreading the word about your business.
        </p>
        <Button size="sm" className="mt-4" onClick={handleSetup} disabled={setting}>
          {setting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Gift className="mr-1.5 h-3.5 w-3.5" />}
          {setting ? "Setting up..." : "Set Up Referral Program"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <Users className="mx-auto h-4 w-4 text-muted-foreground mb-1" />
          <p className="text-xl font-bold text-foreground">{status?.stats?.sent ?? 0}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Referrals Sent</p>
        </div>
        <div className="rounded-lg border border-success/20 bg-success/5 p-3 text-center">
          <Users className="mx-auto h-4 w-4 text-success mb-1" />
          <p className="text-xl font-bold text-success">{status?.stats?.converted ?? 0}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Converted</p>
        </div>
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-center">
          <DollarSign className="mx-auto h-4 w-4 text-primary mb-1" />
          <p className="text-xl font-bold text-primary">${status?.stats?.earned ?? 0}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Earned</p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <p className="text-xs text-muted-foreground mb-2">Your referral link</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded bg-muted px-3 py-2 text-xs text-foreground truncate">{status?.referral_link ?? ""}</code>
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleCopy(status?.referral_link ?? "")}>
            <Copy className="mr-1 h-3 w-3" /> Copy
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => { const link = status?.referral_link ?? ""; navigator.share?.({ url: link }).catch(() => handleCopy(link)); }}>
            <Share2 className="mr-1 h-3 w-3" /> Share
          </Button>
        </div>
      </div>
    </div>
  );
}
