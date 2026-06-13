// Capture page/radio visit, enrich with country from request headers, insert into page_views.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const session_id: string = String(body.session_id || '').slice(0, 64);
    if (!session_id) {
      return new Response(JSON.stringify({ ok: false, error: 'missing session_id' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const view_type: string = body.view_type === 'radio' ? 'radio' : 'page';
    const path: string = String(body.path || '/').slice(0, 500);
    const article_id: string | null = body.article_id || null;
    const station_id: number | null = typeof body.station_id === 'number' ? body.station_id : null;
    const referrer: string | null = body.referrer ? String(body.referrer).slice(0, 500) : null;

    // Country from CDN headers (Cloudflare / Supabase Edge / Deno Deploy)
    const country =
      req.headers.get('cf-ipcountry') ||
      req.headers.get('x-vercel-ip-country') ||
      req.headers.get('x-country-code') ||
      req.headers.get('x-forwarded-country') ||
      null;
    const user_agent = (req.headers.get('user-agent') || '').slice(0, 300);

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/page_views`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        session_id, view_type, path, article_id, station_id,
        country, referrer, user_agent,
      }),
    });
    if (!insertRes.ok) {
      const t = await insertRes.text();
      return new Response(JSON.stringify({ ok: false, error: t }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
