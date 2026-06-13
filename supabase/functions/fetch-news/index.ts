const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Get active sources
    const sourcesRes = await fetch(`${SUPABASE_URL}/rest/v1/sources?is_active=eq.true&select=*`, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
    const sources = await sourcesRes.json();
    if (!Array.isArray(sources) || sources.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No active sources', fetched: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let totalFetched = 0;

    for (const source of sources) {
      try {
        const articles = await fetchFromSource(source);
        if (articles.length === 0) continue;

        // Deduplicate by title
        const existingRes = await fetch(
          `${SUPABASE_URL}/rest/v1/articles?select=title&source_id=eq.${source.id}`,
          {
            headers: {
              'apikey': SUPABASE_SERVICE_ROLE_KEY,
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            },
          }
        );
        const existing = await existingRes.json();
        const existingTitles = new Set((existing || []).map((a: any) => a.title?.trim().toLowerCase()));

        const newArticles = articles.filter(
          (a) => !existingTitles.has(a.title?.trim().toLowerCase())
        );

        if (newArticles.length > 0) {
          const slice = newArticles.slice(0, 20);
          // NOTE: AI classification removed from sync path to avoid 150s timeout.
          // Articles are categorized via weighted keyword classifier below; a separate
          // background job can refine categories via ai-classify when AI credits allow.
          const aiMap: Record<string, string> = {};

          const toInsert = slice.map((a, idx) => {
            const title = cleanText(a.title);
            const summary = cleanText(a.summary || a.title);
            const slug = generateSlug(title) + '-' + Date.now().toString(36).slice(-4);
            const aiCat = aiMap[String(idx)];
            const fallbackCat = categorizeArticle(title, summary, source.section);
            return {
              title,
              summary,
              content: cleanText(a.content || a.summary || a.title),
              image_url: a.image_url || null,
              category: source.assigned_category || aiCat || fallbackCat,
              section: source.section,
              author: a.author || source.name,
              source_name: source.name,
              source_url: a.link || source.url,
              source_id: source.id,
              published_at: a.pubDate || new Date().toISOString(),
              tags: a.tags || [],
              trend_score: Math.floor(Math.random() * 40) + 50,
              slug,
            };
          });

          // Insert one by one to skip duplicates (unique index on title)
          let inserted = 0;
          for (const article of toInsert) {
            const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/articles`, {
              method: 'POST',
              headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal,resolution=ignore-duplicates',
              },
              body: JSON.stringify(article),
            });
            if (insertRes.ok) inserted++;
          }
          totalFetched += inserted;
        }

        // Update last_fetch
        await fetch(`${SUPABASE_URL}/rest/v1/sources?id=eq.${source.id}`, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({ last_fetch: new Date().toISOString() }),
        });
      } catch (err) {
        console.error(`Error fetching from ${source.name}:`, err);
      }
    }

    return new Response(JSON.stringify({ success: true, fetched: totalFetched }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Fetch news error:', error);
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function fetchFromSource(source: any): Promise<any[]> {
  try {
    const response = await fetch(source.url, {
      headers: { 'User-Agent': 'Shibam24/1.0' },
    });
    if (!response.ok) return [];
    const text = await response.text();
    return parseRSS(text);
  } catch {
    return [];
  }
}

function parseRSS(xml: string): any[] {
  const articles: any[] = [];
  const items = xml.split(/<item[\s>]/i).slice(1);

  for (const item of items) {
    const title = extractTag(item, 'title');
    if (!title) continue;

    const description = extractTag(item, 'description') || extractTag(item, 'summary') || '';
    const content = extractTag(item, 'content:encoded') || extractTag(item, 'content') || description;
    const link = extractTag(item, 'link') || extractTag(item, 'guid');
    const pubDate = extractTag(item, 'pubDate') || extractTag(item, 'dc:date') || extractTag(item, 'published');
    const author = extractTag(item, 'dc:creator') || extractTag(item, 'author') || '';

    // Extract image from media:content, enclosure, or content
    let image_url = '';
    const mediaMatch = item.match(/url=["']([^"']+\.(jpg|jpeg|png|webp|gif)[^"']*)/i);
    if (mediaMatch) image_url = mediaMatch[1];
    if (!image_url) {
      const imgMatch = description.match(/<img[^>]+src=["']([^"']+)/i) ||
                       content.match(/<img[^>]+src=["']([^"']+)/i);
      if (imgMatch) image_url = imgMatch[1];
    }
    const enclosureMatch = item.match(/<enclosure[^>]+url=["']([^"']+)/i);
    if (!image_url && enclosureMatch) image_url = enclosureMatch[1];

    // Clean HTML from summary
    const cleanSummary = description.replace(/<[^>]+>/g, '').trim().slice(0, 500);
    const cleanContent = content.replace(/<[^>]+>/g, '').trim();

    let parsedDate: string;
    try {
      parsedDate = new Date(pubDate || Date.now()).toISOString();
    } catch {
      parsedDate = new Date().toISOString();
    }

    articles.push({
      title: title.replace(/<!\[CDATA\[|\]\]>/g, '').trim(),
      summary: cleanSummary.replace(/<!\[CDATA\[|\]\]>/g, '').trim(),
      content: cleanContent.replace(/<!\[CDATA\[|\]\]>/g, '').trim() || cleanSummary,
      link,
      image_url: image_url || null,
      pubDate: parsedDate,
      author: author.replace(/<!\[CDATA\[|\]\]>/g, '').trim(),
      tags: [],
    });
  }
  return articles;
}

function extractTag(text: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}

// Weighted keyword classifier. Title matches count 3x, summary 1x.
// Returns the highest-scoring category, or a generic fallback.
const AR_RULES: Array<[string, RegExp]> = [
  ['عملات وأسعار', /\b(سعر(?:\s+ال)?(?:صرف|الذهب|النفط|البترول)|الذهب|الفضة|البترول|النفط|الدولار|اليورو|الريال|الجنيه|بورصة|تداول|سوق المال|عملات|عملة|بتكوين|كريبتو|فوركس|أسهم|مؤشر)/i],
  ['رياضة', /(كرة(?:\s+القدم|\s+السلة|\s+اليد)?|مباراة|بطولة|الدوري|هدف|لاعب|منتخب|مدرب|ملعب|كأس|أولمبي|فيفا|تنس|سباق|ماراثون|سباحة|ملاكمة|الهلال|النصر|الاتحاد|الأهلي|الزمالك|ريال مدريد|برشلونة|ليفربول|مانشستر|باريس سان|ميسي|رونالدو|مبابي|محمد صلاح|بنزيما|نيمار|تشامبيونزليج|دوري أبطال)/i],
  ['تكنولوجيا', /(تكنولوج|الذكاء الاصطناعي|ذكاء اصطناعي|تقنية|الإنترنت|آيفون|سامسونج|أندرويد|تطبيق|برمجة|روبوت|ميتافيرس|بلوكتشين|سيرفر|خوادم|google|apple|microsoft|openai|chatgpt|ai\b|فيسبوك|تويتر|تيك توك|يوتيوب|إنستغرام|واتساب)/i],
  ['صحة', /(صحة|طب|طبي|مرض|علاج|دواء|فيروس|لقاح|مستشفى|صيدلية|تغذية|حمية|سمنة|سكري|ضغط الدم|سرطان|قلب|كبد|كلى|عملية جراحية|طبيب|ممرض|الصحة النفسية|اكتئاب|وباء|جائحة|كورونا|كوفيد)/i],
  ['فن', /(سينما|مسرح|موسيقى|فيلم|أفلام|ممثل|ممثلة|مهرجان|حفل|أغنية|ألبوم|مسلسل|دراما|نجم|نجمة|فنان|فنانة|مخرج|إخراج|كليب|سينمائي|درامي)/i],
  ['ثقافة', /(أدب|كتاب|شعر|رواية|روائي|مكتبة|معرض كتاب|تراث|متحف|أثر(?:ي|ية)?|تاريخ|حضارة|اللغة العربية|الخط العربي|مثقف|ثقاف)/i],
  ['مقالات', /(مقال|مقالة|رأي|تحليل|تعليق|افتتاحية|عمود|قراءة في|وجهة نظر)/i],
  ['أخبار محلية', /(اليمن|صنعاء|عدن|حضرموت|تعز|إب|مأرب|أبين|شبوة|لحج|الضالع|البيضاء|حجة|صعدة|عمران|ذمار|المهرة|سقطرى|ريمة|المكلا|سيئون|شبام|محافظ|بلدية|محلي)/i],
  ['اقتصاد', /(اقتصاد|مالي|تجارة|بنك|استثمار|ميزانية|ضريبة|تضخم|الناتج المحلي|صادرات|واردات|شركة|أعمال|مشروع|تنمية|فقر|بطالة|قروض|تمويل|صندوق النقد|البنك الدولي)/i],
  ['سياسة', /(سياس|رئيس|الحكومة|البرلمان|انتخابات|وزير|دبلوماس|سفير|مجلس(?:\s+الأمن|\s+الوزراء|\s+النواب)?|قمة|حزب|معارضة|سلطة|نظام|ترامب|بوتين|بايدن|ماكرون|نتنياهو|أردوغان|الحرب|عسكر|جيش|قصف|غارة|صاروخ|دفاع|هجوم|اشتباك|معارك|مقاتل|قوات|تحالف|مفاوضات|اتفاق|هدنة|سلام|أزمة|توتر|إرهاب|داعش|طالبان|حماس|حزب الله|إيران|إسرائيل|فلسطين|أوكرانيا|روسيا|سوريا|لبنان|العراق|ليبيا|السودان|ناتو|الأمم المتحدة|غزة|الضفة|القدس)/i],
];

const EN_RULES: Array<[string, RegExp]> = [
  ['Markets', /\b(currency|exchange rate|gold price|silver|crude|forex|crypto|bitcoin|ethereum|stock(?: market)?|nasdaq|dow jones|s&p 500|wall street|bonds?|treasury yield|commodit)/i],
  ['Sports', /\b(football|soccer|basketball|tennis|olympic|athlete|goal|league|champion|coach|stadium|fifa|uefa|nba|nfl|mlb|nhl|premier league|la liga|bundesliga|serie a|messi|ronaldo|salah|mbappe|cricket|rugby|boxing|wrestling|formula\s?1|f1|grand prix)/i],
  ['Technology', /\b(ai|artificial intelligence|chatgpt|openai|google|apple|microsoft|meta|tesla|nvidia|software|hardware|smartphone|iphone|android|app store|cyber(?:security|attack)?|hack(?:er|ed|ing)|startup|silicon valley|blockchain|crypto wallet|metaverse|robot|drone|saas|cloud comput)/i],
  ['Health', /\b(health|medical|disease|treatment|virus|vaccin|drug|hospital|pharma|nutrition|diet|obesity|diabet|cancer|heart attack|stroke|liver|kidney|surgery|doctor|nurse|mental health|depression|pandemic|covid|wh?o\b)/i],
  ['Art', /\b(cinema|theater|theatre|music|film|movie|actor|actress|festival|concert|album|series|drama|director|hollywood|netflix|oscar|grammy|cannes)/i],
  ['Culture', /\b(book|literature|museum|heritage|history|historical|archaeolog|civiliz|poetry|novel|exhibition|gallery)/i],
  ['Articles', /\b(opinion|analysis|editorial|commentary|column|op[\-\s]?ed|perspective)/i],
  ['Local News', /\b(local|city council|state(?:wide)?|county|municipal|township|community|neighborhood|mayor|sheriff)/i],
  ['Economy', /\b(econom|financ|market|trade(?:\s+deal)?|bank(?:ing)?|dollar|euro|inflation|gdp|export|import|business|invest(?:or|ment)?|tax|debt|recession|company|earnings|revenue|profit|imf|world bank|federal reserve|fed\b)/i],
  ['Politics', /\b(politic|president|government|parliament|election|minister|senate|congress|trump|putin|biden|macron|netanyahu|erdogan|xi jinping|war|military|army|airstrike|missile|attack|bomb|troops|coalition|nato|cease.?fire|peace deal|conflict|crisis|terror|hamas|hezbollah|iran|israel|palest|ukrain|russia|syria|lebanon|iraq|sudan|gaza|west bank|united nations|security council|diplomat|embassy|sanctions?)/i],
];

function scoreCategory(title: string, summary: string, rules: Array<[string, RegExp]>): string | null {
  const scores: Record<string, number> = {};
  for (const [cat, rx] of rules) {
    const t = (title.match(new RegExp(rx, rx.flags.includes('g') ? rx.flags : rx.flags + 'g')) || []).length;
    const s = (summary.match(new RegExp(rx, rx.flags.includes('g') ? rx.flags : rx.flags + 'g')) || []).length;
    const score = t * 3 + s;
    if (score > 0) scores[cat] = (scores[cat] || 0) + score;
  }
  let best: string | null = null;
  let max = 0;
  for (const [cat, sc] of Object.entries(scores)) {
    if (sc > max) { max = sc; best = cat; }
  }
  return best;
}

function categorizeArticle(title: string, summary: string, section: string): string {
  if (section === 'arabic') {
    return scoreCategory(title, summary, AR_RULES) || 'أخبار';
  }
  return scoreCategory(title, summary, EN_RULES) || 'News';
}

function cleanText(text: string): string {
  return text
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function generateSlug(title: string): string {
  let slug = title.toLowerCase().trim();
  slug = slug.replace(/&[a-z]+;/g, '');
  slug = slug.replace(/[^\w\s\-\u0600-\u06FF]/g, '');
  slug = slug.replace(/\s+/g, '-');
  slug = slug.replace(/-+/g, '-');
  slug = slug.replace(/^-|-$/g, '');
  slug = slug.slice(0, 80);
  return slug || 'article';
}
