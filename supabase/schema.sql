-- SweetFM Platform Database Schema
-- Supabase PostgreSQL Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS (Custom Types)
-- ============================================

CREATE TYPE user_role AS ENUM ('admin', 'manager', 'employee', 'client');
CREATE TYPE client_status AS ENUM ('active', 'overdue', 'inactive');
CREATE TYPE billing_frequency AS ENUM ('monthly', 'quarterly', 'annually', 'one-time');
CREATE TYPE invoice_status AS ENUM ('paid', 'pending', 'overdue', 'draft', 'sent', 'cancelled');
CREATE TYPE campaign_status AS ENUM ('active', 'completed', 'scheduled');
CREATE TYPE employee_status AS ENUM ('active', 'inactive');
CREATE TYPE employment_type AS ENUM ('full-time', 'part-time', 'contract', 'intern');
CREATE TYPE payroll_status AS ENUM ('paid', 'pending');
CREATE TYPE expense_status AS ENUM ('approved', 'pending', 'rejected');
CREATE TYPE show_category AS ENUM ('music', 'talk', 'news', 'sports', 'entertainment', 'religious', 'educational', 'other');
CREATE TYPE show_recurrence AS ENUM ('daily', 'weekly', 'custom');
CREATE TYPE show_status AS ENUM ('active', 'inactive', 'archived');
CREATE TYPE ad_type AS ENUM ('spot', 'sponsorship', 'promo', 'psa');
CREATE TYPE ad_recurrence AS ENUM ('once', 'daily', 'weekly', 'custom');
CREATE TYPE ad_status AS ENUM ('scheduled', 'active', 'completed', 'cancelled');
CREATE TYPE notification_type AS ENUM ('info', 'warning', 'error', 'success');
CREATE TYPE leave_type AS ENUM ('vacation', 'sick', 'personal', 'unpaid', 'emergency');
CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
CREATE TYPE announcement_category AS ENUM ('general', 'urgent', 'event', 'policy', 'schedule');
CREATE TYPE announcement_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE shift_status AS ENUM ('scheduled', 'confirmed', 'completed', 'cancelled');
CREATE TYPE revenue_status AS ENUM ('realized', 'expected', 'partial');
CREATE TYPE ar_aging_category AS ENUM ('0-30', '31-60', '61-90', '90+');
CREATE TYPE ticket_category AS ENUM ('billing', 'technical', 'campaign', 'general');
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE ticket_status AS ENUM ('open', 'in-progress', 'resolved', 'closed');
CREATE TYPE ticket_author_role AS ENUM ('client', 'staff');
CREATE TYPE payment_method AS ENUM ('bank_transfer', 'credit_card', 'cash', 'check', 'mobile_money');
CREATE TYPE payment_status AS ENUM ('completed', 'pending', 'failed');

-- ============================================
-- USERS TABLE (extends Supabase auth.users)
-- ============================================

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'employee',
    avatar TEXT,
    department TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CLIENTS TABLE
-- ============================================

CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id TEXT UNIQUE NOT NULL, -- Human-readable ID (e.g., C24001)
    name TEXT NOT NULL,
    company TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT,
    total_billed DECIMAL(12,2) DEFAULT 0,
    amount_paid DECIMAL(12,2) DEFAULT 0,
    balance DECIMAL(12,2) DEFAULT 0,
    status client_status DEFAULT 'active',
    payment_terms TEXT DEFAULT 'Net 30',
    -- Contact Person
    contact_person TEXT,
    contact_person_phone TEXT,
    contact_person_email TEXT,
    -- Contract Details
    contract_start_date DATE,
    contract_end_date DATE,
    contract_amount DECIMAL(12,2),
    service_description TEXT,
    billing_frequency billing_frequency,
    notes TEXT,
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EMPLOYEES TABLE
-- ============================================

CREATE TABLE public.employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Link to auth user if they have login
    employee_id TEXT UNIQUE NOT NULL, -- Human-readable ID (e.g., S23006)
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL, -- Job title
    department TEXT NOT NULL,
    hire_date DATE NOT NULL,
    salary DECIMAL(10,2) NOT NULL,
    deductions DECIMAL(10,2) DEFAULT 0,
    net_pay DECIMAL(10,2),
    avatar TEXT,
    status employee_status DEFAULT 'active',
    -- Additional Details
    address TEXT,
    emergency_contact TEXT,
    emergency_phone TEXT,
    date_of_birth DATE,
    employment_type employment_type DEFAULT 'full-time',
    bank_account TEXT,
    bank_name TEXT,
    tax_id TEXT,
    social_security_number TEXT,
    contract_end_date DATE,
    notes TEXT,
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INVOICES TABLE
-- ============================================

