-- ============================================================================
-- BIZPILOT AI: PRODUCTION-READY DATABASE MIGRATION & RLS POLICIES
-- Multi-Tenant AI Business OS for Indian SMEs (English, Hindi, Marathi)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create isolated schema for private security definer functions
CREATE SCHEMA IF NOT EXISTS private;

-- ----------------------------------------------------------------------------
-- 1. USER PROFILES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    avatar_url TEXT,
    preferred_language TEXT NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'hi', 'mr')),
    is_platform_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. BUSINESSES (Multi-Tenant Workspaces)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    industry TEXT,
    description TEXT,
    preferred_language TEXT NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'hi', 'mr')),
    currency_code VARCHAR(3) NOT NULL DEFAULT 'INR',
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. BUSINESS MEMBERS (Role-Based Access Control)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.business_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'manager', 'staff')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_business_user UNIQUE (business_id, user_id)
);

-- ----------------------------------------------------------------------------
-- 4. SUBSCRIPTION PLANS & SUBSCRIPTIONS (INR in Paise)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    monthly_price_paise BIGINT NOT NULL DEFAULT 0,
    ai_generations_limit INT NOT NULL DEFAULT 20,
    member_limit INT NOT NULL DEFAULT 1,
    lead_limit INT NOT NULL DEFAULT 25,
    features JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE UNIQUE,
    plan_id UUID NOT NULL REFERENCES public.plans(id),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'unpaid')),
    provider TEXT DEFAULT 'razorpay',
    provider_customer_id TEXT,
    provider_subscription_id TEXT,
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 5. LEADS & CRM PIPELINE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    company TEXT,
    source TEXT DEFAULT 'Direct',
    requirement TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'interested', 'won', 'lost')),
    next_follow_up_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.lead_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    description TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 6. AI MARKETING CONTENT
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.marketing_contents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'linkedin', 'whatsapp')),
    content_type TEXT NOT NULL DEFAULT 'post',
    language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'hi', 'mr', 'hinglish')),
    topic TEXT NOT NULL,
    prompt TEXT NOT NULL,
    generated_content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 7. FINANCIAL ANALYTICS (Decimal-safe NUMERIC)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sales_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    currency_code VARCHAR(3) NOT NULL DEFAULT 'INR',
    description TEXT,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.expense_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    currency_code VARCHAR(3) NOT NULL DEFAULT 'INR',
    category TEXT NOT NULL DEFAULT 'General',
    description TEXT,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 8. AI CONVERSATIONS & USAGE QUOTA ENGINE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New Business Query',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_usage_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'consumed', 'released')),
    reserved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '2 minutes')
);

CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    feature TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT 'google',
    model TEXT NOT NULL DEFAULT 'gemini-3.8-flash',
    input_tokens INT NOT NULL DEFAULT 0,
    output_tokens INT NOT NULL DEFAULT 0,
    estimated_cost NUMERIC(10,4) NOT NULL DEFAULT 0.0000,
    status TEXT NOT NULL DEFAULT 'success',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 9. PAYMENT IDEMPOTENCY, NOTIFICATIONS & AUDIT LOGS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL DEFAULT 'razorpay',
    event_id TEXT NOT NULL UNIQUE,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'alert', 'follow_up')),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 10. INDEXES FOR PERFORMANCE
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_business_members_user ON public.business_members(user_id);
CREATE INDEX IF NOT EXISTS idx_business_members_business ON public.business_members(business_id);
CREATE INDEX IF NOT EXISTS idx_leads_business ON public.leads(business_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(business_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_follow_up ON public.leads(business_id, next_follow_up_at);
CREATE INDEX IF NOT EXISTS idx_sales_business_date ON public.sales_entries(business_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_expenses_business_date ON public.expense_entries(business_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_ai_usage_business_date ON public.ai_usage_logs(business_id, created_at);
CREATE INDEX IF NOT EXISTS idx_marketing_business ON public.marketing_contents(business_id);

-- ----------------------------------------------------------------------------
-- 11. SECURITY DEFINER HELPER FUNCTIONS
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.is_business_member(p_business_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, private, auth
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.business_members
        WHERE business_id = p_business_id
          AND user_id = auth.uid()
    );
$$;

CREATE OR REPLACE FUNCTION private.has_business_role(p_business_id UUID, p_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, private, auth
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.business_members
        WHERE business_id = p_business_id
          AND user_id = auth.uid()
          AND role = ANY(p_roles)
    );
$$;

-- ----------------------------------------------------------------------------
-- 12. TRANSACTIONAL WORKSPACE CREATION RPC
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_business_workspace(
    p_name TEXT,
    p_industry TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_preferred_language TEXT DEFAULT 'en'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, auth
AS $$
DECLARE
    v_user_id UUID;
    v_business_id UUID;
    v_slug TEXT;
    v_free_plan_id UUID;
    v_result JSONB;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required to create a business workspace';
    END IF;

    -- Generate a clean URL-safe slug
    v_slug := lower(regexp_replace(p_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(gen_random_uuid()::text from 1 for 6);

    -- 1. Insert Business
    INSERT INTO public.businesses (
        name,
        slug,
        industry,
        description,
        preferred_language,
        currency_code,
        timezone
    ) VALUES (
        p_name,
        v_slug,
        p_industry,
        p_description,
        p_preferred_language,
        'INR',
        'Asia/Kolkata'
    ) RETURNING id INTO v_business_id;

    -- 2. Insert Owner Membership
    INSERT INTO public.business_members (
        business_id,
        user_id,
        role
    ) VALUES (
        v_business_id,
        v_user_id,
        'owner'
    );

    -- 3. Retrieve Free Plan
    SELECT id INTO v_free_plan_id FROM public.plans WHERE code = 'free' LIMIT 1;
    IF v_free_plan_id IS NULL THEN
        -- Seed Free Plan if missing
        INSERT INTO public.plans (code, name, monthly_price_paise, ai_generations_limit, member_limit, lead_limit)
        VALUES ('free', 'Free Starter', 0, 20, 1, 25)
        RETURNING id INTO v_free_plan_id;
    END IF;

    -- 4. Initialize Free Subscription
    INSERT INTO public.subscriptions (
        business_id,
        plan_id,
        status,
        provider,
        current_period_start,
        current_period_end
    ) VALUES (
        v_business_id,
        v_free_plan_id,
        'active',
        'free_tier',
        NOW(),
        NOW() + INTERVAL '365 days'
    );

    -- 5. Record Audit Log
    INSERT INTO public.audit_logs (
        business_id,
        user_id,
        action,
        entity_type,
        entity_id,
        metadata
    ) VALUES (
        v_business_id,
        v_user_id,
        'workspace_created',
        'business',
        v_business_id,
        jsonb_build_object('name', p_name, 'slug', v_slug)
    );

    SELECT jsonb_build_object(
        'id', v_business_id,
        'name', p_name,
        'slug', v_slug,
        'role', 'owner'
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- ----------------------------------------------------------------------------
-- 13. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Plans are publicly readable by authenticated users
CREATE POLICY "Allow authenticated read plans" ON public.plans
    FOR SELECT TO authenticated USING (is_active = TRUE);

-- User Profiles
CREATE POLICY "Users can read own profile" ON public.user_profiles
    FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE TO authenticated USING (id = auth.uid());

-- Businesses: Members can select, Owners/Admins can update
CREATE POLICY "Members can view their business" ON public.businesses
    FOR SELECT TO authenticated
    USING (private.is_business_member(id));

CREATE POLICY "Owners and Admins can update business" ON public.businesses
    FOR UPDATE TO authenticated
    USING (private.has_business_role(id, ARRAY['owner', 'admin']));

-- Business Members
CREATE POLICY "Members can view team members in same business" ON public.business_members
    FOR SELECT TO authenticated
    USING (private.is_business_member(business_id));

CREATE POLICY "Owners and Admins can manage team members" ON public.business_members
    FOR ALL TO authenticated
    USING (private.has_business_role(business_id, ARRAY['owner', 'admin']));

-- Subscriptions: Read-only for members; only system/admin updates
CREATE POLICY "Members can view business subscription" ON public.subscriptions
    FOR SELECT TO authenticated
    USING (private.is_business_member(business_id));

-- Leads: All members can read/manage leads for their business
CREATE POLICY "Members can view business leads" ON public.leads
    FOR SELECT TO authenticated
    USING (private.is_business_member(business_id));

CREATE POLICY "Members can create leads" ON public.leads
    FOR INSERT TO authenticated
    WITH CHECK (private.is_business_member(business_id));

CREATE POLICY "Members can update business leads" ON public.leads
    FOR UPDATE TO authenticated
    USING (private.is_business_member(business_id));

CREATE POLICY "Managers and above can delete leads" ON public.leads
    FOR DELETE TO authenticated
    USING (private.has_business_role(business_id, ARRAY['owner', 'admin', 'manager']));

-- Lead Activities
CREATE POLICY "Members can view lead activities" ON public.lead_activities
    FOR SELECT TO authenticated
    USING (private.is_business_member(business_id));

CREATE POLICY "Members can insert lead activities" ON public.lead_activities
    FOR INSERT TO authenticated
    WITH CHECK (private.is_business_member(business_id));

-- Marketing Contents
CREATE POLICY "Members can view marketing contents" ON public.marketing_contents
    FOR SELECT TO authenticated
    USING (private.is_business_member(business_id));

CREATE POLICY "Members can create marketing contents" ON public.marketing_contents
    FOR INSERT TO authenticated
    WITH CHECK (private.is_business_member(business_id));

CREATE POLICY "Members can update marketing contents" ON public.marketing_contents
    FOR UPDATE TO authenticated
    USING (private.is_business_member(business_id));

CREATE POLICY "Members can delete marketing contents" ON public.marketing_contents
    FOR DELETE TO authenticated
    USING (private.has_business_role(business_id, ARRAY['owner', 'admin', 'manager']));

-- Sales Entries (Decimal-safe financial tracking)
CREATE POLICY "Members can view sales entries" ON public.sales_entries
    FOR SELECT TO authenticated
    USING (private.is_business_member(business_id));

CREATE POLICY "Members can record sales" ON public.sales_entries
    FOR INSERT TO authenticated
    WITH CHECK (private.is_business_member(business_id));

CREATE POLICY "Owners and Admins can manage sales entries" ON public.sales_entries
    FOR ALL TO authenticated
    USING (private.has_business_role(business_id, ARRAY['owner', 'admin']));

-- Expense Entries
CREATE POLICY "Members can view expense entries" ON public.expense_entries
    FOR SELECT TO authenticated
    USING (private.is_business_member(business_id));

CREATE POLICY "Members can record expenses" ON public.expense_entries
    FOR INSERT TO authenticated
    WITH CHECK (private.is_business_member(business_id));

CREATE POLICY "Owners and Admins can manage expense entries" ON public.expense_entries
    FOR ALL TO authenticated
    USING (private.has_business_role(business_id, ARRAY['owner', 'admin']));

-- AI Conversations & Messages
CREATE POLICY "Users can access their business AI conversations" ON public.ai_conversations
    FOR ALL TO authenticated
    USING (private.is_business_member(business_id) AND user_id = auth.uid());

CREATE POLICY "Users can access their AI messages" ON public.ai_messages
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.ai_conversations c
        WHERE c.id = conversation_id
          AND c.user_id = auth.uid()
          AND private.is_business_member(c.business_id)
    ));

-- AI Usage Logs (Read only for business members)
CREATE POLICY "Members can view AI usage logs" ON public.ai_usage_logs
    FOR SELECT TO authenticated
    USING (private.is_business_member(business_id));

-- Notifications
CREATE POLICY "Users can view business notifications" ON public.notifications
    FOR SELECT TO authenticated
    USING (private.is_business_member(business_id) AND (user_id IS NULL OR user_id = auth.uid()));

CREATE POLICY "Users can mark notifications as read" ON public.notifications
    FOR UPDATE TO authenticated
    USING (private.is_business_member(business_id) AND (user_id IS NULL OR user_id = auth.uid()));

-- Audit Logs
CREATE POLICY "Owners and Admins can view audit logs" ON public.audit_logs
    FOR SELECT TO authenticated
    USING (private.has_business_role(business_id, ARRAY['owner', 'admin']));

-- ----------------------------------------------------------------------------
-- 14. SEED INITIAL SUBSCRIPTION PLANS (INR in Paise)
-- ----------------------------------------------------------------------------
INSERT INTO public.plans (code, name, monthly_price_paise, ai_generations_limit, member_limit, lead_limit, features)
VALUES
    ('free', 'Free', 0, 20, 1, 25, '{"dashboard": true, "marketing_templates": true, "crm": true}'::jsonb),
    ('starter', 'Starter', 49900, 150, 1, 500, '{"marketing_assistant": true, "follow_up_reminders": true, "basic_reports": true}'::jsonb),
    ('professional', 'Professional', 149900, 600, 3, 10000, '{"ai_business_assistant": true, "advanced_analytics": true, "csv_exports": true}'::jsonb),
    ('business', 'Business', 499900, 2500, 10, 50000, '{"multiple_workspaces": true, "advanced_reports": true, "priority_support": true}'::jsonb),
    ('enterprise', 'Enterprise', 1499900, 10000, 50, 200000, '{"dedicated_support": true, "custom_integrations": true, "sla": true}'::jsonb)
ON CONFLICT (code) DO UPDATE
SET
    name = EXCLUDED.name,
    monthly_price_paise = EXCLUDED.monthly_price_paise,
    ai_generations_limit = EXCLUDED.ai_generations_limit,
    member_limit = EXCLUDED.member_limit,
    lead_limit = EXCLUDED.lead_limit,
    features = EXCLUDED.features;
