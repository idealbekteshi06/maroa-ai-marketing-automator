import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { apiGet } from "@/lib/apiClient";
import { Loader2, CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface DeletionStatus {
  status: "pending" | "processing" | "complete" | "not_found";
  requested_at?: string;
  completed_at?: string;
  email?: string;
}

const STATUS_CONFIG = {
  pending: { icon: Clock, color: "text-amber-500", bg: "bg-amber-50", label: "Pending", desc: "Your request has been received and is queued for processing." },
  processing: { icon: Loader2, color: "text-blue-500", bg: "bg-blue-50", label: "Processing", desc: "We are actively deleting your data. This typically completes within 30 days." },
  complete: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50", label: "Complete", desc: "All your data has been permanently deleted from maroa.ai." },
  not_found: { icon: AlertCircle, color: "text-muted-foreground", bg: "bg-muted", label: "Not Found", desc: "We couldn't find a deletion request with this code." },
};

export default function DataDeletionStatus() {
  const [params] = useSearchParams();
  const code = params.get("code") || params.get("confirmation_code") || "";
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DeletionStatus | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!code) return;
    setLoading(true);
    setError(false);
    apiGet<DeletionStatus>(`/api/data-deletion-status?code=${encodeURIComponent(code)}`)
      .then(setResult)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [code]);

  const status = result?.status || "not_found";
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.not_found;
  const Icon = cfg.icon;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-xl font-bold text-foreground">
            maroa<span className="text-primary">.ai</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-xl px-6 py-20">
        <h1 className="text-3xl font-bold text-foreground">Data Deletion Status</h1>

        {!code ? (
          <div className="mt-8 rounded-2xl border border-border bg-card p-8">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
            <p className="mt-4 text-[15px] text-foreground font-medium">No confirmation code provided</p>
            <p className="mt-2 text-sm text-muted-foreground">
              To check your data deletion status, use the link provided by Meta when you requested deletion, or check your email for the confirmation code we sent.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              You can also submit a new request on our <Link to="/data-deletion" className="text-primary hover:underline">Data Deletion page</Link>.
            </p>
          </div>
        ) : loading ? (
          <div className="mt-8 flex items-center gap-3 rounded-2xl border border-border bg-card p-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Checking status...</span>
          </div>
        ) : error ? (
          <div className="mt-8 rounded-2xl border border-border bg-card p-8">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="mt-4 text-[15px] text-foreground font-medium">Unable to check status</p>
            <p className="mt-2 text-sm text-muted-foreground">
              We couldn't reach the server. Please try again later or email us at <a href="mailto:info@maroa.ai" className="text-primary hover:underline">info@maroa.ai</a>.
            </p>
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-border bg-card p-8">
            <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${cfg.bg}`}>
              <Icon className={`h-6 w-6 ${cfg.color} ${status === "processing" ? "animate-spin" : ""}`} />
            </div>
            <p className="mt-4 text-[15px] text-foreground font-medium">
              Your data deletion request is: <span className={cfg.color}>{cfg.label}</span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{cfg.desc}</p>

            {result?.requested_at && (
              <div className="mt-4 space-y-1 text-sm text-muted-foreground">
                <p>Requested: {new Date(result.requested_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                {result.completed_at && (
                  <p>Completed: {new Date(result.completed_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                )}
              </div>
            )}
          </div>
        )}

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Questions? Email us at <a href="mailto:info@maroa.ai" className="text-primary hover:underline">info@maroa.ai</a>
        </p>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} maroa.ai &mdash; <Link to="/terms" className="hover:underline">Terms</Link> &middot; <Link to="/privacy" className="hover:underline">Privacy</Link> &middot; <Link to="/data-deletion" className="hover:underline">Data Deletion</Link>
      </footer>
    </div>
  );
}
