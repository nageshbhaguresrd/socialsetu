import { Resend } from 'resend';

export async function sendLeadNotification({
  name,
  city,
  industry,
  budget,
  phone,
  email,
  source,
}: {
  name: string;
  city?: string;
  industry?: string;
  budget?: string;
  phone?: string;
  email?: string;
  source?: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY is not configured; skipping email notification.');
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    await resend.emails.send({
      from: 'SocialSetu CRM <crm@socialsetu.com>',
      to: process.env.AGENCY_EMAIL!,
      subject: `New Lead: ${name} from ${city || 'Unknown City'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Lead Received</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr style="background-color: #f9f9f9;">
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Name</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">City</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${city || 'N/A'}</td>
            </tr>
            <tr style="background-color: #f9f9f9;">
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Industry</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${industry || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Budget</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${budget || 'N/A'}</td>
            </tr>
            <tr style="background-color: #f9f9f9;">
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Phone</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${phone || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Email</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${email || 'N/A'}</td>
            </tr>
            <tr style="background-color: #f9f9f9;">
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Source</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${source || 'N/A'}</td>
            </tr>
          </table>
          <p style="margin-top: 20px; color: #777;">Sent via SocialSetu CRM</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send lead email:', error);
  }
}

export async function sendClientAuditEmail({
  to,
  clientName,
  overallScore,
  reportUrl,
}: {
  to: string;
  clientName: string;
  overallScore: number;
  reportUrl: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured; skipping client audit email.');
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const fullReportUrl = reportUrl.startsWith('http')
    ? reportUrl
    : `${process.env.APP_URL || 'http://localhost:3000'}${reportUrl}`;
  const agencyPhone = process.env.NEXT_PUBLIC_AGENCY_PHONE || '917276119511';

  try {
    await resend.emails.send({
      from: 'SocialSetu <audit@socialsetu.com>',
      to,
      subject: `Your Free Digital Presence Audit for ${clientName} is Ready! 📊`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #080812; color: #ffffff; padding: 32px; border-radius: 16px;">
          <h1 style="color: #FF6B35; font-size: 24px; margin-bottom: 8px;">SocialSetu</h1>
          <h2 style="font-size: 20px; color: #ffffff; margin-top: 0;">Digital Audit Report for ${clientName}</h2>
          
          <p style="color: #cccccc; font-size: 14px; line-height: 1.6;">
            We have completed a comprehensive digital presence & social media audit for <strong>${clientName}</strong>.
          </p>

          <div style="background: #0F0F1A; border: 1px solid #1E1E35; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
            <div style="font-size: 12px; text-transform: uppercase; color: #888888; letter-spacing: 1px;">Overall Performance Score</div>
            <div style="font-size: 48px; font-weight: bold; color: ${overallScore >= 70 ? '#10B981' : overallScore >= 50 ? '#F59E0B' : '#EF4444'}; margin: 8px 0;">
              ${overallScore}/100
            </div>
            <div style="font-size: 13px; color: #aaaaaa;">
              ${overallScore >= 70 ? 'Strong foundation with key scale opportunities' : 'Significant growth opportunities identified'}
            </div>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${fullReportUrl}" style="background: #FF6B35; color: #ffffff; padding: 14px 28px; border-radius: 10px; font-weight: bold; text-decoration: none; display: inline-block; font-size: 14px;">
              View Full Interactive Audit Report →
            </a>
          </div>

          <p style="color: #999999; font-size: 13px; line-height: 1.5;">
            Want to review your 90-day growth strategy with a senior strategist?
          </p>

          <div style="margin-top: 16px;">
            <a href="https://wa.me/${agencyPhone}?text=${encodeURIComponent(`Hi SocialSetu team! I received my audit report for ${clientName} (Score: ${overallScore}/100) and would like to discuss next steps.`)}" style="background: #10B981; color: #ffffff; padding: 12px 24px; border-radius: 8px; font-weight: bold; text-decoration: none; display: inline-block; font-size: 13px;">
              💬 Chat on WhatsApp with Strategy Team
            </a>
          </div>

          <hr style="border: 0; border-top: 1px solid #1E1E35; margin: 32px 0;" />
          <p style="color: #666666; font-size: 11px;">
            SocialSetu Digital Agency • Serving Brands Pan-India • WhatsApp: +${agencyPhone}
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send client audit email:', error);
  }
}


