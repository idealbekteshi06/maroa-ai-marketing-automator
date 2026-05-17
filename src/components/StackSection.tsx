/**
 * StackSection — "Built on the best of the stack."
 *
 * Marquee variant: two rows of brand logos sliding right-to-left at
 * different speeds, looping seamlessly. The classic Stripe / Vercel /
 * Linear premium-page treatment.
 *
 * Implementation notes
 *  - Seamless loop: the logos array is duplicated, and the track
 *    translates from 0 to -50%. When the animation reaches -50%, the
 *    duplicate is exactly where the original started, so the visitor
 *    never sees a "jump." Width: max-content so the track sizes to its
 *    contents regardless of viewport.
 *  - Edge fade: a horizontal mask-image fades the leftmost and
 *    rightmost ~8% of the row to transparent, so logos appear to
 *    enter/exit the strip cleanly rather than getting clipped.
 *  - Pause on hover: the track is inside a group with hover →
 *    animation-play-state: paused so a curious visitor can read the
 *    full row without chasing it.
 *  - Reduced-motion: when prefers-reduced-motion is set, the animation
 *    is removed and the row falls back to a centred wrap layout (same
 *    info, no movement). Required for accessibility.
 *  - Two rows scroll at slightly different durations (38s + 48s) so the
 *    page feels alive without being distracting.
 *
 * Logos: monochrome (grayscale + 70% opacity) at rest, full brand
 * colour on hover. Same pattern as the previous version — Stripe /
 * Vercel / Linear / Apple "Works with" all use it. Monochrome-dark
 * marks (Anthropic, TikTok, X, Threads) use brightness-0 + invert so
 * they stay legible on true black in dark mode.
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
  { kind: "icon", slug: "googleads", name: "Google Ads", role: "Ads", href: "https://ads.google.com" },
  { kind: "icon", slug: "meta", name: "Meta Ads", role: "Ads", href: "https://www.facebook.com/business/ads" },
  { kind: "icon", slug: "tiktok", name: "TikTok Ads", role: "Ads", href: "https://ads.tiktok.com" },
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
        className="h-8 w-auto max-w-[110px] object-contain"
      />
    ) : (
      <span className="inline-flex items-center h-8 text-[17px] font-semibold tracking-tight">
        {logo.text}
      </span>
    );

  // Monochrome-dark marks: their "brand colour" is just black. Use
  // brightness-0 + invert in dark mode so the silhouette stays white
  // on true black; in light mode the natural black already reads fine.
  const isMonoDark =
    logo.kind === "icon" &&
    (logo.slug === "anthropic" || logo.slug === "tiktok" || logo.slug === "x" || logo.slug === "threads");

  const filters = isMonoDark
    ? "dark:brightness-0 dark:invert opacity-80 hover:opacity-100"
    : "grayscale opacity-70 hover:grayscale-0 hover:opacity-100";

  const wrap = (
    <span
      title={logo.role ? `${logo.name} — ${logo.role}` : logo.name}
      aria-label={logo.role ? `${logo.name}, ${logo.role}` : logo.name}
      className={`
        inline-flex items-center justify-center
        h-8
        transition-[filter,opacity] duration-300
        text-[#1d1d1f] dark:text-[#f5f5f7]
        ${filters}
      `}
    >
      {inner}
    </span>
  );

  if (logo.href) {
    return (
      <a href={logo.href} target="_blank" rel="noopener noreferrer" className="inline-flex flex-shrink-0">
        {wrap}
      </a>
    );
  }
  return <span className="inline-flex flex-shrink-0">{wrap}</span>;
}

function Marquee({
  logos,
  durationSeconds,
}: {
  logos: LogoRef[];
  durationSeconds: number;
}) {
  // Duplicate the logo list. The track translates from 0 → -50%, so
  // when the animation reaches -50% the duplicate is exactly where the
  // original started — seamless loop with no jump.
  const items = [...logos, ...logos];
  return (
    <div className="maroa-marquee group/marquee">
      <div
        className="maroa-marquee-track flex items-center gap-x-12 sm:gap-x-16"
        style={{ animationDuration: `${durationSeconds}s` }}
      >
        {items.map((logo, i) => (
          <Logo key={`${logo.name}-${i}`} logo={logo} />
        ))}
      </div>
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

      {/* Frosted container — soft bg + hairline border. Two marquee
          rows separated by a single hairline. No text caption — the
          divider alone signals "two grouped lanes" without breaking
          the visual flow. */}
      <div className="mt-12 rounded-3xl border border-black/[0.06] dark:border-white/[0.08] bg-[#fafafa]/60 dark:bg-white/[0.02] py-10 sm:py-12 overflow-hidden">
        {/* Engines + infra — 38s, fewer logos, slightly faster cadence */}
        <Marquee logos={ENGINES} durationSeconds={38} />

        {/* Hairline divider — thin, low-contrast, edge-faded via the
            same horizontal margins so it visually echoes the marquee
            row above and doesn't read as a hard wall. */}
        <div className="my-8 h-px bg-black/[0.06] dark:bg-white/[0.08] mx-12 sm:mx-20" aria-hidden="true" />

        {/* Channels — 48s, more logos, slower cadence so the row feels
            organic alongside the engines row above it. */}
        <Marquee logos={CHANNELS} durationSeconds={48} />
      </div>

      <p className="mt-6 text-center text-[10px] text-[#86868b]/70 dark:text-[#6e6e73]/70">
        Trademarks are the property of their respective owners.
      </p>

      {/* ── Marquee CSS — kept inline so the component is self-contained
          and the keyframes live next to the markup that uses them.
          See file header for the design rationale. */}
      <style>{`
        .maroa-marquee {
          position: relative;
          overflow: hidden;
          /* Edge fade: logos appear to enter/exit the strip cleanly
             instead of getting hard-clipped at the container edge. */
          -webkit-mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
                  mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
        }
        .maroa-marquee-track {
          width: max-content;
          will-change: transform;
          animation-name: maroa-marquee-scroll;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          padding-inline: 1.5rem;
        }
        @keyframes maroa-marquee-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        /* Pause on hover so a curious visitor can read the full row. */
        .maroa-marquee:hover .maroa-marquee-track {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .maroa-marquee {
            -webkit-mask-image: none;
                    mask-image: none;
          }
          .maroa-marquee-track {
            animation: none;
            width: 100%;
            flex-wrap: wrap;
            justify-content: center;
            row-gap: 1.25rem;
          }
        }
      `}</style>
    </div>
  );
}
