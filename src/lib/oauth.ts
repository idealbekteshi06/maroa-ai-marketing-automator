/** OAuth redirect — must match Meta / TikTok / LinkedIn app settings. */
export function getOAuthRedirectUri(): string {
  const fromEnv = (import.meta.env.VITE_OAUTH_REDIRECT_URI as string)?.trim();
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/social-callback`;
  }
  return "https://maroa.ai/social-callback";
}

export const META_APP_ID =
  (import.meta.env.VITE_META_APP_ID as string)?.trim() || "26551713411132003";
