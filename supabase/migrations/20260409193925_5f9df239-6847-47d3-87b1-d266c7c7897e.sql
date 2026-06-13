
-- Add source management fields
ALTER TABLE public.sources ADD COLUMN IF NOT EXISTS hide_source boolean NOT NULL DEFAULT false;
ALTER TABLE public.sources ADD COLUMN IF NOT EXISTS alt_source_name text DEFAULT NULL;
ALTER TABLE public.sources ADD COLUMN IF NOT EXISTS alt_source_url text DEFAULT NULL;
ALTER TABLE public.sources ADD COLUMN IF NOT EXISTS assigned_category text DEFAULT NULL;

-- Add video support to articles
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS video_url text DEFAULT NULL;
