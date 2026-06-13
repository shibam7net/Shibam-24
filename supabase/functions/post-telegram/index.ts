import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!TELEGRAM_BOT_TOKEN) throw new Error('TELEGRAM_BOT_TOKEN not configured');

    const TELEGRAM_CHANNEL_ID = Deno.env.get('TELEGRAM_CHANNEL_ID');
    if (!TELEGRAM_CHANNEL_ID) throw new Error('TELEGRAM_CHANNEL_ID not configured');

    const { title, summary, url, image_url } = await req.json();
    if (!title || !url) throw new Error('title and url are required');

    // If image exists, send photo with caption; otherwise send text message
    if (image_url) {
      const caption = `📰 <b>${title}</b>\n\n${summary || ''}\n\n🔗 <a href="${url}">اقرأ المزيد - Shibam24</a>`;
      const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
      const res = await fetch(telegramUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHANNEL_ID,
          photo: image_url,
          caption: caption.substring(0, 1024),
          parse_mode: 'HTML',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        // Fallback to text if photo fails
        console.error('Photo send failed, falling back to text:', JSON.stringify(data));
        const fallbackRes = await sendTextMessage(TELEGRAM_BOT_TOKEN, TELEGRAM_CHANNEL_ID, title, summary, url);
        return fallbackRes;
      }

      return new Response(JSON.stringify({ success: true, message_id: data.result?.message_id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Text-only message
    return await sendTextMessage(TELEGRAM_BOT_TOKEN, TELEGRAM_CHANNEL_ID, title, summary, url);
  } catch (error: any) {
    console.error('Telegram post error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function sendTextMessage(token: string, chatId: string, title: string, summary: string, url: string) {
  const text = `📰 <b>${title}</b>\n\n${summary || ''}\n\n🔗 <a href="${url}">اقرأ المزيد - Shibam24</a>`;
  const telegramUrl = `https://api.telegram.org/bot${token}/sendMessage`;
  const res = await fetch(telegramUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: false,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Telegram API error [${res.status}]: ${JSON.stringify(data)}`);
  }

  return new Response(JSON.stringify({ success: true, message_id: data.result?.message_id }), {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Content-Type': 'application/json',
    },
  });
}
