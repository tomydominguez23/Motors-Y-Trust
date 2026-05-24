-- ============================================================
-- Panel admin SIN login (temporal)
-- Ejecutar en Supabase → SQL Editor
-- ============================================================
-- Permite que el rol "anon" (sin sesión) lea y escriba en el panel.
-- ⚠️ No dejar así en producción pública.

CREATE POLICY "Temporal: anon vehículos"
  ON vehicles FOR ALL TO anon
  USING (true) WITH CHECK (true);

CREATE POLICY "Temporal: anon clientes"
  ON customers FOR ALL TO anon
  USING (true) WITH CHECK (true);

CREATE POLICY "Temporal: anon ventas"
  ON sales FOR ALL TO anon
  USING (true) WITH CHECK (true);

CREATE POLICY "Temporal: anon gastos"
  ON expenses FOR ALL TO anon
  USING (true) WITH CHECK (true);

CREATE POLICY "Temporal: anon consultas"
  ON inquiries FOR ALL TO anon
  USING (true) WITH CHECK (true);

GRANT SELECT ON dashboard_summary TO anon;
GRANT SELECT ON sales_detail TO anon;
GRANT SELECT ON monthly_sales TO anon;

-- Storage bucket "vehicles" (crear en Storage si no existe, marcado como público)
-- Políticas para subir fotos desde el panel sin login:

CREATE POLICY "Temporal: lectura pública imágenes"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'vehicles');

CREATE POLICY "Temporal: anon sube imágenes"
  ON storage.objects FOR INSERT TO anon
  WITH CHECK (bucket_id = 'vehicles');

CREATE POLICY "Temporal: anon actualiza imágenes"
  ON storage.objects FOR UPDATE TO anon
  USING (bucket_id = 'vehicles')
  WITH CHECK (bucket_id = 'vehicles');

CREATE POLICY "Temporal: anon elimina imágenes"
  ON storage.objects FOR DELETE TO anon
  USING (bucket_id = 'vehicles');
