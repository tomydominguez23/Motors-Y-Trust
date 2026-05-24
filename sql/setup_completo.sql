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

-- Storage (crear bucket "vehicles" en UI: Storage → New bucket → Public)
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
