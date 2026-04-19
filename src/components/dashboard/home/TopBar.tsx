import { Search, Bell } from "lucide-react";

interface TopBarProps {
  pendingCount: number;
  agentCount: number;
  onOpenPalette: () => void;
  onScrollToFeed: () => void;
  onOpenApprovals: () => void;
}

export default function TopBar({ pendingCount, agentCount, onOpenPalette, onScrollToFeed, onOpenApprovals }: TopBarProps) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <h2 className="text-2xl font-semibold">Home</h2>
      <div className="flex-1" />

      {/* Search / ⌘K trigger */}
      <button
        onClick={onOpenPalette}
        className="hidden items-center gap-2 rounded-full border border-[var(--border-default)] bg-white px-4 py-2 text-sm text-muted-foreground transition-all hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-xs)] sm:flex"
        style={{ width: 280 }}
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search or jump to...</span>
        <kbd className="flex h-[18px] items-center rounded border border-[var(--border-default)] bg-[var(--bg-subtle)] px-1.5 text-[11px] font-medium text-muted-foreground" style={{ borderBottomWidth: 2 }}>
          ⌘K
        </kbd>
      </button>

      {/* AI status pill */}
      <button
        onClick={onScrollToFeed}
        className="flex items-center gap-2 rounded-full bg-[var(--brand-subtle)] py-1.5 pl-3 pr-4 text-[13px] font-medium text-[var(--brand)] transition-colors hover:bg-[var(--brand-dim)]"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--brand)] opacity-40" style={{ animationDuration: "2s" }} />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--brand)]" />
        </span>
        AI active · {agentCount} agent{agentCount !== 1 ? "s" : ""} working
      </button>

      {/* Approvals bell */}
      <button
        onClick={onOpenApprovals}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-[var(--bg-muted)] hover:text-foreground"
        aria-label="Approvals"
      >
        <Bell className="h-[18px] w-[18px]" />
        {pendingCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
            {pendingCount > 9 ? "9+" : pendingCount}
          </span>
        )}
      </button>
    </div>
  );
}
