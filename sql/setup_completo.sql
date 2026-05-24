-- ============================================================
-- TRUST MOTORS - Configuración completa (ejecutar una vez)
-- Supabase → SQL Editor → pegar todo → Run
-- ============================================================

-- Permisos anon para el panel sin login
DROP POLICY IF EXISTS "Temporal: anon vehículos" ON vehicles;
CREATE POLICY "Temporal: anon vehículos"
  ON vehicles FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Temporal: anon clientes" ON customers;
CREATE POLICY "Temporal: anon clientes"
  ON customers FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Temporal: anon ventas" ON sales;
CREATE POLICY "Temporal: anon ventas"
  ON sales FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Temporal: anon gastos" ON expenses;
CREATE POLICY "Temporal: anon gastos"
  ON expenses FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Temporal: anon consultas" ON inquiries;
CREATE POLICY "Temporal: anon consultas"
  ON inquiries FOR ALL TO anon USING (true) WITH CHECK (true);

GRANT SELECT ON dashboard_summary TO anon;
GRANT SELECT ON sales_detail TO anon;
GRANT SELECT ON monthly_sales TO anon;

-- Bucket público para fotos de vehículos (se crea desde SQL; no hace falta la UI)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vehicles',
  'vehicles',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Temporal: lectura pública imágenes" ON storage.objects;
CREATE POLICY "Temporal: lectura pública imágenes"
  ON storage.objects FOR SELECT USING (bucket_id = 'vehicles');

DROP POLICY IF EXISTS "Temporal: anon sube imágenes" ON storage.objects;
CREATE POLICY "Temporal: anon sube imágenes"
  ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'vehicles');

DROP POLICY IF EXISTS "Temporal: anon actualiza imágenes" ON storage.objects;
CREATE POLICY "Temporal: anon actualiza imágenes"
  ON storage.objects FOR UPDATE TO anon
  USING (bucket_id = 'vehicles') WITH CHECK (bucket_id = 'vehicles');

DROP POLICY IF EXISTS "Temporal: anon elimina imágenes" ON storage.objects;
CREATE POLICY "Temporal: anon elimina imágenes"
  ON storage.objects FOR DELETE TO anon USING (bucket_id = 'vehicles');

-- Imágenes del sitio (logo, banners)
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO site_settings (key, value) VALUES
  ('logo_header', ''),
  ('logo_footer', ''),
  ('hero_car', ''),
  ('hero_banner', ''),
  ('hero_background', ''),
  ('about_image', '')
ON CONFLICT (key) DO NOTHING;

DROP POLICY IF EXISTS "Temporal: anon site_settings" ON site_settings;
CREATE POLICY "Temporal: anon site_settings"
  ON site_settings FOR ALL TO anon USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON site_settings TO anon;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site',
  'site',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']::text[]
)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

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

-- Financiamiento por vehículo (cuota referencial)
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS finance_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS finance_months INTEGER NOT NULL DEFAULT 48 CHECK (finance_months >= 6 AND finance_months <= 84),
  ADD COLUMN IF NOT EXISTS finance_down_payment BIGINT NOT NULL DEFAULT 0 CHECK (finance_down_payment >= 0),
  ADD COLUMN IF NOT EXISTS finance_annual_rate NUMERIC(5, 2) NOT NULL DEFAULT 24.00 CHECK (finance_annual_rate >= 0 AND finance_annual_rate <= 60),
  ADD COLUMN IF NOT EXISTS finance_monthly BIGINT DEFAULT NULL CHECK (finance_monthly IS NULL OR finance_monthly > 0);
