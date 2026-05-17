/**
 * StackSection — "Built on the best of the stack."
 *
 * Apple-style logo strip, not a feature grid. The previous iteration
 * wrapped each logo in a bordered card with a role chip underneath —
 * that read as "feature tiles," which is the wrong genre. Apple's
 * "Works with…" sections (iCloud, Apple Music partners, MagSafe
 * accessories, etc.) all use the same pattern: flat surface, bigger
 * logo, generous whitespace, no card chrome, optional caption on
 * hover only. This component matches that.
 *
 * Layout:
 *   - One centred row per logical group, wrapping on small screens.
 *   - 40px logo height (was 28px in the boxed version).
 *   - Logos sit on the page directly — no bg, no border, no hover lift
 *     on individual logos. The page provides the surface.
 *   - Grayscale + 55% opacity at rest; transitions to full colour at
 *     100% opacity on hover. No translate, no shadow.
 *   - Role tags removed from individual logos. A single tiny legend
 *     under the second row distinguishes Ads from Publishing.
 *
 * Logos missing from cdn.simpleicons.org (Higgsfield, Inngest, LinkedIn)
 * use a typographic wordmark fallback sized to match the logo height.
 */

type LogoRef =
  | {
      kind: "icon";
      slug: string;
      name: string;
      role?: string;
      href?: string;
      /** Logo is monochrome-dark (near-black) and disappears on true-black
       * surfaces. We force it to pure white in dark mode via a brightness-0
       * + invert filter (pipeline: black silhouette → white silhouette).
       * Don't set this for coloured logos — it would wipe their brand
       * colour and turn them white too. */
      invertOnDark?: boolean;
    }
  | { kind: "wordmark"; text: string; name: string; role?: string; href?: string };

const ENGINES: LogoRef[] = [
  // Anthropic + Stripe glyphs are dark-on-light and invisible against
  // true-black. Stripe's actual brand colour is purple #635BFF (visible
  // fine), so only Anthropic needs the invert treatment here.
  { kind: "icon", slug: "anthropic", name: "Anthropic Claude", href: "https://anthropic.com", invertOnDark: true },
  { kind: "wordmark", text: "Higgsfield", name: "Higgsfield", href: "https://higgsfield.ai" },
  { kind: "icon", slug: "supabase", name: "Supabase", href: "https://supabase.com" },
  { kind: "wordmark", text: "Inngest", name: "Inngest", href: "https://inngest.com" },
  { kind: "icon", slug: "stripe", name: "Stripe", href: "https://stripe.com" },
];

const CHANNELS: LogoRef[] = [
  // Paid ad management (Ads). Order: Google → Meta → TikTok, which is
  // the budget-weight order across most accounts.
  { kind: "icon", slug: "googleads", name: "Google Ads", role: "Ads", href: "https://ads.google.com" },
  { kind: "icon", slug: "meta", name: "Meta Ads", role: "Ads", href: "https://www.facebook.com/business/ads" },
  // TikTok's official mark is black; needs invert in dark mode.
  { kind: "icon", slug: "tiktok", name: "TikTok Ads", role: "Ads", href: "https://ads.tiktok.com", invertOnDark: true },
  // Organic publishing via Ayrshare + Meta Graph (Publishing).
  { kind: "icon", slug: "instagram", name: "Instagram", role: "Publishing", href: "https://instagram.com" },
  { kind: "icon", slug: "facebook", name: "Facebook", role: "Publishing", href: "https://facebook.com" },
  { kind: "wordmark", text: "LinkedIn", name: "LinkedIn", role: "Publishing", href: "https://linkedin.com" },
  { kind: "icon", slug: "pinterest", name: "Pinterest", role: "Publishing", href: "https://pinterest.com" },
  { kind: "icon", slug: "youtube", name: "YouTube", role: "Publishing", href: "https://youtube.com" },
  // X and Threads — black-glyph brand marks. Both need invert on dark.
  { kind: "icon", slug: "x", name: "X", role: "Publishing", href: "https://x.com", invertOnDark: true },
  { kind: "icon", slug: "threads", name: "Threads", role: "Publishing", href: "https://threads.net", invertOnDark: true },
];

