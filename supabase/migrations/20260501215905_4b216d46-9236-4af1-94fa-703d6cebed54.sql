-- Performance indexes for articles
CREATE INDEX IF NOT EXISTS idx_articles_section_published 
  ON public.articles (section, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_articles_section_category_published 
  ON public.articles (section, category, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_articles_source_published 
  ON public.articles (source_id, published_at DESC) WHERE source_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_articles_breaking 
  ON public.articles (published_at DESC) WHERE is_breaking = true;

CREATE INDEX IF NOT EXISTS idx_articles_slug 
  ON public.articles (slug) WHERE slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_articles_published_at 
  ON public.articles (published_at DESC);

-- Trigram index for fast text search on title (for admin search)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_articles_title_trgm 
  ON public.articles USING gin (title gin_trgm_ops);

-- Bulk delete function (single round-trip for many ids)
CREATE OR REPLACE FUNCTION public.bulk_delete_articles(ids uuid[])
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count int;
BEGIN
  DELETE FROM public.articles WHERE id = ANY(ids);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Lightweight count function for admin pagination
CREATE OR REPLACE FUNCTION public.articles_count(
  p_section text DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_search text DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total bigint;
BEGIN
  SELECT count(*) INTO total
  FROM public.articles
  WHERE (p_section IS NULL OR section = p_section)
    AND (p_category IS NULL OR category = p_category)
    AND (p_search IS NULL OR title ILIKE '%' || p_search || '%');
  RETURN total;
END;
$$;