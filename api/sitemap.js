import { fetchArticles } from './_lib/supabase.js';
import { getArticleUrl, xmlEscape, SITE_URL } from './_lib/article-url.js';

const PAGE_SIZE = 50;

function respond(res, status, body, contentType = 'application/xml; charset=utf-8') {
  res.statusCode = status;
  res.setHeader('Content-Type', contentType);
  res.end(body);
}

const XML_STYLESHEET = '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>';

function buildFallbackSitemap(now = new Date().toISOString()) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n${XML_STYLESHEET}
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${xmlEscape(`${SITE_URL}/`)}</loc>
    <lastmod>${xmlEscape(now)}</lastmod>
    <changefreq>always</changefreq>
    <priority>1.0</priority>
  </url>
  <url><loc>${xmlEscape(`${SITE_URL}/about`)}</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>
  <url><loc>${xmlEscape(`${SITE_URL}/privacy-policy`)}</loc><changefreq>yearly</changefreq><priority>0.3</priority></url>
  <url><loc>${xmlEscape(`${SITE_URL}/terms`)}</loc><changefreq>yearly</changefreq><priority>0.3</priority></url>
  <url><loc>${xmlEscape(`${SITE_URL}/articles`)}</loc><lastmod>${xmlEscape(now)}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>
  <url><loc>${xmlEscape(`${SITE_URL}/section/arabic`)}</loc><lastmod>${xmlEscape(now)}</lastmod><changefreq>hourly</changefreq><priority>0.9</priority></url>
  <url><loc>${xmlEscape(`${SITE_URL}/section/global`)}</loc><lastmod>${xmlEscape(now)}</lastmod><changefreq>hourly</changefreq><priority>0.9</priority></url>
</urlset>`;
}

export default async function handler(_req, res) {
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=3600');

  try {
    const articles = await fetchArticles({
      select: 'id,slug,title,published_at,created_at,section',
      limit: 5000,
    });

    const totalArticles = articles?.length ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalArticles / PAGE_SIZE));
    const arabicCount = articles?.filter((a) => a.section === 'arabic').length ?? 0;
    const globalCount = articles?.filter((a) => a.section === 'global').length ?? 0;
    const arabicPages = Math.max(1, Math.ceil(arabicCount / PAGE_SIZE));
    const globalPages = Math.max(1, Math.ceil(globalCount / PAGE_SIZE));
    const latestArticleUpdate = articles?.[0]?.created_at || articles?.[0]?.published_at || new Date().toISOString();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n${XML_STYLESHEET}
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${xmlEscape(`${SITE_URL}/`)}</loc>
    <lastmod>${xmlEscape(latestArticleUpdate)}</lastmod>
    <changefreq>always</changefreq>
    <priority>1.0</priority>
  </url>
  <url><loc>${xmlEscape(`${SITE_URL}/about`)}</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>
  <url><loc>${xmlEscape(`${SITE_URL}/privacy-policy`)}</loc><changefreq>yearly</changefreq><priority>0.3</priority></url>
  <url><loc>${xmlEscape(`${SITE_URL}/terms`)}</loc><changefreq>yearly</changefreq><priority>0.3</priority></url>
  <url><loc>${xmlEscape(`${SITE_URL}/articles`)}</loc><lastmod>${xmlEscape(latestArticleUpdate)}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>
  <url><loc>${xmlEscape(`${SITE_URL}/section/arabic`)}</loc><lastmod>${xmlEscape(latestArticleUpdate)}</lastmod><changefreq>hourly</changefreq><priority>0.9</priority></url>
  <url><loc>${xmlEscape(`${SITE_URL}/section/global`)}</loc><lastmod>${xmlEscape(latestArticleUpdate)}</lastmod><changefreq>hourly</changefreq><priority>0.9</priority></url>`;

    for (let p = 2; p <= Math.min(totalPages, 100); p += 1) {
      xml += `\n  <url><loc>${xmlEscape(`${SITE_URL}/page/${p}`)}</loc><lastmod>${xmlEscape(latestArticleUpdate)}</lastmod><changefreq>daily</changefreq><priority>0.6</priority></url>`;
    }

    for (let p = 2; p <= Math.min(arabicPages, 100); p += 1) {
      xml += `\n  <url><loc>${xmlEscape(`${SITE_URL}/section/arabic/page/${p}`)}</loc><lastmod>${xmlEscape(latestArticleUpdate)}</lastmod><changefreq>daily</changefreq><priority>0.6</priority></url>`;
    }

    for (let p = 2; p <= Math.min(globalPages, 100); p += 1) {
      xml += `\n  <url><loc>${xmlEscape(`${SITE_URL}/section/global/page/${p}`)}</loc><lastmod>${xmlEscape(latestArticleUpdate)}</lastmod><changefreq>daily</changefreq><priority>0.6</priority></url>`;
    }

    for (const article of articles || []) {
      const lastmod = article.created_at || article.published_at;
      const publishedAt = new Date(article.published_at);
      const hoursSincePublish = Number.isNaN(publishedAt.getTime()) ? 999 : (Date.now() - publishedAt.getTime()) / 3600000;
      xml += `
  <url>
    <loc>${xmlEscape(getArticleUrl(article))}</loc>
    <lastmod>${xmlEscape(lastmod)}</lastmod>
    <changefreq>${hoursSincePublish < 48 ? 'hourly' : 'weekly'}</changefreq>
    <priority>${hoursSincePublish < 48 ? '0.8' : '0.6'}</priority>
  </url>`;
    }

    xml += '\n</urlset>';
    return respond(res, 200, xml);
  } catch (error) {
    console.error('sitemap handler error', error);
    return respond(res, 200, buildFallbackSitemap());
  }
}
