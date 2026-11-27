# BizPilot AI — Razorpay India Billing & Webhook Setup Guide

This guide details the subscription infrastructure, pricing in INR paise, Razorpay checkout orders, and idempotent webhook signature verification for **BizPilot AI**.

---

## 1. Subscription Plans & Pricing (INR Paise)

All pricing is represented in **paise** (1 Rupee = 100 Paise) to maintain integer precision and avoid floating-point discrepancies:

| Plan Code | Display Name | Monthly Price | Price in Paise | AI Credits / Mo | Leads Limit | Team Seats |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `free` | Free Tier | ₹0 | 0 | 20 | 50 | 1 |
| `starter` | Starter | ₹499 | 49,900 | 150 | 500 | 2 |
| `pro` | Professional | ₹1,499 | 149,900 | 600 | 2,500 | 5 |
| `business` | Business | ₹4,999 | 499,900 | 2,500 | Unlimited | 15 |

---

## 2. Order Creation Flow (`app/api/billing/checkout/route.ts`)

When a user upgrades or renews their subscription from the frontend billing panel:
1. The user's role in the workspace is verified (only `owner` and `admin` roles can purchase subscriptions).
2. The endpoint calls Razorpay Orders API:
   ```json
   POST https://api.razorpay.com/v1/orders
   {
     "amount": 49900,
     "currency": "INR",
     "receipt": "rcpt_biz_<uuid>",
     "notes": {
       "business_id": "<uuid>",
       "plan_code": "starter"
     }
   }
   ```
3. An `order_id` is returned to the client to initialize the Razorpay Standard Checkout popup.

---

## 3. Idempotent Webhook Processing (`app/api/billing/webhook/route.ts`)

To protect against duplicate payment credits and replay attacks:
1. **HMAC SHA256 Signature Verification:**
   ```ts
   const expectedSignature = crypto
     .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
     .update(rawBody)
     .digest('hex');

   if (signature !== expectedSignature) {
     return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
   }
   ```
2. **Deduplication via `payment_events` table:**
   The `event_id` is recorded in `payment_events`. If an event with the same ID arrives again, the handler returns `HTTP 200 { status: 'ignored_duplicate' }` immediately without modifying the workspace subscription.
3. **Cycle Expiry Calculation:**
   Sets `current_period_start` to now and `current_period_end` to +30 days.

---

## 4. Webhook Configuration in Razorpay Dashboard

1. Log into your [Razorpay Dashboard](https://dashboard.razorpay.com/).
2. Navigate to **Settings** > **Webhooks** > **Add New Webhook**.
3. **Webhook URL:** `https://your-domain.com/api/billing/webhook`
4. **Secret:** Set a secure random string (matches `RAZORPAY_WEBHOOK_SECRET`).
5. **Active Events:**
   - `order.paid`
   - `payment.captured`
   - `payment.failed`
6. Save and test with a test mode transaction.
