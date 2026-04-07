import { X } from "lucide-react";
import { useEffect, useCallback } from "react";

interface KeyboardShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

const shortcuts = [
  { category: "Navigation", items: [
    { keys: ["G", "D"], label: "Go to Mission Control" },
    { keys: ["G", "S"], label: "Go to Social" },
    { keys: ["G", "C"], label: "Go to Content" },
    { keys: ["G", "R"], label: "Go to CRM" },
    { keys: ["G", "E"], label: "Go to Email" },
    { keys: ["G", "A"], label: "Go to Ads" },
    { keys: ["G", "T"], label: "Go to Settings" },
  ]},
  { category: "Actions", items: [
    { keys: ["\u2318", "K"], label: "Open AI Chat" },
    { keys: ["?"], label: "Show shortcuts" },
    { keys: ["Esc"], label: "Close panel / modal" },
  ]},
];

function Key({ children }: { children: string }) {
  return (
    <kbd className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-md border border-border bg-muted px-1.5 text-[11px] font-mono font-medium text-muted-foreground shadow-sm">
      {children}
    </kbd>
  );
}

export default function KeyboardShortcutsModal({ open, onClose }: KeyboardShortcutsModalProps) {
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    if (open) document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, handleEscape]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-foreground">Keyboard Shortcuts</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        {shortcuts.map(group => (
          <div key={group.category} className="mb-4 last:mb-0">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{group.category}</h3>
            <div className="space-y-2">
              {group.items.map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{item.label}</span>
                  <div className="flex items-center gap-1">
                    {item.keys.map((k, i) => (
                      <span key={i} className="flex items-center gap-1">
                        {i > 0 && <span className="text-[10px] text-muted-foreground">+</span>}
                        <Key>{k}</Key>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
