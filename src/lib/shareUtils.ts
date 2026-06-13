import type { NewsArticle } from '@/data/mockNews';
import { absoluteSiteUrl } from '@/lib/site';

const SITE_NAME = 'Shibam24';
const HASHTAG = '#Shibam24';

function articleUrl(article: NewsArticle) {
  const slug = (article as any).slug;
  return absoluteSiteUrl(`/article/${slug || article.id}`);
}

export function shareToWhatsApp(article: NewsArticle) {
  const url = articleUrl(article);
  const text = `${article.title} - ${SITE_NAME}\n\n${article.summary}\n\n${url}\n\n${HASHTAG}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}

export function shareToTwitter(article: NewsArticle) {
  const url = articleUrl(article);
  const text = `${article.title} - ${SITE_NAME} ${HASHTAG}`;
  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
}

export function shareToTelegram(article: NewsArticle) {
  const url = articleUrl(article);
  const text = `${article.title} - ${SITE_NAME}\n\n${article.summary}\n\n${HASHTAG}`;
  window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
}

export function shareToFacebook(article: NewsArticle) {
  const url = articleUrl(article);
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
}

export function copyLink(article: NewsArticle) {
  const url = articleUrl(article);
  const text = `${article.title} - ${SITE_NAME}\n${url}`;
  navigator.clipboard.writeText(text);
}
