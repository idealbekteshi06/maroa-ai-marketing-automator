import { useEffect, useState } from "react";
import { Mail, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const DISMISS_KEY = "maroa.founder-pill.dismissed";
const FOUNDER_EMAIL = "hello@maroa.ai";
const WINDOW_DAYS = 30;

export default function FounderPill() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(DISMISS_KEY) === "true") return;

    const createdAt = user?.created_at;
    if (createdAt) {
      const daysSince =
        (Date.now() - new Date(createdAt).getTime()) / 86_400_000;
      if (daysSince > WINDOW_DAYS) return;
    }
    setVisible(true);
  }, [user?.created_at]);

  if (!visible) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "true");
    setVisible(false);
  };

  return (
    <div
      role="region"
      aria-label="Message from the founder"
      className="flex w-full flex-col items-start gap-2 border-b border-border bg-muted/30 px-4 py-2.5 motion-safe:animate-fade-in sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex min-w-0 items-center gap-2 text-[13px] text-foreground">
        <Mail
          className="h-4 w-4 shrink-0 text-muted-foreground"
          strokeWidth={1.5}
          aria-hidden
        />
        <span className="min-w-0">
          Questions about Maroa? Email me directly —{" "}
          <a
            href={`mailto:${FOUNDER_EMAIL}`}
            className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-sm"
          >
            {FOUNDER_EMAIL}
          </a>
        </span>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss"
        className="self-end rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 sm:self-auto"
      >
        <X className="h-4 w-4" strokeWidth={1.5} aria-hidden />
      </button>
    </div>
  );
}
