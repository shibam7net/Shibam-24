import { fetchArticles } from './_lib/supabase.js';
import { getArticleUrl, xmlEscape } from './_lib/article-url.js';

function respond(res, status, body, contentType = 'application/xml; charset=utf-8') {
  res.statusCode = status;
  res.setHeader('Content-Type', contentType);
  res.end(body);
}

const XML_STYLESHEET = '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>';

function buildFallbackNewsSitemap() {
  return `<?xml version="1.0" encoding="UTF-8"?>\n${XML_STYLESHEET}
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
</urlset>`;
}

export default async function handler(_req, res) {
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=3600');

  try {
    const since = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
    const articles = await fetchArticles({
      select: 'id,slug,title,published_at,section,tags',
      limit: 1000,
      gtePublishedAt: since,
    });

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n${XML_STYLESHEET}
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">`;

    for (const article of articles || []) {
      const lang = article.section === 'global' ? 'en' : 'ar';
      const tags = Array.isArray(article.tags) ? article.tags.slice(0, 5).join(', ') : '';
      xml += `
  <url>
    <loc>${xmlEscape(getArticleUrl(article))}</loc>
    <news:news>
      <news:publication>
        <news:name>شبام 24</news:name>
        <news:language>${lang}</news:language>
      </news:publication>
      <news:publication_date>${xmlEscape(new Date(article.published_at).toISOString())}</news:publication_date>
      <news:title>${xmlEscape(article.title)}</news:title>${tags ? `
      <news:keywords>${xmlEscape(tags)}</news:keywords>` : ''}
    </news:news>
  </url>`;
    }

    xml += '\n</urlset>';
    return respond(res, 200, xml);
  } catch (error) {
    console.error('news sitemap handler error', error);
    return respond(res, 200, buildFallbackNewsSitemap());
  }
}
