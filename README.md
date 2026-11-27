# BizPilot AI — AI Business Operating System for Indian SMEs

[![Next.js 15](https://img.shields.io/badge/Next.js-15.5.15-black)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.2.1-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4.x-38bdf8)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20RLS-3ecf8e)](https://supabase.com/)
[![Google GenAI](https://img.shields.io/badge/Google%20GenAI-Gemini%203.8%20Flash-4285f4)](https://ai.google.dev/)
[![Razorpay](https://img.shields.io/badge/Razorpay-INR%20Paise-02042b)](https://razorpay.com/)

**BizPilot AI** is a production-ready AI Business Operating System (AI Business OS) engineered specifically for Indian Small & Medium Enterprises (SMEs), retailers, wholesalers, manufacturers, service providers, and digital marketing agencies.

---

## 🌟 Key Features

- **🌐 Tri-lingual Experience:** Full native UI and AI copywriting in **English**, **Hindi (हिंदी)**, and **Marathi (मराठी)** + Hinglish.
- **✨ AI Marketing Studio (`/bizpilot/marketing`):** One-click generation of platform-optimized captions, hashtags, and visual briefs for Instagram, Facebook, LinkedIn, and WhatsApp.
- **👥 Mini CRM & Leads Pipeline (`/bizpilot/leads`):** 5-stage Kanban & Table views (`new`, `contacted`, `interested`, `won`, `lost`), follow-up reminders, and AI-powered WhatsApp follow-up drafter.
- **📊 Decimal-Safe Financial Analytics (`/bizpilot/analytics`):** Real-time Sales, Expenses, and Net Margin calculation backed by PostgreSQL `NUMERIC(12,2)` precision.
- **🤖 Grounded AI Business Assistant (`/bizpilot/assistant`):** Answers business inquiries grounded strictly on verified SQL queries to eliminate financial hallucination.
- **🏢 Multi-Tenant Workspaces (`/bizpilot`):** Manage multiple businesses or branches under one account with transactional PostgreSQL RPC creation and Row Level Security (RLS).
- **💳 Indian Subscriptions in ₹ (`/bizpilot/billing`):** Plans in INR paise with Razorpay checkout integration and idempotent webhook processing.
- **🛡️ Quota & Cost Control:** Atomic AI credit reservation system with token telemetry and usage logs.
- **⚡ Super Admin Dashboard (`/bizpilot/admin`):** Platform-wide metrics including Monthly Recurring Revenue (MRR in ₹), active businesses, and AI compute costs.

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 20+
- A Supabase project
- A Google AI Studio API key (`gemini-3.8-flash`)
- Razorpay account (Test or Live mode)

### 2. Installation
```bash
git clone https://github.com/anand9696/socialsetu.git
cd socialsetu/socialsetu-main

# Install dependencies
npm install --legacy-peer-deps
```

### 3. Environment Setup
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your configuration:
```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-3.8-flash"

RAZORPAY_KEY_ID="rzp_test_xxxxxx"
RAZORPAY_KEY_SECRET="your-razorpay-secret"
RAZORPAY_WEBHOOK_SECRET="your-webhook-secret"
```

### 4. Database Setup
Run the SQL migration in `supabase/migrations/20261126_bizpilot_core.sql` in your Supabase SQL Editor. This initializes:
- 18 core tables with foreign keys and performance indexes
- Multi-tenant Row Level Security (RLS) policies
- Transactional workspace creation RPC (`create_business_workspace`)
- Seed subscription plans (Free, Starter ₹499, Pro ₹1,499, Business ₹4,999)

### 5. Running Locally
```bash
# Start Next.js development server
npm run dev
```
Open [http://localhost:3000/bizpilot](http://localhost:3000/bizpilot) in your browser.

---

## 🧪 Testing & Production Build

### Run Unit Tests
```bash
npx vitest run tests/bizpilot.test.ts
```

### Production Build
```bash
npm run build
npm start
```

---

## 📁 Architecture Overview

```
app/
├── bizpilot/
│   ├── layout.tsx         # Collapsible sidebar, workspace switcher, language toggle, AI quota meter
│   ├── page.tsx           # Executive Dashboard (KPIs, Recharts sales/expense & lead distribution)
│   ├── marketing/page.tsx # AI Marketing Studio (Multilingual generation & draft storage)
│   ├── leads/page.tsx     # Mini CRM (Kanban, follow-up alerts, WhatsApp drafter, CSV export)
│   ├── analytics/page.tsx # Financial Analytics (Sales vs Expenses, Category breakdown, modals)
│   ├── assistant/page.tsx # Grounded AI Business Assistant (Anti-hallucination SQL context)
│   ├── billing/page.tsx   # INR Pricing Plans (Razorpay order checkout)
│   └── admin/page.tsx     # Platform Admin (MRR, system users, AI compute cost telemetry)
├── api/
│   ├── businesses/        # Workspaces CRUD & transactional RPC
│   ├── leads/             # CRM leads & follow-up querying
│   ├── marketing/         # Gemini copywriting generation & content drafts
│   ├── analytics/         # Decimal-safe sales, expenses, and summary ledgers
│   ├── assistant/         # Grounded copilot chat handler
│   ├── usage/             # Real-time AI quota meter
│   ├── billing/           # Plans, Razorpay checkout, and idempotent webhooks
│   └── admin/             # Platform-wide MRR & telemetry
src/
├── context/
│   └── BizPilotContext.tsx # Centralized client-side workspace, language, and quota context
├── i18n/
│   ├── messages/
│   │   ├── en.json        # English dictionary
│   │   ├── hi.json        # Hindi (हिंदी) dictionary
│   │   └── mr.json        # Marathi (मराठी) dictionary
│   └── index.ts           # Type-safe i18n resolver with fallback
├── lib/
│   └── validation/
│       └── bizpilotSchemas.ts # Zod v4 schemas for lead, business, sales, expenses
├── services/
│   ├── aiUsageService.ts  # Atomic quota reservation & token cost logging
│   ├── geminiService.ts   # Multi-model fallback (gemini-3.8-flash, gemini-3.5-flash)
│   └── businessAssistantService.ts # Anti-hallucination telemetry aggregator
└── types/
    └── bizpilot.ts        # TypeScript domain models
```

---

## 📜 License
Private & Proprietary — All rights reserved.
