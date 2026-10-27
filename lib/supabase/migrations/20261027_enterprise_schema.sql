-- ==============================================================================
-- SocialSetu Enterprise Schema Migration: Multi-Tenant Social Media Management
-- Version: 2.0.0
-- Created: 2026-10-27
-- Tables: 32 Relational Tables with Multi-Tenant Isolation and RLS Policies
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. Organizations & Tenant Hierarchy
-- ==============================================================================
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  website text,
  billing_email text,
  plan text NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'professional', 'agency', 'enterprise')),
  subscription_status text NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'canceled', 'unpaid')),
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 2. Users & Organization Membership (RBAC)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY, -- maps to auth.users.id
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  avatar_url text,
  phone text,
  is_super_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'team_member' CHECK (role IN ('super_admin', 'agency_manager', 'client', 'team_member')),
  assigned_client_ids uuid[] DEFAULT ARRAY[]::uuid[],
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- ==============================================================================
-- 3. Clients (Workspaces)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  business_category text,
  description text,
  website_url text,
  industry text,
  target_audience text,
  country text DEFAULT 'India',
  state text,
  city text,
  timezone text NOT NULL DEFAULT 'Asia/Kolkata',
  preferred_language text NOT NULL DEFAULT 'English' CHECK (preferred_language IN ('English', 'Hindi', 'Marathi', 'Hinglish')),
  contact_email text,
  contact_phone text,
  opening_hours jsonb DEFAULT '{"monday": "09:00-18:00", "tuesday": "09:00-18:00", "wednesday": "09:00-18:00", "thursday": "09:00-18:00", "friday": "09:00-18:00", "saturday": "10:00-16:00", "sunday": "closed"}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 4. Client Brand Profiles & Guidelines
-- ==============================================================================
CREATE TABLE IF NOT EXISTS client_brand_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
  brand_voice text DEFAULT 'Professional, engaging, and authoritative',
  tone_traits text[] DEFAULT ARRAY['Empathetic', 'Solution-driven', 'Dynamic'],
  primary_color text DEFAULT '#FF6B35',
  secondary_color text DEFAULT '#1A1A2E',
  accent_color text DEFAULT '#10B981',
  logo_url text,
  font_preference text DEFAULT 'Inter, Poppins',
  restricted_topics text[] DEFAULT ARRAY[]::text[],
  compliance_notes text,
  target_keywords text[] DEFAULT ARRAY[]::text[],
  cta_defaults jsonb DEFAULT '{"primary": "Book a Free Consultation", "secondary": "Message us on WhatsApp"}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 5. Social Platforms Directory
-- ==============================================================================
CREATE TABLE IF NOT EXISTS social_platforms (
  id text PRIMARY KEY, -- 'instagram', 'facebook_page', 'linkedin_page', 'youtube', 'x_twitter', 'tiktok', 'pinterest'
  display_name text NOT NULL,
  icon_name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  supports_publishing boolean NOT NULL DEFAULT true,
  supports_analytics boolean NOT NULL DEFAULT true,
  supports_comments boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO social_platforms (id, display_name, icon_name, is_active, supports_publishing, supports_analytics, supports_comments)
VALUES
  ('instagram', 'Instagram Business', 'Instagram', true, true, true, true),
  ('facebook_page', 'Facebook Page', 'Facebook', true, true, true, true),
  ('linkedin_page', 'LinkedIn Organization', 'Linkedin', true, true, true, true),
  ('youtube', 'YouTube Channel', 'Youtube', true, true, true, false),
  ('x_twitter', 'X (Twitter)', 'Twitter', true, true, true, true)
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 6. Social Accounts Connected per Client
-- ==============================================================================
CREATE TABLE IF NOT EXISTS social_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  platform_id text NOT NULL REFERENCES social_platforms(id) ON DELETE RESTRICT,
  account_external_id text NOT NULL,
  account_name text NOT NULL,
  account_handle text,
  profile_picture_url text,
  account_type text DEFAULT 'business',
  is_connected boolean NOT NULL DEFAULT true,
  connection_status text NOT NULL DEFAULT 'active' CHECK (connection_status IN ('active', 'expired', 'error', 'disconnected')),
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_id, platform_id, account_external_id)
);

