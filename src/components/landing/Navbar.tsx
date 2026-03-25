import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-background/70 backdrop-blur-xl backdrop-saturate-150">
      <div className="container flex h-12 items-center justify-between">
        <Link to="/" className="text-sm font-semibold tracking-tight text-foreground">
          maroa<span className="text-primary">.ai</span>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          <a href="#features" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Features</a>
          <a href="#how-it-works" className="text-xs text-muted-foreground hover:text-foreground transition-colors">How it works</a>
          <a href="#pricing" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
          <ThemeToggle />
          <Link to="/login">
            <Button variant="ghost" size="sm" className="text-xs">Log in</Button>
          </Link>
          <Link to="/signup">
            <Button size="sm" className="text-xs h-8">Start free trial</Button>
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => setOpen(!open)} className="h-8 w-8">
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="bg-background px-6 pb-6 pt-2 md:hidden">
          <div className="flex flex-col gap-4">
            <a href="#features" onClick={() => setOpen(false)} className="text-sm text-muted-foreground">Features</a>
            <a href="#how-it-works" onClick={() => setOpen(false)} className="text-sm text-muted-foreground">How it works</a>
            <a href="#pricing" onClick={() => setOpen(false)} className="text-sm text-muted-foreground">Pricing</a>
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
