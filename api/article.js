const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://pqtfipryditlsthdczkq.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxdGZpcHJ5ZGl0bHN0aGRjemtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2OTc4NzgsImV4cCI6MjA4OTI3Mzg3OH0.wdS_FIpMPlyQHbsi9f1Uxfd209cOmDgfOd24XpFD0PY';
const SITE_URL = (process.env.SITE_URL || process.env.VITE_SITE_URL || 'https://shibam-24.vercel.app').replace(/\/$/, '');
const SITE_NAME = 'Shibam24 - شبام24';
const SOCIAL_BOT_RE = /(facebookexternalhit|Facebot|Twitterbot|Xbot|WhatsApp|TelegramBot|Slackbot|Discordbot|LinkedInBot|SkypeUriPreview|Googlebot|bingbot)/i;

function decodeHtml(text = '') {
  return String(text)
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([\da-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#124;/g, '|')
    .replace(/&#8230;/g, '…');
}

function stripHtml(text = '') {
  return decodeHtml(text)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function cleanTitle(text = '') {
  return stripHtml(text).replace(/\s+/g, ' ').trim();
}

function escapeHtml(text = '') {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function encodeAttr(text = '') {
  return escapeHtml(text).replace(/\n/g, ' ');
}

function trimText(text = '', max = 160) {
  const value = stripHtml(text).replace(/\s+/g, ' ').trim();
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trim()}…`;
}

function extractFirstImageUrl(article) {
  const direct = article?.image_url ? decodeHtml(article.image_url).trim() : '';
  if (isAbsoluteHttpUrl(direct)) return direct;

  const raw = `${article?.summary || ''} ${article?.content || ''}`;
  const imgMatch = decodeHtml(raw).match(/<img\b[^>]*\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/i);
  const candidate = (imgMatch?.[1] || imgMatch?.[2] || imgMatch?.[3] || '').trim();
  return isAbsoluteHttpUrl(candidate) ? candidate : null;
}

function isAbsoluteHttpUrl(value) {
  return /^https?:\/\//i.test(value || '');
}

function safeUrl(url) {
  if (!isAbsoluteHttpUrl(url)) return null;
  try {
    const parsed = new URL(url);
    return parsed.toString();
  } catch {
    return null;
  }
}

function getOgImageUrl(imageUrl) {
  const safe = safeUrl(imageUrl);
  if (!safe) return null;
  return `${SITE_URL}/api/image-proxy?url=${encodeURIComponent(safe)}`;
}

function formatDate(value, locale = 'ar') {
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'UTC',
    }).format(new Date(value));
  } catch {
    return value || '';
  }
}

async function fetchArticle(slug) {
  const columns = 'id,slug,title,summary,content,image_url,category,section,author,source_name,source_url,published_at,created_at,views,tags';
  const encodedColumns = encodeURIComponent(columns);
  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    Accept: 'application/json',
  };

  const attempts = [
    `${SUPABASE_URL}/rest/v1/articles?select=${encodedColumns}&slug=eq.${encodeURIComponent(slug)}&limit=1`,
    `${SUPABASE_URL}/rest/v1/articles?select=${encodedColumns}&id=eq.${encodeURIComponent(slug)}&limit=1`,
  ];

  for (const url of attempts) {
    const response = await fetch(url, { headers, cache: 'no-store' });
    if (!response.ok) continue;
    const rows = await response.json();
    if (Array.isArray(rows) && rows[0]) return rows[0];
  }

  return null;
}

function buildJsonLd(article, canonicalUrl, ogImageUrl, metaDescription, lang) {
  const image = ogImageUrl ? [ogImageUrl] : undefined;
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: cleanTitle(article.title),
    description: metaDescription,
    image,
    datePublished: article.published_at,
    dateModified: article.created_at || article.published_at,
    articleSection: article.category || undefined,
    inLanguage: lang,
    mainEntityOfPage: canonicalUrl,
    author: {
      '@type': 'Person',
      name: article.author || 'شبام24',
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
      },
    },
  };
}

function renderArticleHtml(article, canonicalUrl, metaDescription, ogImageUrl) {
  const title = cleanTitle(article.title);
  const summary = trimText(article.summary || article.content || '', 220);
  const contentText = stripHtml(article.content || article.summary || '');
  const paragraphs = contentText
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 120);
  const isArabic = article.section !== 'global';
  const lang = isArabic ? 'ar' : 'en';
  const direction = isArabic ? 'rtl' : 'ltr';
  const published = formatDate(article.published_at, isArabic ? 'ar' : 'en');
  const sourceName = article.source_name || SITE_NAME;
  const sourceUrl = safeUrl(article.source_url);
  const pageTitle = `${title} | شبام24`;
  const socialTitle = title;
  const sectionLabel = article.category || (isArabic ? 'أخبار' : 'News');
  const encodedCanonical = encodeAttr(canonicalUrl);
  const encodedTitle = encodeAttr(pageTitle);
  const encodedSocialTitle = encodeAttr(socialTitle);
  const encodedMetaDescription = encodeAttr(metaDescription);
  const encodedOgImage = ogImageUrl ? encodeAttr(ogImageUrl) : '';
  const encodedImageAlt = encodeAttr(title);
  const jsonLd = JSON.stringify(buildJsonLd(article, canonicalUrl, ogImageUrl, metaDescription, lang)).replace(/</g, '\\u003c');

  const socialMeta = ogImageUrl
    ? `
    <meta property="og:title" content="${encodedSocialTitle}" />
    <meta property="og:description" content="${encodedMetaDescription}" />
    <meta property="og:url" content="${encodedCanonical}" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="${encodeAttr(SITE_NAME)}" />
    <meta property="og:locale" content="${isArabic ? 'ar_AR' : 'en_US'}" />
    <meta property="article:published_time" content="${encodeAttr(article.published_at || '')}" />
    <meta property="article:modified_time" content="${encodeAttr(article.created_at || article.published_at || '')}" />
    <meta property="article:section" content="${encodeAttr(sectionLabel)}" />
    <meta property="og:image" content="${encodedOgImage}" />
    <meta property="og:image:secure_url" content="${encodedOgImage}" />
    <meta property="og:image:alt" content="${encodedImageAlt}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${encodedSocialTitle}" />
    <meta name="twitter:description" content="${encodedMetaDescription}" />
    <meta name="twitter:image" content="${encodedOgImage}" />
    <meta name="twitter:image:alt" content="${encodedImageAlt}" />`
    : '';

  const heroImage = ogImageUrl
    ? `<figure class="hero"><img src="${encodedOgImage}" alt="${encodedImageAlt}" loading="eager" decoding="async" /></figure>`
    : '';

  const sourceBlock = sourceUrl
    ? `<a class="source-link" href="${encodeAttr(sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(sourceName)}</a>`
    : `<span class="source-link">${escapeHtml(sourceName)}</span>`;

  const bodyHtml = paragraphs.length
    ? paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('\n')
    : `<p>${escapeHtml(summary)}</p>`;

  return `<!doctype html>
<html lang="${lang}" dir="${direction}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>${encodedTitle}</title>
    <meta name="description" content="${encodedMetaDescription}" />
    <meta name="author" content="${encodeAttr(article.author || 'شبام24')}" />
    <meta name="robots" content="index,follow,max-image-preview:large" />
    <link rel="canonical" href="${encodedCanonical}" />
    <meta property="article:author" content="${encodeAttr(article.author || 'شبام24')}" />
    ${socialMeta}
    <script type="application/ld+json">${jsonLd}</script>
    <style>
      :root {
        color-scheme: light;
        --bg: #f8fafc;
        --card: #ffffff;
        --text: #0f172a;
        --muted: #475569;
        --line: #e2e8f0;
        --brand: #dc2626;
        --brand-dark: #991b1b;
        --shadow: 0 20px 40px rgba(15, 23, 42, 0.08);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Tahoma, Arial, sans-serif;
        background: linear-gradient(180deg, #fff 0%, var(--bg) 100%);
        color: var(--text);
      }
      a { color: inherit; text-decoration: none; }
      .topbar {
        border-bottom: 1px solid rgba(226, 232, 240, 0.8);
        background: rgba(255, 255, 255, 0.94);
        backdrop-filter: blur(14px);
        position: sticky;
        top: 0;
        z-index: 5;
      }
      .topbar-inner, .container {
        width: min(100%, 1120px);
        margin: 0 auto;
        padding: 0 20px;
      }
      .topbar-inner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-height: 70px;
        gap: 16px;
      }
      .brand {
        font-weight: 800;
        font-size: 1.15rem;
        color: var(--brand-dark);
        letter-spacing: -0.02em;
      }
      .nav {
        display: flex;
        gap: 14px;
        color: var(--muted);
        font-size: 0.96rem;
        flex-wrap: wrap;
      }
      .shell {
        padding: 28px 0 60px;
      }
      .article {
        background: var(--card);
        border: 1px solid rgba(226, 232, 240, 0.8);
        border-radius: 28px;
        box-shadow: var(--shadow);
        overflow: hidden;
      }
      .article-inner {
        padding: 28px;
      }
      .eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: rgba(220, 38, 38, 0.08);
        color: var(--brand-dark);
        border: 1px solid rgba(220, 38, 38, 0.18);
        border-radius: 999px;
        padding: 8px 14px;
        font-size: 0.9rem;
        font-weight: 700;
        margin-bottom: 18px;
      }
      h1 {
        margin: 0 0 18px;
        font-size: clamp(2rem, 4.2vw, 3.4rem);
        line-height: 1.15;
        letter-spacing: -0.03em;
      }
      .meta {
        display: flex;
        flex-wrap: wrap;
        gap: 12px 18px;
        color: var(--muted);
        font-size: 0.98rem;
        border-bottom: 1px solid var(--line);
        padding-bottom: 18px;
        margin-bottom: 20px;
      }
      .summary {
        font-size: 1.13rem;
        line-height: 1.95;
        color: #1e293b;
        background: #fff7f7;
        border: 1px solid rgba(220, 38, 38, 0.14);
        border-inline-start: 4px solid var(--brand);
        border-radius: 20px;
        padding: 16px 18px;
        margin-bottom: 22px;
      }
      .hero {
        margin: 0;
        background: #0f172a;
        aspect-ratio: 16 / 9;
      }
      .hero img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .content {
        font-size: 1.08rem;
        line-height: 2.05;
      }
      .content p {
        margin: 0 0 18px;
      }
      .footer-meta {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 12px;
        margin-top: 28px;
        padding-top: 20px;
        border-top: 1px solid var(--line);
        color: var(--muted);
      }
      .source-link {
        color: var(--brand-dark);
        font-weight: 700;
      }
      .share-note {
        font-size: 0.92rem;
        color: var(--muted);
      }
      .home-link {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        margin-top: 24px;
        color: var(--brand-dark);
        font-weight: 700;
      }
      @media (max-width: 720px) {
        .article-inner { padding: 20px; }
        .topbar-inner { min-height: 62px; }
        .nav { font-size: 0.9rem; gap: 10px; }
      }
    </style>
  </head>
  <body>
    <header class="topbar">
      <div class="topbar-inner">
        <a class="brand" href="${SITE_URL}/">شبام24 | Shibam24</a>
        <nav class="nav">
          <a href="${SITE_URL}/">${isArabic ? 'الرئيسية' : 'Home'}</a>
          <a href="${SITE_URL}/articles">${isArabic ? 'الأخبار' : 'Articles'}</a>
          <a href="${SITE_URL}/section/${encodeURIComponent(article.section || 'arabic')}">${escapeHtml(sectionLabel)}</a>
        </nav>
      </div>
    </header>
    <main class="shell">
      <div class="container">
        <article class="article">
          ${heroImage}
          <div class="article-inner">
            <div class="eyebrow">${escapeHtml(sectionLabel)}</div>
            <h1>${escapeHtml(title)}</h1>
            <div class="meta">
              <span>${escapeHtml(article.author || 'شبام24')}</span>
              <span>${escapeHtml(published)}</span>
              <span>${escapeHtml(sourceName)}</span>
            </div>
            ${summary ? `<div class="summary">${escapeHtml(summary)}</div>` : ''}
            <div class="content">${bodyHtml}</div>
            <div class="footer-meta">
              <span>${isArabic ? 'المصدر:' : 'Source:'}</span>
              ${sourceBlock}
              <span class="share-note">${isArabic ? 'رابط المشاركة الاحترافي:' : 'Canonical share URL:'} ${escapeHtml(canonicalUrl)}</span>
            </div>
            <a class="home-link" href="${SITE_URL}/">${isArabic ? 'العودة إلى الصفحة الرئيسية' : 'Back to homepage'}</a>
          </div>
        </article>
      </div>
    </main>
  </body>
</html>`;
}

function respond(res, status, body, contentType = 'text/html; charset=utf-8') {
  res.statusCode = status;
  res.setHeader('Content-Type', contentType);
  res.end(body);
}

export default async function handler(req, res) {
  try {
    const slug = String(req.query?.slug || '').trim();
    if (!slug) {
      return respond(res, 400, 'Missing article slug', 'text/plain; charset=utf-8');
    }

    const article = await fetchArticle(slug);
    if (!article) {
      res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
      return respond(res, 404, '<!doctype html><html lang="ar"><head><meta charset="utf-8"><title>المقال غير موجود</title></head><body>المقال غير موجود</body></html>');
    }

    const canonicalSlug = article.slug || article.id;
    const canonicalUrl = `${SITE_URL}/article/${encodeURIComponent(canonicalSlug)}`;
    const metaDescription = trimText(article.summary || article.content || article.title || '', 180);
    const sourceImage = extractFirstImageUrl(article);
    const ogImageUrl = sourceImage ? getOgImageUrl(sourceImage) : null;
    const isSocialBot = SOCIAL_BOT_RE.test(String(req.headers['user-agent'] || ''));

    if (!ogImageUrl && isSocialBot) {
      res.statusCode = 204;
      res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
      return res.end();
    }

    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
    return respond(res, 200, renderArticleHtml(article, canonicalUrl, metaDescription, ogImageUrl));
  } catch (error) {
    console.error('article handler error', error);
    return respond(res, 500, 'Internal Server Error', 'text/plain; charset=utf-8');
  }
}
