
CREATE TABLE public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  view_type text NOT NULL DEFAULT 'page',
  path text NOT NULL DEFAULT '/',
  article_id uuid,
  station_id integer,
  country text,
  referrer text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX page_views_created_at_idx ON public.page_views (created_at DESC);
CREATE INDEX page_views_type_created_idx ON public.page_views (view_type, created_at DESC);
CREATE INDEX page_views_session_idx ON public.page_views (session_id);
CREATE INDEX page_views_article_idx ON public.page_views (article_id) WHERE article_id IS NOT NULL;
CREATE INDEX page_views_country_idx ON public.page_views (country) WHERE country IS NOT NULL;

GRANT SELECT ON public.page_views TO authenticated;
GRANT INSERT ON public.page_views TO anon, authenticated;
GRANT ALL ON public.page_views TO service_role;

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert views" ON public.page_views
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can read views" ON public.page_views
  FOR SELECT TO authenticated USING (true);

-- Overview RPC: live, today, week, by country (24h), radio
CREATE OR REPLACE FUNCTION public.analytics_overview()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'live_visitors', (
      SELECT COUNT(DISTINCT session_id) FROM page_views
      WHERE view_type = 'page' AND created_at >= now() - interval '3 minutes'
    ),
    'live_radio_listeners', (
      SELECT COUNT(DISTINCT session_id) FROM page_views
      WHERE view_type = 'radio' AND created_at >= now() - interval '90 seconds'
    ),
    'today_visits', (
      SELECT COUNT(DISTINCT session_id) FROM page_views
      WHERE view_type = 'page' AND created_at >= date_trunc('day', now())
    ),
    'today_pageviews', (
      SELECT COUNT(*) FROM page_views
      WHERE view_type = 'page' AND created_at >= date_trunc('day', now())
    ),
    'today_radio_visits', (
      SELECT COUNT(DISTINCT session_id) FROM page_views
      WHERE view_type = 'radio' AND created_at >= date_trunc('day', now())
    ),
    'week_visits', (
      SELECT COUNT(DISTINCT session_id) FROM page_views
      WHERE view_type = 'page' AND created_at >= now() - interval '7 days'
    ),
    'total_visits', (
      SELECT COUNT(DISTINCT session_id) FROM page_views WHERE view_type = 'page'
    ),
    'total_pageviews', (
      SELECT COUNT(*) FROM page_views WHERE view_type = 'page'
    )
  ) INTO result;
  RETURN result;
END;
$$;

-- Visits by country in last 24h
CREATE OR REPLACE FUNCTION public.analytics_countries(p_hours int DEFAULT 24, p_limit int DEFAULT 15)
RETURNS TABLE (country text, visits bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(country, 'غير معروف') AS country, COUNT(DISTINCT session_id) AS visits
  FROM page_views
  WHERE view_type = 'page' AND created_at >= now() - (p_hours || ' hours')::interval
  GROUP BY 1
  ORDER BY visits DESC
  LIMIT p_limit;
$$;

-- Top articles by views (joined with articles)
CREATE OR REPLACE FUNCTION public.analytics_top_articles(p_hours int DEFAULT 24, p_limit int DEFAULT 10)
RETURNS TABLE (article_id uuid, title text, slug text, views bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT pv.article_id, a.title, a.slug, COUNT(*) AS views
  FROM page_views pv
  JOIN articles a ON a.id = pv.article_id
  WHERE pv.article_id IS NOT NULL
    AND pv.created_at >= now() - (p_hours || ' hours')::interval
  GROUP BY pv.article_id, a.title, a.slug
  ORDER BY views DESC
  LIMIT p_limit;
$$;

-- Hourly visits last 24h
CREATE OR REPLACE FUNCTION public.analytics_hourly()
RETURNS TABLE (hour timestamptz, visits bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT date_trunc('hour', created_at) AS hour, COUNT(DISTINCT session_id) AS visits
  FROM page_views
  WHERE view_type = 'page' AND created_at >= now() - interval '24 hours'
  GROUP BY 1
  ORDER BY 1;
$$;

-- Top radio stations now (last 5 min) by listener count
CREATE OR REPLACE FUNCTION public.analytics_top_radio(p_limit int DEFAULT 10)
RETURNS TABLE (station_id integer, listeners bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT station_id, COUNT(DISTINCT session_id) AS listeners
  FROM page_views
  WHERE view_type = 'radio' AND station_id IS NOT NULL
    AND created_at >= now() - interval '5 minutes'
  GROUP BY station_id
  ORDER BY listeners DESC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.analytics_overview() TO authenticated;
GRANT EXECUTE ON FUNCTION public.analytics_countries(int, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.analytics_top_articles(int, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.analytics_hourly() TO authenticated;
GRANT EXECUTE ON FUNCTION public.analytics_top_radio(int) TO authenticated;
