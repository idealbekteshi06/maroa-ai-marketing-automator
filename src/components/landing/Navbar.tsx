import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled
        ? "bg-background/80 backdrop-blur-xl border-b border-border shadow-card"
        : "bg-transparent"
    }`}>
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="text-base font-bold tracking-tight text-foreground">
          maroa<span className="text-primary">.ai</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors duration-200">Features</a>
          <a href="#how-it-works" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors duration-200">How it works</a>
          <a href="#pricing" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors duration-200">Pricing</a>
          <a href="#faq" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors duration-200">FAQ</a>
          <ThemeToggle />
          <Link to="/login">
            <Button variant="ghost" size="sm" className="text-[13px]">Log in</Button>
          </Link>
          <Link to="/signup">
            <Button size="sm" className="text-[13px] h-9 rounded-full px-5">Start free trial</Button>
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => setOpen(!open)} className="h-9 w-9">
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="bg-background border-b border-border px-6 pb-6 pt-2 md:hidden animate-fade-in">
          <div className="flex flex-col gap-4">
            <a href="#features" onClick={() => setOpen(false)} className="text-sm text-muted-foreground py-2">Features</a>
            <a href="#how-it-works" onClick={() => setOpen(false)} className="text-sm text-muted-foreground py-2">How it works</a>
            <a href="#pricing" onClick={() => setOpen(false)} className="text-sm text-muted-foreground py-2">Pricing</a>
            <a href="#faq" onClick={() => setOpen(false)} className="text-sm text-muted-foreground py-2">FAQ</a>
            <Link to="/login" onClick={() => setOpen(false)}>
              <Button variant="outline" className="w-full">Log in</Button>
            </Link>
            <Link to="/signup" onClick={() => setOpen(false)}>
              <Button className="w-full">Start free trial</Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