-- ==============================================================================
-- 7. OAuth Credentials (Encrypted Token Storage)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS oauth_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  social_account_id uuid NOT NULL UNIQUE REFERENCES social_accounts(id) ON DELETE CASCADE,
  access_token text NOT NULL,
  refresh_token text,
  token_secret text,
  scopes text[] DEFAULT ARRAY[]::text[],
  expires_at timestamptz,
  raw_payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 8. Client Permissions & Approval Requirements
-- ==============================================================================
CREATE TABLE IF NOT EXISTS client_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
  require_post_approval boolean NOT NULL DEFAULT true,
  require_birthday_approval boolean NOT NULL DEFAULT true,
  allow_ai_direct_publishing boolean NOT NULL DEFAULT false,
  auto_respond_comments boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 9. Campaigns
-- ==============================================================================
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  objective text NOT NULL DEFAULT 'Brand Awareness',
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  budget numeric(12,2) DEFAULT 0,
  spent numeric(12,2) DEFAULT 0,
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Draft', 'Active', 'Paused', 'Completed')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 10. Content Posts
-- ==============================================================================
CREATE TABLE IF NOT EXISTS content_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL,
  created_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  title text,
  content_text text NOT NULL,
  hashtags text[] DEFAULT ARRAY[]::text[],
  target_platforms text[] NOT NULL DEFAULT ARRAY['instagram']::text[],
  post_type text NOT NULL DEFAULT 'post' CHECK (post_type IN ('post', 'reel', 'story', 'carousel', 'short', 'article')),
  language text NOT NULL DEFAULT 'English',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'scheduled', 'publishing', 'published', 'failed', 'rejected')),
  scheduled_for timestamptz,
  published_at timestamptz,
  ai_generated boolean NOT NULL DEFAULT false,
  ai_model text,
  quality_score numeric(4,2),
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 11. Post Media Assets
-- ==============================================================================
CREATE TABLE IF NOT EXISTS post_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES content_posts(id) ON DELETE CASCADE,
  media_url text NOT NULL,
  media_type text NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video', 'carousel_item')),
  position integer NOT NULL DEFAULT 0,
  caption text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 12. Content Calendar Scheduling Slots
-- ==============================================================================
CREATE TABLE IF NOT EXISTS content_calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  post_id uuid UNIQUE REFERENCES content_posts(id) ON DELETE CASCADE,
  scheduled_slot timestamptz NOT NULL,
  platform text NOT NULL,
  status text NOT NULL DEFAULT 'scheduled',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 13. Approval Requests
-- ==============================================================================
CREATE TABLE IF NOT EXISTS approval_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES content_posts(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  requested_by uuid REFERENCES users(id) ON DELETE SET NULL,
  reviewed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'changes_requested')),
  client_feedback text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 14. Automation Rules
-- ==============================================================================
CREATE TABLE IF NOT EXISTS automation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  trigger_type text NOT NULL, -- 'birthday', 'anniversary', 'weekly_planning', 'content_gap', 'low_engagement'
  conditions jsonb NOT NULL DEFAULT '{}'::jsonb,
  actions jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_enabled boolean NOT NULL DEFAULT true,
  requires_approval boolean NOT NULL DEFAULT true,
  last_executed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 15. Automation Executions (Audit Run Log)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS automation_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'failed', 'skipped')),
  details jsonb DEFAULT '{}'::jsonb,
  error_message text,
  executed_at timestamptz NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 16. Contacts (Clients, Customers, VIPs)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text,
  email text,
  phone text,
  relationship text DEFAULT 'customer' CHECK (relationship IN ('customer', 'employee', 'vip', 'partner', 'vendor')),
  whatsapp_opt_in boolean NOT NULL DEFAULT true,
  email_opt_in boolean NOT NULL DEFAULT true,
  tags text[] DEFAULT ARRAY[]::text[],
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 17. Contact Events (Birthdays, Anniversaries, Milestones)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS contact_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('birthday', 'anniversary', 'company_foundation', 'work_anniversary', 'customer_milestone')),
  event_date date NOT NULL,
  notify_days_in_advance integer NOT NULL DEFAULT 3,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 18. Greeting Templates
