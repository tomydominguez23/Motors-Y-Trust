-- ============================================================
-- TRUST MOTORS - Schema completo para Supabase
-- Ejecutar este SQL en el SQL Editor de Supabase
-- ============================================================

-- ── 1. EXTENSIONES ──────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 2. TIPOS ENUMERADOS ─────────────────────────────────────

CREATE TYPE vehicle_status AS ENUM ('disponible', 'reservado', 'vendido');
CREATE TYPE vehicle_type AS ENUM ('SUV', 'Sedán', 'Hatchback', 'Pickup', 'Coupé', 'Van', 'Convertible');
CREATE TYPE fuel_type AS ENUM ('Bencina', 'Diésel', 'Híbrido', 'Eléctrico', 'GLP');
CREATE TYPE transmission_type AS ENUM ('Manual', 'Automática', 'CVT');
CREATE TYPE sale_status AS ENUM ('pendiente', 'completada', 'cancelada');
CREATE TYPE payment_method AS ENUM ('contado', 'financiamiento', 'mixto');

-- ── 3. TABLA: vehicles ──────────────────────────────────────

CREATE TABLE vehicles (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  brand         TEXT NOT NULL,
  model         TEXT NOT NULL,
  year          INTEGER NOT NULL CHECK (year >= 1990 AND year <= EXTRACT(YEAR FROM NOW()) + 1),
  type          vehicle_type NOT NULL DEFAULT 'Sedán',
  price         BIGINT NOT NULL CHECK (price > 0),
  km            INTEGER NOT NULL DEFAULT 0 CHECK (km >= 0),
  fuel          fuel_type NOT NULL DEFAULT 'Bencina',
  transmission  transmission_type NOT NULL DEFAULT 'Manual',
  color         TEXT DEFAULT '',
  plate         TEXT DEFAULT '',
  vin           TEXT DEFAULT '',
  doors         INTEGER DEFAULT 4 CHECK (doors >= 2 AND doors <= 5),
  engine        TEXT DEFAULT '',
  horsepower    INTEGER DEFAULT NULL,
  description   TEXT DEFAULT '',
  status        vehicle_status NOT NULL DEFAULT 'disponible',
  is_featured   BOOLEAN NOT NULL DEFAULT false,
  purchase_price BIGINT DEFAULT NULL,

  -- Colores para el SVG del sitio público
  color1        TEXT DEFAULT '#1a1a2e',
  color2        TEXT DEFAULT '#16213e',
  window_color  TEXT DEFAULT '#a8d8ea',

  -- Imágenes (array de URLs de Supabase Storage)
  images        TEXT[] DEFAULT '{}',

  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_brand ON vehicles(brand);
CREATE INDEX idx_vehicles_type ON vehicles(type);
CREATE INDEX idx_vehicles_price ON vehicles(price);
CREATE INDEX idx_vehicles_year ON vehicles(year);
CREATE INDEX idx_vehicles_featured ON vehicles(is_featured) WHERE is_featured = true;

-- ── 4. TABLA: customers ─────────────────────────────────────

CREATE TABLE customers (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name        TEXT NOT NULL,
  rut         TEXT DEFAULT '',
  email       TEXT DEFAULT '',
  phone       TEXT NOT NULL,
  address     TEXT DEFAULT '',
  notes       TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_rut ON customers(rut);
CREATE INDEX idx_customers_phone ON customers(phone);

-- ── 5. TABLA: sales ─────────────────────────────────────────

CREATE TABLE sales (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  vehicle_id      UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  customer_id     UUID REFERENCES customers(id) ON DELETE SET NULL,
  sale_price      BIGINT NOT NULL CHECK (sale_price > 0),
  payment_method  payment_method NOT NULL DEFAULT 'contado',
  status          sale_status NOT NULL DEFAULT 'pendiente',
  notes           TEXT DEFAULT '',
  sale_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sales_vehicle ON sales(vehicle_id);
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_sales_status ON sales(status);
CREATE INDEX idx_sales_date ON sales(sale_date);

-- ── 6. TABLA: expenses ──────────────────────────────────────

CREATE TABLE expenses (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  vehicle_id  UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  concept     TEXT NOT NULL,
  amount      BIGINT NOT NULL CHECK (amount > 0),
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  notes       TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_expenses_vehicle ON expenses(vehicle_id);
CREATE INDEX idx_expenses_date ON expenses(date);

-- ── 7. TABLA: inquiries (consultas de clientes) ─────────────

CREATE TABLE inquiries (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  vehicle_id  UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  email       TEXT DEFAULT '',
  message     TEXT DEFAULT '',
  is_read     BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inquiries_read ON inquiries(is_read);
CREATE INDEX idx_inquiries_vehicle ON inquiries(vehicle_id);

-- ── 8. FUNCIONES DE ACTUALIZACIÓN AUTOMÁTICA ────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_vehicles_updated
  BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_customers_updated
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_sales_updated
  BEFORE UPDATE ON sales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Al completar una venta, marcar el vehículo como vendido
CREATE OR REPLACE FUNCTION on_sale_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completada' AND (OLD.status IS NULL OR OLD.status != 'completada') THEN
    UPDATE vehicles SET status = 'vendido' WHERE id = NEW.vehicle_id;
  END IF;
  IF NEW.status = 'cancelada' AND OLD.status = 'completada' THEN
    UPDATE vehicles SET status = 'disponible' WHERE id = NEW.vehicle_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sale_status
  AFTER INSERT OR UPDATE OF status ON sales
  FOR EACH ROW EXECUTE FUNCTION on_sale_status_change();

-- ── 9. VISTAS PARA EL DASHBOARD ────────────────────────────

-- Vista de resumen de dashboard
CREATE OR REPLACE VIEW dashboard_summary AS
SELECT
  (SELECT COUNT(*) FROM vehicles WHERE status = 'disponible') AS vehicles_available,
  (SELECT COUNT(*) FROM vehicles WHERE status = 'reservado') AS vehicles_reserved,
  (SELECT COUNT(*) FROM vehicles WHERE status = 'vendido') AS vehicles_sold,
  (SELECT COUNT(*) FROM vehicles) AS vehicles_total,
  (SELECT COALESCE(SUM(sale_price), 0) FROM sales WHERE status = 'completada') AS total_revenue,
  (SELECT COALESCE(SUM(sale_price), 0) FROM sales WHERE status = 'completada'
    AND sale_date >= DATE_TRUNC('month', CURRENT_DATE)) AS month_revenue,
  (SELECT COUNT(*) FROM sales WHERE status = 'completada'
    AND sale_date >= DATE_TRUNC('month', CURRENT_DATE)) AS month_sales_count,
  (SELECT COUNT(*) FROM sales WHERE status = 'pendiente') AS pending_sales,
  (SELECT COUNT(*) FROM inquiries WHERE is_read = false) AS unread_inquiries,
  (SELECT COUNT(*) FROM customers) AS total_customers;

-- Vista de ventas con detalles
CREATE OR REPLACE VIEW sales_detail AS
SELECT
  s.id,
  s.sale_price,
  s.payment_method,
  s.status,
  s.notes,
  s.sale_date,
  s.created_at,
  v.brand || ' ' || v.model || ' ' || v.year AS vehicle_name,
  v.id AS vehicle_id,
  v.plate,
  c.name AS customer_name,
  c.phone AS customer_phone,
  c.rut AS customer_rut,
  c.id AS customer_id
FROM sales s
LEFT JOIN vehicles v ON s.vehicle_id = v.id
LEFT JOIN customers c ON s.customer_id = c.id
ORDER BY s.created_at DESC;

-- Vista de ventas mensuales (últimos 12 meses)
CREATE OR REPLACE VIEW monthly_sales AS
SELECT
  TO_CHAR(DATE_TRUNC('month', sale_date), 'YYYY-MM') AS month,
  TO_CHAR(DATE_TRUNC('month', sale_date), 'Mon YYYY') AS month_label,
  COUNT(*) AS count,
  COALESCE(SUM(sale_price), 0) AS revenue
FROM sales
WHERE status = 'completada'
  AND sale_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months'
GROUP BY DATE_TRUNC('month', sale_date)
ORDER BY month;

-- ── 10. ROW LEVEL SECURITY ──────────────────────────────────

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- Lectura pública: disponibles, reservados y vendidos (catálogo del sitio)
CREATE POLICY "Vehículos visibles en el sitio"
  ON vehicles FOR SELECT
  TO anon, authenticated
  USING (status IN ('disponible', 'reservado', 'vendido'));

-- Usuarios autenticados tienen acceso total a vehículos
CREATE POLICY "Admin acceso total vehículos"
  ON vehicles FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Solo usuarios autenticados pueden ver/modificar clientes
CREATE POLICY "Admin acceso total clientes"
  ON customers FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Solo usuarios autenticados pueden ver/modificar ventas
CREATE POLICY "Admin acceso total ventas"
  ON sales FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Solo usuarios autenticados pueden ver/modificar gastos
CREATE POLICY "Admin acceso total gastos"
  ON expenses FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Consultas: cualquiera puede crear, solo admin puede leer/modificar
CREATE POLICY "Cualquiera puede crear consulta"
  ON inquiries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin acceso total consultas"
  ON inquiries FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ── 11. USUARIO ADMIN (Authentication) ─────────────────────
-- El panel admin usa Supabase Auth, NO la tabla customers.
--
-- 1. Ir a Authentication → Users → Add user
-- 2. Email + contraseña (marcar "Auto Confirm User" si no quieres confirmar por correo)
-- 3. O desactivar confirmación: Authentication → Providers → Email → Confirm email = OFF
--
-- Sin un usuario en Auth, signInWithPassword devolverá "Invalid login credentials".

-- ── 12. STORAGE BUCKET ──────────────────────────────────────
-- NOTA: Ejecutar esto por separado o desde la UI de Supabase:
--
-- 1. Ir a Storage > New Bucket
-- 2. Nombre: "vehicles"
-- 3. Público: Sí
-- 4. Agregar políticas:
--    - SELECT: Público (para que las imágenes se vean en el sitio)
--    - INSERT/UPDATE/DELETE: Solo usuarios autenticados

-- ── 12. DATOS DE EJEMPLO ────────────────────────────────────

INSERT INTO vehicles (brand, model, year, type, price, km, fuel, transmission, color, description, status, is_featured, color1, color2, window_color) VALUES
  ('Toyota', 'Corolla Cross', 2024, 'SUV', 18990000, 12000, 'Bencina', 'Automática', 'Gris Oscuro', 'SUV híbrido con bajo kilometraje, mantenciones al día en servicio oficial. Único dueño, como nuevo.', 'disponible', true, '#2d3436', '#1e272e', '#a8d8ea'),
  ('Hyundai', 'Tucson', 2023, 'SUV', 16490000, 28000, 'Bencina', 'Automática', 'Azul', 'Versión Limited full equipo. Techo panorámico, asientos de cuero calefactados, cámara 360°.', 'disponible', false, '#1a3c6e', '#0d2b4e', '#b8d4e8'),
  ('Kia', 'Sportage', 2023, 'SUV', 15990000, 35000, 'Bencina', 'Automática', 'Rojo', 'Motor 1.6 turbo, pantalla doble, asistente de conducción nivel 2. Excelente estado mecánico.', 'disponible', false, '#6b1d1d', '#4a1212', '#c8dde8'),
  ('Toyota', 'Yaris', 2022, 'Sedán', 9990000, 42000, 'Bencina', 'Manual', 'Plata', 'Económico y confiable. Ideal para ciudad. Mantenciones al día, historial limpio.', 'disponible', false, '#c0c0c0', '#999999', '#d0e8f0'),
  ('Chevrolet', 'Onix', 2023, 'Sedán', 10490000, 18000, 'Bencina', 'Automática', 'Negro', 'Versión Premier turbo con pantalla central, Apple CarPlay y Android Auto. Poco uso.', 'disponible', false, '#1a1a1a', '#0a0a0a', '#b0c8d8'),
  ('Nissan', 'Kicks', 2024, 'SUV', 14990000, 8000, 'Bencina', 'CVT', 'Naranja', 'Prácticamente nuevo. Versión Exclusive con techo bitono, sensores y cámara de retroceso.', 'disponible', true, '#e67e22', '#c0651a', '#c8dde8'),
  ('Mazda', 'CX-5', 2022, 'SUV', 17490000, 48000, 'Bencina', 'Automática', 'Rojo Soul', 'Soul Red Crystal. Motor Skyactiv-G 2.0L, sistema i-Activsense completo. Impecable.', 'disponible', false, '#8e1b1b', '#6e1010', '#c0d6e4'),
  ('Suzuki', 'Swift', 2023, 'Hatchback', 8990000, 22000, 'Bencina', 'Manual', 'Azul', 'Compacto, eficiente y divertido de manejar. Perfecto para movilidad urbana con bajo consumo.', 'disponible', false, '#2980b9', '#1a5276', '#d0e8f5'),
  ('Hyundai', 'Accent', 2022, 'Sedán', 9490000, 55000, 'Bencina', 'Automática', 'Gris', 'Sedán amplio y confortable. Bluetooth, aire acondicionado, dirección asistida. Buen estado general.', 'disponible', false, '#4a4a4a', '#2d2d2d', '#b8d0e0'),
  ('Toyota', 'Hilux', 2023, 'Pickup', 22990000, 30000, 'Diésel', 'Automática', 'Blanco', 'SRV 4x4, motor 2.8 diésel. Ideal para trabajo y aventura. Barra antivuelco y estribos laterales.', 'disponible', true, '#f0f0f0', '#cccccc', '#c0d8e8'),
  ('Kia', 'Rio', 2021, 'Hatchback', 8490000, 60000, 'Bencina', 'Manual', 'Verde', 'Económico y práctico. Motor 1.4L, aire acondicionado, radio bluetooth. Documentación al día.', 'disponible', false, '#27ae60', '#1e8449', '#c8e0ea'),
  ('BMW', '320i', 2022, 'Sedán', 24990000, 38000, 'Bencina', 'Automática', 'Negro', 'Serie 3 Sport Line. Motor 2.0 turbo 184HP, pantalla BMW Live Cockpit, Head-up Display.', 'disponible', true, '#0a0a0a', '#1a1a1a', '#a0c0d8');

INSERT INTO customers (name, rut, email, phone, address) VALUES
  ('Carlos Mendoza', '12.345.678-9', 'carlos.mendoza@email.com', '+56 9 1234 5678', 'Los Leones 1234, Providencia'),
  ('María González', '15.678.901-2', 'maria.gonzalez@email.com', '+56 9 8765 4321', 'Av. Italia 567, Ñuñoa'),
  ('Roberto Sánchez', '10.111.222-3', 'roberto.s@email.com', '+56 9 5555 1234', 'Manuel Montt 890, Providencia');
