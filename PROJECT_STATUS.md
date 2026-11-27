# BizPilot AI — Production Status & Architecture Report

**Version:** 1.0.0-production  
**Target Market:** Indian Small & Medium Enterprises (SMEs), Retailers, Distributors, Manufacturers, Freelancers & Agencies  
**Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Recharts, Supabase PostgreSQL (RLS), Google GenAI (`gemini-3.8-flash`), Razorpay (INR)

---

## 1. Executive Summary

**BizPilot AI** is a complete, production-ready AI Business Operating System (AI Business OS) built specifically for Indian SMEs. It consolidates daily marketing, lead management (mini-CRM), verified financial analytics, conversational business intelligence, and multi-tenant billing into a single, high-performance platform.

All AI interactions are localized in **English**, **Hindi (हिंदी)**, and **Marathi (मराठी)** with Hinglish support, enabling Indian business owners to run their business operations natively without technical overhead.

---

## 2. Core Modules Implemented

### 1. AI Marketing Studio (`/bizpilot/marketing`)
- **Multilingual Copywriting:** Generates high-converting marketing posts, captions, hashtags, and call-to-actions in English, Hindi, Marathi, and Hinglish.
- **Platform-Optimized Formats:** Tailored generation for Instagram (visual hook, captions, hashtags), Facebook (community tone & CTA), LinkedIn (professional B2B angle), and WhatsApp (quick sales copy with direct CTA).
- **Tone & Audience Selector:** Supports promotional, professional, friendly, creative, and informative tones.
- **Content Storage:** Saves generated posts directly into `marketing_contents` draft library with one-click clipboard copying.
- **AI Quota Guard:** Interlocks with `aiUsageService` before generation to ensure workspace has sufficient monthly quota.

### 2. Lead Management & Mini CRM (`/bizpilot/leads`)
- **Kanban Pipeline & Table Views:** Tracks leads across 5 stages: `new`, `contacted`, `interested`, `won`, and `lost`.
- **Follow-up Engine:** Visual indicators for overdue follow-ups, today's tasks, and upcoming meetings.
- **AI WhatsApp Drafter:** Generates personalized, multilingual WhatsApp follow-up messages tailored to the lead's status and history.
- **Data Portability:** Instant CSV export formatted for Indian phone numbers and lead pipelines.

### 3. Financial Analytics Dashboard (`/bizpilot/analytics`)
- **Decimal-Safe Financial Tracking:** Backed by PostgreSQL `NUMERIC(12,2)` to eliminate floating-point rounding errors.
- **Key Metrics:** Total Sales, Total Expenses, Net Profit, and Profit Margin Percentage.
- **Visual Trends:** Recharts Area & Bar charts depicting monthly sales vs. expenses, expense distribution by category (Rent, Salaries, Marketing, Utilities, Inventory, Logistics), and recent transactions.
- **Quick Modals:** Record sales and expense vouchers directly with instantaneous recalculation.

### 4. AI Business Assistant (`/bizpilot/assistant`)
- **Strict Anti-Hallucination Architecture:** The assistant runs verified SQL queries first against Supabase (`businessAssistantService.ts`) to compute verified financial totals, lead conversion rates, and pending follow-ups.
- **Grounded AI Answers:** Only verified metrics are supplied into Gemini's system prompt context. The AI is forbidden from guessing financial metrics, guaranteeing 100% grounded explanations.
- **Multilingual Support:** Business owners can converse in English, Hindi, or Marathi (e.g., *"या महिन्याचा नफा किती आहे?"* or *"इस महीने कितने लीड्स कन्वर्ट हुए?"*).

### 5. Multi-Tenant Business Workspaces & Team Management (`/bizpilot`)
- **Workspace Switcher:** Instant switching between multiple businesses or branches under one account.
- **Transactional Workspace Creation:** Powered by PostgreSQL transactional RPC `create_business_workspace`, ensuring workspace record, owner membership (`owner` role), and free tier subscription are created atomically.
- **Row Level Security (RLS):** Strict multi-tenant isolation enforced at the database level on all 18 tables using `workspace_members` validation.

