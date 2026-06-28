import { fetchArticles } from './_lib/supabase.js';
import { getArticleUrl, hasPercentEncoding, SITE_URL } from './_lib/article-url.js';

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

async function fetchText(url) {
  const response = await fetch(url, { headers: { Accept: 'text/plain, application/xml, text/xml' }, cache: 'no-store' });
  const text = await response.text();
  return { ok: response.ok, status: response.status, text };
}

export default async function handler(_req, res) {
  try {
    const articles = await fetchArticles({
      select: 'id,slug,title,published_at,created_at,section',
      limit: 200,
    });

    const articleUrls = (articles || []).map((article) => getArticleUrl(article));
    const expectedLatestUpdate = articles?.[0]?.created_at || articles?.[0]?.published_at || null;

    const sitemapUrl = `${SITE_URL}/sitemap.xml`;
    const newsSitemapUrl = `${SITE_URL}/news-sitemap.xml`;
    const robotsUrl = `${SITE_URL}/robots.txt`;

    const [sitemap, newsSitemap, robots] = await Promise.all([
      fetchText(sitemapUrl),
      fetchText(newsSitemapUrl),
      fetchText(robotsUrl),
    ]);

    const sampleArticleUrls = articleUrls.slice(0, 20);
    const sitemapHasValidArticleUrls = sampleArticleUrls.every((url) => sitemap.text.includes(url));
    const sitemapHasReadableUrls = !hasPercentEncoding(sitemap.text);
    const canonicalConsistency = sampleArticleUrls.every((url) => sitemap.text.includes(url) && !hasPercentEncoding(url));
    const robotsIncludesSitemaps = robots.text.includes(sitemapUrl) && robots.text.includes(newsSitemapUrl);
    const lastUpdatedMatches = expectedLatestUpdate ? sitemap.text.includes(expectedLatestUpdate) : true;

    const payload = {
      active: sitemap.ok && newsSitemap.ok && robots.ok && sitemapHasValidArticleUrls && sitemapHasReadableUrls,
      siteUrl: SITE_URL,
      sitemapUrl,
      newsSitemapUrl,
      robotsUrl,
      articleCount: articles?.length ?? 0,
      lastUpdated: expectedLatestUpdate,
      checks: {
        sitemapReachable: { ok: sitemap.ok, status: sitemap.status },
        newsSitemapReachable: { ok: newsSitemap.ok, status: newsSitemap.status },
        robotsReachable: { ok: robots.ok, status: robots.status },
        validArticleUrls: { ok: sitemapHasValidArticleUrls, checked: sampleArticleUrls.length },
        readableCanonicalUrls: { ok: sitemapHasReadableUrls && canonicalConsistency },
        robotsIncludesSitemaps: { ok: robotsIncludesSitemaps },
        lastUpdatedTimestamp: { ok: lastUpdatedMatches, expected: expectedLatestUpdate },
      },
    };

    res.setHeader('Cache-Control', 'no-store');
    return json(res, 200, payload);
  } catch (error) {
    console.error('seo status handler error', error);
    return json(res, 500, {
      active: false,
      error: 'Failed to verify sitemap status',
    });
  }
}
