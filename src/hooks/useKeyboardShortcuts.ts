import { useEffect, useRef } from "react";

interface ShortcutCallbacks {
  onNavigate: (tab: string) => void;
  onToggleHelp: () => void;
  onEscape: () => void;
  onToggleChat: () => void;
}

export function useKeyboardShortcuts({ onNavigate, onToggleHelp, onEscape, onToggleChat }: ShortcutCallbacks) {
  const gPressedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable;

      // Cmd/Ctrl + K always works
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onToggleChat();
        return;
      }

      // Escape always works
      if (e.key === "Escape") {
        onEscape();
        return;
      }

      // Skip shortcuts when typing
      if (isInput) return;

      // ? for help
      if (e.key === "?") {
        e.preventDefault();
        onToggleHelp();
        return;
      }

      // G-prefix shortcuts
      if (e.key === "g" || e.key === "G") {
        gPressedRef.current = true;
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => { gPressedRef.current = false; }, 500);
        return;
      }

      if (gPressedRef.current) {
        gPressedRef.current = false;
        clearTimeout(timerRef.current);
        const keyMap: Record<string, string> = {
          d: "overview",
          s: "social",
          c: "content",
          r: "crm",
          e: "email",
          t: "settings",
          a: "ads",
          i: "inbox",
        };
        const tab = keyMap[e.key.toLowerCase()];
        if (tab) {
          e.preventDefault();
          onNavigate(tab);
        }
      }
    };

    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      clearTimeout(timerRef.current);
    };
  }, [onNavigate, onToggleHelp, onEscape, onToggleChat]);
}
