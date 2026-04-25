-- ════════════════════════════════════════════════════════════
-- Add vendor_code to procurement.vendors
-- Run this once in Supabase SQL editor
-- ════════════════════════════════════════════════════════════

-- 1. Add column (nullable for now so existing rows don't fail)
ALTER TABLE procurement.vendors
  ADD COLUMN IF NOT EXISTS vendor_code text;

-- 2. Backfill existing vendors with VEN-001, VEN-002... (ordered by created_at)
WITH numbered AS (
  SELECT id,
         'VEN-' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at NULLS LAST, id)::text, 3, '0') AS new_code
  FROM procurement.vendors
  WHERE vendor_code IS NULL OR vendor_code = ''
)
UPDATE procurement.vendors v
SET vendor_code = n.new_code
FROM numbered n
WHERE v.id = n.id;

-- 3. Enforce uniqueness going forward
CREATE UNIQUE INDEX IF NOT EXISTS vendors_vendor_code_unique
  ON procurement.vendors (vendor_code);
