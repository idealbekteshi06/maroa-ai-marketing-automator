import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Lock } from "lucide-react";

const SECRET_CODE = "MAROA2026";

export default function Access() {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().toUpperCase() === SECRET_CODE) {
      navigate("/login");
    } else {
      setError(true);
      setTimeout(() => setError(false), 3000);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-xs text-center">
        <Link to="/" className="inline-block text-xl font-bold tracking-tight mb-8">
          maroa<span className="text-primary">.</span>ai
        </Link>

        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-base font-semibold text-foreground mb-1">Team Access</h2>
          <p className="text-xs text-muted-foreground mb-4">Enter your access code to continue</p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              value={code}
              onChange={e => { setCode(e.target.value); setError(false); }}
              placeholder="Enter access code"
              className={`w-full rounded-lg border px-4 py-3 text-sm text-center text-foreground bg-background placeholder:text-muted-foreground focus:outline-none tracking-widest uppercase ${
                error ? "border-destructive" : "border-border focus:border-primary"
              }`}
              autoFocus
            />
            {error && <p className="text-xs text-destructive">Invalid code — try again</p>}
            <button type="submit"
              className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
              Enter
            </button>
          </form>
        </div>

        <Link to="/" className="inline-block mt-6 text-xs text-muted-foreground hover:text-foreground transition-colors">← Back to home</Link>
      </div>
    </div>
  );
}