CREATE TABLE public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number TEXT UNIQUE NOT NULL,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    amount_paid DECIMAL(12,2) DEFAULT 0,
    balance DECIMAL(12,2),
    status invoice_status DEFAULT 'draft',
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    description TEXT,
    notes TEXT,
    payment_terms TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INVOICE ITEMS TABLE (ad_slot_id reference added later via ALTER)
-- ============================================

CREATE TABLE public.invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    ad_slot_id UUID, -- Reference added after ad_slots table is created
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CAMPAIGNS TABLE
-- ============================================

CREATE TABLE public.campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    budget DECIMAL(12,2) NOT NULL,
    status campaign_status DEFAULT 'scheduled',
    ad_slots INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SHOWS TABLE
-- ============================================

CREATE TABLE public.shows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    presenter TEXT NOT NULL,
    description TEXT,
    category show_category NOT NULL,
    recurrence show_recurrence NOT NULL,
    days_of_week INTEGER[] NOT NULL, -- Array of 0-6 (Sunday-Saturday)
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    color TEXT DEFAULT '#c81f25',
    status show_status DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AD SLOTS TABLE
-- ============================================

CREATE TABLE public.ad_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    ad_title TEXT NOT NULL,
    ad_type ad_type NOT NULL,
    recurrence ad_recurrence NOT NULL,
    days_of_week INTEGER[] NOT NULL,
    time TIME NOT NULL,
    duration INTEGER NOT NULL, -- in seconds
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    show_id UUID REFERENCES public.shows(id) ON DELETE SET NULL,
    frequency INTEGER DEFAULT 1, -- times per day
    status ad_status DEFAULT 'scheduled',
    cost DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key to invoice_items now that ad_slots exists
ALTER TABLE public.invoice_items 
    ADD CONSTRAINT fk_invoice_items_ad_slot 
    FOREIGN KEY (ad_slot_id) REFERENCES public.ad_slots(id) ON DELETE SET NULL;

-- ============================================
-- EXPENSES TABLE
-- ============================================

CREATE TABLE public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT NOT NULL,
    receipt_url TEXT,
    status expense_status DEFAULT 'pending',
    approved_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PAYROLL RECORDS TABLE
-- ============================================

CREATE TABLE public.payroll_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    gross_pay DECIMAL(10,2) NOT NULL,
    deductions DECIMAL(10,2) DEFAULT 0,
    net_pay DECIMAL(10,2) NOT NULL,
    pay_date DATE NOT NULL,
    pay_period_start DATE NOT NULL,
    pay_period_end DATE NOT NULL,
    status payroll_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================

CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type notification_type DEFAULT 'info',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LEAVE REQUESTS TABLE
-- ============================================

CREATE TABLE public.leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    leave_type leave_type NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days INTEGER NOT NULL,
    reason TEXT,
    status leave_status DEFAULT 'pending',
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_by UUID REFERENCES public.profiles(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT
);

-- ============================================
-- ANNOUNCEMENTS TABLE
-- ============================================

CREATE TABLE public.announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category announcement_category DEFAULT 'general',
    priority announcement_priority DEFAULT 'medium',
    published_by UUID NOT NULL REFERENCES public.profiles(id),
    published_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    target_roles user_role[], -- If empty, visible to all
    attachments TEXT[]
);

-- ============================================
-- ANNOUNCEMENT READS (Track who has read)
-- ============================================

CREATE TABLE public.announcement_reads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(announcement_id, user_id)
);

-- ============================================
-- SHIFTS TABLE
-- ============================================

CREATE TABLE public.shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    role TEXT NOT NULL, -- DJ, Producer, Engineer, etc.
    show_id UUID REFERENCES public.shows(id) ON DELETE SET NULL,
    status shift_status DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TIME OFF BALANCES TABLE
-- ============================================

