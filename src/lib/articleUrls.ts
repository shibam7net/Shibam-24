import { cleanTitle, decodeHtml } from '@/lib/decodeHtml';
import { SITE_URL } from '@/lib/site';

interface ArticleLike {
  id: string;
  slug?: string | null;
  title?: string | null;
}

const PERCENT_ENCODED_RE = /%(?:[0-9a-f]{2})/i;

export function safeDecodeSlug(value: string | null | undefined): string {
  const input = String(value || '').trim();
  if (!input) return '';

  try {
    return PERCENT_ENCODED_RE.test(input) ? decodeURIComponent(input) : input;
  } catch {
    return input;
  }
}

export function normalizeExistingArticleSlug(value: string | null | undefined): string {
  const decoded = safeDecodeSlug(decodeHtml(value || ''))
    .normalize('NFC')
    .trim()
    .replace(/[?#].*$/, '')
    .replace(/[\\/]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return decoded;
}

export function createArticleSlug(title: string | null | undefined): string {
  let slug = cleanTitle(title || '').toLowerCase().trim();
  slug = slug.replace(/&[a-z]+;/gi, '');
  slug = slug.replace(/[^\w\s\-\u0600-\u06FF]/g, '');
  slug = slug.replace(/\s+/g, '-');
  slug = slug.replace(/-+/g, '-');
  slug = slug.replace(/^-|-$/g, '');
  slug = slug.slice(0, 80);
  return slug || 'article';
}

export function ensureUniqueArticleSlug(baseSlug: string, takenSlugs: Iterable<string>, currentSlug?: string | null): string {
  const normalizedCurrent = normalizeExistingArticleSlug(currentSlug);
  const base = normalizeExistingArticleSlug(baseSlug) || 'article';
  const taken = new Set(Array.from(takenSlugs, (slug) => normalizeExistingArticleSlug(slug)).filter(Boolean));

  if (!taken.has(base) || base === normalizedCurrent) return base;

  let counter = 2;
  let candidate = `${base}-${counter}`;
  while (taken.has(candidate) && candidate !== normalizedCurrent) {
    counter += 1;
    candidate = `${base}-${counter}`;
  }

  return candidate;
}

export function getArticleSlug(article: ArticleLike): string {
  return normalizeExistingArticleSlug(article.slug) || createArticleSlug(article.title) || article.id;
}

export function getArticlePath(article: ArticleLike): string {
  return `/article/${getArticleSlug(article) || article.id}`;
}

export function absoluteReadableSiteUrl(path = '/'): string {
  if (!path || path === '/') return SITE_URL;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function getArticleUrl(article: ArticleLike): string {
  return absoluteReadableSiteUrl(getArticlePath(article));
}

export function hasPercentEncoding(value: string | null | undefined): boolean {
  return /%(?:d[0-9a-f]|c[0-9a-f]|[0-9a-f]{2})/i.test(String(value || ''));
}
