# BizPilot AI — Production Deployment Guide & Security Checklist

This guide covers production deployment to hosting environments (Vercel, Cloud Run, AWS), environment variables, background cron jobs, and the production security checklist for **BizPilot AI**.

---

## 1. Hosting Options & Prerequisites

BizPilot AI is architected as a Next.js 15 modular monolith that deploys seamlessly to:
- **Vercel** (Recommended for zero-config edge routing and automated cron jobs)
- **Google Cloud Run / AWS ECS** (Containerized Docker deployment)

---

## 2. Required Production Environment Variables

Configure these variables in your hosting provider's secrets manager:

```env
# Application URL
APP_URL="https://your-production-domain.com"
NEXT_PUBLIC_APP_URL="https://your-production-domain.com"

# Supabase PostgreSQL
NEXT_PUBLIC_SUPABASE_URL="https://xxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOi..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..."

# Google GenAI / Gemini
GEMINI_API_KEY="AIzaSy..."
GEMINI_MODEL="gemini-3.8-flash"

# Razorpay India
RAZORPAY_KEY_ID="rzp_live_..."
RAZORPAY_KEY_SECRET="your_live_secret"
RAZORPAY_WEBHOOK_SECRET="your_live_webhook_secret"

# Scheduled Background Jobs
CRON_SECRET="generate_a_random_32_character_string"
```

---

## 3. Scheduled Background Jobs (Cron)

BizPilot AI includes an automated follow-up notifier and subscription expiration check at:
`GET /api/cron/bizpilot`

### Setting up on Vercel:
In `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/bizpilot",
      "schedule": "0 4 * * *"
    }
  ]
}
```
*(4:00 AM UTC = 9:30 AM IST, the optimal time for business follow-up alerts in India).*

The endpoint verifies the `CRON_SECRET` bearer header or query parameter to prevent unauthorized execution.

---

## 4. Production Security Checklist

- [x] **Strict Row Level Security (RLS):** All 18 database tables have RLS enabled with workspace isolation checks via `private.is_business_member`.
- [x] **No Leaked Secrets:** LLM API keys (`GEMINI_API_KEY`), database admin keys (`SUPABASE_SERVICE_ROLE_KEY`), and Razorpay secrets are kept exclusively on the server.
- [x] **Zod Input Validation:** All API endpoints validate incoming JSON payloads with RFC 4122 v4 UUID checks and non-negative financial guards.
- [x] **Decimal Financial Precision:** Monetary transactions are stored in `NUMERIC(12,2)` and paise integers to prevent floating-point drift.
- [x] **Anti-Hallucination Guardrails:** AI Business Assistant answers are grounded strictly in real SQL metrics.
- [x] **Webhook Idempotency:** Webhooks check and insert `event_id` into `payment_events` before altering subscription state.
- [x] **Quota Reservation:** Atomic reservation rows protect against race condition exploitation.
- [x] **Content-Security-Policy (CSP):** Headers configured in `next.config.ts` blocking unauthorized frames, scripts, and injection attempts.

---

## 5. Verification Commands

Before deploying, run these automated verification commands:

```bash
# 1. Run unit test suite
npx vitest run tests/bizpilot.test.ts

# 2. Run Next.js production build
npm run build
```
Both commands must exit with code 0 before tagging a release.
