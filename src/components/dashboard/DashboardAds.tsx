const campaigns = [
  { name: "Summer Sale Promo", status: "active", spend: "$142", ctr: "2.8%", roas: "3.1x" },
  { name: "New Menu Launch", status: "scaling", spend: "$89", ctr: "3.4%", roas: "4.2x" },
  { name: "Brand Awareness Q1", status: "paused", spend: "$210", ctr: "1.2%", roas: "1.8x" },
];

const statusBadge: Record<string, string> = {
  active: "bg-primary/10 text-primary",
  scaling: "bg-success/10 text-success",
  paused: "bg-destructive/10 text-destructive",
};

export default function DashboardAds() {
  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <p className="text-sm text-muted-foreground">Your AI-managed ad campaigns.</p>
      <div className="space-y-3">
        {campaigns.map((c) => (
          <div key={c.name} className="grid grid-cols-2 gap-4 rounded-2xl bg-card p-5 sm:grid-cols-5 sm:items-center">
            <div className="col-span-2 sm:col-span-1">
              <p className="font-medium text-card-foreground">{c.name}</p>
              <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusBadge[c.status]}`}>{c.status}</span>
            </div>
            <div><p className="text-xs text-muted-foreground">Spend</p><p className="font-medium text-card-foreground">{c.spend}</p></div>
            <div><p className="text-xs text-muted-foreground">CTR</p><p className="font-medium text-card-foreground">{c.ctr}</p></div>
            <div><p className="text-xs text-muted-foreground">ROAS</p><p className="font-medium text-card-foreground">{c.roas}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
}