-- ==============================================================================
CREATE TABLE IF NOT EXISTS greeting_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE, -- null means global template
  event_type text NOT NULL,
  language text NOT NULL DEFAULT 'English',
  title text NOT NULL,
  template_body text NOT NULL,
  image_url text,
  is_approved boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO greeting_templates (event_type, language, title, template_body)
VALUES
  ('birthday', 'English', 'Warm Birthday Greetings', 'Wishing a very Happy Birthday to {name}! May your year ahead be filled with happiness, health, and massive success. From all of us at {brand_name}! 🎂✨'),
  ('birthday', 'Marathi', 'वाढदिवसाच्या हार्दिक शुभेच्छा', '{name} यांना वाढदिवसाच्या हार्दिक शुभेच्छा! आपले पुढील आयुष्य सुख, समृद्धी आणि यशाने भरलेले जावो हीच {brand_name} कडून सदिच्छा! 💐🎉'),
  ('birthday', 'Hindi', 'जन्मदिन की हार्दिक शुभकामनाएं', '{name} जी को जन्मदिन की ढेर सारी शुभकामनाएं! आपके जीवन में सुख, शांति और प्रगति बनी रहे। - {brand_name} 🌟🎂'),
  ('anniversary', 'English', 'Happy Business Milestone', 'Congratulations to {name} on celebrating another year of remarkable excellence! Proud to be your growth partner. - {brand_name} 🚀')
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- 19. Greeting Jobs (Generated Celebrations)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS greeting_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  greeting_text text NOT NULL,
  media_url text,
  channel text NOT NULL DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp', 'email', 'social_post', 'manual')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'scheduled', 'sent', 'failed')),
  scheduled_for timestamptz NOT NULL,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 20. Engagement Items (Comments & Mentions)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS engagement_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  social_account_id uuid NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  external_interaction_id text NOT NULL,
  item_type text NOT NULL DEFAULT 'comment' CHECK (item_type IN ('comment', 'mention', 'direct_message', 'review')),
  author_name text NOT NULL,
  author_handle text,
  content text NOT NULL,
  sentiment text CHECK (sentiment IN ('positive', 'neutral', 'negative', 'urgent')),
  classification text CHECK (classification IN ('question', 'complaint', 'praise', 'lead_inquiry', 'spam')),
  is_answered boolean NOT NULL DEFAULT false,
  post_id text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 21. Engagement Responses
-- ==============================================================================
CREATE TABLE IF NOT EXISTS engagement_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_item_id uuid NOT NULL REFERENCES engagement_items(id) ON DELETE CASCADE,
  recommended_reply text NOT NULL,
  final_reply text,
  reviewed_by uuid REFERENCES users(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'sent', 'rejected')),
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 22. Analytics Snapshots
-- ==============================================================================
CREATE TABLE IF NOT EXISTS analytics_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  social_account_id uuid NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  followers_count integer NOT NULL DEFAULT 0,
  impressions integer NOT NULL DEFAULT 0,
  reach integer NOT NULL DEFAULT 0,
  engagement_rate numeric(6,2) NOT NULL DEFAULT 0,
  profile_views integer NOT NULL DEFAULT 0,
  posts_count integer NOT NULL DEFAULT 0,
  raw_metrics jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(social_account_id, snapshot_date)
);

