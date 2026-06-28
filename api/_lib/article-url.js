export const SITE_URL = (process.env.SITE_URL || process.env.VITE_SITE_URL || 'https://shibam-24.vercel.app').replace(/\/$/, '');

const PERCENT_ENCODED_RE = /%(?:[0-9a-f]{2})/i;

export function safeDecodeSlug(value) {
  const input = String(value || '').trim();
  if (!input) return '';

  try {
    return PERCENT_ENCODED_RE.test(input) ? decodeURIComponent(input) : input;
  } catch {
    return input;
  }
}

export function normalizeExistingArticleSlug(value) {
  return safeDecodeSlug(value)
    .normalize('NFC')
    .trim()
    .replace(/[?#].*$/, '')
    .replace(/[\\/]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function getCanonicalArticleSlug(article) {
  return normalizeExistingArticleSlug(article?.slug) || String(article?.id || '').trim();
}

export function getArticlePath(article) {
  return `/article/${getCanonicalArticleSlug(article)}`;
}

export function getArticleUrl(article) {
  return `${SITE_URL}${getArticlePath(article)}`;
}

export function xmlEscape(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function hasPercentEncoding(value) {
  return /%(?:d[0-9a-f]|c[0-9a-f]|[0-9a-f]{2})/i.test(String(value || ''));
}
