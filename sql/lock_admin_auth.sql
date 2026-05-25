-- ============================================================
-- TRUST MOTORS — Bloquear panel sin login (producción)
-- Supabase → SQL Editor → pegar → Run (una vez)
-- ============================================================
-- Quita permisos «anon» de escritura que permitían usar el panel
-- sin contraseña. El sitio público sigue leyendo autos disponibles.
-- El panel requiere usuario en Authentication + sesión iniciada.
-- ============================================================

-- ── Quitar políticas temporales anon (tablas) ─────────────────
DROP POLICY IF EXISTS "Temporal: anon vehículos" ON public.vehicles;
DROP POLICY IF EXISTS "Temporal: anon clientes" ON public.customers;
DROP POLICY IF EXISTS "Temporal: anon ventas" ON public.sales;
DROP POLICY IF EXISTS "Temporal: anon gastos" ON public.expenses;
DROP POLICY IF EXISTS "Temporal: anon consultas" ON public.inquiries;
DROP POLICY IF EXISTS "Temporal: anon site_settings" ON public.site_settings;

-- ── Vehículos: público solo lectura de disponibles ──────────
DROP POLICY IF EXISTS "Vehículos disponibles son públicos" ON public.vehicles;
DROP POLICY IF EXISTS "Vehículos visibles en el sitio" ON public.vehicles;
CREATE POLICY "Vehículos visibles en el sitio"
  ON public.vehicles FOR SELECT
  TO anon, authenticated
  USING (status IN ('disponible', 'reservado', 'vendido'));

DROP POLICY IF EXISTS "Admin acceso total vehículos" ON public.vehicles;
CREATE POLICY "Admin acceso total vehículos"
  ON public.vehicles FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ── Tablas solo admin (authenticated) ─────────────────────────
DROP POLICY IF EXISTS "Admin acceso total clientes" ON public.customers;
CREATE POLICY "Admin acceso total clientes"
  ON public.customers FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admin acceso total ventas" ON public.sales;
CREATE POLICY "Admin acceso total ventas"
  ON public.sales FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admin acceso total gastos" ON public.expenses;
CREATE POLICY "Admin acceso total gastos"
  ON public.expenses FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Cualquiera puede crear consulta" ON public.inquiries;
CREATE POLICY "Cualquiera puede crear consulta"
  ON public.inquiries FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admin acceso total consultas" ON public.inquiries;
CREATE POLICY "Admin acceso total consultas"
  ON public.inquiries FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ── Imágenes del sitio: lectura pública, escritura admin ────
DROP POLICY IF EXISTS "Público lee site_settings" ON public.site_settings;
CREATE POLICY "Público lee site_settings"
  ON public.site_settings FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin escribe site_settings" ON public.site_settings;
CREATE POLICY "Admin escribe site_settings"
  ON public.site_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admin actualiza site_settings"
  ON public.site_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admin elimina site_settings"
  ON public.site_settings FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

REVOKE INSERT, UPDATE, DELETE ON public.site_settings FROM anon;
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;

-- ── Vistas del dashboard (solo admin) ───────────────────────
REVOKE SELECT ON public.dashboard_summary FROM anon;
REVOKE SELECT ON public.sales_detail FROM anon;
REVOKE SELECT ON public.monthly_sales FROM anon;
GRANT SELECT ON public.dashboard_summary TO authenticated;
GRANT SELECT ON public.sales_detail TO authenticated;
GRANT SELECT ON public.monthly_sales TO authenticated;

-- ── Storage: quitar escritura anon ──────────────────────────
DROP POLICY IF EXISTS "Temporal: anon sube imágenes" ON storage.objects;
DROP POLICY IF EXISTS "Temporal: anon actualiza imágenes" ON storage.objects;
DROP POLICY IF EXISTS "Temporal: anon elimina imágenes" ON storage.objects;
DROP POLICY IF EXISTS "Temporal: anon sube site" ON storage.objects;
DROP POLICY IF EXISTS "Temporal: anon actualiza site" ON storage.objects;
DROP POLICY IF EXISTS "Temporal: anon elimina site" ON storage.objects;

DROP POLICY IF EXISTS "Temporal: lectura pública imágenes" ON storage.objects;
CREATE POLICY "Temporal: lectura pública imágenes"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'vehicles');

DROP POLICY IF EXISTS "Admin sube vehicles" ON storage.objects;
CREATE POLICY "Admin sube vehicles"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'vehicles');

DROP POLICY IF EXISTS "Admin actualiza vehicles" ON storage.objects;
CREATE POLICY "Admin actualiza vehicles"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'vehicles')
  WITH CHECK (bucket_id = 'vehicles');

DROP POLICY IF EXISTS "Admin elimina vehicles" ON storage.objects;
CREATE POLICY "Admin elimina vehicles"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'vehicles');

DROP POLICY IF EXISTS "Temporal: lectura pública site" ON storage.objects;
CREATE POLICY "Temporal: lectura pública site"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'site');

DROP POLICY IF EXISTS "Admin sube site" ON storage.objects;
CREATE POLICY "Admin sube site"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'site');

DROP POLICY IF EXISTS "Admin actualiza site" ON storage.objects;
CREATE POLICY "Admin actualiza site"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'site')
  WITH CHECK (bucket_id = 'site');

DROP POLICY IF EXISTS "Admin elimina site" ON storage.objects;
CREATE POLICY "Admin elimina site"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'site');

-- ============================================================
-- Crear usuario admin (hazlo en la UI si prefieres):
-- Authentication → Users → Add user → email + contraseña
-- Marca «Auto Confirm User» o confirma manualmente el correo.
-- ============================================================
