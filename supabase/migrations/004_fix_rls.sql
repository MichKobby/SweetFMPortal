-- ============================================================
-- Fix RLS policies so admins/managers can INSERT/UPDATE/DELETE
-- employees (and other key tables).
-- Safe to run multiple times (uses IF EXISTS / OR REPLACE).
-- ============================================================

-- ── EMPLOYEES ────────────────────────────────────────────────

-- Drop any stale policies that might conflict
DROP POLICY IF EXISTS "Admins can insert employees"               ON employees;
DROP POLICY IF EXISTS "Managers can insert employees"             ON employees;
DROP POLICY IF EXISTS "Admins and managers can insert employees"  ON employees;
DROP POLICY IF EXISTS "Enable insert for admins and managers"     ON employees;
DROP POLICY IF EXISTS "Admins can manage employees"               ON employees;
DROP POLICY IF EXISTS "Managers can manage employees"             ON employees;
DROP POLICY IF EXISTS "Admins can update employees"               ON employees;
DROP POLICY IF EXISTS "Admins can delete employees"               ON employees;
DROP POLICY IF EXISTS "Staff can view employees"                  ON employees;
DROP POLICY IF EXISTS "Employees can view employees"              ON employees;
DROP POLICY IF EXISTS "Enable read access for authenticated"      ON employees;

-- SELECT: any authenticated user
CREATE POLICY "employees_select"
  ON employees FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- INSERT: admin or manager only
CREATE POLICY "employees_insert"
  ON employees FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'manager')
    )
  );

-- UPDATE: admin or manager only
CREATE POLICY "employees_update"
  ON employees FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'manager')
    )
  );

-- DELETE: admin only
CREATE POLICY "employees_delete"
  ON employees FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- ── ANNOUNCEMENTS ────────────────────────────────────────────

DROP POLICY IF EXISTS "Admins can insert announcements"              ON announcements;
DROP POLICY IF EXISTS "Admins and managers can insert announcements" ON announcements;
DROP POLICY IF EXISTS "Admins can manage announcements"              ON announcements;
DROP POLICY IF EXISTS "announcements_insert"                         ON announcements;
DROP POLICY IF EXISTS "announcements_update"                         ON announcements;
DROP POLICY IF EXISTS "announcements_delete"                         ON announcements;

CREATE POLICY "announcements_select"
  ON announcements FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "announcements_insert"
  ON announcements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "announcements_update"
  ON announcements FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "announcements_delete"
  ON announcements FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- ── SUPPORT TICKETS ──────────────────────────────────────────

DROP POLICY IF EXISTS "support_tickets_insert" ON support_tickets;
DROP POLICY IF EXISTS "support_tickets_update" ON support_tickets;
DROP POLICY IF EXISTS "support_tickets_select" ON support_tickets;

CREATE POLICY "support_tickets_select"
  ON support_tickets FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Any authenticated user can create a support ticket
CREATE POLICY "support_tickets_insert"
  ON support_tickets FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "support_tickets_update"
  ON support_tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'manager')
    )
  );

-- ── COMMISSIONS ──────────────────────────────────────────────

DROP POLICY IF EXISTS "commissions_insert" ON commissions;
DROP POLICY IF EXISTS "commissions_update" ON commissions;
DROP POLICY IF EXISTS "commissions_select" ON commissions;
DROP POLICY IF EXISTS "commissions_delete" ON commissions;

CREATE POLICY "commissions_select"
  ON commissions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "commissions_insert"
  ON commissions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "commissions_update"
  ON commissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "commissions_delete"
  ON commissions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );
