-- ==============================================================================
-- AI Virtual IT Company OS (AI-VITOS) Schema Migration
-- Migration: 20261120_ai_vit_company_os_schema.sql
-- Description: Core schema for multi-tenant, 8 departments, 40+ AI employees,
--              central command orchestration, reverse engineering audits,
--              DevOps monitoring, multi-service project execution & financial ledger.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. AI Departments
CREATE TABLE IF NOT EXISTS ai_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT 'Building2',
  lead_agent_id text,
  budget_monthly numeric(12,2) DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed 8 Core Departments
INSERT INTO ai_departments (department_key, name, description, icon, lead_agent_id, budget_monthly)
VALUES
  ('executive', 'Executive Management & CEO Office', 'Strategic planning, task decomposition, inter-department delegation and executive reporting', 'Crown', 'ceo-orchestrator', 5000),
  ('bizdev', 'Business Development & Sales', 'Lead generation, competitor research, proposal generation, client acquisition and onboarding', 'TrendingUp', 'lead-generator', 3000),
  ('webdev', 'Software & Web Development Studio', 'Full-stack engineering, API architecture, database design, mobile apps and UI/UX design', 'Code2', 'fullstack-builder', 8000),
  ('reveng', 'Reverse Engineering & Intelligence Lab', 'Ethical public asset analysis, tech stack detection, cleanroom architecture synthesis', 'Cpu', 'cleanroom-planner', 4000),
  ('devops', 'IT Operations, SRE & Cloud DevOps', 'Server monitoring, SSL tracking, backup orchestration, deployment pipelines and cybersecurity', 'Server', 'server-monitor', 5000),
  ('marketing', 'Digital Marketing & Growth Hub', 'SEO optimization, Google & Meta Ads, content copywriting, social scheduling and visual design', 'Share2', 'marketing-director', 4000),
  ('support', 'Customer Support & Helpdesk', 'Automated ticket triage, 24/7 technical troubleshooting, knowledge base maintenance and SLAs', 'Headphones', 'support-triage', 2000),
  ('finance', 'Finance, Billing & Administration', 'Automated invoicing, milestone tracking, expense management and project profitability', 'DollarSign', 'accountant-agent', 2000)
ON CONFLICT (department_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon;

-- 2. AI Agents (Employees Registry)
CREATE TABLE IF NOT EXISTS ai_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id text NOT NULL UNIQUE,
  department_key text NOT NULL REFERENCES ai_departments(department_key) ON DELETE RESTRICT,
  name text NOT NULL,
  role_title text NOT NULL,
  avatar text,
  autonomy_level text NOT NULL DEFAULT 'L1' CHECK (autonomy_level IN ('L1', 'L2', 'L3')),
  model_preference text NOT NULL DEFAULT 'gemini-3.8-flash',
  system_prompt text NOT NULL,
  capabilities text[] NOT NULL DEFAULT ARRAY[]::text[],
  tools jsonb NOT NULL DEFAULT '[]'::jsonb,
  hourly_rate numeric(8,2) DEFAULT 25.00,
  total_tokens_used bigint NOT NULL DEFAULT 0,
  total_cost_usd numeric(10,4) NOT NULL DEFAULT 0.0000,
  tasks_completed integer NOT NULL DEFAULT 0,
  performance_score numeric(4,2) NOT NULL DEFAULT 98.50,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_agents_dept_idx ON ai_agents(department_key);
CREATE INDEX IF NOT EXISTS ai_agents_autonomy_idx ON ai_agents(autonomy_level);

-- 3. AI Command Centre Executions
CREATE TABLE IF NOT EXISTS ai_command_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  raw_command text NOT NULL,
  parsed_intent text,
  generated_plan jsonb DEFAULT '{}'::jsonb,
  delegated_task_ids uuid[] DEFAULT ARRAY[]::uuid[],
  status text NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'waiting_approval', 'failed')),
  tokens_consumed integer DEFAULT 0,
  cost_usd numeric(8,4) DEFAULT 0,
  execution_summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. IT Projects Workspaces
CREATE TABLE IF NOT EXISTS it_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  project_name text NOT NULL,
  service_category text NOT NULL, -- e.g. 'Website Development', 'Cybersecurity Assessment', 'DevOps & Cloud'
  description text,
  status text NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'review', 'waiting_approval', 'delivered', 'active_maintenance', 'archived')),
  priority text NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
  budget numeric(12,2) DEFAULT 0,
  spent numeric(12,2) DEFAULT 0,
  repo_url text,
  staging_url text,
  production_url text,
  tech_stack text[] DEFAULT ARRAY[]::text[],
  deliverables jsonb DEFAULT '[]'::jsonb,
  start_date date DEFAULT CURRENT_DATE,
  target_delivery_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS it_projects_client_idx ON it_projects(client_id);
