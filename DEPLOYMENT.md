# Deploying SocialSetu to Vercel

## One-time setup

1. Push code to GitHub (make sure .env files are not committed)

2. Go to vercel.com → New Project → Import your GitHub repo

3. Add ALL environment variables from .env.production.example 
   in Vercel dashboard → Settings → Environment Variables

4. Add CRON_SECRET as an environment variable 
   (generate one at: https://generate-secret.vercel.app/32)

5. Deploy — Vercel auto-detects Next.js

## After deploying

6. Update NEXT_PUBLIC_APP_URL to your actual Vercel URL

7. In Supabase dashboard → Authentication → URL Configuration:
   - Add your Vercel URL to "Site URL"
   - Add your Vercel URL to "Redirect URLs"

8. Test login at your-app.vercel.app/login

## Cron job
The daily reminder email runs automatically via vercel.json cron config.
Check logs in Vercel dashboard → Functions → Cron Jobs.
