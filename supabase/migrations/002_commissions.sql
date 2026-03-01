-- Commission tracking for employees who bring in ad sales
CREATE TABLE IF NOT EXISTS commissions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  invoice_id      UUID REFERENCES invoices(id) ON DELETE SET NULL,
  invoice_number  TEXT NOT NULL,
  client_id       UUID REFERENCES clients(id) ON DELETE SET NULL,
  rate            DECIMAL(5,2) NOT NULL DEFAULT 10.00, -- percentage, e.g. 10.00 = 10%
  base_amount     DECIMAL(12,2) NOT NULL,              -- invoice amount the commission is based on
  commission_amount DECIMAL(12,2) NOT NULL,            -- rate / 100 * base_amount
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'paid')),
  notes           TEXT,
  created_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at     TIMESTAMPTZ,
  paid_at         TIMESTAMPTZ
);

-- Index for fast lookups by employee and status
CREATE INDEX IF NOT EXISTS commissions_employee_id_idx ON commissions (employee_id);
CREATE INDEX IF NOT EXISTS commissions_status_idx       ON commissions (status);
CREATE INDEX IF NOT EXISTS commissions_invoice_id_idx   ON commissions (invoice_id);

-- RLS: admin and manager can do everything; employees can read their own
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/manager full access to commissions"
  ON commissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Employees read own commissions"
  ON commissions FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE id = auth.uid()
    )
  );
