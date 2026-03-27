import { useState } from "react";
import { Gift, Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function ReferralPage() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const refCode = user?.id?.substring(0, 8) || "xxxxxxxx";
  const referralLink = `https://maroa-ai-marketing-automator.lovable.app/signup?ref=${refCode}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareTwitter = () => {
    const text = encodeURIComponent(
      `I replaced my $800/month marketing agency with @maroa_ai for just $49/month. AI handles everything automatically. Try it free: ${referralLink}`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  };

  const shareLinkedIn = () => {
    const url = encodeURIComponent(referralLink);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank");
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
          Share maroa.ai with other business owners. You earn 1 free month for every person who signs up with your link.
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
          <Button onClick={shareTwitter} variant="outline" className="flex-1">
            <ExternalLink className="mr-2 h-3.5 w-3.5" /> Share on Twitter
          </Button>
          <Button onClick={shareLinkedIn} variant="outline" className="flex-1">
            <ExternalLink className="mr-2 h-3.5 w-3.5" /> Share on LinkedIn
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 text-center">
          <p className="text-3xl font-bold text-foreground">0</p>
          <p className="mt-1 text-xs text-muted-foreground">Referrals made</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 text-center">
          <p className="text-3xl font-bold text-foreground">0</p>
          <p className="mt-1 text-xs text-muted-foreground">Free months earned</p>
        </div>
      </div>
    </div>
  );
}
