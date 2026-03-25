import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";

const accounts = [
  { name: "Facebook", handle: "@bloombakery", followers: "2,341", connected: true, color: "#1877F2" },
  { name: "Instagram", handle: "@bloom.bakery", followers: "5,892", connected: true, color: "#E4405F" },
  { name: "Google Ads", handle: "Bloom Bakery", followers: "—", connected: true, color: "#4285F4" },
  { name: "TikTok", handle: "", followers: "—", connected: false, color: "#000000" },
];

export default function DashboardSocial() {
  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">Manage your connected social media accounts.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {accounts.map((a) => (
          <div key={a.name} className="flex items-center justify-between rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-card">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: a.color + "15" }}>
                <span className="text-sm font-bold" style={{ color: a.color }}>{a.name[0]}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-card-foreground">{a.name}</p>
                {a.connected ? (
                  <>
                    <p className="text-xs text-muted-foreground">{a.handle}</p>
                    <p className="text-[10px] text-muted-foreground">{a.followers} followers</p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">Not connected</p>
                )}
              </div>
            </div>
            {a.connected ? (
              <span className="rounded-full bg-success/10 px-3 py-1 text-[11px] font-medium text-success">Connected</span>
            ) : (
              <Button size="sm" className="h-8 text-xs">Connect</Button>
            )}
          </div>
        ))}
      </div>

      {/* Empty state for when no accounts are connected */}
      {accounts.every(a => !a.connected) && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/8">
            <Share2 className="h-6 w-6 text-primary" />
          </div>
          <p className="mt-5 text-base font-semibold text-foreground">Connect your social accounts</p>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Link your social media accounts so maroa.ai can post content and manage ads for you automatically.
          </p>
        </div>
      )}
    </div>
  );
}
