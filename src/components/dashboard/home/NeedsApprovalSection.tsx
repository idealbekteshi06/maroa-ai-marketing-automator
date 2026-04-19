import { FileText, Image, Target } from "lucide-react";

export interface ApprovalItem {
  id: string;
  title: string;
  subtitle: string;
  type: "post" | "creative" | "ad";
  urgency: "urgent" | "today" | "this_week";
}

const TYPE_ICONS = { post: FileText, creative: Image, ad: Target };
const URGENCY_STYLES = {
  urgent: "bg-red-50 text-red-600 border-red-200",
  today: "bg-amber-50 text-amber-600 border-amber-200",
  this_week: "bg-gray-50 text-gray-500 border-gray-200",
};
const URGENCY_LABELS = { urgent: "Urgent", today: "Today", this_week: "This week" };

interface NeedsApprovalSectionProps {
  items: ApprovalItem[];
  onReview: (id: string) => void;
  onApproveAll: () => void;
  oldestAge?: string;
}

export default function NeedsApprovalSection({ items, onReview, onApproveAll, oldestAge }: NeedsApprovalSectionProps) {
  if (items.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Needs your approval</h3>
        <span className="text-[13px] text-muted-foreground">
          {items.length} item{items.length !== 1 ? "s" : ""}{oldestAge ? ` · oldest ${oldestAge}` : ""}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {items.slice(0, 3).map((item) => {
          const Icon = TYPE_ICONS[item.type] || FileText;
          return (
            <div key={item.id} className="relative rounded-2xl border-l-[3px] border-l-amber-400 bg-amber-50/50 p-5 dark:bg-amber-950/20">
              <div className={`absolute right-4 top-4 rounded-full border px-2 py-0.5 text-[10px] font-medium ${URGENCY_STYLES[item.urgency]}`}>
                {URGENCY_LABELS[item.urgency]}
              </div>
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/30">
                <Icon className="h-4 w-4" />
              </div>
              <div className="text-[15px] font-semibold text-foreground">{item.title}</div>
              <div className="mt-1 text-[13px] text-muted-foreground">{item.subtitle}</div>
              <div className="mt-4 flex gap-2">
                <button onClick={() => onReview(item.id)} className="rounded-full bg-[var(--brand)] px-4 py-1.5 text-[13px] font-medium text-white transition-all hover:bg-[var(--brand-hover)]">
                  Review
                </button>
                <button onClick={onApproveAll} className="rounded-full px-3 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground">
                  Approve all
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
