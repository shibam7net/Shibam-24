import { fetchSeoSettings } from './_lib/supabase.js';
import { SITE_URL } from './_lib/article-url.js';

function respond(res, status, body, contentType = 'text/plain; charset=utf-8') {
  res.statusCode = status;
  res.setHeader('Content-Type', contentType);
  res.end(body);
}

function normalizeRobotsText(source) {
  const raw = String(source || '').replace(/\r/g, '').trim();
  const lines = raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^sitemap\s*:/i.test(line));

  if (!lines.some((line) => /^user-agent\s*:/i.test(line))) {
    lines.unshift('User-agent: *');
  }

  if (!lines.some((line) => /^allow\s*:/i.test(line))) {
    lines.push('Allow: /');
  }

  if (!lines.some((line) => /^disallow\s*:\s*\/admin\b/i.test(line))) {
    lines.push('Disallow: /admin');
  }

  if (!lines.some((line) => /^disallow\s*:\s*\/dashboard\b/i.test(line))) {
    lines.push('Disallow: /dashboard');
  }

  lines.push(`Sitemap: ${SITE_URL}/sitemap.xml`);
  lines.push(`Sitemap: ${SITE_URL}/news-sitemap.xml`);
  return lines.join('\n') + '\n';
}

export default async function handler(_req, res) {
  try {
    const seoSetting = await fetchSeoSettings();
    const configured = seoSetting?.value?.robots_txt || [
      'User-agent: *',
      'Allow: /',
      'Disallow: /admin',
      'Disallow: /dashboard',
    ].join('\n');

    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=3600');
    return respond(res, 200, normalizeRobotsText(configured));
  } catch (error) {
    console.error('robots handler error', error);
    return respond(res, 500, 'Internal Server Error');
  }
}
