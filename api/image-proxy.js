const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);
const BLOCKED_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);

function isPrivateIp(hostname) {
  return /^(10\.|127\.|169\.254\.|172\.(1[6-9]|2\d|3[0-1])\.|192\.168\.)/.test(hostname);
}

function badRequest(res, message) {
  res.statusCode = 400;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end(message);
}

export default async function handler(req, res) {
  try {
    const rawUrl = String(req.query?.url || '').trim();
    if (!rawUrl) return badRequest(res, 'Missing image url');

    let parsed;
    try {
      parsed = new URL(rawUrl);
    } catch {
      return badRequest(res, 'Invalid image url');
    }

    if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) return badRequest(res, 'Unsupported protocol');
    if (BLOCKED_HOSTS.has(parsed.hostname) || isPrivateIp(parsed.hostname)) return badRequest(res, 'Blocked hostname');

    const upstream = await fetch(parsed.toString(), {
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; Shibam24ImageProxy/1.0; +https://shibam-24.vercel.app)',
        'accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.9,ar;q=0.8',
        'referer': 'https://shibam-24.vercel.app/',
      },
      redirect: 'follow',
    });

    if (!upstream.ok) {
      res.statusCode = upstream.status;
      res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
      res.end();
      return;
    }

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    if (!contentType.startsWith('image/')) {
      return badRequest(res, 'Upstream resource is not an image');
    }

    const arrayBuffer = await upstream.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.statusCode = 200;
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', String(buffer.length));
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800');
    const etag = upstream.headers.get('etag');
    if (etag) res.setHeader('ETag', etag);
    const lastModified = upstream.headers.get('last-modified');
    if (lastModified) res.setHeader('Last-Modified', lastModified);
    res.end(buffer);
  } catch (error) {
    console.error('image proxy error', error);
    res.statusCode = 502;
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    res.end();
  }
}
