import { useState, useEffect } from "react";
import { Gift, Copy, Check, ExternalLink, Users, Award, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { apiGet, apiPost } from "@/lib/apiClient";
import { ERROR_MESSAGES } from "@/lib/errorMessages";

interface ReferralStats {
  referrals_sent: number;
  converted: number;
  months_earned: number;
  referrals?: { email: string; status: string; date: string; reward?: string }[];
}

export default function ReferralPage() {
  const { user, businessId } = useAuth();
  const [copied, setCopied] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [stats, setStats] = useState<ReferralStats>({ referrals_sent: 0, converted: 0, months_earned: 0 });
  const [loading, setLoading] = useState(true);

  // Generate / fetch referral code from backend
  useEffect(() => {
    if (!businessId) return;
    const fetchReferralData = async () => {
      setLoading(true);
      try {
        try {
          const codeData = await apiPost<{ referral_code?: string; code?: string }>("/webhook/referral-create", {
            user_id: user?.id ?? "", // server expects user_id — this is auth.user.id = businesses.id
            business_id: businessId,
          });
          setReferralCode(codeData.referral_code || codeData.code || null);
        } catch { /* optional */ }

        try {
          const statsData = await apiGet<Record<string, unknown>>(`/webhook/referral-stats?business_id=${businessId}`);
          setStats({
            referrals_sent: (statsData.referrals_sent as number) ?? (statsData.total as number) ?? 0,
            converted: (statsData.converted as number) ?? 0,
            months_earned: (statsData.months_earned as number) ?? (statsData.rewards as number) ?? 0,
            referrals: (statsData.referrals as ReferralStats["referrals"]) || [],
          });
        } catch { /* optional */ }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        toast.error(ERROR_MESSAGES.LOAD_FAILED);
      }
      setLoading(false);
    };
    fetchReferralData();
  }, [businessId, user?.id]);

  // Fallback referral code from user ID if backend doesn't return one
  const code = referralCode || user?.id?.substring(0, 8) || "xxxxxxxx";
  const referralLink = `https://maroa-ai-marketing-automator.vercel.app/signup?ref=${code}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success(SUCCESS_MESSAGES.COPIED);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(
      `I replaced my $800/month marketing agency with maroa.ai for just $49/month. AI handles everything automatically. Try it free: ${referralLink}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const shareLinkedIn = () => {
    const url = encodeURIComponent(referralLink);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank");
  };

  const shareEmail = () => {
    const subject = encodeURIComponent("Try maroa.ai — AI marketing on autopilot");
    const body = encodeURIComponent(
      `Hey!\n\nI've been using maroa.ai to handle all my marketing — social media, ads, email, SEO — everything is automated by AI.\n\nIt's $49/month instead of $2,000+ for an agency. Setup takes 5 minutes.\n\nTry it free: ${referralLink}\n\nLet me know what you think!`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/10 p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15">
          <Gift className="h-8 w-8 text-primary" />
        </div>
        <h2 className="mt-4 text-2xl font-bold text-foreground">Refer & Earn</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
          Share maroa.ai with other business owners. You earn 1 free month for every person who subscribes with your link.
        </p>
      </div>

      {/* Referral Link Card */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="text-sm font-semibold text-card-foreground mb-3">Your Referral Link</h3>
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-sm text-foreground truncate font-mono">
            {referralLink}
          </div>
          <Button onClick={copyLink} variant="outline" size="sm" className="shrink-0 h-10">
            {copied ? <><Check className="mr-1.5 h-3.5 w-3.5" /> Copied</> : <><Copy className="mr-1.5 h-3.5 w-3.5" /> Copy</>}
          </Button>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button onClick={shareWhatsApp} variant="outline" className="flex-1">
            <ExternalLink className="mr-2 h-3.5 w-3.5" /> WhatsApp
          </Button>
          <Button onClick={shareLinkedIn} variant="outline" className="flex-1">
            <ExternalLink className="mr-2 h-3.5 w-3.5" /> LinkedIn
          </Button>
          <Button onClick={shareEmail} variant="outline" className="flex-1">
            <ExternalLink className="mr-2 h-3.5 w-3.5" /> Email
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 text-center">
          {loading ? (
            <Loader2 className="mx-auto h-6 w-6 text-muted-foreground animate-spin" />
          ) : (
            <p className="text-3xl font-bold text-foreground">{stats.referrals_sent}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">Referrals sent</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 text-center">
          {loading ? (
            <Loader2 className="mx-auto h-6 w-6 text-muted-foreground animate-spin" />
          ) : (
            <p className="text-3xl font-bold text-foreground">{stats.converted}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">Converted</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 text-center">
          {loading ? (
            <Loader2 className="mx-auto h-6 w-6 text-muted-foreground animate-spin" />
          ) : (
            <p className="text-3xl font-bold text-primary">{stats.months_earned}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">Months earned</p>
        </div>
      </div>

      {/* How it works */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">How it works</h3>
        <div className="space-y-4">
          {[
            { step: "1", title: "Share your link", desc: "Send your referral link to business owner friends" },
            { step: "2", title: "They sign up", desc: "They create an account and start their free trial" },
            { step: "3", title: "You earn", desc: "When they subscribe, you get 1 month free automatically" },
          ].map(s => (
            <div key={s.step} className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{s.step}</div>
              <div>
                <p className="text-sm font-medium text-foreground">{s.title}</p>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Referrals table */}
      {stats.referrals && stats.referrals.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">Your referrals</h3>
          <div className="space-y-2">
            {stats.referrals.map((r, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2.5">
                <div>
                  <p className="text-sm text-foreground">{r.email}</p>
                  <p className="text-[11px] text-muted-foreground">{new Date(r.date).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  r.status === "converted" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                }`}>
                  {r.status === "converted" ? "Converted" : "Pending"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
