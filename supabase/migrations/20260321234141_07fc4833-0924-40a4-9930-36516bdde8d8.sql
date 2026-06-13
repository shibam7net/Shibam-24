
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS slug text;
CREATE UNIQUE INDEX IF NOT EXISTS articles_slug_unique ON public.articles(slug) WHERE slug IS NOT NULL;

-- Create function to generate slug from title
CREATE OR REPLACE FUNCTION public.generate_slug(title text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  result text;
  counter int := 0;
  base_slug text;
BEGIN
  -- Transliterate common Arabic to simple latin, or keep latin chars
  result := lower(trim(title));
  -- Remove HTML entities
  result := regexp_replace(result, '&[a-z]+;', '', 'g');
  -- Keep only alphanumeric, spaces, hyphens, and Arabic chars
  result := regexp_replace(result, '[^\w\s\-\u0600-\u06FF]', '', 'g');
  -- Replace spaces with hyphens
  result := regexp_replace(result, '\s+', '-', 'g');
  -- Remove multiple hyphens
  result := regexp_replace(result, '-+', '-', 'g');
  -- Trim hyphens
  result := trim(both '-' from result);
  -- Truncate to 80 chars
  result := left(result, 80);
  
  IF result = '' THEN
    result := 'article';
  END IF;
  
  base_slug := result;
  
  -- Check for uniqueness
  WHILE EXISTS (SELECT 1 FROM public.articles WHERE slug = result) LOOP
    counter := counter + 1;
    result := base_slug || '-' || counter;
  END LOOP;
  
  RETURN result;
END;
$$;

-- Generate slugs for existing articles that don't have one
UPDATE public.articles SET slug = id::text WHERE slug IS NULL;
