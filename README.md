# Production Setup

1. Create a Supabase project at supabase.com
2. Run the SQL from lib/supabase/schema.sql in the Supabase SQL editor
3. Create a user in Supabase Auth > Users (this is your CRM login)
4. Copy all env vars from .env.example into .env.local
5. Run `npm install && npm run dev`
6. Enable Realtime: run `ALTER PUBLICATION supabase_realtime ADD TABLE leads;` in Supabase SQL editor
