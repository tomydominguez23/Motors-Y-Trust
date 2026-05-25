-- ============================================================
-- TRUST MOTORS — Arreglar login del panel admin
-- Supabase → SQL Editor → Run (ajusta el email)
-- ============================================================

-- 1) Confirmar usuario (mismo email que usas en panel.html)
-- Si creaste el usuario en Authentication → Users, esto desbloquea el login.
UPDATE auth.users
SET
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  confirmed_at = COALESCE(confirmed_at, NOW())
WHERE lower(email) = lower('TU_EMAIL@ejemplo.com');

-- 2) Permisos de tablas para rol authenticated (panel con sesión)
GRANT USAGE ON SCHEMA public TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inquiries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;

GRANT SELECT ON public.dashboard_summary TO authenticated;
GRANT SELECT ON public.sales_detail TO authenticated;
GRANT SELECT ON public.monthly_sales TO authenticated;

-- 3) Si aún no ejecutaste el bloqueo del panel, corre también:
--    sql/lock_admin_auth.sql
