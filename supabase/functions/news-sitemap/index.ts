// Google News sitemap — articles from the last 48 hours only (per Google News spec).
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

Deno.serve(async () => {
  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const since = new Date(Date.now() - 48 * 3600 * 1000).toISOString();

  const { data: articles } = await sb
    .from("articles")
    .select("id, slug, title, published_at, section, tags")
    .gte("published_at", since)
    .order("published_at", { ascending: false })
    .limit(1000);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">`;

  for (const a of articles || []) {
    const slug = a.slug || a.id;
    const lang = a.section === "global" ? "en" : "ar";
    const tags = Array.isArray(a.tags) ? a.tags.slice(0, 5).join(", ") : "";
    xml += `
  <url>
    <loc>${SITE}/article/${encodeURIComponent(slug)}</loc>
    <news:news>
      <news:publication>
        <news:name>Shibam24</news:name>
        <news:language>${lang}</news:language>
      </news:publication>
      <news:publication_date>${new Date(a.published_at).toISOString()}</news:publication_date>
      <news:title>${esc(a.title)}</news:title>${
        tags ? `\n      <news:keywords>${esc(tags)}</news:keywords>` : ""
      }
    </news:news>
  </url>`;
  }

  xml += `\n</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
