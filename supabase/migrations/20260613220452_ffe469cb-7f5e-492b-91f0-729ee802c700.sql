
-- 1) Admin role system
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','editor','user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own roles" ON public.user_roles;
CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role);
$$;

-- Seed admin role for the existing admin account (shib@shibampress.local)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users WHERE email='shib@shibampress.local'
ON CONFLICT (user_id, role) DO NOTHING;

-- 2) Tighten write policies: only admin can write; public/auth can still read
-- articles
DROP POLICY IF EXISTS "Auth insert articles" ON public.articles;
DROP POLICY IF EXISTS "Auth update articles" ON public.articles;
DROP POLICY IF EXISTS "Auth delete articles" ON public.articles;
CREATE POLICY "Admin insert articles" ON public.articles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin update articles" ON public.articles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin delete articles" ON public.articles FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- sources
DROP POLICY IF EXISTS "Auth insert sources" ON public.sources;
DROP POLICY IF EXISTS "Auth update sources" ON public.sources;
DROP POLICY IF EXISTS "Auth delete sources" ON public.sources;
CREATE POLICY "Admin insert sources" ON public.sources FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin update sources" ON public.sources FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin delete sources" ON public.sources FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- sponsors
DROP POLICY IF EXISTS "Auth insert sponsors" ON public.sponsors;
DROP POLICY IF EXISTS "Auth update sponsors" ON public.sponsors;
DROP POLICY IF EXISTS "Auth delete sponsors" ON public.sponsors;
CREATE POLICY "Admin insert sponsors" ON public.sponsors FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin update sponsors" ON public.sponsors FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin delete sponsors" ON public.sponsors FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- site_settings
DROP POLICY IF EXISTS "Auth manage settings" ON public.site_settings;
CREATE POLICY "Admin manage settings" ON public.site_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 3) Fix mutable search_path on generate_slug
CREATE OR REPLACE FUNCTION public.generate_slug(title text)
RETURNS text LANGUAGE plpgsql SET search_path = public AS $function$
DECLARE result text; counter int := 0; base_slug text;
BEGIN
  result := lower(trim(title));
  result := regexp_replace(result, '&[a-z]+;', '', 'g');
  result := regexp_replace(result, '[^\w\s\-\u0600-\u06FF]', '', 'g');
  result := regexp_replace(result, '\s+', '-', 'g');
  result := regexp_replace(result, '-+', '-', 'g');
  result := trim(both '-' from result);
  result := left(result, 80);
  IF result = '' THEN result := 'article'; END IF;
  base_slug := result;
  WHILE EXISTS (SELECT 1 FROM public.articles WHERE slug = result) LOOP
    counter := counter + 1;
    result := base_slug || '-' || counter;
  END LOOP;
  RETURN result;
END;
$function$;

-- 4) Full-text search via trigram similarity
CREATE INDEX IF NOT EXISTS idx_articles_title_trgm ON public.articles USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_articles_summary_trgm ON public.articles USING gin (summary gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_articles_category_section ON public.articles (section, category);
CREATE INDEX IF NOT EXISTS idx_articles_generic_cat ON public.articles (section, category) WHERE category IN ('أخبار','News');

CREATE OR REPLACE FUNCTION public.search_articles(
  p_query text,
  p_section text DEFAULT NULL,
  p_limit int DEFAULT 60
)
RETURNS TABLE (
  id uuid, slug text, title text, summary text, content text,
  image_url text, video_url text, category text, section text,
  author text, source_name text, source_url text,
  published_at timestamptz, tags text[], views int, trend_score int,
  is_breaking boolean, is_trending boolean, rank real
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT a.id, a.slug, a.title, a.summary, a.content,
         a.image_url, a.video_url, a.category, a.section,
         a.author, a.source_name, a.source_url,
         a.published_at, a.tags, a.views, a.trend_score,
         a.is_breaking, a.is_trending,
         (similarity(a.title, p_query) * 3.0
          + similarity(coalesce(a.summary,''), p_query) * 1.0
          + CASE WHEN a.title ILIKE '%'||p_query||'%' THEN 2.0 ELSE 0 END
          + CASE WHEN a.summary ILIKE '%'||p_query||'%' THEN 0.5 ELSE 0 END)::real AS rank
  FROM public.articles a
  WHERE (p_section IS NULL OR a.section = p_section)
    AND (
      a.title ILIKE '%'||p_query||'%'
      OR a.summary ILIKE '%'||p_query||'%'
      OR a.title % p_query
      OR coalesce(a.summary,'') % p_query
      OR p_query = ANY(a.tags)
    )
  ORDER BY rank DESC, a.published_at DESC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.search_articles(text, text, int) TO anon, authenticated;
