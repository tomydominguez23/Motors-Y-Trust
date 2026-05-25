-- ============================================================
-- Mostrar vehículos RESERVADOS en el sitio (con etiqueta)
-- Ejecutar en Supabase → SQL Editor (una vez)
-- ============================================================

DROP POLICY IF EXISTS "Vehículos disponibles son públicos" ON public.vehicles;

CREATE POLICY "Vehículos visibles en el sitio"
  ON public.vehicles FOR SELECT
  TO anon, authenticated
  USING (status IN ('disponible', 'reservado'));
