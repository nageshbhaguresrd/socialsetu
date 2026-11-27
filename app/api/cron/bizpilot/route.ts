import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(url, key);
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
  const url = new URL(request.url);
  const secretParam = url.searchParams.get('secret');

  // Authorize cron trigger
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.CRON_SECRET &&
    authHeader !== expectedAuth &&
    secretParam !== process.env.CRON_SECRET
  ) {
    return NextResponse.json({ error: 'Unauthorized cron caller' }, { status: 401 });
  }

  const supabase = getAdminClient();
  const todayStr = new Date().toISOString().split('T')[0];
  const summary = {
    date: todayStr,
    followUpsPending: 0,
    subscriptionsChecked: 0,
    notificationsLogged: 0,
    errors: [] as string[],
  };

  try {
    // 1. Process Due and Overdue Follow-ups
    const { data: leads, error: leadErr } = await supabase
      .from('leads')
      .select('id, business_id, name, phone, next_follow_up, status')
      .lte('next_follow_up', todayStr)
      .not('status', 'in', '("won","lost")')
      .order('next_follow_up', { ascending: true })
      .limit(100);

    if (leadErr) {
      summary.errors.push(`Lead scan error: ${leadErr.message}`);
    } else if (leads) {
      summary.followUpsPending = leads.length;

      // Log reminders into lead_activities for each pending lead
      for (const lead of leads) {
        const isOverdue = lead.next_follow_up < todayStr;
        const note = isOverdue
          ? `[System Alert] Overdue follow-up for ${lead.name} (Scheduled: ${lead.next_follow_up})`
          : `[System Reminder] Follow-up scheduled for today for ${lead.name}`;

        // Verify if a reminder for today was already recorded to keep job idempotent
        const { data: existing } = await supabase
          .from('lead_activities')
          .select('id')
          .eq('lead_id', lead.id)
          .eq('activity_type', 'reminder')
          .gte('created_at', `${todayStr}T00:00:00Z`)
          .limit(1);

        if (!existing || existing.length === 0) {
          await supabase.from('lead_activities').insert({
            business_id: lead.business_id,
            lead_id: lead.id,
            activity_type: 'reminder',
            description: note,
          });
          summary.notificationsLogged++;
        }
      }
    }

    // 2. Check Expiring Subscriptions (within next 3 days)
    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    const threeDaysLaterStr = threeDaysLater.toISOString();

    const { data: subs, error: subErr } = await supabase
      .from('subscriptions')
      .select('id, business_id, status, current_period_end')
      .eq('status', 'active')
      .lte('current_period_end', threeDaysLaterStr)
      .limit(50);

    if (subErr) {
      summary.errors.push(`Subscription scan error: ${subErr.message}`);
    } else if (subs) {
      summary.subscriptionsChecked = subs.length;
    }

    return NextResponse.json({
      status: 'ok',
      job: 'bizpilot-cron-notifier',
      summary,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
