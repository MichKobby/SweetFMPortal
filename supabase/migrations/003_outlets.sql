-- ============================================================
-- Multi-outlet support
-- Allows the platform to serve multiple business entities
-- (e.g. Sweet FM 106.5 radio + Digital Media outlet)
-- ============================================================

-- 1. Create the outlets table
CREATE TABLE IF NOT EXISTS outlets (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  code        TEXT NOT NULL UNIQUE,   -- e.g. 'radio', 'digital'
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'inactive')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE outlets ENABLE ROW LEVEL SECURITY;

-- Everyone can read outlets (needed for the switcher UI)
CREATE POLICY "Anyone authenticated can read outlets"
  ON outlets FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only admins can modify outlets
CREATE POLICY "Admins can manage outlets"
  ON outlets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- 2. Seed the two outlets
INSERT INTO outlets (name, code, description)
VALUES
  ('Sweet FM 106.5', 'radio',   'Physical radio station'),
  ('Digital Media',  'digital', 'Online / digital media outlet')
ON CONFLICT (code) DO NOTHING;

-- 3. Add outlet_id to profiles
--    NULL = super-admin (can switch between outlets)
--    non-null = locked to that outlet
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS outlet_id UUID REFERENCES outlets(id) ON DELETE SET NULL;

-- 4. Add outlet_id to all outlet-scoped tables
--    Existing rows default to the radio outlet

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS outlet_id UUID REFERENCES outlets(id) ON DELETE RESTRICT;

UPDATE employees
  SET outlet_id = (SELECT id FROM outlets WHERE code = 'radio')
  WHERE outlet_id IS NULL;

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS outlet_id UUID REFERENCES outlets(id) ON DELETE RESTRICT;

UPDATE invoices
  SET outlet_id = (SELECT id FROM outlets WHERE code = 'radio')
  WHERE outlet_id IS NULL;

ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS outlet_id UUID REFERENCES outlets(id) ON DELETE RESTRICT;

UPDATE expenses
  SET outlet_id = (SELECT id FROM outlets WHERE code = 'radio')
  WHERE outlet_id IS NULL;

ALTER TABLE shows
  ADD COLUMN IF NOT EXISTS outlet_id UUID REFERENCES outlets(id) ON DELETE RESTRICT;

UPDATE shows
  SET outlet_id = (SELECT id FROM outlets WHERE code = 'radio')
  WHERE outlet_id IS NULL;

ALTER TABLE ad_slots
  ADD COLUMN IF NOT EXISTS outlet_id UUID REFERENCES outlets(id) ON DELETE RESTRICT;

UPDATE ad_slots
  SET outlet_id = (SELECT id FROM outlets WHERE code = 'radio')
  WHERE outlet_id IS NULL;

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS outlet_id UUID REFERENCES outlets(id) ON DELETE RESTRICT;

UPDATE campaigns
  SET outlet_id = (SELECT id FROM outlets WHERE code = 'radio')
  WHERE outlet_id IS NULL;

ALTER TABLE shifts
  ADD COLUMN IF NOT EXISTS outlet_id UUID REFERENCES outlets(id) ON DELETE RESTRICT;

UPDATE shifts
  SET outlet_id = (SELECT id FROM outlets WHERE code = 'radio')
  WHERE outlet_id IS NULL;

ALTER TABLE commissions
  ADD COLUMN IF NOT EXISTS outlet_id UUID REFERENCES outlets(id) ON DELETE RESTRICT;

UPDATE commissions
  SET outlet_id = (SELECT id FROM outlets WHERE code = 'radio')
  WHERE outlet_id IS NULL;

ALTER TABLE announcements
  ADD COLUMN IF NOT EXISTS outlet_id UUID REFERENCES outlets(id) ON DELETE RESTRICT;

UPDATE announcements
  SET outlet_id = (SELECT id FROM outlets WHERE code = 'radio')
  WHERE outlet_id IS NULL;

ALTER TABLE support_tickets
  ADD COLUMN IF NOT EXISTS outlet_id UUID REFERENCES outlets(id) ON DELETE RESTRICT;

UPDATE support_tickets
  SET outlet_id = (SELECT id FROM outlets WHERE code = 'radio')
  WHERE outlet_id IS NULL;

ALTER TABLE payroll_records
  ADD COLUMN IF NOT EXISTS outlet_id UUID REFERENCES outlets(id) ON DELETE RESTRICT;

UPDATE payroll_records
  SET outlet_id = (SELECT id FROM outlets WHERE code = 'radio')
  WHERE outlet_id IS NULL;

-- 5. Indexes for fast outlet filtering
CREATE INDEX IF NOT EXISTS employees_outlet_idx      ON employees      (outlet_id);
CREATE INDEX IF NOT EXISTS invoices_outlet_idx        ON invoices        (outlet_id);
CREATE INDEX IF NOT EXISTS expenses_outlet_idx        ON expenses        (outlet_id);
CREATE INDEX IF NOT EXISTS shows_outlet_idx           ON shows           (outlet_id);
CREATE INDEX IF NOT EXISTS ad_slots_outlet_idx        ON ad_slots        (outlet_id);
CREATE INDEX IF NOT EXISTS campaigns_outlet_idx       ON campaigns       (outlet_id);
CREATE INDEX IF NOT EXISTS shifts_outlet_idx          ON shifts          (outlet_id);
CREATE INDEX IF NOT EXISTS commissions_outlet_idx     ON commissions     (outlet_id);
CREATE INDEX IF NOT EXISTS announcements_outlet_idx   ON announcements   (outlet_id);
CREATE INDEX IF NOT EXISTS support_tickets_outlet_idx ON support_tickets (outlet_id);
CREATE INDEX IF NOT EXISTS payroll_records_outlet_idx ON payroll_records (outlet_id);
