import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const AI_KEY = Deno.env.get("OPENROUTER_API_KEY") || Deno.env.get("LOVABLE_API_KEY");
    if (!AI_KEY) throw new Error("AI key not configured");
    const usingOpenRouter = !!Deno.env.get("OPENROUTER_API_KEY");
    const AI_URL = usingOpenRouter
      ? "https://openrouter.ai/api/v1/chat/completions"
      : "https://ai.gateway.lovable.dev/v1/chat/completions";
    const MODEL = Deno.env.get("AI_MODEL") || (usingOpenRouter ? "google/gemini-2.5-flash" : "google/gemini-3-flash-preview");
    const aiHeaders: Record<string, string> = {
      Authorization: `Bearer ${AI_KEY}`,
      "Content-Type": "application/json",
    };
    if (usingOpenRouter) {
      aiHeaders["HTTP-Referer"] = "https://shibam7net.github.io/Shibam-24/";
      aiHeaders["X-Title"] = "Shibam-24";
    }

    const { mode, title, newsTitles } = await req.json();

    let prompt = "";
    if (mode === "generate" && title) {
      prompt = `أنت صحفي محترف. اكتب مقالاً إخبارياً كاملاً عن "${title}".
يجب أن يتضمن:
- عنوان جذاب
- ملخص قصير (جملتين)
- محتوى المقال كاملاً (3-5 فقرات)
- تصنيف مقترح

أجب بصيغة JSON بالشكل التالي:
{"title":"...","summary":"...","content":"...","category":"..."}`;
    } else if (mode === "analyze" && newsTitles) {
      prompt = `أنت محلل سياسي خبير. هذه عناوين أخبار من موقعنا:

${newsTitles}

قم بتحليل شامل:
1. ربط الأخبار ببعضها
2. شرح الأسباب والنتائج
3. كتابة تحليل احترافي

أجب بصيغة JSON:
{"title":"تحليل: ...","summary":"...","content":"...","category":"مقالات"}`;
    } else {
      return new Response(JSON.stringify({ error: "Invalid mode" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch(AI_URL, {
      method: "POST",
      headers: aiHeaders,
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: "أنت صحفي ومحلل سياسي محترف. أجب دائماً بصيغة JSON فقط بدون أي نص إضافي." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز حد الطلبات، حاول لاحقاً" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "يرجى إضافة رصيد للاستمرار" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", status, t);
      throw new Error("AI provider error");
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "";
    
    // Extract JSON from response
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(JSON.stringify({ error: "Could not parse AI response", raw }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const article = JSON.parse(jsonMatch[0]);
    return new Response(JSON.stringify(article), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-article error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
