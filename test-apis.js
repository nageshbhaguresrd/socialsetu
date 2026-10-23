const fs = require('fs');

// Load environment variables from .env.local
const envFile = fs.readFileSync('.env.local', 'utf8');
envFile.split(/\r?\n/).forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  }
});

async function runTests() {
  const results = {};

  // 1. YouTube Data API v3
  try {
    const ytKey = process.env.YOUTUBE_API_KEY;
    const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=UC_x5XG1OV2P6uZZ5FSM9Ttw&key=${ytKey}`);
    const data = await res.json();
    if (res.ok && data.items && data.items.length > 0) {
      results['YouTube Data API v3'] = `✅ SUCCESS (${data.items[0].snippet.title})`;
    } else {
      results['YouTube Data API v3'] = `❌ FAILED: ${data.error?.message || res.status}`;
    }
  } catch (err) {
    results['YouTube Data API v3'] = `❌ ERROR: ${err.message}`;
  }

  // 2. RapidAPI (Instagram Scraper)
  try {
    const rapidKey = process.env.RAPIDAPI_KEY;
    const form = new FormData();
    form.append('data', 'basic');
    form.append('username_or_url', 'nageshbhagure');

    const res = await fetch('https://instagram-scraper-stable-api.p.rapidapi.com/ig_get_fb_profile.php', {
      method: 'POST',
      headers: {
        'x-rapidapi-key': rapidKey,
        'x-rapidapi-host': 'instagram-scraper-stable-api.p.rapidapi.com'
      },
      body: form
    });
    const data = await res.json();
    if (res.ok && data.follower_count != null) {
      results['RapidAPI (Instagram)'] = `✅ SUCCESS (@${data.username}: ${Number(data.follower_count).toLocaleString()} followers, ${data.media_count} posts)`;
    } else {
      results['RapidAPI (Instagram)'] = `❌ FAILED (HTTP ${res.status}): ${data.message || JSON.stringify(data)}`;
    }
  } catch (err) {
    results['RapidAPI (Instagram)'] = `❌ ERROR: ${err.message}`;
  }

  // 3. Twitter / X Official API
  try {
    const token = process.env.TWITTER_BEARER_TOKEN;
    const res = await fetch('https://api.twitter.com/2/users/by/username/X', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok && data.data) {
      results['Twitter / X Official API'] = `✅ SUCCESS (@${data.data.username})`;
    } else {
      results['Twitter / X Official API'] = `⚠️ HTTP ${res.status}: ${data.title || data.detail || 'Access restricted'}`;
    }
  } catch (err) {
    results['Twitter / X Official API'] = `❌ ERROR: ${err.message}`;
  }

  // 4. Meta Graph API
  try {
    const metaToken = process.env.META_GRAPH_ACCESS_TOKEN;
    const res = await fetch(`https://graph.facebook.com/v20.0/me?access_token=${metaToken}`);
    const data = await res.json();
    if (res.ok) {
      results['Meta Graph API'] = `✅ SUCCESS`;
    } else {
      results['Meta Graph API'] = `⚠️ HTTP ${res.status}: ${data.error?.message?.slice(0, 70)}...`;
    }
  } catch (err) {
    results['Meta Graph API'] = `❌ ERROR: ${err.message}`;
  }

  // 5. Telegram Bot API
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const res = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const data = await res.json();
    if (data.ok) {
      results['Telegram Lead Alert Bot'] = `✅ SUCCESS (@${data.result.username})`;
    } else {
      results['Telegram Lead Alert Bot'] = `❌ FAILED: ${data.description}`;
    }
  } catch (err) {
    results['Telegram Lead Alert Bot'] = `❌ ERROR: ${err.message}`;
  }

  // 6. Google Gemini AI Engine
  try {
    const geminiKey = process.env.GEMINI_API_KEY;
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`);
    const data = await res.json();
    if (res.ok && data.models) {
      results['Google Gemini AI Engine'] = `✅ SUCCESS (${data.models.length} models ready)`;
    } else {
      results['Google Gemini AI Engine'] = `❌ FAILED: ${data.error?.message || res.status}`;
    }
  } catch (err) {
    results['Google Gemini AI Engine'] = `❌ ERROR: ${err.message}`;
  }

  // 7. Supabase Database REST API
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const res = await fetch(`${url}/rest/v1/audits?select=id&limit=1`, {
      headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
    });
    if (res.ok) {
      results['Supabase Database Connection'] = `✅ SUCCESS (Status: ${res.status} OK)`;
    } else {
      results['Supabase Database Connection'] = `❌ FAILED (HTTP ${res.status})`;
    }
  } catch (err) {
    results['Supabase Database Connection'] = `❌ ERROR: ${err.message}`;
  }

  // 8. Google PageSpeed (Website SEO)
  try {
    const psKey = process.env.PAGESPEED_API_KEY;
    const url = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://socialsetu.vercel.app&strategy=mobile&category=seo${psKey ? '&key=' + psKey : ''}`;
    const res = await fetch(url);
    const data = await res.json();
    const score = Math.round((data.lighthouseResult?.categories?.seo?.score || 0) * 100);
    if (res.ok && score > 0) {
      results['Google PageSpeed (Website SEO)'] = `✅ SUCCESS (Live SEO Score: ${score}/100)`;
    } else {
      results['Google PageSpeed (Website SEO)'] = `❌ FAILED (HTTP ${res.status})`;
    }
  } catch (err) {
    results['Google PageSpeed (Website SEO)'] = `❌ ERROR: ${err.message}`;
  }

  // 9. Resend Email API
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey || resendKey.trim() === '') {
    results['Resend Email Delivery'] = `⚪ NOT CONFIGURED (Key is empty in .env.local)`;
  } else {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        headers: { 'Authorization': `Bearer ${resendKey}` }
      });
      results['Resend Email Delivery'] = res.status !== 401 ? `✅ SUCCESS` : `❌ FAILED (Invalid Key)`;
    } catch (e) {
      results['Resend Email Delivery'] = `❌ ERROR: ${e.message}`;
    }
  }

  console.log('\n=================== SOCIALSETU API HEALTH REPORT ===================');
  for (const [name, status] of Object.entries(results)) {
    console.log(name.padEnd(35) + '-> ' + status);
  }
  console.log('====================================================================\n');
}

runTests();
