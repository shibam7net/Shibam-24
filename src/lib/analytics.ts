// Lightweight visit tracker. Uses sendBeacon when available for reliability.
import { supabase } from '@/integrations/supabase/client';

const SESSION_KEY = 'sh24_sid';

function getSessionId(): string {
  try {
    let sid = sessionStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = (crypto.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36));
      sessionStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  } catch {
    return 'anon-' + Math.random().toString(36).slice(2);
  }
}

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-visit`;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function send(payload: Record<string, unknown>) {
  const body = JSON.stringify({ session_id: getSessionId(), ...payload });
  try {
    // sendBeacon doesn't allow custom headers, so fall back to fetch when we need auth
    await fetch(FN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: ANON, Authorization: `Bearer ${ANON}` },
      body,
      keepalive: true,
    });
  } catch {
    // swallow; analytics must never break the app
  }
}

export function trackPageView(path: string, article_id?: string | null) {
  send({
    view_type: 'page',
    path,
    article_id: article_id || null,
    referrer: typeof document !== 'undefined' ? document.referrer : null,
  });
}

export function trackRadioHeartbeat(station_id: number | null) {
  if (!station_id) return;
  send({ view_type: 'radio', path: '/radio', station_id });
}

export { getSessionId };
