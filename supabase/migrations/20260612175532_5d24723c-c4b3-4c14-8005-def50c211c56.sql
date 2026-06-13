
CREATE TABLE IF NOT EXISTS public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read settings" ON public.site_settings;
CREATE POLICY "Public read settings" ON public.site_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Auth manage settings" ON public.site_settings;
CREATE POLICY "Auth manage settings" ON public.site_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO public.site_settings (key, value) VALUES
  ('analytics', '{"ga_id":"","gtm_id":"","custom_head":"","internal_tracking":true}'::jsonb),
  ('ads', '{"enabled":false,"publisher_id":"","slots":{"header":"","sidebar":"","in_article":""},"disabled_categories":[]}'::jsonb),
  ('seo', '{"meta_title":"","meta_description":"","robots":"index,follow","category_seo":{},"robots_txt":""}'::jsonb)
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.analytics_overview()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'live_visitors', (SELECT COUNT(DISTINCT session_id) FROM page_views WHERE view_type='page' AND created_at >= now() - interval '3 minutes'),
    'live_radio_listeners', (SELECT COUNT(DISTINCT session_id) FROM page_views WHERE view_type='radio' AND created_at >= now() - interval '90 seconds'),
    'today_visits', (SELECT COUNT(DISTINCT session_id) FROM page_views WHERE view_type='page' AND created_at >= date_trunc('day', now())),
    'today_pageviews', (SELECT COUNT(*) FROM page_views WHERE view_type='page' AND created_at >= date_trunc('day', now())),
    'today_radio_visits', (SELECT COUNT(DISTINCT session_id) FROM page_views WHERE view_type='radio' AND created_at >= date_trunc('day', now())),
    'week_visits', (SELECT COUNT(DISTINCT session_id) FROM page_views WHERE view_type='page' AND created_at >= now() - interval '7 days'),
    'total_visits', (SELECT COUNT(DISTINCT session_id) FROM page_views WHERE view_type='page'),
    'total_pageviews', (SELECT COUNT(*) FROM page_views WHERE view_type='page'),
    'total_articles', (SELECT COUNT(*) FROM articles),
    'today_articles', (SELECT COUNT(*) FROM articles WHERE created_at >= date_trunc('day', now())),
    'week_articles', (SELECT COUNT(*) FROM articles WHERE created_at >= now() - interval '7 days')
  ) INTO result;
  RETURN result;
END;
$function$;
