import { cn } from "@/lib/utils";

/**
 * Renders a row of country flags.
 *
 * Why we switched away from hand-drawn inline SVG:
 *   - The previous hand-drawn versions (especially Kosovo + Albania)
 *     looked amateurish — wrong proportions, coats-of-arms approximated.
 *   - Unicode flag emoji render inconsistently across platforms (Windows
 *     shows country-code letters; some Linux distros show nothing).
 *
 * Current implementation:
 *   - Source: flagcdn.com — the professionally-designed SVG/PNG set
 *     Wikipedia + major news sites use. Free, CDN-cached, no auth.
 *   - 2x-DPR srcSet so the flags stay crisp on Retina/HiDPI displays.
 *   - flagcdn supports the provisional "xk" (Kosovo) code natively.
 *   - The flag image carries its own alt text for SR users; the wrapper
 *     is `role="list"` with an aria-label naming the strip overall.
 *
 * Visual treatment matches the previous component: small rectangular
 * tile, 4:3 ratio, 1px hairline ring, configurable opacity so the strip
 * reads as atmospheric rather than navigational.
 */
export type FlagCode = "xk" | "al" | "gb" | "de" | "ae" | "us" | "fr" | "it" | "tr" | "es" | "pt" | "nl";

const FLAG_LABEL: Record<FlagCode, string> = {
  xk: "Kosovo",
  al: "Albania",
  gb: "United Kingdom",
  de: "Germany",
  ae: "United Arab Emirates",
  us: "United States",
  fr: "France",
  it: "Italy",
  tr: "Türkiye",
  es: "Spain",
  pt: "Portugal",
  nl: "Netherlands",
};

interface FlagStripProps {
  codes?: FlagCode[];
  /** Pixel height of each flag. Width is derived (4:3 ratio). */
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
  opacity = 0.85,
}: FlagStripProps) {
  return (
    <ul
      role="list"
      aria-label={ariaLabel}
      className={cn("flex items-center justify-center gap-1.5", className)}
    >
      {codes.map((code) => {
        const label = FLAG_LABEL[code];
        if (!label) return null;
        const w = Math.round((size * 4) / 3);
        // SVG is preferred — infinite scaling, single source-of-truth file
        // per country, no DPR juggling. flagcdn.com serves SVG at the bare
        // path (no w-prefix).
        const src = `https://flagcdn.com/${code}.svg`;
        return (
          <li
            key={code}
            title={label}
            className="overflow-hidden rounded-[3px] ring-1 ring-black/10 dark:ring-white/10 flex-shrink-0"
            style={{ width: w, height: size, opacity }}
          >
            <img
              src={src}
              alt={label}
              loading="lazy"
              decoding="async"
              width={w}
              height={size}
              className="block h-full w-full object-cover"
            />
          </li>
        );
      })}
    </ul>
  );
}
