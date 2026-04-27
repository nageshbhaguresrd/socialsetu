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

CREATE INDEX IF NOT EXISTS leads_stage_idx ON leads(stage);
CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS reminders_lead_id_idx ON reminders(lead_id);
CREATE INDEX IF NOT EXISTS reminders_due_date_idx ON reminders(due_date, done);
