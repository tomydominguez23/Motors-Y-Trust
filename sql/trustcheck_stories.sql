-- ============================================================
-- TRUST MOTORS — Clientes felices de TRUST CHECK
-- Fotos y videos debajo de cada persona en la sección pública.
-- Supabase → SQL Editor → pegar → Run (una sola vez)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.trustcheck_stories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  quote         TEXT NOT NULL DEFAULT '',
  media         JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT trustcheck_stories_media_array CHECK (jsonb_typeof(media) = 'array')
);

CREATE INDEX IF NOT EXISTS idx_trustcheck_stories_active_sort
  ON public.trustcheck_stories (is_active, sort_order, created_at);

DROP TRIGGER IF EXISTS trg_trustcheck_stories_updated ON public.trustcheck_stories;
CREATE TRIGGER trg_trustcheck_stories_updated
  BEFORE UPDATE ON public.trustcheck_stories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE public.trustcheck_stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Temporal: anon trustcheck_stories" ON public.trustcheck_stories;
DROP POLICY IF EXISTS "Clientes felices visibles en el sitio" ON public.trustcheck_stories;
CREATE POLICY "Clientes felices visibles en el sitio"
  ON public.trustcheck_stories FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Admin acceso total trustcheck_stories" ON public.trustcheck_stories;
CREATE POLICY "Admin acceso total trustcheck_stories"
  ON public.trustcheck_stories FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

GRANT SELECT ON public.trustcheck_stories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trustcheck_stories TO authenticated;

-- El bucket «site» también acepta videos cortos (además de imágenes).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site',
  'site',
  true,
  52428800,
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
    'video/mp4', 'video/webm', 'video/quicktime', 'video/ogg'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = GREATEST(COALESCE(storage.buckets.file_size_limit, 0), EXCLUDED.file_size_limit),
  allowed_mime_types = EXCLUDED.allowed_mime_types;

COMMENT ON TABLE public.trustcheck_stories IS 'Clientes felices de TRUST CHECK: nombre, comentario y fotos/videos';
