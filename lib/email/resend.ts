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
  const resend = new Resend(process.env.RESEND_API_KEY!);

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

