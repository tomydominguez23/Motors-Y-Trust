-- ============================================================
-- TRUST MOTORS - Solo imágenes del sitio (logo, banners)
-- Ejecutar en Supabase → SQL Editor → Run
-- Soluciona: "Could not find the table public.site_settings"
-- ============================================================

CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Temporal: anon site_settings" ON public.site_settings;
CREATE POLICY "Temporal: anon site_settings"
  ON public.site_settings
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO anon;

INSERT INTO public.site_settings (key, value) VALUES
  ('logo_header', ''),
  ('logo_footer', ''),
  ('hero_banner', ''),
  ('hero_background', ''),
  ('about_image', '')
ON CONFLICT (key) DO NOTHING;

-- Bucket Storage «site» para subir archivos desde el admin
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site',
  'site',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Temporal: lectura pública site" ON storage.objects;
CREATE POLICY "Temporal: lectura pública site"
  ON storage.objects FOR SELECT USING (bucket_id = 'site');

DROP POLICY IF EXISTS "Temporal: anon sube site" ON storage.objects;
CREATE POLICY "Temporal: anon sube site"
  ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'site');

DROP POLICY IF EXISTS "Temporal: anon actualiza site" ON storage.objects;
CREATE POLICY "Temporal: anon actualiza site"
  ON storage.objects FOR UPDATE TO anon
  USING (bucket_id = 'site') WITH CHECK (bucket_id = 'site');

DROP POLICY IF EXISTS "Temporal: anon elimina site" ON storage.objects;
CREATE POLICY "Temporal: anon elimina site"
  ON storage.objects FOR DELETE TO anon USING (bucket_id = 'site');