CREATE INDEX IF NOT EXISTS it_projects_status_idx ON it_projects(status);

-- 5. AI Tasks State Machine
CREATE TABLE IF NOT EXISTS ai_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  project_id uuid REFERENCES it_projects(id) ON DELETE SET NULL,
  task_title text NOT NULL,
  description text,
  department_key text NOT NULL REFERENCES ai_departments(department_key) ON DELETE RESTRICT,
  assigned_agent_id text NOT NULL REFERENCES ai_agents(agent_id) ON DELETE RESTRICT,
  priority text NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'in_progress', 'waiting_approval', 'completed', 'failed', 'escalated')),
  autonomy_level text NOT NULL DEFAULT 'L1' CHECK (autonomy_level IN ('L1', 'L2', 'L3')),
  required_approval_role text DEFAULT 'founder' CHECK (required_approval_role IN ('founder', 'client', 'tech_lead', 'none')),
  input_payload jsonb DEFAULT '{}'::jsonb,
  output_payload jsonb DEFAULT '{}'::jsonb,
  error_message text,
  tokens_used integer DEFAULT 0,
  cost_usd numeric(8,4) DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_tasks_status_idx ON ai_tasks(status);
CREATE INDEX IF NOT EXISTS ai_tasks_agent_idx ON ai_tasks(assigned_agent_id);
CREATE INDEX IF NOT EXISTS ai_tasks_client_idx ON ai_tasks(client_id);
CREATE INDEX IF NOT EXISTS ai_tasks_project_idx ON ai_tasks(project_id);

-- 6. AI Task Subtasks (Execution Plan Steps)
CREATE TABLE IF NOT EXISTS ai_task_subtasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES ai_tasks(id) ON DELETE CASCADE,
  step_order integer NOT NULL DEFAULT 1,
  title text NOT NULL,
  instructions text,
  assigned_agent_id text NOT NULL REFERENCES ai_agents(agent_id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'skipped')),
  output jsonb DEFAULT '{}'::jsonb,
  duration_ms integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_subtasks_task_idx ON ai_task_subtasks(task_id, step_order);

