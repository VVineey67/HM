-- ════════════════════════════════════════════════════════════
-- Split serialization counters per order kind (Supply / SITC)
-- Run this once in Supabase SQL editor
-- ════════════════════════════════════════════════════════════

-- 1. Add order_kind column (default Supply so existing rows = PO counters)
ALTER TABLE procurement.serialization_settings
  ADD COLUMN IF NOT EXISTS order_kind text NOT NULL DEFAULT 'Supply';

-- 2. Drop old unique constraint on (site_id, financial_year) if it exists
DO $$
DECLARE c text;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'procurement.serialization_settings'::regclass
      AND contype = 'u'
  LOOP
    EXECUTE format('ALTER TABLE procurement.serialization_settings DROP CONSTRAINT %I', c);
  END LOOP;
END$$;

-- 3. Drop old unique index if it exists
DROP INDEX IF EXISTS procurement.serialization_settings_site_id_financial_year_key;
DROP INDEX IF EXISTS procurement.serialization_settings_unique;

-- 4. New unique index on (site_id, financial_year, order_kind)
CREATE UNIQUE INDEX serialization_settings_unique
  ON procurement.serialization_settings (site_id, financial_year, order_kind);
