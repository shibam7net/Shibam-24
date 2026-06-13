const FALLBACK_SITE_URL = "https://shibam7net.github.io/Shibam-24";

export const SITE_BASE_URL = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

export const SITE_URL = typeof window !== "undefined"
  ? new URL(SITE_BASE_URL, window.location.origin).toString().replace(/\/$/, "")
  : FALLBACK_SITE_URL;

export function absoluteSiteUrl(path = "/") {
  const normalizedPath = path === "/" ? "" : path.replace(/^\/+/, "");
  return new URL(normalizedPath, `${SITE_URL}/`).toString();
}

export function publicAssetUrl(path: string) {
  return `${SITE_BASE_URL}${path.replace(/^\/+/, "")}`;
}
