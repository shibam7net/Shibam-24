
-- Sources table
CREATE TABLE public.sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  fetch_method TEXT NOT NULL DEFAULT 'rss',
  section TEXT NOT NULL DEFAULT 'arabic' CHECK (section IN ('arabic', 'global')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  fetch_interval INTEGER NOT NULL DEFAULT 5 CHECK (fetch_interval >= 1 AND fetch_interval <= 15),
  last_fetch TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Articles table
CREATE TABLE public.articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  category TEXT NOT NULL DEFAULT '',
  section TEXT NOT NULL DEFAULT 'arabic' CHECK (section IN ('arabic', 'global')),
  author TEXT NOT NULL DEFAULT '',
  source_name TEXT NOT NULL DEFAULT '',
  source_url TEXT,
  source_id UUID REFERENCES public.sources(id) ON DELETE CASCADE,
  is_breaking BOOLEAN NOT NULL DEFAULT false,
  is_trending BOOLEAN NOT NULL DEFAULT false,
  views INTEGER NOT NULL DEFAULT 0,
  trend_score INTEGER NOT NULL DEFAULT 50,
  tags TEXT[] NOT NULL DEFAULT '{}',
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read sources" ON public.sources FOR SELECT USING (true);
CREATE POLICY "Public read articles" ON public.articles FOR SELECT USING (true);

-- Authenticated write access
CREATE POLICY "Auth insert sources" ON public.sources FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update sources" ON public.sources FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete sources" ON public.sources FOR DELETE TO authenticated USING (true);

CREATE POLICY "Auth insert articles" ON public.articles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update articles" ON public.articles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete articles" ON public.articles FOR DELETE TO authenticated USING (true);

-- Create storage bucket for news images
INSERT INTO storage.buckets (id, name, public) VALUES ('news-images', 'news-images', true);

-- Storage policies
CREATE POLICY "Public read news images" ON storage.objects FOR SELECT USING (bucket_id = 'news-images');
CREATE POLICY "Auth upload news images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'news-images');
CREATE POLICY "Auth update news images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'news-images');
CREATE POLICY "Auth delete news images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'news-images');