-- ==============================================================================
-- 23. Analytics Reports
-- ==============================================================================
CREATE TABLE IF NOT EXISTS analytics_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  report_period text NOT NULL CHECK (report_period IN ('weekly', 'monthly', 'quarterly')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  summary text,
  highlights text[],
  growth_recommendations text[],
  pdf_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 24. Media Assets Library
-- ==============================================================================
CREATE TABLE IF NOT EXISTS media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL,
  file_size_bytes integer,
  category text DEFAULT 'brand' CHECK (category IN ('logo', 'product', 'creative', 'raw_footage', 'template')),
  tags text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 25. Notifications
-- ==============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'approval_needed', 'publish_success', 'publish_failed', 'token_expiring', 'alert')),
  is_read boolean NOT NULL DEFAULT false,
  action_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 26. Subscriptions
-- ==============================================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_tier text NOT NULL DEFAULT 'starter' CHECK (plan_tier IN ('starter', 'professional', 'agency', 'enterprise')),
  max_clients integer NOT NULL DEFAULT 3,
  max_social_accounts integer NOT NULL DEFAULT 5,
  monthly_ai_tokens integer NOT NULL DEFAULT 500000,
  razorpay_subscription_id text,
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 27. Invoices
-- ==============================================================================
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_number text NOT NULL UNIQUE,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  tax_gst numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'paid' CHECK (status IN ('draft', 'pending', 'paid', 'overdue', 'cancelled')),
  pdf_url text,
  payment_method text DEFAULT 'razorpay',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 28. AI Usage Logs
-- ==============================================================================
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  agent_type text NOT NULL, -- 'content_creator', 'adapter', 'quality_inspector', 'celebration'
  model_used text NOT NULL DEFAULT 'gemini-3.8-flash',
  prompt_tokens integer NOT NULL DEFAULT 0,
  completion_tokens integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 29. Audit Logs (Immutable Security Audit Trail)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_entity text NOT NULL,
  target_id text,
  ip_address text,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 30. Scheduled Jobs (Queue Record)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS scheduled_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type text NOT NULL, -- 'publish_post', 'check_birthdays', 'sync_analytics', 'check_tokens'
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  scheduled_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3,
  last_error text,
  locked_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 31. Integration Errors (Diagnostics)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS integration_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  social_account_id uuid REFERENCES social_accounts(id) ON DELETE SET NULL,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  platform text NOT NULL,
  endpoint text,
  status_code integer,
  error_message text NOT NULL,
  raw_response jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 32. Contact Import Batches
-- ==============================================================================
CREATE TABLE IF NOT EXISTS contact_import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  total_records integer NOT NULL DEFAULT 0,
  successful_records integer NOT NULL DEFAULT 0,
  failed_records integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ==============================================================================
-- Performance Indexes
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_clients_org ON clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_social_accounts_client ON social_accounts(client_id);
CREATE INDEX IF NOT EXISTS idx_content_posts_client ON content_posts(client_id, status);
CREATE INDEX IF NOT EXISTS idx_content_posts_scheduled ON content_posts(scheduled_for) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_contacts_client ON contacts(client_id);
CREATE INDEX IF NOT EXISTS idx_contact_events_date ON contact_events(event_date);
CREATE INDEX IF NOT EXISTS idx_engagement_items_client ON engagement_items(client_id, is_answered);
CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_client ON analytics_snapshots(client_id, snapshot_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_status ON scheduled_jobs(status, scheduled_at);

-- ==============================================================================
-- Row-Level Security (RLS) Enablement
-- ==============================================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE greeting_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to interact with their organization data
CREATE POLICY "Users can access their organization" ON organizations
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can access their clients" ON clients
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can access brand profiles" ON client_brand_profiles
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can access social accounts" ON social_accounts
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can access content posts" ON content_posts
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can access campaigns" ON campaigns
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can access contacts" ON contacts
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can access greeting jobs" ON greeting_jobs
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can access engagement items" ON engagement_items
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can access analytics snapshots" ON analytics_snapshots
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can access media assets" ON media_assets
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can access their notifications" ON notifications
  FOR ALL TO authenticated USING (true);