-- 7. Autonomous Checkpoint Approvals (Level 2 & Level 3 Gates)
CREATE TABLE IF NOT EXISTS ai_approval_checkpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES ai_tasks(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  action_type text NOT NULL, -- 'deploy_production', 'send_proposal', 'publish_campaign', 'db_migration', 'financial_invoice'
  autonomy_level text NOT NULL CHECK (autonomy_level IN ('L2', 'L3')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  proposed_by_agent_id text NOT NULL REFERENCES ai_agents(agent_id),
  reviewed_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  review_notes text,
  action_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);

CREATE INDEX IF NOT EXISTS ai_approvals_status_idx ON ai_approval_checkpoints(status);

-- 8. Reverse Engineering & Intelligence Lab Reports
CREATE TABLE IF NOT EXISTS reverse_engineering_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  target_url text NOT NULL,
  target_name text NOT NULL,
  target_category text DEFAULT 'Competitor Product',
  tech_stack jsonb DEFAULT '{}'::jsonb,
  dom_structure jsonb DEFAULT '{}'::jsonb,
  public_apis jsonb DEFAULT '[]'::jsonb,
  ui_components jsonb DEFAULT '[]'::jsonb,
  performance_metrics jsonb DEFAULT '{}'::jsonb,
  seo_strategy jsonb DEFAULT '{}'::jsonb,
  cleanroom_architecture_recommendation text,
  original_implementation_plan jsonb DEFAULT '{}'::jsonb,
  ethical_compliance_certified boolean NOT NULL DEFAULT true,
  compliance_notes text DEFAULT 'Strictly public DOM, public headers and public network inspections. Zero credential bypass, DRM tampering, or copyright infringement.',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reveng_client_idx ON reverse_engineering_audits(client_id);

-- 9. DevOps & Infrastructure Monitoring
CREATE TABLE IF NOT EXISTS devops_servers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  server_name text NOT NULL,
  host_url text NOT NULL,
  ip_address text,
  environment text NOT NULL DEFAULT 'production' CHECK (environment IN ('production', 'staging', 'development')),
  status text NOT NULL DEFAULT 'healthy' CHECK (status IN ('healthy', 'degraded', 'down', 'maintenance')),
  ssl_valid boolean NOT NULL DEFAULT true,
  ssl_expiry_date date,
  last_ping_ms integer DEFAULT 45,
  uptime_percentage numeric(5,2) DEFAULT 99.95,
  monitoring_enabled boolean NOT NULL DEFAULT true,
  last_checked_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS devops_servers_client_idx ON devops_servers(client_id);
CREATE INDEX IF NOT EXISTS devops_servers_status_idx ON devops_servers(status);

-- 10. DevOps Incident Reports
CREATE TABLE IF NOT EXISTS devops_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id uuid REFERENCES devops_servers(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  severity text NOT NULL DEFAULT 'P3_MEDIUM' CHECK (severity IN ('P1_CRITICAL', 'P2_HIGH', 'P3_MEDIUM', 'P4_LOW')),
  title text NOT NULL,
  description text NOT NULL,
  detected_by_agent_id text NOT NULL REFERENCES ai_agents(agent_id),
  status text NOT NULL DEFAULT 'investigating' CHECK (status IN ('investigating', 'mitigating', 'resolved', 'escalated')),
  root_cause text,
  mitigation_steps text,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS devops_incidents_status_idx ON devops_incidents(status);

-- 11. Customer Support Tickets
CREATE TABLE IF NOT EXISTS it_support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  project_id uuid REFERENCES it_projects(id) ON DELETE SET NULL,
  ticket_number text NOT NULL UNIQUE,
  subject text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'Technical Bug' CHECK (category IN ('Technical Bug', 'Feature Request', 'Server Outage', 'Billing', 'General Inquiry')),
  priority text NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_client', 'resolved', 'closed')),
  assigned_agent_id text REFERENCES ai_agents(agent_id),
  customer_email text,
  sla_breach_at timestamptz,
  resolution_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS it_tickets_client_idx ON it_support_tickets(client_id);
CREATE INDEX IF NOT EXISTS it_tickets_status_idx ON it_support_tickets(status);

-- 12. Quotations & Invoices (Financial Engine)
CREATE TABLE IF NOT EXISTS it_quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  project_id uuid REFERENCES it_projects(id) ON DELETE SET NULL,
  quotation_number text NOT NULL UNIQUE,
  title text NOT NULL,
  line_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  tax_rate numeric(4,2) NOT NULL DEFAULT 18.00, -- 18% GST standard
  tax_amount numeric(12,2) NOT NULL DEFAULT 0,
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  valid_until date NOT NULL DEFAULT (CURRENT_DATE + 30),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'approved', 'rejected', 'expired')),
  terms text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS it_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  project_id uuid REFERENCES it_projects(id) ON DELETE SET NULL,
  quotation_id uuid REFERENCES it_quotations(id) ON DELETE SET NULL,
  invoice_number text NOT NULL UNIQUE,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  tax_amount numeric(12,2) NOT NULL DEFAULT 0,
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  due_date date NOT NULL DEFAULT (CURRENT_DATE + 15),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'paid', 'overdue', 'cancelled')),
  payment_method text,
  paid_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS it_invoices_client_idx ON it_invoices(client_id);
CREATE INDEX IF NOT EXISTS it_invoices_status_idx ON it_invoices(status);

-- 13. Tenant Knowledge Base & Vector Documents
CREATE TABLE IF NOT EXISTS tenant_knowledge_docs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'guideline' CHECK (category IN ('brand', 'architecture', 'api_spec', 'sop', 'guideline', 'incident_postmortem')),
  content text NOT NULL,
  tags text[] DEFAULT ARRAY[]::text[],
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS knowledge_client_idx ON tenant_knowledge_docs(client_id, category);

-- 14. Immutable Agent Execution & Audit Ledger
CREATE TABLE IF NOT EXISTS ai_audit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  task_id uuid REFERENCES ai_tasks(id) ON DELETE SET NULL,
  agent_id text NOT NULL,
  action_name text NOT NULL,
  autonomy_level text NOT NULL,
  model_name text NOT NULL,
  prompt_tokens integer NOT NULL DEFAULT 0,
  completion_tokens integer NOT NULL DEFAULT 0,
  cost_usd numeric(8,5) NOT NULL DEFAULT 0,
  latency_ms integer NOT NULL DEFAULT 0,
  success boolean NOT NULL DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_agent_idx ON ai_audit_ledger(agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_client_idx ON ai_audit_ledger(client_id, created_at DESC);