CREATE TABLE public.time_off_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    vacation_days INTEGER DEFAULT 15,
    vacation_used INTEGER DEFAULT 0,
    sick_days INTEGER DEFAULT 10,
    sick_used INTEGER DEFAULT 0,
    personal_days INTEGER DEFAULT 3,
    personal_used INTEGER DEFAULT 0,
    UNIQUE(employee_id, year)
);

-- ============================================
-- REVENUE RECOGNITION TABLE
-- ============================================

CREATE TABLE public.revenue_recognition (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    contract_amount DECIMAL(12,2) NOT NULL,
    recognized_revenue DECIMAL(12,2) DEFAULT 0,
    unrealized_revenue DECIMAL(12,2) DEFAULT 0,
    month TEXT NOT NULL,
    year INTEGER NOT NULL,
    status revenue_status DEFAULT 'expected',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CASH FLOW TABLE
-- ============================================

CREATE TABLE public.cash_flow (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    month TEXT NOT NULL,
    year INTEGER NOT NULL,
    cash_inflow DECIMAL(12,2) DEFAULT 0,
    cash_outflow DECIMAL(12,2) DEFAULT 0,
    net_cash_flow DECIMAL(12,2) DEFAULT 0,
    opening_balance DECIMAL(12,2) DEFAULT 0,
    closing_balance DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(month, year)
);

-- ============================================
-- ACCOUNTS RECEIVABLE TABLE
-- ============================================

CREATE TABLE public.accounts_receivable (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    due_date DATE NOT NULL,
    days_overdue INTEGER DEFAULT 0,
    aging_category ar_aging_category DEFAULT '0-30',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PROFIT & LOSS TABLE
-- ============================================

CREATE TABLE public.profit_loss (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    month TEXT NOT NULL,
    year INTEGER NOT NULL,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    cost_of_revenue DECIMAL(12,2) DEFAULT 0,
    gross_profit DECIMAL(12,2) DEFAULT 0,
    operating_expenses DECIMAL(12,2) DEFAULT 0,
    ebitda DECIMAL(12,2) DEFAULT 0,
    net_income DECIMAL(12,2) DEFAULT 0,
    profit_margin DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(month, year)
);

-- ============================================
-- SUPPORT TICKETS TABLE
-- ============================================

CREATE TABLE public.support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    category ticket_category DEFAULT 'general',
    priority ticket_priority DEFAULT 'medium',
    status ticket_status DEFAULT 'open',
    assigned_to UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TICKET RESPONSES TABLE
-- ============================================

CREATE TABLE public.ticket_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id),
    author_role ticket_author_role NOT NULL,
    message TEXT NOT NULL,
    attachments TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PAYMENT HISTORY TABLE
-- ============================================

CREATE TABLE public.payment_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method payment_method NOT NULL,
    reference TEXT,
    status payment_status DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Clients
CREATE INDEX idx_clients_status ON public.clients(status);
CREATE INDEX idx_clients_client_id ON public.clients(client_id);

-- Employees
CREATE INDEX idx_employees_status ON public.employees(status);
CREATE INDEX idx_employees_department ON public.employees(department);
CREATE INDEX idx_employees_employee_id ON public.employees(employee_id);

-- Invoices
CREATE INDEX idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_due_date ON public.invoices(due_date);

-- Shows
CREATE INDEX idx_shows_status ON public.shows(status);
CREATE INDEX idx_shows_category ON public.shows(category);

-- Ad Slots
CREATE INDEX idx_ad_slots_client_id ON public.ad_slots(client_id);
CREATE INDEX idx_ad_slots_status ON public.ad_slots(status);
CREATE INDEX idx_ad_slots_dates ON public.ad_slots(start_date, end_date);

-- Shifts
CREATE INDEX idx_shifts_employee_id ON public.shifts(employee_id);
CREATE INDEX idx_shifts_date ON public.shifts(date);

-- Leave Requests
CREATE INDEX idx_leave_requests_employee_id ON public.leave_requests(employee_id);
CREATE INDEX idx_leave_requests_status ON public.leave_requests(status);

-- Notifications
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);

-- Support Tickets
CREATE INDEX idx_support_tickets_client_id ON public.support_tickets(client_id);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_off_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_recognition ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_flow ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts_receivable ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profit_loss ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all profiles, but only update their own
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Admin/Manager full access policies (example for clients table)
CREATE POLICY "Admins and managers have full access to clients" ON public.clients
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'manager')
        )
    );

