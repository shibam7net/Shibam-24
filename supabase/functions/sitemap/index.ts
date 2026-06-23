import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/xml; charset=utf-8",
};

const PAGE_SIZE = 50;

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  const siteUrl = "https://shibam7net.github.io/Shibam-24";

  const { data: articles, count } = await supabase
    .from("articles")
    .select("slug, id, published_at, created_at, section", { count: "exact" })
    .order("published_at", { ascending: false })
    .limit(5000);

  const totalArticles = count ?? articles?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalArticles / PAGE_SIZE));

  // Count by section for section pagination
  const arabicCount = articles?.filter((a) => a.section === "arabic").length ?? 0;
  const globalCount = articles?.filter((a) => a.section === "global").length ?? 0;
  const arabicPages = Math.max(1, Math.ceil(arabicCount / PAGE_SIZE));
  const globalPages = Math.max(1, Math.ceil(globalCount / PAGE_SIZE));

  const now = new Date().toISOString();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  <url>
    <loc>${siteUrl}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>always</changefreq>
    <priority>1.0</priority>
  </url>
  <url><loc>${siteUrl}/about</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>
  <url><loc>${siteUrl}/privacy-policy</loc><changefreq>yearly</changefreq><priority>0.3</priority></url>
  <url><loc>${siteUrl}/terms</loc><changefreq>yearly</changefreq><priority>0.3</priority></url>
  <url><loc>${siteUrl}/articles</loc><changefreq>daily</changefreq><priority>0.8</priority></url>
  <url><loc>${siteUrl}/section/arabic</loc><changefreq>hourly</changefreq><priority>0.9</priority></url>
  <url><loc>${siteUrl}/section/global</loc><changefreq>hourly</changefreq><priority>0.9</priority></url>`;

  // Homepage pagination
  for (let p = 2; p <= Math.min(totalPages, 100); p++) {
    xml += `\n  <url><loc>${siteUrl}/page/${p}</loc><changefreq>daily</changefreq><priority>0.6</priority></url>`;
  }
  // Section pagination
  for (let p = 2; p <= Math.min(arabicPages, 100); p++) {
    xml += `\n  <url><loc>${siteUrl}/section/arabic/page/${p}</loc><changefreq>daily</changefreq><priority>0.6</priority></url>`;
  }
  for (let p = 2; p <= Math.min(globalPages, 100); p++) {
    xml += `\n  <url><loc>${siteUrl}/section/global/page/${p}</loc><changefreq>daily</changefreq><priority>0.6</priority></url>`;
  }

  for (const a of articles || []) {
    const slug = a.slug || a.id;
    const lastmod = a.created_at || a.published_at;
    const pubDate = new Date(a.published_at);
    const hoursSincePublish = (Date.now() - pubDate.getTime()) / 3600000;

    xml += `
  <url>
    <loc>${siteUrl}/article/${encodeURIComponent(slug)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${hoursSincePublish < 48 ? 'hourly' : 'weekly'}</changefreq>
    <priority>${hoursSincePublish < 48 ? '0.8' : '0.6'}</priority>
  </url>`;
  }

  xml += `\n</urlset>`;

  return new Response(xml, { headers: corsHeaders });
});
