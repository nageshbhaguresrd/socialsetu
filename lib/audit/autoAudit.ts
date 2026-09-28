import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { analyzeAudit } from './analyzer';
import { fetchInstagramData } from './instagram';
import { fetchYouTubeData } from './youtube';
import { fetchTwitterData } from './twitter';
import { sendTelegramAuditAlert } from '@/lib/notifications/telegram';
import { sendClientAuditEmail } from '@/lib/email/resend';

interface AutoAuditOptions {
  clientName: string;
  leadId?: string;
  clientEmail?: string;
  industry?: string;
  websiteOrHandle?: string;
  targetAudience?: string;
  businessGoal?: string;
}

export async function generateAutoAudit(options: AutoAuditOptions) {
  const supabase = getSupabaseAdmin();
  const rawInput = (options.websiteOrHandle || '').trim();

  // Normalize platform handles
  const platforms: Record<string, string> = {};
  if (rawInput) {
    if (rawInput.includes('youtube.com') || rawInput.includes('youtu.be')) {
      platforms.youtube = rawInput;
    } else if (rawInput.includes('twitter.com') || rawInput.includes('x.com')) {
      platforms.twitter = rawInput.replace(/^https?:\/\/(www\.)?(twitter|x)\.com\//, '').replace(/\/$/, '');
    } else {
      // Clean handle for Instagram
      const cleanHandle = rawInput
        .replace(/^https?:\/\/(www\.)?instagram\.com\//, '')
        .replace(/^@/, '')
        .replace(/\/$/, '');
      platforms.instagram = cleanHandle;
    }
  } else {
    // If no handle is provided, default to client name sanitized as handle
    platforms.instagram = options.clientName.toLowerCase().replace(/[^a-z0-9_]/g, '');
  }

  // 1. Insert audit row in processing state
  const { data: audit, error: insertError } = await supabase
    .from('audits')
    .insert({
      client_name: options.clientName,
      lead_id: options.leadId || null,
      platforms,
      scores: {},
      report: {},
      status: 'processing',
    })
    .select()
    .single();

  if (insertError || !audit) {
    throw new Error(insertError?.message || 'Failed to initialize audit');
  }

  // 2. Fetch platform data
  const [youtube, instagram, twitter] = await Promise.allSettled([
    platforms.youtube ? fetchYouTubeData(platforms.youtube) : Promise.resolve(undefined),
    platforms.instagram ? fetchInstagramData(platforms.instagram) : Promise.resolve(undefined),
    platforms.twitter ? fetchTwitterData(platforms.twitter) : Promise.resolve(undefined),
  ]);

  const auditInput = {
    clientName: options.clientName,
    industry: options.industry || 'Digital Creator & Local Business',
    targetAudience: options.targetAudience || 'Target customers and local demographic in India',
    businessGoal: options.businessGoal || 'Lead Generation & Brand Awareness',
    youtube: youtube.status === 'fulfilled' ? youtube.value : undefined,
    instagram: instagram.status === 'fulfilled' ? instagram.value : undefined,
    twitter: twitter.status === 'fulfilled' ? twitter.value : undefined,
  };

  // 3. Run Analysis
  const { report, scores, rawMetrics } = await analyzeAudit(auditInput);

  // 4. Update Audit Record
  await supabase
    .from('audits')
    .update({
      report,
      scores,
      raw_metrics: rawMetrics,
      status: 'completed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', audit.id);

  const overallScore = report?.overallScore ?? scores?.overall ?? 65;
  const reportUrl = `/report/${audit.share_id || audit.id}`;

  // 5. Send automated client email (if email provided)
  if (options.clientEmail) {
    sendClientAuditEmail({
      to: options.clientEmail,
      clientName: options.clientName,
      overallScore,
      reportUrl,
    }).catch(console.error);
  }

  // 6. Send Telegram alert to agency admin
  sendTelegramAuditAlert({
    clientName: options.clientName,
    auditId: audit.id,
    shareId: audit.share_id,
    overallScore,
    platforms,
  }).catch(console.error);

  return {
    auditId: audit.id,
    shareId: audit.share_id,
    reportUrl,
    scores,
    overallScore,
    report,
  };
}
