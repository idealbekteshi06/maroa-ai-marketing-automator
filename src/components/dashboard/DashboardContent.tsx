import { Button } from "@/components/ui/button";

const content = [
  { id: 1, caption: "Fresh croissants, straight from the oven 🥐", platform: "Instagram", status: "published", date: "Mar 23" },
  { id: 2, caption: "Our new spring menu is here! Come try our lavender latte ☕", platform: "Facebook", status: "approved", date: "Mar 24" },
  { id: 3, caption: "Behind the scenes: Our bakers start at 4am to bring you freshness", platform: "Instagram", status: "pending", date: "Mar 25" },
  { id: 4, caption: "Weekend special: Buy 2 pastries, get 1 free! 🎉", platform: "Facebook", status: "pending", date: "Mar 26" },
  { id: 5, caption: "Meet our team! Say hi to Maria, our head baker 👩‍🍳", platform: "TikTok", status: "pending", date: "Mar 27" },
];

const statusColors: Record<string, string> = {
  published: "bg-success/10 text-success",
  approved: "bg-primary/10 text-primary",
  pending: "bg-muted text-muted-foreground",
};

export default function DashboardContent() {
  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">AI-generated content ready for your review.</p>
        <Button size="sm">Generate new</Button>
      </div>

      <div className="space-y-3">
        {content.map((c) => (
          <div key={c.id} className="flex flex-col gap-4 rounded-2xl bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium text-card-foreground">{c.caption}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{c.platform}</span> · <span>{c.date}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${statusColors[c.status]}`}>
                {c.status === "pending" ? "Pending approval" : c.status}
              </span>
              {c.status === "pending" && (
                <>
                  <Button size="sm">Approve</Button>
                  <Button variant="outline" size="sm">Edit</Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {content.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-medium text-foreground">No content yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Click "Generate new" to create your first AI content.</p>
        </div>
      )}
    </div>
  );
}
