# BizPilot AI — Google Gemini AI Integration & Model Guide

This guide details the server-side integration of Google GenAI for **BizPilot AI**, including model fallbacks, multilingual prompt generation, token tracking, and anti-hallucination guarantees.

---

## 1. Supported Model Strategy

BizPilot AI uses the modern `@google/genai` SDK with active multi-model fallback:

1. **Primary Model:** `gemini-3.8-flash` (or `gemini-2.5-flash`)
   - Optimized for low latency (< 1.5s), high throughput, and cost-efficiency.
   - Ideal for multilingual copywriting and fast business chat.
2. **Fallback Model:** `gemini-3.5-flash` (or `gemini-1.5-flash-latest`)
   - Automatically triggered if the primary model encounters rate limiting or temporary regional unavailability.

All model calls are handled strictly server-side in [`src/services/geminiService.ts`](file:///d:/socialsetu/socialsetu-main/src/services/geminiService.ts). **API keys are never exposed to client browsers.**

---

## 2. Multilingual Marketing Studio Prompts

The marketing engine formats instructions per platform and language:
- **Instagram:** Focuses on an attention-grabbing hook in the first 2 lines, engaging body copy, 10-15 targeted hashtags, and image direction for Canva/designers.
- **Facebook:** Emphasizes community engagement, conversational tone, and direct WhatsApp/Phone call-to-actions.
- **LinkedIn:** Adopts a professional B2B perspective, sharing business value and industry credibility.
- **WhatsApp:** Delivers concise, easily-shareable promotional messages with clear discount/offer terms and contact numbers.

Supported output languages:
- `en`: Clear, business-grade Indian English.
- `hi`: Natural Hindi in Devanagari script (हिंदी).
- `mr`: Authentic Marathi in Devanagari script (मराठी).
- `hinglish`: Romanized Hindi/English blend familiar to urban Indian consumers.

---

## 3. Grounded AI Business Assistant (Anti-Hallucination)

To prevent the AI assistant from inventing revenue, margins, or lead counts, BizPilot AI utilizes a **two-phase architecture**:

```
User Query ("या महिन्याचा नफा किती आहे?")
               │
               ▼
   1. Database Telemetry Aggregator (businessAssistantService.ts)
      - Runs verified SQL calculations on Supabase:
        • Total Sales = ₹1,45,000.00
        • Total Expenses = ₹85,000.00
        • Net Profit = ₹60,000.00 (Margin: 41.4%)
        • Active Leads = 28 (Won: 6, Conversion: 21.4%)
        • Pending Follow-ups = 4
               │
               ▼
   2. Grounded Gemini Prompt Construction
      - Passes ONLY verified numbers inside system context.
      - System instruction: "You are BizPilot AI. Use ONLY the verified data provided.
        Never invent financial statistics."
               │
               ▼
   3. Multilingual Conversational Explanation to User
```

---

## 4. Quota Reservation & Cost Control (`src/services/aiUsageService.ts`)

To avoid race conditions:
1. `reserveAiQuota(businessId, credits=1)` reserves the quota atomically using `ai_usage_reservations`.
2. Gemini is invoked.
3. Actual prompt tokens and completion tokens are recorded in `ai_usage_logs`.
4. Reservation is released and the monthly quota meter is updated.
