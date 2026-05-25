-- ============================================================
-- Vehículos visibles en el sitio web (disponible, reservado, vendido)
-- Ejecutar en Supabase → SQL Editor (una vez)
--
-- Sin esto, autos en «Reservado» o «Vendido» desaparecen del catálogo.
-- ============================================================

DROP POLICY IF EXISTS "Vehículos disponibles son públicos" ON public.vehicles;
DROP POLICY IF EXISTS "Vehículos visibles en el sitio" ON public.vehicles;

CREATE POLICY "Vehículos visibles en el sitio"
  ON public.vehicles FOR SELECT
  TO anon, authenticated
  USING (status IN ('disponible', 'reservado', 'vendido'));
