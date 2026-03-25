import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="border-t border-border">
      {/* CTA */}
      <div className="py-24 md:py-32">
        <div className="container text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-5xl">
            Ready to put your marketing
            <br />
            on autopilot?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-lg text-muted-foreground">
            Join 2,000+ small businesses growing with AI.
          </p>
          <div className="mt-10">
            <Link to="/signup">
              <Button variant="hero" size="xl">Start free trial</Button>
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">No credit card required</p>
        </div>
      </div>

      {/* Links */}
      <div className="border-t border-border py-10">
        <div className="container">
          <div className="grid gap-10 sm:grid-cols-4">
            <div>
              <Link to="/" className="text-base font-bold text-foreground">
                maroa<span className="text-primary">.ai</span>
              </Link>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                AI-powered marketing for small businesses.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Product</h4>
              <ul className="mt-4 space-y-3">
                <li><a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How it works</a></li>
                <li><a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Company</h4>
              <ul className="mt-4 space-y-3">
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Careers</a></li>
                <li><a href="mailto:support@maroa.ai" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Legal</h4>
              <ul className="mt-4 space-y-3">
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
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
