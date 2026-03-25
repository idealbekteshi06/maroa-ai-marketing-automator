import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("maroa-theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("maroa-theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <Button variant="ghost" size="icon" onClick={() => setDark(!dark)} aria-label="Toggle theme" className="h-8 w-8 relative overflow-hidden">
      <Sun className={`h-4 w-4 absolute transition-all duration-300 ${dark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"}`} />
      <Moon className={`h-4 w-4 absolute transition-all duration-300 ${dark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"}`} />
    </Button>
  );
}
