
CREATE TABLE public.sponsors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  logo_url text NOT NULL,
  link_url text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read sponsors" ON public.sponsors FOR SELECT USING (true);
CREATE POLICY "Auth insert sponsors" ON public.sponsors FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update sponsors" ON public.sponsors FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete sponsors" ON public.sponsors FOR DELETE TO authenticated USING (true);

INSERT INTO storage.buckets (id, name, public) VALUES ('sponsor-logos', 'sponsor-logos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read sponsor logos" ON storage.objects FOR SELECT USING (bucket_id = 'sponsor-logos');
CREATE POLICY "Auth upload sponsor logos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'sponsor-logos');
CREATE POLICY "Auth update sponsor logos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'sponsor-logos');
CREATE POLICY "Auth delete sponsor logos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'sponsor-logos');
