import { Search, Command as CmdIcon } from "lucide-react";

interface Props {
  onOpenPalette: () => void;
}

export function Topbar({ onOpenPalette }: Props) {
  return (
    <header
      className="sticky top-0 z-30 h-14 flex items-center px-6 m-glass"
      style={{ borderBottom: "1px solid hsl(var(--m-border-subtle))" }}
    >
      <button
        onClick={onOpenPalette}
        className="flex-1 max-w-md flex items-center gap-2 px-3 h-9 rounded-xl text-subhead transition-colors"
        style={{
          background: "hsl(var(--m-surface))",
          border: "1px solid hsl(var(--m-border-subtle))",
          color: "hsl(var(--m-muted-foreground))",
        }}
      >
        <Search size={14} strokeWidth={1.5} />
        <span className="flex-1 text-left">Search or ask Maroa…</span>
        <kbd
          className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-caption"
          style={{
            background: "hsl(var(--m-surface-elevated))",
            border: "1px solid hsl(var(--m-border-subtle))",
          }}
        >
          <CmdIcon size={10} /> K
        </kbd>
      </button>
      <div className="ml-auto flex items-center gap-3">
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-footnote"
          style={{
            background: "hsl(var(--m-success) / 0.1)",
            color: "hsl(var(--m-success))",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: "hsl(var(--m-success))" }}
          />
          Autopilot
        </div>
      </div>
    </header>
  );
}
