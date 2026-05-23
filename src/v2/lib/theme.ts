import { useEffect, useState, useCallback } from "react";

export type ThemeMode = "light" | "dark" | "system";
const KEY = "maroa-theme";

function systemDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}
function apply(mode: ThemeMode) {
  const dark = mode === "dark" || (mode === "system" && systemDark());
  document.documentElement.classList.toggle("dark", dark);
}

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "light";
    return (localStorage.getItem(KEY) as ThemeMode) ?? "light";
  });
  useEffect(() => {
    apply(mode);
    try { localStorage.setItem(KEY, mode); } catch { /* ignore */ }
  }, [mode]);
  useEffect(() => {
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const h = () => apply("system");
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, [mode]);
  const toggle = useCallback(() => {
    setMode((m) => (m === "dark" ? "light" : "dark"));
  }, []);
  return { mode, setMode, toggle, isDark: mode === "dark" || (mode === "system" && systemDark()) };
}
