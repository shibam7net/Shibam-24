import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function percentEncode(str: string): string {
  return encodeURIComponent(str).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string,
): string {
  const sortedParams = Object.keys(params).sort().map(k => `${percentEncode(k)}=${percentEncode(params[k])}`).join('&');
  const baseString = `${method}&${percentEncode(url)}&${percentEncode(sortedParams)}`;
  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`;
  const hmac = createHmac('sha1', signingKey);
  hmac.update(baseString);
  return hmac.digest('base64') as unknown as string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const CONSUMER_KEY = Deno.env.get('TWITTER_CONSUMER_KEY');
    const CONSUMER_SECRET = Deno.env.get('TWITTER_CONSUMER_SECRET');
    const ACCESS_TOKEN = Deno.env.get('TWITTER_ACCESS_TOKEN');
    const ACCESS_TOKEN_SECRET = Deno.env.get('TWITTER_ACCESS_TOKEN_SECRET');

    if (!CONSUMER_KEY || !CONSUMER_SECRET || !ACCESS_TOKEN || !ACCESS_TOKEN_SECRET) {
      throw new Error('Twitter API credentials not fully configured');
    }

    const { title, url: articleUrl } = await req.json();
    if (!title || !articleUrl) throw new Error('title and url are required');

    // Keep tweet under 280 chars
    const tweetText = `${title.substring(0, 230)}\n\n${articleUrl}`;

    const apiUrl = 'https://api.x.com/2/tweets';
    const nonce = crypto.randomUUID().replace(/-/g, '');
    const timestamp = Math.floor(Date.now() / 1000).toString();

    const oauthParams: Record<string, string> = {
      oauth_consumer_key: CONSUMER_KEY,
      oauth_nonce: nonce,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: timestamp,
      oauth_token: ACCESS_TOKEN,
      oauth_version: '1.0',
    };

    // For POST with JSON body, do NOT include body params in signature
    const signature = generateOAuthSignature('POST', apiUrl, oauthParams, CONSUMER_SECRET, ACCESS_TOKEN_SECRET);
    oauthParams.oauth_signature = signature;

    const authHeader = 'OAuth ' + Object.keys(oauthParams).sort().map(k => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`).join(', ');

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: tweetText }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(`Twitter API error [${res.status}]: ${JSON.stringify(data)}`);
    }

    return new Response(JSON.stringify({ success: true, tweet_id: data.data?.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Twitter post error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
