-- Invitations table for invite-only user registration
-- Run this in Supabase SQL Editor after the main schema

-- ============================================
-- INVITATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'employee',
    department TEXT,
    invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);

-- RLS Policies
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Admins and managers can view all invitations
CREATE POLICY "Admins can view all invitations" ON public.invitations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'manager')
        )
    );

-- Admins and managers can create invitations
CREATE POLICY "Admins can create invitations" ON public.invitations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'manager')
        )
    );

-- Admins can delete invitations
CREATE POLICY "Admins can delete invitations" ON public.invitations
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Anyone can view their own invitation by token (for accepting)
CREATE POLICY "Anyone can view invitation by token" ON public.invitations
    FOR SELECT USING (true);

-- Grant permissions
GRANT ALL ON public.invitations TO authenticated;
GRANT SELECT ON public.invitations TO anon;
