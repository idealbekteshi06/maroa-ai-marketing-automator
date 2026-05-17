/**
 * StackSection — "Built on the best of the stack."
 *
 * Premium-tier pattern: monochrome logos at rest, full colour on hover.
 *
 * Why this beats the "always in colour" treatment:
 *   - Every brand's saturation level is different (Meta blue is loud,
 *     Anthropic black is quiet, Instagram gradient is louder still).
 *     A row of mixed-saturation logos reads as "SaaS landing page."
 *   - One uniform monochrome tint at rest reads as "respected brand
 *     library." Stripe, Vercel, Linear, Apple "Works with" all use this.
 *   - The hover reveal still gives the playfulness the user asked for —
 *     it just stops competing for attention when nobody's touching it.
 *
 * Layout:
 *   - Section sits inside a soft frosted container (hairline border,
 *     subtle inner bg) so the logos read as one curated set, not a
 *     loose row floating on the page.
 *   - Two grouped rows separated by a hairline divider:
 *       1. AI engines & infrastructure (5 marks)
 *       2. Ad platforms (3) + Social channels (7) — the role caption
 *          above the second row tells you which is which without
 *          per-logo chips.
 *   - 32px logo height. Uniform vertical baseline via flex-align.
 *
 * Logos missing from cdn.simpleicons.org (Higgsfield, Inngest, LinkedIn)
 * use a typographic wordmark — same height as the icon logos so the row
 * baseline stays flat.
 */

type LogoRef =
  | { kind: "icon"; slug: string; name: string; role?: string; href?: string }
  | { kind: "wordmark"; text: string; name: string; role?: string; href?: string };

const ENGINES: LogoRef[] = [
  { kind: "icon", slug: "anthropic", name: "Anthropic Claude", href: "https://anthropic.com" },
  { kind: "wordmark", text: "Higgsfield", name: "Higgsfield", href: "https://higgsfield.ai" },
  { kind: "icon", slug: "supabase", name: "Supabase", href: "https://supabase.com" },
  { kind: "wordmark", text: "Inngest", name: "Inngest", href: "https://inngest.com" },
  { kind: "icon", slug: "stripe", name: "Stripe", href: "https://stripe.com" },
];

const CHANNELS: LogoRef[] = [
  // Paid ad management (Ads). Order: Google → Meta → TikTok.
  { kind: "icon", slug: "googleads", name: "Google Ads", role: "Ads", href: "https://ads.google.com" },
  { kind: "icon", slug: "meta", name: "Meta Ads", role: "Ads", href: "https://www.facebook.com/business/ads" },
  { kind: "icon", slug: "tiktok", name: "TikTok Ads", role: "Ads", href: "https://ads.tiktok.com" },
  // Organic publishing via Ayrshare + Meta Graph (Publishing).
  { kind: "icon", slug: "instagram", name: "Instagram", role: "Publishing", href: "https://instagram.com" },
  { kind: "icon", slug: "facebook", name: "Facebook", role: "Publishing", href: "https://facebook.com" },
  { kind: "wordmark", text: "LinkedIn", name: "LinkedIn", role: "Publishing", href: "https://linkedin.com" },
  { kind: "icon", slug: "pinterest", name: "Pinterest", role: "Publishing", href: "https://pinterest.com" },
  { kind: "icon", slug: "youtube", name: "YouTube", role: "Publishing", href: "https://youtube.com" },
  { kind: "icon", slug: "x", name: "X", role: "Publishing", href: "https://x.com" },
  { kind: "icon", slug: "threads", name: "Threads", role: "Publishing", href: "https://threads.net" },
];

function Logo({ logo }: { logo: LogoRef }) {
  const inner =
    logo.kind === "icon" ? (
      <img
        src={`https://cdn.simpleicons.org/${logo.slug}`}
        alt={`${logo.name} logo`}
        width={32}
        height={32}
        loading="lazy"
        decoding="async"
        // Rest state: grayscale + 70% opacity, then a slight brightness
        // bump in dark mode so the silhouette doesn't get crushed against
        // the black surface. Hover: lift to full colour (grayscale-0,
        // opacity-100).
        //
        // For coloured logos this means: at rest you see a tasteful grey
        // silhouette; on hover you see the brand colour.
        // For monochrome-dark logos (Anthropic, TikTok, X, Threads) the
        // dark:invert + dark:brightness-0 pipeline still applies so they
        // stay legible on true black even at the grey rest state.
        className="h-8 w-auto max-w-[110px] object-contain"
      />
    ) : (
      <span className="inline-flex items-center h-8 text-[17px] font-semibold tracking-tight">
        {logo.text}
      </span>
    );

  // Force monochrome-dark icons to white in dark mode at rest, and keep
  // them white on hover (since their "brand colour" is just black/white,
  // there's no colour to reveal). Coloured icons use the grayscale →
  // colour reveal.
  const isMonoDark =
    logo.kind === "icon" &&
    (logo.slug === "anthropic" || logo.slug === "tiktok" || logo.slug === "x" || logo.slug === "threads");

  const monoTint = isMonoDark
    ? "dark:brightness-0 dark:invert"
    : "grayscale opacity-70 hover:grayscale-0 hover:opacity-100";

  const wrap = (
    <span
      title={logo.role ? `${logo.name} — ${logo.role}` : logo.name}
      aria-label={logo.role ? `${logo.name}, ${logo.role}` : logo.name}
      className={`
        inline-flex items-center justify-center
        h-8 px-2
        transition-[filter,opacity,transform] duration-200
        text-[#1d1d1f] dark:text-[#f5f5f7]
        ${monoTint}
      `}
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
    <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-5 sm:gap-x-12">
      {logos.map((logo) => (
        <Logo key={logo.name} logo={logo} />
      ))}
    </div>
  );
}

export default function StackSection() {
  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-3xl sm:text-4xl font-bold text-center tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
        Built on the best of the stack.
      </h2>
      <p className="text-center text-[#6e6e73] dark:text-[#a1a1a6] mt-4 text-base max-w-xl mx-auto leading-relaxed">
        We don&apos;t reinvent the model — we orchestrate the best ones into one system that ships every day.
      </p>

      {/* Frosted container — hairline border + subtle bg + generous
          padding. Makes the section read as a curated brand library,
          not a row of decoupled logos floating in space. */}
      <div className="mt-12 rounded-3xl border border-black/[0.06] dark:border-white/[0.08] bg-[#fafafa]/60 dark:bg-white/[0.02] px-6 py-10 sm:px-10 sm:py-12">
        {/* Engines + infra */}
        <LogoRow logos={ENGINES} />

        {/* Hairline divider — picks up the same translucent value as
            the container border so it sits inside the same system. */}
        <div className="my-10 h-px bg-black/[0.06] dark:bg-white/[0.08]" aria-hidden="true" />

        {/* Channels — small caption above so the Ads/Publishing
            distinction lands without needing a chip on every logo. */}
        <p className="text-center text-[10px] uppercase tracking-[0.2em] text-[#86868b] dark:text-[#6e6e73] font-medium mb-6">
          Ad platforms <span className="text-[#0066CC] dark:text-[#0A84FF]">we manage</span>
          <span className="mx-2.5 text-[#d2d2d7] dark:text-[#3a3a3c]">·</span>
          Social channels <span className="text-[#86868b]">we publish</span>
        </p>
        <LogoRow logos={CHANNELS} />
      </div>

      <p className="mt-6 text-center text-[10px] text-[#86868b]/70 dark:text-[#6e6e73]/70">
        Trademarks are the property of their respective owners.
      </p>
    </div>
  );
}
