import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <div className="container">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <Link to="/" className="text-lg font-bold text-foreground">
            maroa<span className="text-primary">.ai</span>
          </Link>
          <div className="flex gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
            <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Log in</Link>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 maroa.ai. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
