import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const getTodayInIST = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  return { full: `${year}-${month}-${day}`, month, day };
};

const getReminderLead = (reminder: any) => {
  if (Array.isArray(reminder.leads)) return reminder.leads[0] || {};
  return reminder.leads || {};
};

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
  const url = new URL(request.url);
  const secretParam = url.searchParams.get('secret');

  if (
    process.env.NODE_ENV === 'production' &&
    (!process.env.CRON_SECRET || (authHeader !== expectedAuth && secretParam !== process.env.CRON_SECRET))
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const today = getTodayInIST();

    // 1. Fetch CRM Reminders
    const { data: reminders } = await supabase
      .from('reminders')
      .select(`
        id,
        type,
        note,
        due_time,
        leads (
          name,
          business,
          phone
        )
      `)
      .eq('done', false)
      .eq('due_date', today.full)
      .order('due_time', { ascending: true });

    // 2. Fetch Today's Client Celebrations (Birthdays & Anniversaries)
    const { data: contacts } = await supabase
      .from('client_contacts')
      .select(`
        id,
        first_name,
        last_name,
        relationship,
        birthday,
        anniversary,
        client:clients(name)
      `);

    const todaysCelebrations: any[] = [];
    if (contacts) {
      for (const c of contacts) {
        if (c.birthday && c.birthday.endsWith(`-${today.month}-${today.day}`)) {
          todaysCelebrations.push({
            name: `${c.first_name} ${c.last_name || ''}`.trim(),
            client: (c.client as any)?.name || 'Direct Client',
            type: 'Birthday 🎂',
          });
        }
        if (c.anniversary && c.anniversary.endsWith(`-${today.month}-${today.day}`)) {
          todaysCelebrations.push({
            name: `${c.first_name} ${c.last_name || ''}`.trim(),
            client: (c.client as any)?.name || 'Direct Client',
            type: 'Anniversary 🥂',
          });
        }
      }
    }

    const hasReminders = reminders && reminders.length > 0;
    const hasCelebrations = todaysCelebrations.length > 0;

    if (!hasReminders && !hasCelebrations) {
      return NextResponse.json({ message: 'No reminders or celebrations today' });
    }

    const emailHtml = `
<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 620px; margin: 0 auto; color: #1e293b;">
  <div style="background: linear-gradient(135deg, #FF6B35 0%, #E85D04 100%); padding: 24px; border-radius: 12px 12px 0 0; color: white;">
    <h2 style="margin: 0; font-size: 20px;">🌅 SocialSetu Daily Briefing</h2>
    <p style="margin: 4px 0 0 0; opacity: 0.9; font-size: 14px;">${new Date().toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })}</p>
  </div>

  <div style="padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; background: #ffffff;">
    ${
      hasCelebrations
        ? `
      <h3 style="color: #FF6B35; font-size: 16px; margin-top: 0;">🎉 Today's Celebrations (${todaysCelebrations.length})</h3>
      <table style="width:100%; border-collapse: collapse; margin-bottom: 24px;">
        <tr style="background:#f8fafc; font-size: 12px; color: #64748b;">
          <th style="padding:8px; text-align:left;">Person</th>
          <th style="padding:8px; text-align:left;">Workspace / Client</th>
          <th style="padding:8px; text-align:left;">Occasion</th>
        </tr>
        ${todaysCelebrations
          .map(
            (c) => `
          <tr style="border-bottom: 1px solid #f1f5f9; font-size: 13px;">
            <td style="padding:8px; font-weight: 600;">${c.name}</td>
            <td style="padding:8px;">${c.client}</td>
            <td style="padding:8px;">${c.type}</td>
          </tr>`
          )
          .join('')}
      </table>
    `
        : ''
    }

    ${
      hasReminders
        ? `
      <h3 style="color: #6366F1; font-size: 16px;">📋 Pending CRM Follow-ups (${reminders.length})</h3>
      <table style="width:100%; border-collapse: collapse;">
        <tr style="background:#f8fafc; font-size: 12px; color: #64748b;">
          <th style="padding:8px; text-align:left;">Lead</th>
          <th style="padding:8px; text-align:left;">Type</th>
          <th style="padding:8px; text-align:left;">Note</th>
          <th style="padding:8px; text-align:left;">Time</th>
          <th style="padding:8px; text-align:left;">Phone</th>
        </tr>
        ${reminders
          .map((r) => {
            const lead = getReminderLead(r);
            return `
          <tr style="border-bottom: 1px solid #f1f5f9; font-size: 13px;">
            <td style="padding:8px; font-weight: 500;">${lead.name || 'Unknown'}<br><span style="font-size:11px; color:#64748b;">${lead.business || ''}</span></td>
            <td style="padding:8px;">${r.type}</td>
            <td style="padding:8px;">${r.note}</td>
            <td style="padding:8px;">${r.due_time}</td>
            <td style="padding:8px;">${lead.phone || ''}</td>
          </tr>`;
          })
          .join('')}
      </table>
    `
        : ''
    }

    <p style="color:#94a3b8; font-size:12px; margin-top:28px; text-align: center;">
      SocialSetu Enterprise CRM — Review and take action in your dashboard.
    </p>
  </div>
</div>`;

    if (process.env.RESEND_API_KEY && process.env.AGENCY_EMAIL) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: 'SocialSetu CRM <crm@socialsetu.com>',
        to: process.env.AGENCY_EMAIL,
        subject: `🌅 Daily Briefing — ${todaysCelebrations.length} Celebrations & ${reminders?.length || 0} Reminders`,
        html: emailHtml,
      });
    }

    return NextResponse.json({
      sent: true,
      remindersCount: reminders?.length || 0,
      celebrationsCount: todaysCelebrations.length,
    });
  } catch (error: any) {
    console.error('Reminder cron error:', error);
    return NextResponse.json(
      { error: 'Failed to run daily reminder briefing' },
      { status: 500 }
    );
  }
}
