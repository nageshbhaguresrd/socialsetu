# Autonomous AI Virtual IT Company OS (AI-VITOS)
## Enterprise Deployment & Operations Manual

### 1. Executive Summary
The **AI Virtual IT Company OS (AI-VITOS)** is a full-cycle, autonomous business operating system that empowers a single founder to govern a complete digital IT services enterprise. It features **42 specialized AI employees** organized into **8 departments**, handling **20 IT service verticals** with multi-tenant isolation, 3-tier autonomy guardrails, and real-time CEO task decomposition.

---

### 2. Live Application Routes
| URL Path | Module Description | Target Audience |
| :--- | :--- | :--- |
| `/vitos` | **Central AI Command Centre & 18-Module OS** | Founder / Executive Board |
| `/vitos/portal` | **Client Self-Service Portal** | Multi-Tenant Corporate Clients |
| `/api/vitos/command` | Natural Language CEO Orchestrator Endpoint | Internal Event Bus |
| `/api/vitos/agents` | AI Employee Directory & Metrics Endpoint | Roster & Telemetry |
| `/api/vitos/reveng` | Ethical Cleanroom Reverse Engineering Lab | Intelligence Lab |
| `/api/vitos/devops` | SRE Server Health, Ping & Security Scan | IT Ops |

---

### 3. The 8 Departments & 42 AI Employees

#### A. Executive Office
- **Victoria Vance (`ceo-orchestrator`)**: Chief Executive Officer & Master Orchestrator (Level 1 planning, Level 2 checkpoint enforcement).

#### B. Business Development & Sales (6 Agents)
- `lead-generator`: Marcus Vance (Prospect discovery & lead scoring)
- `market-researcher`: Elena Rostova (Industry trends & market fit)
- `competitor-analyst`: Julian Sterling (Competitive positioning & SWOT)
- `sales-agent`: Sophia Chen (Consultative sales pitches)
- `proposal-generator`: David Hayes (SOW drafting & commercial quotes - Level 2)
- `client-onboarder`: Rachel Adams (Workspace setup & brand intake)

#### C. Software & Web Development Studio (9 Agents)
- `frontend-developer`: Alex Rivera (React 19 / Next.js 15 / Tailwind)
- `backend-developer`: Tariq Al-Mansoor (Node / Python / Zod REST endpoints)
- `fullstack-developer`: Leo Tanaka (Full-stack systems lead)
- `db-architect`: Priya Sundaram (PostgreSQL, Supabase RLS schemas)
- `api-integrator`: Vikram Joshi (Stripe, Razorpay, OAuth, webhooks)
- `uiux-designer`: Chloe Monet (Design systems & WCAG accessibility)
- `wordpress-developer`: Oliver Thorne (Headless WP & WooCommerce)
- `ecommerce-developer`: Samira Khan (Cart state & checkout funnels)
- `mobile-developer`: Lucas Wright (React Native / Expo cross-platform)

#### D. Reverse Engineering & Intelligence Lab (5 Agents)
- `site-inspector`: Dr. Evelyn Cross (Public DOM & hierarchy analysis)
- `techstack-detector`: Gideon Ross (Framework & CDN fingerprinter)
- `api-analyzer`: Zane Mercer (Public JSON endpoint modeling)
- `ui-reverse-architect`: Maya Lin (Atomic layout deconstruction)
- `cleanroom-planner`: Sterling Archer (Original non-infringing architecture)

#### E. IT Operations, SRE & Cloud DevOps (7 Agents)
- `server-monitor`: Kaelen Vance (Uptime & SSL certificate pinger)
- `deployment-agent`: Damon Cole (CI/CD & release staging - Level 2)
- `db-maintenance`: Ananya Roy (Query performance & indexing)
- `backup-agent`: Nolan Briggs (Snapshot integrity & disaster recovery)
- `performance-optimizer`: Sergei Volkov (Core Web Vitals & TTFB)
- `incident-manager`: Commander Knox (SRE P1-P4 triage & blameless post-mortems)
- `security-sentinel`: Cyra Vance (OWASP Top 10 audits & security headers)

#### F. Digital Marketing & Growth (8 Agents)
- `seo-agent`: Aria Thorne (Keyword clustering & schema markup)
- `google-ads-agent`: Brett Callaghan (Search & PMax campaigns - Level 2)
- `meta-ads-agent`: Camilla Vasquez (FB/IG creative funnels - Level 2)
- `social-manager`: Zoe Hart (30-day cross-platform schedules)
- `content-creator`: Dominic Wells (Technical articles & case studies)
- `graphic-designer`: Sienna Frost (Visual branding & banner briefs)
- `video-creator`: Tyler Reed (Short-form video scripts & reels)
- `marketing-analyst`: Natasha Romanova (Attribution & ROAS analytics)

#### G. Customer Support & Helpdesk (5 Agents)
- `support-agent`: Emily Watson (24/7 SLA client response lead)
- `tech-troubleshooter`: Felix Brody (Tier 2 stack trace analysis)
- `ticket-manager`: Gareth Bale (Automated triage & department routing)
- `knowledge-base-agent`: Hannah Abbott (SOP curation & FAQ indexing)
- `feedback-agent`: Isla Fisher (CSAT & NPS sentiment scoring)

#### H. Finance & Administration (6 Agents)
- `accounting-agent`: Arthur Sterling (P&L statements & gross margin modeling)
- `invoice-agent`: Beatrice Vance (Milestone invoices & GST - Level 2)
- `quotation-agent`: Cassandra Drake (Pricing estimation & tiers)
- `payment-tracker`: Devon Miller (Reconciliation & aging receivables)
- `expense-manager`: Elliott Shaw (AI token & cloud cost auditing)
- `business-analytics-agent`: Francesca Rossi (Executive BI briefings)

---

### 4. 3-Tier Autonomy Security Matrix
1. **Level 1 (Autonomous):** Safe, reversible operations executed immediately (read, inspect, plan, write code, run audits).
2. **Level 2 (Approval Required):** Production deployment, ad budget commitment, public proposal delivery, and invoice dispatch require Founder review via the Kanban Checkpoint strip.
3. **Level 3 (Restricted):** Production database deletion, root ownership transfer, and unauthorized transactions are strictly forbidden.

---

### 5. Running and Testing Locally
```powershell
cd socialsetu-main

# Install dependencies (if needed)
npm install

# Run development server
npm run dev

# Open in browser:
# http://localhost:3000/vitos         -> AI Virtual IT Company OS
# http://localhost:3000/vitos/portal  -> Multi-Tenant Client Portal
```

---

### 6. Production Build & Deployment Instructions
```powershell
# Verify TypeScript typing
npx tsc --noEmit

# Run Next.js production build
npx next build

# Deploy to Vercel or cloud provider
vercel --prod
```
