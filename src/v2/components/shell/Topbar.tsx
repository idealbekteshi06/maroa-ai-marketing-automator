import { Bell, Sparkles } from "lucide-react";
import { useLocation } from "react-router-dom";
import { NAV } from "./nav";

interface Props {
  onOpenPalette: () => void;
}

function titleFor(pathname: string): string {
  const seg = pathname.replace(/^\/app\/?/, "").split("/")[0];
  const match = NAV.find((n) => n.to === seg);
  if (match) return match.label;
  if (!seg) return "Today";
  return seg.charAt(0).toUpperCase() + seg.slice(1);
}

export function Topbar({ onOpenPalette }: Props) {
  const { pathname } = useLocation();
  const title = titleFor(pathname);
  const date = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <header
      className="sticky top-0 z-30 h-14 flex items-center gap-4 px-6"
      style={{
        background: "hsl(var(--m-background) / 0.85)",
        backdropFilter: "saturate(180%) blur(20px)",
        WebkitBackdropFilter: "saturate(180%) blur(20px)",
        borderBottom: "1px solid hsl(var(--m-border-subtle))",
      }}
    >
      <div className="flex items-baseline gap-3 min-w-0">
        <h1 className="text-[15px] font-semibold truncate">{title}</h1>
        <span
          className="text-[12px] hidden sm:inline"
          style={{ color: "hsl(var(--m-muted-foreground))" }}
        >
          {date}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={onOpenPalette}
          className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium transition-colors hover:bg-[hsl(var(--m-surface-elevated))]"
          style={{
            border: "1px solid hsl(var(--m-border-subtle))",
            color: "hsl(var(--m-foreground))",
          }}
        >
          <Sparkles size={13} strokeWidth={1.75} />
          Ask Maroa
          <kbd
            className="ml-1 px-1 rounded text-[10px] font-mono"
            style={{
              background: "hsl(var(--m-surface-elevated))",
              color: "hsl(var(--m-muted-foreground))",
            }}
          >
            ⌘K
          </kbd>
        </button>
        <button
          className="h-8 w-8 inline-flex items-center justify-center rounded-lg transition-colors hover:bg-[hsl(var(--m-surface-elevated))]"
          style={{ color: "hsl(var(--m-muted-foreground))" }}
          aria-label="Notifications"
        >
          <Bell size={15} strokeWidth={1.75} />
        </button>
      </div>
    </header>
  );
}
