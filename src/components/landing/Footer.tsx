import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="border-t border-border">
      {/* CTA */}
      <div className="py-16 sm:py-24 md:py-32">
        <div className="container text-center px-6">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
            Ready to put your marketing
            <br className="hidden sm:block" />
            <span className="sm:hidden"> </span>on autopilot?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base sm:text-lg text-muted-foreground">
            Join 2,000+ small businesses growing with AI.
          </p>
          <div className="mt-8 sm:mt-10 px-4 sm:px-0">
            <Link to="/signup" className="inline-block w-full sm:w-auto">
              <Button variant="hero" size="xl" className="w-full sm:w-auto">Start free trial</Button>
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">No credit card required</p>
        </div>
      </div>

      {/* Links */}
      <div className="border-t border-border py-10">
        <div className="container px-6">
          <div className="grid gap-8 sm:gap-10 grid-cols-2 sm:grid-cols-4">
            <div className="col-span-2 sm:col-span-1">
              <Link to="/" className="text-base font-bold text-foreground">
                maroa<span className="text-primary">.ai</span>
              </Link>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                AI-powered marketing for small businesses.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Product</h4>
              <ul className="mt-3 sm:mt-4 space-y-2.5 sm:space-y-3">
                <li><a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a></li>
                <li><Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link></li>
                <li><a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How it works</a></li>
                <li><a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Company</h4>
              <ul className="mt-3 sm:mt-4 space-y-2.5 sm:space-y-3">
                <li><a href="mailto:hello@maroa.ai" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Legal</h4>
              <ul className="mt-3 sm:mt-4 space-y-2.5 sm:space-y-3">
                <li><Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link></li>
                <li><Link to="/refund" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Refund Policy</Link></li>
                <li><Link to="/delete-data" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Data Deletion</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 sm:mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
            <p className="text-xs text-muted-foreground">© 2026 maroa.ai. All rights reserved.</p>
            <div className="flex gap-6">
              <Link to="/login" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Log in</Link>
              <Link to="/signup" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Sign up</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
