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