-- Employees can view clients
CREATE POLICY "Employees can view clients" ON public.clients
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'employee'
        )
    );

-- Clients can view their own data
CREATE POLICY "Clients can view own data" ON public.clients
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.clients c ON c.email = p.email
            WHERE p.id = auth.uid()
            AND c.id = clients.id
        )
    );

-- Shows are viewable by all authenticated users
CREATE POLICY "Shows are viewable by authenticated users" ON public.shows
    FOR SELECT USING (auth.role() = 'authenticated');

-- Announcements viewable by target roles or all if no target
CREATE POLICY "Announcements viewable by target roles" ON public.announcements
    FOR SELECT USING (
        target_roles IS NULL 
        OR array_length(target_roles, 1) IS NULL
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = ANY(target_roles)
        )
    );

-- Notifications: Users can only see their own
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (user_id = auth.uid());

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shows_updated_at BEFORE UPDATE ON public.shows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ad_slots_updated_at BEFORE UPDATE ON public.ad_slots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shifts_updated_at BEFORE UPDATE ON public.shifts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate invoice balance
CREATE OR REPLACE FUNCTION calculate_invoice_balance()
RETURNS TRIGGER AS $$
BEGIN
    NEW.balance = NEW.amount - NEW.amount_paid;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_invoice_balance_trigger BEFORE INSERT OR UPDATE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION calculate_invoice_balance();

-- Function to update client balance when invoice changes
CREATE OR REPLACE FUNCTION update_client_balance()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.clients
    SET 
        total_billed = (SELECT COALESCE(SUM(amount), 0) FROM public.invoices WHERE client_id = NEW.client_id),
        amount_paid = (SELECT COALESCE(SUM(amount_paid), 0) FROM public.invoices WHERE client_id = NEW.client_id),
        balance = (SELECT COALESCE(SUM(balance), 0) FROM public.invoices WHERE client_id = NEW.client_id)
    WHERE id = NEW.client_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_client_balance_trigger AFTER INSERT OR UPDATE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION update_client_balance();

-- Function to calculate employee net pay
CREATE OR REPLACE FUNCTION calculate_employee_net_pay()
RETURNS TRIGGER AS $$
BEGIN
    NEW.net_pay = NEW.salary - NEW.deductions;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_employee_net_pay_trigger BEFORE INSERT OR UPDATE ON public.employees
    FOR EACH ROW EXECUTE FUNCTION calculate_employee_net_pay();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'employee')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on auth.users insert
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- View: Invoices with client names
CREATE VIEW public.invoices_with_clients AS
SELECT 
    i.*,
    c.name AS client_name,
    c.company AS client_company,
    c.email AS client_email
FROM public.invoices i
JOIN public.clients c ON i.client_id = c.id;

-- View: Shifts with employee and show names
CREATE VIEW public.shifts_with_details AS
SELECT 
    s.*,
    e.name AS employee_name,
    e.employee_id AS employee_code,
    sh.name AS show_name
FROM public.shifts s
JOIN public.employees e ON s.employee_id = e.id
LEFT JOIN public.shows sh ON s.show_id = sh.id;

-- View: Ad slots with client and show names
CREATE VIEW public.ad_slots_with_details AS
SELECT 
    a.*,
    c.name AS client_name,
    c.company AS client_company,
    sh.name AS show_name
FROM public.ad_slots a
JOIN public.clients c ON a.client_id = c.id
LEFT JOIN public.shows sh ON a.show_id = sh.id;

-- View: Leave requests with employee names
CREATE VIEW public.leave_requests_with_employees AS
SELECT 
    lr.*,
    e.name AS employee_name,
    e.employee_id AS employee_code,
    e.department
FROM public.leave_requests lr
JOIN public.employees e ON lr.employee_id = e.id;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant access to all tables for authenticated users
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant select on views
GRANT SELECT ON public.invoices_with_clients TO authenticated;
GRANT SELECT ON public.shifts_with_details TO authenticated;
GRANT SELECT ON public.ad_slots_with_details TO authenticated;
GRANT SELECT ON public.leave_requests_with_employees TO authenticated;
