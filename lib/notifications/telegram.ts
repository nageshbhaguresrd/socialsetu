export async function sendTelegramMessage(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('Telegram notification error:', err);
    }
  } catch (error) {
    console.error('Failed to send Telegram alert:', error);
  }
}

export async function sendTelegramLeadAlert(lead: {
  name: string;
  business?: string;
  phone?: string;
  email?: string;
  city?: string;
  industry?: string;
  budget?: string;
  score?: number;
  source?: string;
}) {
  const phoneClean = (lead.phone || '').replace(/\D/g, '');
  const waLink = phoneClean
    ? `https://wa.me/${phoneClean.length === 10 ? '91' + phoneClean : phoneClean}`
    : '';

  const lines = [
    `🔥 *New Lead Captured on SocialSetu!*`,
    ``,
    `👤 *Name:* ${lead.name}`,
    lead.business ? `🏢 *Business:* ${lead.business}` : null,
    lead.industry ? `🏭 *Industry:* ${lead.industry}` : null,
    lead.city ? `📍 *City:* ${lead.city}` : null,
    lead.budget ? `💰 *Budget:* ${lead.budget}` : null,
    lead.score ? `⭐ *AI Intent Score:* ${lead.score}/100` : null,
    lead.phone ? `📞 *Phone:* \`${lead.phone}\`` : null,
    lead.email ? `✉️ *Email:* \`${lead.email}\`` : null,
    lead.source ? `🌐 *Source:* ${lead.source}` : null,
    ``,
    waLink ? `👉 [1-Click Reply on WhatsApp](${waLink})` : null,
    `👉 [Open CRM Pipeline](${process.env.APP_URL || 'http://localhost:3000'}/crm)`,
  ].filter(Boolean);

  await sendTelegramMessage(lines.join('\n'));
}

export async function sendTelegramAuditAlert(audit: {
  clientName: string;
  auditId: string;
  shareId?: string;
  overallScore?: number;
  platforms?: Record<string, any>;
}) {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const reportUrl = `${appUrl}/report/${audit.shareId || audit.auditId}`;

  const platformNames = audit.platforms
    ? Object.keys(audit.platforms)
        .filter((k) => audit.platforms && audit.platforms[k])
        .join(', ')
    : '';

  const lines = [
    `📊 *Digital Presence Audit Generated!*`,
    ``,
    `🏢 *Client:* ${audit.clientName}`,
    audit.overallScore != null ? `🎯 *Overall Score:* ${audit.overallScore}/100` : null,
    platformNames ? `📱 *Platforms:* ${platformNames}` : null,
    ``,
    `🔗 [View Interactive Report](${reportUrl})`,
    `📥 [Download Branded PDF](${appUrl}/api/audit/${audit.auditId}/pdf)`,
  ].filter(Boolean);

  await sendTelegramMessage(lines.join('\n'));
}
