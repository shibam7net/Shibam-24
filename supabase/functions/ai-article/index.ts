import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "أنت صحفي ومحلل سياسي محترف. أجب دائماً بصيغة JSON فقط بدون أي نص إضافي." },
          { role: "user", content: prompt },
        ],
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
      throw new Error("AI gateway error");
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
