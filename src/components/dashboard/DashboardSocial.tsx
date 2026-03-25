import { Button } from "@/components/ui/button";

const accounts = [
  { name: "Facebook", handle: "@bloombakery", followers: "2,341", connected: true },
  { name: "Instagram", handle: "@bloom.bakery", followers: "5,892", connected: true },
  { name: "Google Ads", handle: "Bloom Bakery", followers: "—", connected: true },
  { name: "TikTok", handle: "", followers: "—", connected: false },
];

export default function DashboardSocial() {
  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <p className="text-sm text-muted-foreground">Manage your connected social media accounts.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {accounts.map((a) => (
          <div key={a.name} className="flex items-center justify-between rounded-2xl bg-card p-5">
            <div>
              <p className="font-medium text-card-foreground">{a.name}</p>
              {a.connected ? (
                <>
                  <p className="text-sm text-muted-foreground">{a.handle}</p>
                  <p className="text-xs text-muted-foreground">{a.followers} followers</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Not connected</p>
              )}
            </div>
            {a.connected ? (
              <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">Connected</span>
            ) : (
              <Button size="sm">Connect</Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
