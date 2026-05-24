-- ============================================================
-- TRUST MOTORS — Imágenes del sitio + auto del hero
-- Supabase → SQL Editor → pegar → Run (una sola vez)
-- ============================================================

-- Tabla clave/valor para URLs de imágenes (logo, hero, etc.)
CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Filas por defecto (vacías = usa imagen local de respaldo en el servidor)
INSERT INTO public.site_settings (key, value) VALUES
  ('logo_header', ''),
  ('logo_footer', ''),
  ('hero_car', ''),
  ('hero_banner', ''),
  ('hero_background', ''),
  ('about_image', '')
ON CONFLICT (key) DO NOTHING;

-- Si ya tenías hero_banner con URL, copiarla a hero_car (solo la primera vez)
UPDATE public.site_settings AS s
SET value = b.value, updated_at = NOW()
FROM public.site_settings AS b
WHERE s.key = 'hero_car'
  AND (s.value IS NULL OR s.value = '')
  AND b.key = 'hero_banner'
  AND b.value IS NOT NULL
  AND b.value <> '';

COMMENT ON TABLE public.site_settings IS 'URLs de imágenes del sitio (admin → Imágenes sitio)';
COMMENT ON COLUMN public.site_settings.key IS 'logo_header, logo_footer, hero_car, hero_banner, hero_background, about_image';

-- Permisos para el panel admin (anon) y lectura en la web pública
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Temporal: anon site_settings" ON public.site_settings;
CREATE POLICY "Temporal: anon site_settings"
  ON public.site_settings
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO anon;

-- Bucket Storage «site» para subir logos y foto del hero
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
