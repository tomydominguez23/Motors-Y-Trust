-- Financiamiento por vehículo (cuota referencial editable en el admin)
-- Supabase → SQL Editor → Run

ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS finance_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS finance_months INTEGER NOT NULL DEFAULT 48 CHECK (finance_months >= 6 AND finance_months <= 84),
  ADD COLUMN IF NOT EXISTS finance_down_payment BIGINT NOT NULL DEFAULT 0 CHECK (finance_down_payment >= 0),
  ADD COLUMN IF NOT EXISTS finance_annual_rate NUMERIC(5, 2) NOT NULL DEFAULT 24.00 CHECK (finance_annual_rate >= 0 AND finance_annual_rate <= 60),
  ADD COLUMN IF NOT EXISTS finance_monthly BIGINT DEFAULT NULL CHECK (finance_monthly IS NULL OR finance_monthly > 0);

COMMENT ON COLUMN public.vehicles.finance_monthly IS 'Cuota mensual mostrada en la web. Si es NULL se calcula con precio, pie, plazo y tasa.';
