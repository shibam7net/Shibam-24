import { fetchArticles } from './_lib/supabase.js';
import { getArticleUrl, hasPercentEncoding, SITE_URL } from './_lib/article-url.js';

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function extractTagValues(xml, tagName) {
  const regex = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'gi');
  const values = [];
  let match;
  while ((match = regex.exec(String(xml || '')))) {
    values.push(match[1].trim());
  }
  return values;
}

async function fetchText(url) {
  const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}seo_check=${Date.now()}`, {
    headers: { Accept: 'text/plain, application/xml, text/xml, application/json' },
    cache: 'no-store',
  });
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

    const sitemapLocs = extractTagValues(sitemap.text, 'loc');
    const newsLocs = extractTagValues(newsSitemap.text, 'loc');
    const sitemapLocSet = new Set(sitemapLocs);
    const newsLocSet = new Set(newsLocs);
    const sampleArticleUrls = articleUrls.slice(0, 20);
    const sampleNewsUrls = articleUrls.slice(0, 20).filter((url) => newsLocSet.has(url));

    const sitemapHasValidArticleUrls = sampleArticleUrls.every((url) => sitemapLocSet.has(url));
    const sitemapHasReadableUrls = sitemapLocs.every((loc) => !hasPercentEncoding(loc));
    const newsHasReadableUrls = newsLocs.every((loc) => !hasPercentEncoding(loc));
    const canonicalConsistency = sampleArticleUrls.every((url) => !hasPercentEncoding(url));
    const robotsIncludesSitemaps = robots.text.includes(sitemapUrl) && robots.text.includes(newsSitemapUrl);
    const sitemapLastmods = extractTagValues(sitemap.text, 'lastmod');
    const lastUpdatedMatches = expectedLatestUpdate ? sitemapLastmods.includes(expectedLatestUpdate) : true;

    const payload = {
      active: sitemap.ok && newsSitemap.ok && robots.ok && sitemapHasValidArticleUrls && sitemapHasReadableUrls && newsHasReadableUrls && canonicalConsistency && robotsIncludesSitemaps && lastUpdatedMatches,
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
        readableCanonicalUrls: { ok: sitemapHasReadableUrls && newsHasReadableUrls && canonicalConsistency, checked: sitemapLocs.length + newsLocs.length },
        robotsIncludesSitemaps: { ok: robotsIncludesSitemaps },
        lastUpdatedTimestamp: { ok: lastUpdatedMatches, expected: expectedLatestUpdate },
      },
      samples: {
        sitemapLocs: sitemapLocs.slice(0, 5),
        newsLocs: sampleNewsUrls.slice(0, 5),
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
