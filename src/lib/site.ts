const EXPLICIT_SITE_URL = (import.meta.env.VITE_SITE_URL || '').replace(/\/$/, '');
const FALLBACK_SITE_URL = EXPLICIT_SITE_URL || 'https://shibam-24.vercel.app';

export const SITE_BASE_URL = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

export const SITE_URL = EXPLICIT_SITE_URL || (typeof window !== "undefined"
  ? new URL(SITE_BASE_URL, window.location.origin).toString().replace(/\/$/, "")
  : FALLBACK_SITE_URL);

export function absoluteSiteUrl(path = "/") {
  const normalizedPath = path === "/" ? "" : path.replace(/^\/+/, "");
  return new URL(normalizedPath, `${SITE_URL}/`).toString();
}

export function publicAssetUrl(path: string) {
  return new URL(path.replace(/^\/+/, ''), `${SITE_URL}/`).toString();
}