### 6. Subscriptions & Billing in INR (`/bizpilot/billing`)
- **Indian Pricing Tiers:**
  - **Free Tier:** ₹0 / month — 20 AI credits, 50 leads, single workspace.
  - **Starter Plan:** ₹499 / month (49,900 paise) — 150 AI credits, 500 leads, 2 team seats.
  - **Professional Plan:** ₹1,499 / month (149,900 paise) — 600 AI credits, 2,500 leads, 5 team seats, priority AI.
  - **Business Plan:** ₹4,999 / month (499,900 paise) — 2,500 AI credits, unlimited leads, 15 team seats.
- **Razorpay Integration:** Server-side order creation (`/api/billing/checkout`) with HMAC SHA256 webhook signature verification (`/api/billing/webhook`).
- **Idempotent Webhooks:** Deduplicated using `payment_events` table to prevent double-crediting.

### 7. AI Usage & Cost Control (`/api/usage`)
- **Atomic Quota Reservation:** Prevents race conditions during concurrent user requests via `ai_usage_reservations`.
- **Token & Cost Telemetry:** Real-time logging of prompt tokens, completion tokens, model name, and estimated cost in USD/INR in `ai_usage_logs`.
- **Live Progress Meter:** Visual usage indicator in the sidebar alerting users before quota limits are reached.

### 8. Platform Administration (`/bizpilot/admin`)
- **Telemetry Overview:** Aggregated Monthly Recurring Revenue (MRR in ₹), active paid vs. free businesses, total system users, and total AI compute tokens consumed.
- **Multi-Tenant System Health:** Platform-wide oversight for super administrators.

---

## 3. Database Architecture (`supabase/migrations/20261126_bizpilot_core.sql`)

The migration file creates 18 strongly-typed tables with foreign keys, indexes, and full RLS policies:
1. `businesses`: Tenant workspaces
2. `workspace_members`: RBAC roles (`owner`, `admin`, `manager`, `staff`)
3. `subscription_plans`: Pricing tiers in INR paise
4. `subscriptions`: Active subscriptions and cycle dates
5. `payment_events`: Razorpay webhook idempotency ledger
6. `leads`: CRM leads pipeline
7. `lead_activities`: Notes, calls, meetings, follow-ups
8. `sales_entries`: Decimal-safe revenue ledger
9. `expense_entries`: Categorized business expenses
10. `marketing_contents`: AI generated posts and drafts
11. `assistant_conversations`: Grounded AI chat threads
12. `assistant_messages`: Verified message history
13. `ai_usage_reservations`: Atomic quota reservations
14. `ai_usage_logs`: LLM token & cost ledger

---

## 4. Quality & Build Verification

### Vitest Test Suite (`tests/bizpilot.test.ts`)
- **Result:** 11 passed (100%)
- **Coverage:**
  - Zod RFC 4122 v4 UUID validation for business workspace creation
  - Lead pipeline schema validation
  - Decimal-safe sales & expense entry schemas
  - Rejection of negative financial figures
  - Multilingual translation lookups (English, Hindi, Marathi)
  - Missing key fallback handling
  - Net profit and profit margin calculation accuracy
  - INR paise to rupee conversion arithmetic

### Next.js 15 Production Build (`npm run build`)
- **Result:** Exit code 0 (Success)
- **Output:** 57 static and dynamic route handlers compiled and optimized cleanly with zero TypeScript or webpack errors.

---

## 5. Deployment Checklist for Production

1. **Database:**
   Execute `supabase/migrations/20261126_bizpilot_core.sql` in your Supabase SQL Editor.
2. **Environment Variables:**
   Verify the following in your hosting provider (e.g., Vercel / Cloud Run):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
   - `GEMINI_MODEL="gemini-3.8-flash"`
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
   - `RAZORPAY_WEBHOOK_SECRET`
3. **Razorpay Webhook Configuration:**
   Point your Razorpay webhook endpoint to `https://your-domain.com/api/billing/webhook` with the secret configured above and subscribe to `order.paid` and `payment.captured` events.
