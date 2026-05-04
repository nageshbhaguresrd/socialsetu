import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';

// const resend = new Resend(process.env.RESEND_API_KEY);

const getTodayInIST = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const year = parts.find(part => part.type === 'year')?.value;
  const month = parts.find(part => part.type === 'month')?.value;
  const day = parts.find(part => part.type === 'day')?.value;

  return `${year}-${month}-${day}`;
};

const getReminderLead = (reminder: any) => {
  if (Array.isArray(reminder.leads)) return reminder.leads[0] || {};
  return reminder.leads || {};
};

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET || authHeader !== expectedAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    const today = getTodayInIST();
    const { data: reminders, error } = await supabase
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
      .eq('due_date', today)
      .order('due_time', { ascending: true });

    if (error) {
      console.error('Reminder cron query error:', error);
      return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 });
    }

    if (!reminders || reminders.length === 0) {
      return NextResponse.json({ message: 'No reminders today' });
    }

    const emailHtml = `
<div style="font-family: system-ui; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #6C63FF;">Today's Reminders</h2>
  <p style="color: #666;">${new Date().toLocaleDateString('en-IN',
    { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
  <table style="width:100%; border-collapse: collapse;">
    <tr style="background:#f5f5f5;">
      <th style="padding:8px; text-align:left;">Lead</th>
      <th style="padding:8px; text-align:left;">Business</th>
      <th style="padding:8px; text-align:left;">Type</th>
      <th style="padding:8px; text-align:left;">Note</th>
      <th style="padding:8px; text-align:left;">Time</th>
      <th style="padding:8px; text-align:left;">Phone</th>
    </tr>
    ${reminders.map(r => {
      const lead = getReminderLead(r);
      return `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding:8px;">${lead.name || 'Unknown'}</td>
      <td style="padding:8px;">${lead.business || ''}</td>
      <td style="padding:8px;">${r.type}</td>
      <td style="padding:8px;">${r.note}</td>
      <td style="padding:8px;">${r.due_time}</td>
      <td style="padding:8px;">${lead.phone || ''}</td>
    </tr>`;
    }).join('')}
  </table>
  <p style="color:#999; font-size:12px; margin-top:24px;">
    SocialSetu CRM — Mark reminders done at your CRM dashboard
  </p>
</div>`;

    const resend = new Resend(process.env.RESEND_API_KEY!);
    await resend.emails.send({

      from: 'SocialSetu CRM <crm@socialsetu.com>',
      to: process.env.AGENCY_EMAIL!,
      subject: `📋 Today's Reminders — SocialSetu CRM (${reminders.length} due)`,
      html: emailHtml,
    });

    return NextResponse.json({ sent: true, count: reminders.length });
  } catch (error) {
    console.error('Reminder cron error:', error);
    return NextResponse.json({ error: 'Failed to send reminder digest' }, { status: 500 });
  }
}
