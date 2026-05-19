import type { LucideIcon } from "lucide-react";
import { EmptyState } from "./EmptyState";

interface Props<T> {
  loading?: boolean;
  items?: T[] | null;
  emptyIcon?: LucideIcon;
  emptyTitle: string;
  emptyHelper?: string;
  renderItem: (item: T, i: number) => React.ReactNode;
  skeletonRows?: number;
}

export function DataList<T>({
  loading,
  items,
  emptyIcon,
  emptyTitle,
  emptyHelper,
  renderItem,
  skeletonRows = 4,
}: Props<T>) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: skeletonRows }).map((_, i) => (
          <div
            key={i}
            className="h-16 rounded-xl animate-pulse"
            style={{ background: "hsl(var(--m-border-subtle))" }}
          />
        ))}
      </div>
    );
  }
  if (!items || items.length === 0) {
    return <EmptyState icon={emptyIcon} title={emptyTitle} helper={emptyHelper} />;
  }
  return <ul className="space-y-2">{items.map((it, i) => renderItem(it, i))}</ul>;
}

export function Row({
  title,
  subtitle,
  right,
  onClick,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <li
      onClick={onClick}
      className={`flex items-start gap-3 p-3.5 rounded-xl transition-colors ${
        onClick ? "cursor-pointer hover:brightness-105" : ""
      }`}
      style={{
        background: "hsl(var(--m-surface))",
        border: "1px solid hsl(var(--m-border-subtle))",
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="text-callout font-medium truncate">{title}</div>
        {subtitle && (
          <div
            className="text-footnote mt-0.5 truncate"
            style={{ color: "hsl(var(--m-muted-foreground))" }}
          >
            {subtitle}
          </div>
        )}
      </div>
      {right && (
        <div className="shrink-0 text-footnote" style={{ color: "hsl(var(--m-muted-foreground))" }}>
          {right}
        </div>
      )}
    </li>
  );
}

export function Panel({ children, title, action }: { children: React.ReactNode; title?: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl m-glass p-6" style={{ boxShadow: "var(--m-shadow-sm)" }}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h2 className="text-title-3">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
