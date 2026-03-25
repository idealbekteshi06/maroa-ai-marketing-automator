import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="py-20 md:py-28">
      <div className="container">
        {/* CTA */}
        <div className="text-center mb-20">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Ready to put your marketing on autopilot?
          </h2>
          <div className="mt-8">
            <Link to="/signup">
              <Button variant="hero" size="xl">Start free trial</Button>
            </Link>
          </div>
        </div>

        {/* Links */}
        <div className="border-t border-border pt-8 flex flex-col items-center justify-between gap-4 md:flex-row">
          <Link to="/" className="text-sm font-semibold text-foreground">
            maroa<span className="text-primary">.ai</span>
          </Link>
          <div className="flex gap-8">
            <a href="#features" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
            <a href="#faq" className="text-xs text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
            <Link to="/login" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Log in</Link>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 maroa.ai. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