function Logo({ logo }: { logo: LogoRef }) {
  const invertOnDark = logo.kind === "icon" && logo.invertOnDark;

  const inner =
    logo.kind === "icon" ? (
      <img
        src={`https://cdn.simpleicons.org/${logo.slug}`}
        alt={`${logo.name} logo`}
        width={40}
        height={40}
        loading="lazy"
        decoding="async"
        // Dark-mode invert pipeline for monochrome-dark logos
        // (Anthropic, TikTok, X, Threads): brightness-0 nukes whatever
        // colour to pure black, then invert lifts pure black to pure
        // white. Net result: the silhouette stays exactly the same,
        // just legible on a true-black background. Coloured logos
        // (Meta blue, Google multi-color, Instagram gradient, etc.)
        // skip this filter entirely so their brand colour is preserved.
        className={
          invertOnDark
            ? "h-10 w-auto max-w-[120px] object-contain dark:brightness-0 dark:invert"
            : "h-10 w-auto max-w-[120px] object-contain"
        }
      />
    ) : (
      // Wordmark sized to match logo height. Tracking tightened so the
      // word reads as a logo, not a heading. Adapts via text-colour.
      <span className="inline-flex items-center h-10 text-[20px] font-semibold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
        {logo.text}
      </span>
    );

  const wrap = (
    <span
      title={logo.role ? `${logo.name} — ${logo.role}` : logo.name}
      aria-label={logo.role ? `${logo.name}, ${logo.role}` : logo.name}
      // Full colour at rest (user feedback: "have color without touching
      // them"). Subtle scale on hover so the strip still feels alive.
      className="
        inline-flex items-center justify-center
        h-10 px-1 sm:px-2
        transition-transform duration-200
        hover:scale-110
      "
    >
      {inner}
    </span>
  );

  if (logo.href) {
    return (
      <a href={logo.href} target="_blank" rel="noopener noreferrer" className="inline-flex">
        {wrap}
      </a>
    );
  }
  return wrap;
}

function LogoRow({ logos }: { logos: LogoRef[] }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 sm:gap-x-14">
      {logos.map((logo) => (
        <Logo key={logo.name} logo={logo} />
      ))}
    </div>
  );
}

export default function StackSection() {
  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl sm:text-4xl font-bold text-center tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
        Built on the best of the stack.
      </h2>
      <p className="text-center text-[#6e6e73] dark:text-[#a1a1a6] mt-4 text-base max-w-2xl mx-auto leading-relaxed">
        We don&apos;t reinvent the model. We orchestrate the best ones — with reasoning
        traces, compliance gates, and an OS layer above — into one system that ships
        every day.
      </p>

      {/* Engines + infra */}
      <div className="mt-16">
        <LogoRow logos={ENGINES} />
      </div>

      {/* Channels — small caption above so the Ads/Publishing distinction
          lands without needing a chip on every logo. */}
      <div className="mt-16">
        <p className="text-center text-[11px] uppercase tracking-[0.18em] text-[#86868b] dark:text-[#6e6e73] font-medium mb-6">
          Ad platforms <span className="text-[#0066CC] dark:text-[#0A84FF]">(we manage)</span>
          <span className="mx-3 text-[#d2d2d7] dark:text-[#3a3a3c]">·</span>
          Social channels <span className="text-[#86868b]">(we publish)</span>
        </p>
        <LogoRow logos={CHANNELS} />
      </div>

      <p className="mt-12 text-center text-[10px] text-[#86868b]/70 dark:text-[#6e6e73]/70">
        Trademarks are the property of their respective owners.
      </p>
    </div>
  );
}
