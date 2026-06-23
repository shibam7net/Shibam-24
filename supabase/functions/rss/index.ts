// Public RSS 2.0 feed for the latest articles. Supports ?section=arabic|global and ?category=...
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.2";

const SITE = "https://shibam7net.github.io/Shibam-24";

function esc(s: string) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const section = url.searchParams.get("section");
  const category = url.searchParams.get("category");
  const limit = Math.min(Number(url.searchParams.get("limit") || 50), 200);

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let q = sb
    .from("articles")
    .select("id, slug, title, summary, image_url, category, section, author, published_at, source_name")
    .order("published_at", { ascending: false })
    .limit(limit);
  if (section) q = q.eq("section", section);
  if (category) q = q.eq("category", category);

  const { data: articles } = await q;
  const now = new Date().toUTCString();
  const title = section === "global" ? "Shibam24 — Global News" : "شبام24 — آخر الأخبار";
  const desc = section === "global"
    ? "Latest world news, politics, economy, technology and sports."
    : "آخر الأخبار العربية والعالمية، السياسة، الاقتصاد، الرياضة والتكنولوجيا.";

  const feedUrl = `${SITE}/functions/v1/rss${url.search}`;

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/" xmlns:dc="http://purl.org/dc/elements/1.1/">
<channel>
<title>${esc(title)}</title>
<link>${SITE}</link>
<description>${esc(desc)}</description>
<language>${section === "global" ? "en-us" : "ar"}</language>
<lastBuildDate>${now}</lastBuildDate>
<atom:link href="${esc(feedUrl)}" rel="self" type="application/rss+xml"/>`;

  for (const a of articles || []) {
    const link = `${SITE}/article/${encodeURIComponent(a.slug || a.id)}`;
    const pub = new Date(a.published_at).toUTCString();
    xml += `
<item>
  <title>${esc(a.title)}</title>
  <link>${link}</link>
  <guid isPermaLink="true">${link}</guid>
  <pubDate>${pub}</pubDate>
  <description>${esc(a.summary || "")}</description>
  <category>${esc(a.category || "")}</category>
  <dc:creator>${esc(a.author || a.source_name || "Shibam24")}</dc:creator>${
    a.image_url
      ? `\n  <enclosure url="${esc(a.image_url)}" type="image/jpeg"/>\n  <media:content url="${esc(a.image_url)}" medium="image"/>`
      : ""
  }
</item>`;
  }

  xml += `\n</channel>\n</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
