export const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://pqtfipryditlsthdczkq.supabase.co';
export const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxdGZpcHJ5ZGl0bHN0aGRjemtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2OTc4NzgsImV4cCI6MjA4OTI3Mzg3OH0.wdS_FIpMPlyQHbsi9f1Uxfd209cOmDgfOd24XpFD0PY';

const baseHeaders = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  Accept: 'application/json',
};

export async function supabaseRest(pathname, searchParams = {}, options = {}) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${pathname}`);
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    url.searchParams.set(key, String(value));
  });

  return fetch(url, {
    ...options,
    headers: {
      ...baseHeaders,
      ...(options.headers || {}),
    },
  });
}

export async function fetchArticles({ select, order = 'published_at.desc', limit = 5000, gtePublishedAt } = {}) {
  const response = await supabaseRest('articles', {
    select,
    order,
    limit,
    ...(gtePublishedAt ? { published_at: `gte.${gtePublishedAt}` } : {}),
  });

  if (!response.ok) {
    throw new Error(`Supabase articles request failed with ${response.status}`);
  }

  return response.json();
}

export async function fetchSeoSettings() {
  const response = await supabaseRest('site_settings', {
    select: 'value,updated_at',
    key: 'eq.seo',
    limit: 1,
  });

  if (!response.ok) return null;
  const rows = await response.json();
  return rows?.[0] || null;
}
