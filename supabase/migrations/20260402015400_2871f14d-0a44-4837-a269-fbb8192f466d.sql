
CREATE UNIQUE INDEX idx_articles_unique_source_url ON public.articles (source_url) WHERE source_url IS NOT NULL;
