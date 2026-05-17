import { useEffect } from "react";

/**
 * useSEO — per-route head-tag manager for a Vite SPA.
 *
 * The site is a single-page app, so every route shares the head tags
 * baked into index.html unless something runs at navigation time and
 * mutates document.head. That's what this hook does:
 *
 *   - <title>                         (replaces the one set by useDocumentTitle)
 *   - <meta name="description">       (per-page snippet)
 *   - <link rel="canonical">          (per-page canonical URL)
 *   - <meta property="og:title">      (per-page social share title)
 *   - <meta property="og:description">
 *   - <meta property="og:url">
 *   - <meta property="og:image">      (optional, falls back to site default)
 *   - <meta name="twitter:title">
 *   - <meta name="twitter:description">
 *   - <meta name="twitter:image">
 *   - <meta name="robots">            (optional per-page override)
 *
 * Why a hook + not a library like react-helmet-async:
 *   - Zero dependency footprint (Vite SPA build stays small).
 *   - No SSR considerations needed — the homepage's index.html holds
 *     the SEO defaults that Google's first-pass crawl reads; this hook
 *     improves the second-pass + share-target experience.
 *
 * Pattern: on mount, capture the previous values for every tag we touch.
 * On unmount, restore those values so a brief navigation doesn't leave
 * a stale Pricing title on the homepage if the user hits Back.
 *
 * SITE_URL is the canonical origin used to build absolute URLs. It must
 * match the canonical declared in index.html.
 */

const SITE_URL = "https://maroa.ai";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;
const TITLE_SUFFIX = " · maroa.ai";

export interface SEOOptions {
  /** Page-specific title. Suffix " · maroa.ai" is appended automatically.
   *  Pass an empty string to use the brand-only title. */
  title: string;
  /** 150-160 char snippet for SERP + social cards. Keep keyword-bearing. */
  description: string;
  /** Path component for the canonical URL. E.g. "/pricing".
   *  Pass "/" for home. Trailing slashes stripped. */
  path: string;
  /** Absolute OG image URL. Defaults to /og-image.png. */
  ogImage?: string;
  /** Override the global robots policy for this page only.
   *  E.g. "noindex, nofollow" on auth pages where we don't want a SERP entry. */
  robots?: string;
}

/** Read-or-create a <meta> tag. Selector form is `name=...` or `property=...`. */
function setMeta(attr: "name" | "property", key: string, value: string) {
  if (typeof document === "undefined") return () => {};
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  const wasCreated = !el;
  const previous = el?.getAttribute("content") ?? null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
  return () => {
    if (wasCreated) {
      el?.parentNode?.removeChild(el);
    } else if (previous !== null) {
      el?.setAttribute("content", previous);
    }
  };
}

/** Read-or-create the <link rel="canonical"> tag. */
function setCanonical(href: string) {
  if (typeof document === "undefined") return () => {};
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  const wasCreated = !el;
  const previous = el?.getAttribute("href") ?? null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
  return () => {
    if (wasCreated) {
      el?.parentNode?.removeChild(el);
    } else if (previous !== null) {
      el?.setAttribute("href", previous);
    }
  };
}

export function useSEO({ title, description, path, ogImage, robots }: SEOOptions) {
  useEffect(() => {
    if (typeof document === "undefined") return;

    // Normalise path: ensure single leading slash, strip trailing slash
    // except on the root "/".
    const cleanPath =
      path === "/" ? "/" : `/${path.replace(/^\/+/, "").replace(/\/+$/, "")}`;
    const fullUrl = `${SITE_URL}${cleanPath}`;
    const fullTitle = title.trim() ? `${title}${TITLE_SUFFIX}` : "maroa.ai";
    const image = ogImage ?? DEFAULT_OG_IMAGE;

    // <title>
    const previousTitle = document.title;
    document.title = fullTitle;

    // Restore on unmount — every other tag gets the same treatment via
    // the closure-returning setMeta / setCanonical helpers above.
    const restorers: Array<() => void> = [];
    const restore = (fn: () => void) => restorers.push(fn);

    restore(setMeta("name", "description", description));
    restore(setCanonical(fullUrl));

    // Open Graph
    restore(setMeta("property", "og:title", fullTitle));
    restore(setMeta("property", "og:description", description));
    restore(setMeta("property", "og:url", fullUrl));
    restore(setMeta("property", "og:image", image));

    // Twitter
    restore(setMeta("name", "twitter:title", fullTitle));
    restore(setMeta("name", "twitter:description", description));
    restore(setMeta("name", "twitter:image", image));

    // Per-page robots override (auth pages, status pages, etc.)
    if (robots) restore(setMeta("name", "robots", robots));

    return () => {
      document.title = previousTitle;
      for (const fn of restorers) fn();
    };
  }, [title, description, path, ogImage, robots]);
}
