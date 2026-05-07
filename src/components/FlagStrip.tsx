import { cn } from "@/lib/utils";

/**
 * Renders a row of country flags. Uses the open-source flag-icons CSS classes
 * served by Twemoji-style SVG sprites via `country-flag-icons` is overkill —
 * for our 8-flag use case we ship inline SVG to dodge the emoji-rendering
 * inconsistency on Windows (Kosovo flag in particular).
 *
 * Codes accepted: ISO 3166-1 alpha-2 lowercase. Maroa-specific addition: "xk"
 * for Kosovo (provisional ISO code).
 */
export type FlagCode = "xk" | "al" | "gb" | "de" | "ae" | "us" | "fr" | "it" | "tr" | "es" | "pt" | "nl";

const FLAG_PATHS: Record<FlagCode, string> = {
  // Each value is the SVG body (children) of a 24x18 viewBox flag.
  xk: '<rect width="24" height="18" fill="#244AA5"/><g fill="#D0A650"><circle cx="12" cy="11" r="2.4"/><path d="M9.5 7.5l1 .8.7-1.2.7 1.2 1-.8-.4 1.3 1.4-.2-.9 1 1.4.5-1.4.5.9 1-1.4-.2.4 1.3-1-.8-.7 1.2-.7-1.2-1 .8.4-1.3-1.4.2.9-1-1.4-.5 1.4-.5-.9-1 1.4.2z"/></g>',
  al: '<rect width="24" height="18" fill="#E41E20"/><g fill="#000"><path d="M11.2 6.3l.8-.6.8.6-.3-1 .8-.6h-1l-.3-1-.3 1h-1l.8.6zM12 9c-1.1 0-2 .8-2 1.8 0 .8.5 1.4 1.2 1.6l-.4-.4c-.4-.4-.4-1 0-1.4.4-.4 1-.4 1.4 0l.4.4-.4-.4c.4 0 .8.4.8.8 0 .5-.3.8-.8.8h-.4l.4.4c.7-.2 1.2-.8 1.2-1.6 0-1-.9-1.8-2-1.8z"/></g>',
  gb: '<rect width="24" height="18" fill="#012169"/><path d="M0 0l24 18M24 0L0 18" stroke="#fff" stroke-width="3.6"/><path d="M0 0l24 18M24 0L0 18" stroke="#C8102E" stroke-width="2"/><path d="M12 0v18M0 9h24" stroke="#fff" stroke-width="6"/><path d="M12 0v18M0 9h24" stroke="#C8102E" stroke-width="3.6"/>',
  de: '<rect width="24" height="6" fill="#000"/><rect y="6" width="24" height="6" fill="#DD0000"/><rect y="12" width="24" height="6" fill="#FFCE00"/>',
  ae: '<rect width="24" height="6" fill="#00732F"/><rect y="6" width="24" height="6" fill="#fff"/><rect y="12" width="24" height="6" fill="#000"/><rect width="6" height="18" fill="#FF0000"/>',
  us: '<rect width="24" height="18" fill="#fff"/><g fill="#B22234"><rect y="0" width="24" height="1.4"/><rect y="2.8" width="24" height="1.4"/><rect y="5.5" width="24" height="1.4"/><rect y="8.3" width="24" height="1.4"/><rect y="11.1" width="24" height="1.4"/><rect y="13.8" width="24" height="1.4"/><rect y="16.6" width="24" height="1.4"/></g><rect width="10" height="9.7" fill="#3C3B6E"/>',
  fr: '<rect width="8" height="18" fill="#0055A4"/><rect x="8" width="8" height="18" fill="#fff"/><rect x="16" width="8" height="18" fill="#EF4135"/>',
  it: '<rect width="8" height="18" fill="#009246"/><rect x="8" width="8" height="18" fill="#fff"/><rect x="16" width="8" height="18" fill="#CE2B37"/>',
  tr: '<rect width="24" height="18" fill="#E30A17"/><circle cx="9" cy="9" r="3.6" fill="#fff"/><circle cx="9.9" cy="9" r="2.9" fill="#E30A17"/><polygon fill="#fff" points="13.5,9 14.6,9.7 14.4,8.4 15.3,7.5 14,7.4 13.5,6.2 13,7.4 11.7,7.5 12.6,8.4 12.4,9.7"/>',
  es: '<rect width="24" height="4.5" fill="#AA151B"/><rect y="4.5" width="24" height="9" fill="#F1BF00"/><rect y="13.5" width="24" height="4.5" fill="#AA151B"/>',
  pt: '<rect width="24" height="18" fill="#FF0000"/><rect width="9.6" height="18" fill="#006600"/>',
  nl: '<rect width="24" height="6" fill="#AE1C28"/><rect y="6" width="24" height="6" fill="#fff"/><rect y="12" width="24" height="6" fill="#21468B"/>',
};

const FLAG_LABEL: Record<FlagCode, string> = {
  xk: "Kosovo", al: "Albania", gb: "United Kingdom", de: "Germany", ae: "UAE",
  us: "United States", fr: "France", it: "Italy", tr: "Turkey", es: "Spain",
  pt: "Portugal", nl: "Netherlands",
};

interface FlagStripProps {
  codes?: FlagCode[];
  size?: number;
  className?: string;
  ariaLabel?: string;
  opacity?: number;
}

export default function FlagStrip({
  codes = ["xk", "al", "gb", "de", "ae", "us", "fr", "it"],
  size = 18,
  className,
  ariaLabel = "Available countries",
  opacity = 0.6,
}: FlagStripProps) {
  return (
    <ul
      role="list"
      aria-label={ariaLabel}
      className={cn("flex items-center justify-center gap-1.5", className)}
    >
      {codes.map((code) => {
        const path = FLAG_PATHS[code];
        if (!path) return null;
        return (
          <li
            key={code}
            title={FLAG_LABEL[code]}
            className="overflow-hidden rounded-[3px] ring-1 ring-black/10 dark:ring-white/10"
            style={{ width: (size * 4) / 3, height: size, opacity }}
          >
            <svg
              viewBox="0 0 24 18"
              width="100%"
              height="100%"
              role="img"
              aria-label={FLAG_LABEL[code]}
              dangerouslySetInnerHTML={{ __html: path }}
            />
          </li>
        );
      })}
    </ul>
  );
}
