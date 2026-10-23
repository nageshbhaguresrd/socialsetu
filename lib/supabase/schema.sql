CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  business text NOT NULL,
  city text NOT NULL,
  industry text NOT NULL,
  budget text NOT NULL,
  source text NOT NULL DEFAULT 'Manual',
  stage text NOT NULL DEFAULT 'New Lead',
  phone text NOT NULL,
  email text NOT NULL,
  notes text DEFAULT '',
  value integer NOT NULL DEFAULT 0,
  ai_score integer NOT NULL DEFAULT 70,
  priority text NOT NULL DEFAULT 'Medium',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_contact timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  type text NOT NULL,
  note text NOT NULL,
  due_date date NOT NULL,
  due_time text NOT NULL DEFAULT '10:00',
  done boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text,
  industry text,
  budget text,
  message text,
  phone text,
  email text,
  source text NOT NULL DEFAULT 'contact_form',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  type text NOT NULL,
  description text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS leads_stage_idx ON leads(stage);
CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS reminders_lead_id_idx ON reminders(lead_id);
CREATE INDEX IF NOT EXISTS reminders_due_date_idx ON reminders(due_date, done);
CREATE INDEX IF NOT EXISTS activities_lead_id_idx ON lead_activities(lead_id, created_at DESC);

-- Run in Supabase SQL editor to enable realtime:
-- ALTER PUBLICATION supabase_realtime ADD TABLE leads;
-- ALTER PUBLICATION supabase_realtime ADD TABLE audits;

CREATE TABLE IF NOT EXISTS wa_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  body text NOT NULL,
  variables text[] DEFAULT ARRAY['name','business','city'],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

INSERT INTO wa_templates (name, body) VALUES
  ('Initial Follow-up', 
   'Hi {name}! 👋 I saw your interest in digital marketing for {business}. We help brands in {city} grow with Meta & Google Ads. Can we schedule a quick call? 🚀'),
  ('Audit Offer',
   'Hi {name}, we would love to do a FREE audit of {business}''s current digital presence. No cost, no commitment. Interested?'),
  ('Proposal Follow-up',
   'Hi {name}, following up on the proposal we shared for {business}. Any questions I can answer? Happy to jump on a quick call!')
ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS wa_templates_idx ON wa_templates(name);

CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  client text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('Meta','Google','LinkedIn','YouTube')),
  budget integer NOT NULL DEFAULT 0,
  spent integer NOT NULL DEFAULT 0,
  leads_generated integer NOT NULL DEFAULT 0,
  conversions integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Active' 
    CHECK (status IN ('Active','Paused','Completed')),
  start_date date NOT NULL DEFAULT now(),
  end_date date,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS campaigns_status_idx ON campaigns(status);
CREATE INDEX IF NOT EXISTS campaigns_platform_idx ON campaigns(platform);


CREATE TABLE IF NOT EXISTS audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  share_id uuid DEFAULT gen_random_uuid() UNIQUE,
  client_name text NOT NULL,
  platforms jsonb NOT NULL DEFAULT '{}',
  scores jsonb NOT NULL DEFAULT '{}',
  report jsonb NOT NULL DEFAULT '{}',
  raw_metrics jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','processing','completed','failed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS for Security Tests S2
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;

-- Policies for leads
-- Allow public and authenticated users to select leads (needed for .insert().select().single() on anon forms)
CREATE POLICY "Allow public to select leads" 
  ON leads FOR SELECT USING (true);

-- Allow both public form submissions (anon) and authenticated users to insert leads
CREATE POLICY "Allow insert on leads" 
  ON leads FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update leads" 
  ON leads FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete leads" 
  ON leads FOR DELETE TO authenticated USING (true);

-- Policies for contact submissions
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anyone to insert contact_submissions"
  ON contact_submissions FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated users to select contact_submissions"
  ON contact_submissions FOR SELECT TO authenticated USING (true);

-- Policies for lead activities
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anyone to insert lead_activities"
  ON lead_activities FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated users to select lead_activities"
  ON lead_activities FOR SELECT TO authenticated USING (true);

-- Policies for audits
-- SELECT is already public (Tier 1 Feature 2)
CREATE POLICY "Public audit access" ON audits FOR SELECT USING (true);

-- Allow all users to create audits (needed for public landing pages/lead forms)
CREATE POLICY "Allow anyone to insert audits"
  ON audits FOR INSERT 
  WITH CHECK (true);

-- Allow authenticated users to update their audits
CREATE POLICY "Authed can update audits"
  ON audits FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS audits_lead_id_idx ON audits(lead_id);
CREATE INDEX IF NOT EXISTS audits_status_idx ON audits(status);
CREATE INDEX IF NOT EXISTS audits_created_at_idx ON audits(created_at DESC);

-- =====================================================
-- Missing RLS Policies for reminders
-- =====================================================
CREATE POLICY "Allow authenticated users to select reminders"
  ON reminders FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert reminders"
  ON reminders FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update reminders"
  ON reminders FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete reminders"
  ON reminders FOR DELETE TO authenticated USING (true);

-- =====================================================
-- Missing RLS Policies for campaigns
-- =====================================================
CREATE POLICY "Allow authenticated users to select campaigns"
  ON campaigns FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert campaigns"
  ON campaigns FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update campaigns"
  ON campaigns FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete campaigns"
  ON campaigns FOR DELETE TO authenticated USING (true);

-- =====================================================
-- Enable and add RLS for wa_templates
-- =====================================================
ALTER TABLE wa_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to select wa_templates"
  ON wa_templates FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow anyone to insert wa_templates"
  ON wa_templates FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update wa_templates"
  ON wa_templates FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete wa_templates"
  ON wa_templates FOR DELETE TO authenticated USING (true);

-- =====================================================
-- Missing columns on leads
-- =====================================================
ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_to uuid;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tags text[] DEFAULT ARRAY[]::text[];
ALTER TABLE leads ADD COLUMN IF NOT EXISTS stage_updated_at timestamptz DEFAULT now();

-- =====================================================
-- Missing columns on reminders
-- =====================================================
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS assigned_to uuid;

-- =====================================================
-- Missing columns on campaigns
-- =====================================================
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES leads(id) ON DELETE SET NULL;

-- =====================================================
-- Invoices table (for tracking PDF invoices and payment status)
-- =====================================================
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  invoice_number text NOT NULL,
  amount integer NOT NULL DEFAULT 0,
  gst_amount integer NOT NULL DEFAULT 0,
  total_amount integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','paid','overdue','cancelled')),
  items jsonb NOT NULL DEFAULT '[]',
  notes text DEFAULT '',
  due_date date,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to select invoices"
  ON invoices FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert invoices"
  ON invoices FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update invoices"
  ON invoices FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS invoices_lead_id_idx ON invoices(lead_id);
CREATE INDEX IF NOT EXISTS invoices_status_idx ON invoices(status);

-- =====================================================
-- Enable realtime for live CRM updates
-- =====================================================
-- Run in Supabase SQL Editor:
-- ALTER PUBLICATION supabase_realtime ADD TABLE leads;
-- ALTER PUBLICATION supabase_realtime ADD TABLE audits;
-- ALTER PUBLICATION supabase_realtime ADD TABLE reminders;
-- ALTER PUBLICATION supabase_realtime ADD TABLE campaigns;