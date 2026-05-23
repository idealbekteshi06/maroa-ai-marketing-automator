import { Bell, Sparkles, Sun, Moon } from "lucide-react";
import { useLocation } from "react-router-dom";
import { findSection } from "./nav";
import { useTheme } from "@/v2/lib/theme";

interface Props { onOpenPalette: () => void; }

export function Topbar({ onOpenPalette }: Props) {
  const { pathname } = useLocation();
  const section = findSection(pathname);
  const title = section?.label ?? "Today";
  const { isDark, toggle } = useTheme();

  return (
    <header
      className="sticky top-0 z-30 h-14 flex items-center gap-3 px-4 sm:px-6"
      style={{
        background: "hsl(var(--m-background) / 0.85)",
        backdropFilter: "saturate(180%) blur(20px)",
        WebkitBackdropFilter: "saturate(180%) blur(20px)",
        borderBottom: "1px solid hsl(var(--m-border-subtle))",
      }}
    >
      <div className="md:hidden flex items-center gap-2">
        <div className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-semibold"
             style={{ background: "hsl(var(--m-accent))", color: "hsl(var(--m-accent-foreground))" }}>M</div>
      </div>
      <h1 className="text-[15px] font-semibold truncate">{title}</h1>

      <div className="ml-auto flex items-center gap-1.5">
        <button onClick={onOpenPalette}
                className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium transition-colors hover:bg-[hsl(var(--m-surface-elevated))]"
                style={{ border: "1px solid hsl(var(--m-border-subtle))" }}
                aria-label="Open command palette">
          <Sparkles size={13} strokeWidth={1.75} />
          Ask Maroa
          <kbd className="ml-1 px-1 rounded text-[10px] font-mono"
               style={{ background: "hsl(var(--m-surface-elevated))", color: "hsl(var(--m-muted-foreground))" }}>⌘K</kbd>
        </button>
        <button onClick={toggle}
                className="h-8 w-8 inline-flex items-center justify-center rounded-lg transition-colors hover:bg-[hsl(var(--m-surface-elevated))]"
                style={{ color: "hsl(var(--m-muted-foreground))" }}
                aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}>
          {isDark ? <Sun size={15} strokeWidth={1.75} /> : <Moon size={15} strokeWidth={1.75} />}
        </button>
        <button className="h-8 w-8 inline-flex items-center justify-center rounded-lg transition-colors hover:bg-[hsl(var(--m-surface-elevated))]"
                style={{ color: "hsl(var(--m-muted-foreground))" }}
                aria-label="Notifications">
          <Bell size={15} strokeWidth={1.75} />
        </button>
      </div>
    </header>
  );
}
