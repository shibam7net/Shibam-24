// AI-powered semantic + entity-aware news classifier.
// - Dynamic categories pulled from DB (sources.assigned_category + articles.category)
// - Uses Lovable AI Gateway (google/gemini-3-flash-preview) for semantic + entity reasoning
// - Batch reclassification supported

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const AI_KEY = Deno.env.get('OPENROUTER_API_KEY') || Deno.env.get('LOVABLE_API_KEY');
if (!AI_KEY) throw new Error('AI key not configured');
const USING_OPENROUTER = !!Deno.env.get('OPENROUTER_API_KEY');
const AI_URL = USING_OPENROUTER ? 'https://openrouter.ai/api/v1/chat/completions' : 'https://ai.gateway.lovable.dev/v1/chat/completions';
const MODEL = Deno.env.get('AI_MODEL') || (USING_OPENROUTER ? 'google/gemini-2.5-flash' : 'google/gemini-3-flash-preview');

async function sb(path: string, init: RequestInit = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
}

const FALLBACK_AR = ['سياسة','اقتصاد','رياضة','صحة','تكنولوجيا','فن','ثقافة','مقالات','أخبار محلية','عملات وأسعار','منوعات'];
const FALLBACK_EN = ['Politics','Economy','Sports','Health','Technology','Art','Culture','Articles','Local News','Markets','News'];

async function getDynamicCategories(section: 'arabic' | 'global'): Promise<string[]> {
  const cats = new Set<string>();
  // From sources
  const s = await sb(`sources?select=assigned_category,section&section=eq.${section}`);
  if (s.ok) {
    const rows = await s.json();
    for (const r of rows) if (r.assigned_category && r.assigned_category.trim()) cats.add(r.assigned_category.trim());
  }
  // From existing articles
  const a = await sb(`articles?select=category&section=eq.${section}&limit=2000`);
  if (a.ok) {
    const rows = await a.json();
    for (const r of rows) if (r.category && r.category.trim()) cats.add(r.category.trim());
  }
  // Add fallbacks to ensure coverage
  const baseline = section === 'arabic' ? FALLBACK_AR : FALLBACK_EN;
  for (const c of baseline) cats.add(c);
  return [...cats];
}

async function aiClassifyBatch(
  items: { id: string; title: string; summary: string }[],
  categories: string[],
  section: 'arabic' | 'global',
): Promise<Record<string, { category: string; confidence: number }>> {
  const lang = section === 'arabic' ? 'Arabic' : 'English';
  const system = `You are an expert multilingual news classifier with entity recognition.
TASK: Classify each ${lang} news item into EXACTLY ONE category from the provided list.
RULES:
- Use semantic understanding, NOT keyword matching.
- Recognize entities: athletes/teams -> Sports; politicians/wars/parties (e.g. Hamas, Hezbollah) -> Politics; banks/currencies/markets -> Economy or Markets; artists/movies/songs -> Art; diseases/epidemics (cholera, COVID) -> Health; tech companies/AI/devices -> Technology; opinion/analysis pieces -> Articles.
- Never confuse Politics with Sports. Never bucket a health story under generic News.
- If you cannot pick with confidence >= 0.55, use the generic catch-all category from the list ("منوعات" / "News").
- Score every option mentally then pick argmax.
OUTPUT: STRICT JSON only: {"results":[{"id":"...","category":"...","confidence":0.0}]}
Category MUST be copied verbatim from the allowed list.`;

  const user = `ALLOWED CATEGORIES (verbatim):
${JSON.stringify(categories)}

ITEMS:
${JSON.stringify(items.map(i => ({ id: i.id, title: i.title, summary: (i.summary || '').slice(0, 600) })))}`;

  let res: Response | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    res = await fetch(AI_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AI_KEY}`,
        'Content-Type': 'application/json',
        ...(USING_OPENROUTER ? { 'HTTP-Referer': 'https://shibam7net.github.io/Shibam-24/', 'X-Title': 'Shibam-24' } : {}),
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        response_format: { type: 'json_object' },
      }),
    });
    if (res.status !== 429) break;
    const wait = 2000 * Math.pow(2, attempt) + Math.random() * 1000;
    console.warn(`AI rate-limited, backoff ${Math.round(wait)}ms (attempt ${attempt + 1})`);
    await new Promise((r) => setTimeout(r, wait));
  }

  if (!res || !res.ok) {
    const txt = res ? await res.text() : 'no response';
    throw new Error(`AI ${res?.status}: ${txt.slice(0, 200)}`);
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '{}';
  let parsed: any = {};
  try { parsed = JSON.parse(content); } catch { parsed = {}; }
  const out: Record<string, { category: string; confidence: number }> = {};
  const allowed = new Set(categories);
  const fallback = section === 'arabic' ? 'منوعات' : 'News';
  for (const r of (parsed.results || [])) {
    const cat = allowed.has(r.category) ? r.category : fallback;
    out[r.id] = { category: cat, confidence: Number(r.confidence) || 0 };
  }
  return out;
}

export async function classifyArticles(
  items: { id: string; title: string; summary: string; section: 'arabic' | 'global' }[],
): Promise<Record<string, { category: string; confidence: number }>> {
  const bySection: Record<string, typeof items> = { arabic: [], global: [] };
  for (const it of items) (bySection[it.section] ||= []).push(it);
  const result: Record<string, { category: string; confidence: number }> = {};
  for (const section of ['arabic', 'global'] as const) {
    const list = bySection[section];
    if (!list?.length) continue;
    const categories = await getDynamicCategories(section);
    // chunk 10 per AI call
    for (let i = 0; i < list.length; i += 25) {
      const chunk = list.slice(i, i + 25);
      try {
        const r = await aiClassifyBatch(chunk, categories, section);
        Object.assign(result, r);
      } catch (e) {
        console.error('classify chunk error', e);
      }
    }
  }
  return result;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const mode = body.mode || 'classify';

    // Mode 1: ad-hoc classify provided items
    if (mode === 'classify' && Array.isArray(body.items)) {
      const result = await classifyArticles(body.items);
      return new Response(JSON.stringify({ success: true, result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Mode 2: reclassify articles in DB (batched)
    if (mode === 'reclassify') {
      const limit = Math.min(Number(body.limit) || 100, 500);
      const section = body.section as 'arabic' | 'global' | undefined;
      const onlyCategory = body.only_category as string | undefined;
      const offset = Number(body.offset) || 0;

      let q = `articles?select=id,title,summary,section,category&order=published_at.desc&limit=${limit}&offset=${offset}`;
      if (section) q += `&section=eq.${section}`;
      if (onlyCategory) q += `&category=eq.${encodeURIComponent(onlyCategory)}`;

      const r = await sb(q);
      const rows = await r.json();
      if (!Array.isArray(rows) || rows.length === 0) {
        return new Response(JSON.stringify({ success: true, updated: 0, processed: 0 }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const classified = await classifyArticles(rows.map((a: any) => ({
        id: a.id, title: a.title, summary: a.summary, section: a.section,
      })));

      let updated = 0;
      for (const a of rows) {
        const c = classified[a.id];
        if (!c) continue;
        if (c.confidence < 0.5) continue;
        if (c.category && c.category !== a.category) {
          const up = await sb(`articles?id=eq.${a.id}`, {
            method: 'PATCH',
            headers: { Prefer: 'return=minimal' },
            body: JSON.stringify({ category: c.category }),
          });
          if (up.ok) updated++;
        }
      }

      return new Response(JSON.stringify({ success: true, processed: rows.length, updated }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: false, error: 'Unknown mode' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('ai-classify error', e);
    return new Response(JSON.stringify({ success: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
