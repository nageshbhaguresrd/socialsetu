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

-- Public read-only access for audits via share_id (Tier 1 Feature 2)
CREATE POLICY "Public audit access" ON audits FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS audits_lead_id_idx ON audits(lead_id);
CREATE INDEX IF NOT EXISTS audits_status_idx ON audits(status);
CREATE INDEX IF NOT EXISTS audits_created_at_idx ON audits(created_at DESC);