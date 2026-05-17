import { Link } from "react-router-dom";
import { Home, ArrowLeft, ArrowRight, Tag, FileText, MessageCircle } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";

/**
 * 404 — "Page not found."
 *
 * UX rationale: a dead-end 404 wastes 100% of the visitor's intent.
 * Instead, recover the visit with three high-conversion next-actions:
 *   - Home
 *   - Pricing (highest commercial intent off-route)
 *   - Compare (second-highest off-route, captures "vs..." searches)
 *   - Contact (last-resort, captures questions)
 * Plus a Go Back button for accidental misclicks.
 *
 * SEO rationale: noindex so we don't accumulate 404 entries in the
 * SERP. Page still loads with proper meta (helps the recovery path)
 * but the URL never makes it to the index.
 */
export default function NotFound() {
  useSEO({
    title: "Page not found",
    description:
      "We couldn't find that page. Try the homepage, pricing, or our agency comparison.",
    path: "/404",
    robots: "noindex, follow",
  });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <span
        className="text-[120px] sm:text-[160px] font-bold tracking-tight leading-none text-muted-foreground/15"
        aria-hidden="true"
      >
        404
      </span>
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground mt-2 mb-3 tracking-tight">
        Page not found
      </h1>
      <p className="text-muted-foreground mb-10 max-w-md leading-relaxed">
        That URL doesn&apos;t exist on maroa.ai. It might have moved or you
        followed an old link. Pick a destination below or head home.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mb-10">
        <Link
          to="/"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Home className="h-4 w-4" /> Go home
        </Link>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-6 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Go back
        </button>
      </div>

      {/* Recovery links — pick up the visit, don't waste it. */}
      <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl w-full">
        {[
          { icon: Tag, label: "Pricing", desc: "Growth $149 · Agency $599", href: "/pricing" },
          { icon: FileText, label: "Compare", desc: "Maroa vs agency, Buffer, Jasper", href: "/compare" },
          { icon: MessageCircle, label: "Contact", desc: "hello@maroa.ai", href: "mailto:hello@maroa.ai" },
        ].map((l) => {
          const Icon = l.icon;
          const isExternal = l.href.startsWith("mailto:");
          const inner = (
            <>
              <Icon className="h-4 w-4 text-primary flex-shrink-0" />
              <div className="text-left min-w-0">
                <p className="text-sm font-medium text-foreground">{l.label}</p>
                <p className="text-xs text-muted-foreground truncate">{l.desc}</p>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground ml-auto flex-shrink-0" />
            </>
          );
          return (
            <li key={l.label}>
              {isExternal ? (
                <a
                  href={l.href}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 hover:border-primary/40 hover:bg-muted/40 transition-colors"
                >
                  {inner}
                </a>
              ) : (
                <Link
                  to={l.href}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 hover:border-primary/40 hover:bg-muted/40 transition-colors"
                >
                  {inner}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
