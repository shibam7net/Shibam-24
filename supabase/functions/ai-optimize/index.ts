const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const AI_KEY = Deno.env.get('OPENROUTER_API_KEY') || Deno.env.get('LOVABLE_API_KEY');
    if (!AI_KEY) throw new Error('AI key not configured');
    const usingOpenRouter = !!Deno.env.get('OPENROUTER_API_KEY');
    const AI_URL = usingOpenRouter
      ? 'https://openrouter.ai/api/v1/chat/completions'
      : 'https://ai.gateway.lovable.dev/v1/chat/completions';
    const MODEL = Deno.env.get('AI_MODEL') || (usingOpenRouter ? 'google/gemini-2.5-flash' : 'google/gemini-3-flash-preview');
    const aiHeaders: Record<string, string> = {
      'Authorization': `Bearer ${AI_KEY}`,
      'Content-Type': 'application/json',
    };
    if (usingOpenRouter) {
      aiHeaders['HTTP-Referer'] = 'https://shibam7net.github.io/Shibam-24/';
      aiHeaders['X-Title'] = 'Shibam-24';
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const { articleId, action, title: inTitle, summary: inSummary, content: inContent, sourceUrl: inSourceUrl, section: inSection } = await req.json();

    // Editor-mode: AI tools called from the article editor (no DB read/write)
    if (action?.startsWith('editor-')) {
      const editorAction = action.replace('editor-', '');
      const isArabic = inSection === 'arabic';
      const lang = isArabic ? 'Arabic' : 'English';
      let prompt = '';

      if (editorAction === 'improve-title') {
        prompt = `Suggest a stronger, more engaging ${lang} news title for this article. Keep the meaning. Title: ${inTitle}\nContent snippet: ${inContent?.slice(0, 300)}\n\nReturn JSON: {"title":"improved title"}`;
      } else if (editorAction === 'rewrite') {
        prompt = `Rewrite this ${lang} news article with unique wording. Keep the meaning 100%.\nTitle: ${inTitle}\nContent: ${inContent}\n\nReturn JSON: {"title":"rewritten title","content":"rewritten content"}`;
      } else if (editorAction === 'improve') {
        prompt = `Improve the writing style, grammar, and flow of this ${lang} article professionally. Keep the meaning.\nContent: ${inContent}\n\nReturn JSON: {"content":"improved content"}`;
      } else if (editorAction === 'full-rewrite') {
        prompt = `Completely restructure and rewrite this ${lang} article in an organized, sequential manner. Remove any off-topic content. Keep only what's relevant.\nTitle: ${inTitle}\nContent: ${inContent}\n\nReturn JSON: {"title":"new title","summary":"2-3 line summary","content":"fully restructured content"}`;
      } else if (editorAction === 'seo') {
        prompt = `Extract 5-10 relevant SEO hashtags/keywords for this ${lang} article. Return short, relevant tags without the # symbol.\nTitle: ${inTitle}\nContent: ${inContent?.slice(0, 500)}\n\nReturn JSON: {"tags":["tag1","tag2","tag3"]}`;
      } else if (editorAction === 'summarize') {
        prompt = `Write a concise 2-3 line summary for this ${lang} article:\nTitle: ${inTitle}\nContent: ${inContent}\n\nReturn JSON: {"summary":"concise summary"}`;
      } else if (editorAction === 'fetch-details') {
        prompt = `You are given a news article title and a source URL. Imagine you are fetching the full details of this story. Write a comprehensive, detailed ${lang} news article based on the title. Remove any symbols, irrelevant dates, or unrelated info. Focus only on the core news story.\nTitle: ${inTitle}\nSource: ${inSourceUrl}\nExisting content: ${inContent?.slice(0, 300)}\n\nReturn JSON: {"title":"detailed title","content":"full detailed article"}`;
      } else {
        return new Response(JSON.stringify({ error: 'Unknown editor action' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const aiRes = await fetch(AI_URL, {
        method: 'POST',
        headers: aiHeaders,
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: 'You are a professional journalist. Respond in valid JSON only.' },
            { role: 'user', content: prompt },
          ],
          response_format: { type: 'json_object' },
        }),
      });

      if (!aiRes.ok) {
        const status = aiRes.status;
        if (status === 429) return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        if (status === 402) return new Response(JSON.stringify({ error: 'Credits exhausted' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        throw new Error(`AI gateway error: ${status}`);
      }

      const aiData = await aiRes.json();
      const raw = aiData.choices?.[0]?.message?.content || '';
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Could not parse AI response');
      const result = JSON.parse(jsonMatch[0]);

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Original DB-based flow
    // action: 'optimize' (full), 'rewrite', 'summarize', 'categorize'

    if (!articleId) {
      return new Response(JSON.stringify({ error: 'articleId required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch article
    const artRes = await fetch(`${SUPABASE_URL}/rest/v1/articles?id=eq.${articleId}&select=*`, {
      headers: { 'apikey': SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
    });
    const arts = await artRes.json();
    if (!arts || arts.length === 0) {
      return new Response(JSON.stringify({ error: 'Article not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const article = arts[0];

    // Check for duplicates
    if (action === 'optimize' || action === 'check-duplicate') {
      const dupRes = await fetch(
        `${SUPABASE_URL}/rest/v1/articles?id=neq.${articleId}&select=id,title&limit=100`,
        { headers: { 'apikey': SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } }
      );
      const otherArticles = await dupRes.json();
      const titleLower = article.title.toLowerCase().trim();
      const duplicate = (otherArticles || []).find((a: any) => {
        const t = a.title.toLowerCase().trim();
        return t === titleLower || similarity(t, titleLower) > 0.85;
      });
      if (duplicate) {
        return new Response(JSON.stringify({ 
          error: 'duplicate', 
          message: `مقال مشابه موجود بالفعل: "${duplicate.title}"`,
          duplicateId: duplicate.id 
        }), {
          status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const isArabic = article.section === 'arabic';
    const lang = isArabic ? 'Arabic' : 'English';

    let prompt = '';
    if (action === 'rewrite') {
      prompt = buildRewritePrompt(article, lang);
    } else if (action === 'summarize') {
      prompt = buildSummarizePrompt(article, lang);
    } else if (action === 'categorize') {
      prompt = buildCategorizePrompt(article, lang, isArabic);
    } else {
      // Full optimize
      prompt = buildFullOptimizePrompt(article, lang, isArabic);
    }

    const aiResponse = await fetch(AI_URL, {
      method: 'POST',
      headers: aiHeaders,
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: 'You are a professional journalist and SEO expert. Always respond in valid JSON only, no extra text.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (status === 402) return new Response(JSON.stringify({ error: 'Credits exhausted' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const raw = aiData.choices?.[0]?.message?.content || '';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Could not parse AI response');

    const result = JSON.parse(jsonMatch[0]);

    // Generate slug from title
    const newTitle = result.title || article.title;
    const slug = generateSlug(newTitle);

    // Build update payload
    const update: Record<string, any> = { slug };
    if (result.title) update.title = cleanText(result.title);
    if (result.content) update.content = cleanText(result.content);
    if (result.summary) update.summary = cleanText(result.summary);
    if (result.category) update.category = result.category;

    // Add source attribution
    if (article.source_url && result.content) {
      const sourceLabel = isArabic ? 'المصدر' : 'Source';
      if (!update.content.includes(article.source_url)) {
        update.content += `\n\n${sourceLabel}: ${article.source_url}`;
      }
    }

    // Ensure slug uniqueness
    const slugCheck = await fetch(
      `${SUPABASE_URL}/rest/v1/articles?slug=eq.${encodeURIComponent(update.slug)}&id=neq.${articleId}&select=id`,
      { headers: { 'apikey': SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } }
    );
    const slugExists = await slugCheck.json();
    if (slugExists && slugExists.length > 0) {
      update.slug = update.slug + '-' + Date.now().toString(36);
    }

    // Update article
    const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/articles?id=eq.${articleId}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(update),
    });

    if (!updateRes.ok) {
      console.error('Update error:', await updateRes.text());
      throw new Error('Failed to update article');
    }

    return new Response(JSON.stringify({ success: true, ...update }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('ai-optimize error:', e);
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function buildRewritePrompt(article: any, lang: string): string {
  return `Rewrite this ${lang} news article with unique wording. Keep the meaning 100% accurate.
Title: ${article.title}
Content: ${article.content}

Return JSON: {"title":"rewritten title","content":"rewritten full content"}`;
}

function buildSummarizePrompt(article: any, lang: string): string {
  return `Write a 2-3 line summary for this ${lang} article:
Title: ${article.title}
Content: ${article.content}

Return JSON: {"summary":"2-3 line summary"}`;
}

function buildCategorizePrompt(article: any, lang: string, isArabic: boolean): string {
  const cats = isArabic
    ? 'سياسة, اقتصاد, رياضة, تكنولوجيا, صحة, فن, مقالات, أخبار'
    : 'Politics, Economy, Sports, Technology, Health, Art, Articles, News';
  return `Categorize this ${lang} article into one of: ${cats}
Title: ${article.title}
Content: ${article.content?.slice(0, 500)}

Return JSON: {"category":"chosen category"}`;
}

function buildFullOptimizePrompt(article: any, lang: string, isArabic: boolean): string {
  const cats = isArabic
    ? 'سياسة, اقتصاد, رياضة, تكنولوجيا, صحة, فن, مقالات, أخبار'
    : 'Politics, Economy, Sports, Technology, Health, Art, Articles, News';
  return `You are a professional journalist. Fully optimize this ${lang} news article:

Original Title: ${article.title}
Original Content: ${article.content}

Do ALL of these:
1. REWRITE: Rewrite with unique wording, keep meaning 100% accurate. Professional and SEO-friendly.
2. SUMMARY: Write a 2-3 line summary.
3. CATEGORY: Assign one category from: ${cats}
4. CLEAN: Remove HTML tags, decode entities, format into clean paragraphs.
5. SEO TITLE: Create an SEO-friendly title if needed.

Return JSON:
{"title":"optimized title","summary":"2-3 line summary","content":"full rewritten content with clean paragraphs","category":"category"}`;
}

function cleanText(text: string): string {
  return text
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

function similarity(a: string, b: string): number {
  if (a === b) return 1;
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  if (longer.length === 0) return 1;
  const editDist = levenshtein(longer, shorter);
  return (longer.length - editDist) / longer.length;
}

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}
