-- Visitas agendadas desde el sitio web (vehiculo.html)
-- Ejecutar en Supabase → SQL Editor

DO $$ BEGIN
  CREATE TYPE visit_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS visit_appointments (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  vehicle_id      UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  customer_name   TEXT NOT NULL,
  customer_phone  TEXT NOT NULL,
  customer_email  TEXT DEFAULT '',
  scheduled_at    TIMESTAMPTZ NOT NULL,
  notes           TEXT DEFAULT '',
  status          visit_status DEFAULT 'pending',
  is_read         BOOLEAN DEFAULT false,
  whatsapp_notified BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visit_appointments_scheduled ON visit_appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_visit_appointments_vehicle ON visit_appointments(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_visit_appointments_read ON visit_appointments(is_read);

ALTER TABLE visit_appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cualquiera puede agendar visita" ON visit_appointments;
CREATE POLICY "Cualquiera puede agendar visita"
  ON visit_appointments FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admin acceso total visitas" ON visit_appointments;
CREATE POLICY "Admin acceso total visitas"
  ON visit_appointments FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.visit_appointments TO authenticated;
GRANT INSERT ON public.visit_appointments TO anon;
