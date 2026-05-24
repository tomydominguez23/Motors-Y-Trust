-- ============================================================
-- TRUST MOTORS - Arreglos de auth y RLS (ejecutar en SQL Editor)
-- ============================================================

-- 1) Confirmar manualmente un usuario (cambia el email)
-- Útil cuando mailer_autoconfirm está en false y no llegó el correo.
UPDATE auth.users
SET
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  confirmed_at = COALESCE(confirmed_at, NOW())
WHERE email = 'TU_EMAIL_COMPLETO@ejemplo.com';  -- ← mismo email que usas en el login

-- 2) Políticas RLS para usuarios autenticados (si el login entra pero no hay datos)
DROP POLICY IF EXISTS "Admin acceso total vehículos" ON vehicles;
CREATE POLICY "Admin acceso total vehículos"
  ON vehicles FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admin acceso total clientes" ON customers;
CREATE POLICY "Admin acceso total clientes"
  ON customers FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admin acceso total ventas" ON sales;
CREATE POLICY "Admin acceso total ventas"
  ON sales FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admin acceso total gastos" ON expenses;
CREATE POLICY "Admin acceso total gastos"
  ON expenses FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admin acceso total consultas" ON inquiries;
CREATE POLICY "Admin acceso total consultas"
  ON inquiries FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 3) Permisos de lectura en vistas del dashboard
GRANT SELECT ON dashboard_summary TO authenticated;
GRANT SELECT ON sales_detail TO authenticated;
GRANT SELECT ON monthly_sales TO authenticated;
