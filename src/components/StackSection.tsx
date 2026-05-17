/**
 * StackSection — "Built on the best of the stack."
 *
 * Two grouped rows:
 *   1. AI engines & infrastructure — the brains and the rails.
 *   2. Ad platforms & social channels — where work ships, with
 *      explicit "Ads" vs "Publishing" tags so we don't over-claim
 *      paid-ad management for channels we only publish organically.
 *
 * Brand logos are pulled from Simple Icons' CDN
 * (https://cdn.simpleicons.org/<slug>). The CDN returns the official
 * brand colour; we wrap each logo in a grayscale + lower-opacity
 * filter so the row reads as one tone in repose, then transitions to
 * full colour on hover (Apple's product-mosaic pattern).
 *
 * Higgsfield isn't in Simple Icons — we fall back to a styled wordmark
 * so the visual weight stays consistent across the row.
 *
 * Microcopy:
 *   - Section title: "Built on the best of the stack."
 *   - Subtitle: "We don't reinvent the model. We orchestrate the best
 *     ones into one system that ships every day."
 *   - Trademark footer required by Simple Icons' attribution norm +
 *     a sane legal-team default.
 */

type LogoRef =
  | { kind: "icon"; slug: string; name: string; role: string; href?: string }
  | { kind: "wordmark"; text: string; name: string; role: string; href?: string };

const ENGINES: LogoRef[] = [
  { kind: "icon", slug: "anthropic", name: "Anthropic Claude", role: "Reasoning", href: "https://anthropic.com" },
  // Higgsfield + Inngest aren't in Simple Icons; wordmark fallback so
  // the row stays visually consistent (no broken-image placeholders).
  { kind: "wordmark", text: "Higgsfield", name: "Higgsfield", role: "Image & video", href: "https://higgsfield.ai" },
  { kind: "icon", slug: "supabase", name: "Supabase", role: "Data + auth", href: "https://supabase.com" },
  { kind: "wordmark", text: "Inngest", name: "Inngest", role: "Background work", href: "https://inngest.com" },
  { kind: "icon", slug: "stripe", name: "Stripe", role: "Payments", href: "https://stripe.com" },
];

const CHANNELS: LogoRef[] = [
  // Paid ads we actually manage (services/google-ads, meta-marketing, tiktok-ads).
  { kind: "icon", slug: "googleads", name: "Google Ads", role: "Ads", href: "https://ads.google.com" },
  { kind: "icon", slug: "meta", name: "Meta Ads", role: "Ads", href: "https://www.facebook.com/business/ads" },
  { kind: "icon", slug: "tiktok", name: "TikTok Ads", role: "Ads", href: "https://ads.tiktok.com" },
  // Organic publishing via Ayrshare + Meta Graph. NOT paid ads.
  { kind: "icon", slug: "instagram", name: "Instagram", role: "Publishing", href: "https://instagram.com" },
  { kind: "icon", slug: "facebook", name: "Facebook", role: "Publishing", href: "https://facebook.com" },
  // LinkedIn isn't in Simple Icons (removed under their brand policy);
  // wordmark fallback keeps the channel visible without a broken image.
  { kind: "wordmark", text: "LinkedIn", name: "LinkedIn", role: "Publishing", href: "https://linkedin.com" },
  { kind: "icon", slug: "pinterest", name: "Pinterest", role: "Publishing", href: "https://pinterest.com" },
  { kind: "icon", slug: "youtube", name: "YouTube", role: "Publishing", href: "https://youtube.com" },
  { kind: "icon", slug: "x", name: "X", role: "Publishing", href: "https://x.com" },
  { kind: "icon", slug: "threads", name: "Threads", role: "Publishing", href: "https://threads.net" },
];

function LogoTile({ logo }: { logo: LogoRef }) {
  const inner = logo.kind === "icon" ? (
    <img
      src={`https://cdn.simpleicons.org/${logo.slug}`}
      alt={`${logo.name} logo`}
      width={28}
      height={28}
      loading="lazy"
      decoding="async"
      // grayscale + low opacity in repose; transitions to full colour
      // on hover. The transition is on the wrapper so the role label
      // animates with it.
      className="h-7 w-auto"
    />
  ) : (
    <span className="text-[15px] font-semibold tracking-tight">{logo.text}</span>
  );

  const body = (
    <div
      title={logo.name}
      className="
        group flex flex-col items-center justify-center gap-2
        h-20 px-4 rounded-xl
        bg-white/40 dark:bg-white/[0.02]
        border border-black/[0.04] dark:border-white/[0.06]
        text-[#1d1d1f] dark:text-white
        transition-all duration-200
        hover:bg-white dark:hover:bg-white/[0.05]
        hover:border-black/[0.08] dark:hover:border-white/[0.12]
        hover:-translate-y-px
        hover:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.06)]
      "
    >
      <div className="grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-200">
        {inner}
      </div>
      <span className="text-[10px] uppercase tracking-[0.14em] text-[#6e6e73] dark:text-[#a1a1a6] group-hover:text-[#1d1d1f] dark:group-hover:text-white transition-colors">
        {logo.role}
      </span>
    </div>
  );

  if (logo.href) {
    return (
      <a href={logo.href} target="_blank" rel="noopener noreferrer" aria-label={`${logo.name} — ${logo.role}`}>
        {body}
      </a>
    );
  }
  return body;
}

export default function StackSection() {
  return (
    <div className="max-w-6xl mx-auto">
      <p className="text-xs uppercase tracking-[0.2em] text-[#0066CC] dark:text-[#0A84FF] text-center mb-3">
        Built on the best of the stack
      </p>
      <h2 className="text-3xl sm:text-4xl font-bold text-center tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
        We don&apos;t reinvent the model. We orchestrate it.
      </h2>
      <p className="text-center text-[#6e6e73] dark:text-[#a1a1a6] mt-3 text-sm max-w-2xl mx-auto leading-relaxed">
        Each tool below is best-in-class at one job. Maroa orchestrates them — with
        reasoning traces, compliance gates, and a marketing-OS-shaped layer above —
        so you get an operating system, not a stack of subscriptions.
      </p>

      {/* AI engines & infrastructure */}
      <div className="mt-12">
        <p className="text-[11px] uppercase tracking-[0.16em] text-[#86868b] dark:text-[#6e6e73] text-center mb-5 font-medium">
          AI engines &amp; infrastructure
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 max-w-3xl mx-auto">
          {ENGINES.map((logo) => <LogoTile key={logo.name} logo={logo} />)}
        </div>
      </div>

      {/* Ad platforms & social channels */}
      <div className="mt-10">
        <p className="text-[11px] uppercase tracking-[0.16em] text-[#86868b] dark:text-[#6e6e73] text-center mb-5 font-medium">
          Ad platforms &amp; social channels
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5 gap-3">
          {CHANNELS.map((logo) => <LogoTile key={logo.name} logo={logo} />)}
        </div>
      </div>

      <p className="mt-10 text-center text-[10px] uppercase tracking-[0.16em] text-[#86868b] dark:text-[#6e6e73]">
        Ads = campaigns we manage daily &nbsp;·&nbsp; Publishing = posts we draft &amp; schedule
      </p>
      <p className="mt-3 text-center text-[10px] text-[#86868b]/70 dark:text-[#6e6e73]/70">
        All vendor names and logos are trademarks of their respective owners.
      </p>
    </div>
  );
}
