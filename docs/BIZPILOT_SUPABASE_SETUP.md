# BizPilot AI — Supabase Database Architecture & Setup Guide

This guide details the complete database configuration, multi-tenant row-level security (RLS), and transactional RPC functions for **BizPilot AI**.

---

## 1. Overview of Core Database Migration

All database definitions are packaged in:
[`supabase/migrations/20261126_bizpilot_core.sql`](file:///d:/socialsetu/socialsetu-main/supabase/migrations/20261126_bizpilot_core.sql)

### The migration provisions 18 essential tables:
1. `public.user_profiles`: Extends `auth.users` with display name, avatar, and preferred language (`en`, `hi`, `mr`).
2. `public.businesses`: Multi-tenant business workspaces with slug, industry, and default language.
3. `public.business_members`: RBAC mapping table assigning roles (`owner`, `admin`, `manager`, `staff`) per business.
4. `public.subscription_plans`: Pricing tiers in INR paise with lead limits and AI usage quotas.
5. `public.subscriptions`: Active subscription records tied to businesses.
6. `public.payment_events`: Idempotency tracking table preventing duplicate webhook events.
7. `public.leads`: Mini-CRM leads with 5 stages (`new`, `contacted`, `interested`, `won`, `lost`).
8. `public.lead_activities`: Interaction audit logs (calls, notes, WhatsApp, reminders).
9. `public.sales_entries`: Decimal-safe (`NUMERIC(12,2)`) revenue vouchers.
10. `public.expense_entries`: Categorized business expense ledgers.
11. `public.marketing_contents`: AI generated copywriting drafts and published posts.
12. `public.assistant_conversations`: Conversational session threads with the AI copilot.
13. `public.assistant_messages`: Verified prompt and grounded explanation turns.
14. `public.ai_usage_reservations`: Atomic credit reservations preventing race conditions.
15. `public.ai_usage_logs`: Token consumption and cost telemetry.

---

## 2. Multi-Tenant Row-Level Security (RLS)

All public tables enforce strict tenant isolation using Postgres Row Level Security.

A private security definer function checks workspace membership:
```sql
CREATE OR REPLACE FUNCTION private.is_business_member(biz_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.business_members
    WHERE business_id = biz_id AND user_id = auth.uid()
  );
$$;
```

Each table is locked with tenant isolation policies:
```sql
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view workspace leads"
ON public.leads FOR SELECT
USING (private.is_business_member(business_id));

CREATE POLICY "Members can insert workspace leads"
ON public.leads FOR INSERT
WITH CHECK (private.is_business_member(business_id));

CREATE POLICY "Members can update workspace leads"
ON public.leads FOR UPDATE
USING (private.is_business_member(business_id));
```

---

## 3. Atomic Transactional RPC: `create_business_workspace`

To guarantee data consistency when onboarding new businesses, a PostgreSQL stored procedure runs in a single transaction:
1. Inserts the business record in `public.businesses`.
2. Assigns the creator as an `owner` in `public.business_members`.
3. Attaches the default Free Tier subscription record.

```sql
SELECT create_business_workspace(
  p_name := 'Pune Auto Spares',
  p_industry := 'Retail & Wholesale',
  p_description := 'Automotive spare parts distributor in Pune',
  p_language := 'mr'
);
```

---

## 4. How to Execute Migrations

1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to **SQL Editor** > **New Query**.
3. Copy the entire contents of [`supabase/migrations/20261126_bizpilot_core.sql`](file:///d:/socialsetu/socialsetu-main/supabase/migrations/20261126_bizpilot_core.sql).
4. Click **Run**.
5. Verify in **Table Editor** that all 18 tables and seed plans are populated.
