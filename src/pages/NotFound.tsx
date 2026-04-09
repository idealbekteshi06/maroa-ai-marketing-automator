import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <span className="text-8xl font-bold text-muted-foreground/10">404</span>
      <h1 className="text-2xl font-bold text-foreground mt-4 mb-2">Page not found</h1>
      <p className="text-muted-foreground mb-8 max-w-sm">The page you're looking for doesn't exist.</p>
      <div className="flex gap-3">
        <Link to="/" className="flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Home className="h-4 w-4" /> Go Home
        </Link>
        <button onClick={() => window.history.back()} className="flex min-h-11 items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">
          <ArrowLeft className="h-4 w-4" /> Go Back
        </button>
      </div>
    </div>
  );
}
