-- ════════════════════════════════════════════════════════════
-- Add contact_code to procurement.contacts
-- Run once in Supabase SQL editor
-- ════════════════════════════════════════════════════════════

-- 1. Add column
ALTER TABLE procurement.contacts
  ADD COLUMN IF NOT EXISTS contact_code text;

-- 2. Backfill CON-001, CON-002... by created_at
WITH numbered AS (
  SELECT id,
         'CON-' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at NULLS LAST, id)::text, 3, '0') AS new_code
  FROM procurement.contacts
  WHERE contact_code IS NULL OR contact_code = ''
)
UPDATE procurement.contacts c
SET contact_code = n.new_code
FROM numbered n
WHERE c.id = n.id;

-- 3. Unique index
CREATE UNIQUE INDEX IF NOT EXISTS contacts_contact_code_unique
  ON procurement.contacts (contact_code);
