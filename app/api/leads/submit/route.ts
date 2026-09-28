import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { sendLeadNotification } from '@/lib/email/resend';
import { sendTelegramLeadAlert } from '@/lib/notifications/telegram';
import { generateAutoAudit } from '@/lib/audit/autoAudit';
import { contactSubmissionSchema } from '@/lib/validation/schemas';
import { logActivity } from '@/lib/supabase/logActivity';

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const body = await req.json();

    const result = contactSubmissionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const {
      name,
      city,
      industry,
      budget,
      message,
      phone,
      email,
      source,
    } = body;

    const { error } = await supabase
      .from('contact_submissions')
      .insert({
        name,
        city,
        industry,
        budget,
        message,
        phone,
        email,
        source
      });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Submission failed' }, { status: 500 });
    }

    // Tier 1 Feature 5: Lead Scoring Automation
    const calculateLeadScore = (budget: string, industry: string, source: string) => {
      let score = 40; // Base score
      
      if (source === 'audit_form') score += 20; // High intent
      
      const b = budget.toLowerCase();
      if (b.includes('1.5l+') || b.includes('high')) score += 30;
      else if (b.includes('75k')) score += 15;

      const highMargin = ['real estate', 'healthcare', 'saas', 'luxury', 'it'];
      if (highMargin.some(ind => industry.toLowerCase().includes(ind))) score += 10;
      
      return Math.min(score, 99);
    };

    let newLead: any = null;
    let auditResult: any = null;

    try {
      const leadData = {
        name,
        business: body.website || industry || 'Unknown',
        city: city || 'Unknown',
        industry: industry || 'General',
        budget: budget || 'Not specified',
        source: source === 'audit_form' ? 'Free Audit Form' : 'Website Contact',
        stage: 'New Lead',
        phone: phone || '',
        email: email || '',
        notes: message || '',
        value: 0,
        ai_score: calculateLeadScore(budget || '', industry || '', source || ''),
        priority: 'High',
      };

      // Defensive: ensure empty name can't create a lead row
      if (!leadData.name || !leadData.name.trim()) {
        return NextResponse.json({ error: 'Name is required' }, { status: 400 });
      }

      const { data: insertedLead, error: leadError } = await supabase
        .from('leads')
        .insert(leadData)
        .select()
        .single();

      if (leadError) {
        console.error('Supabase lead error:', leadError);
      } else {
        newLead = insertedLead;
      }

      if (newLead) {
        await logActivity(
          newLead.id,
          'created',
          `Lead created from ${source === 'audit_form' ? 'Free Audit form' : 'Contact form'}`
        );
      }
    } catch (leadInsertError) {
      console.error('Lead insert error:', leadInsertError);
    }

    // Auto-generate Digital Presence Audit if coming from audit form or website/handle provided
    const shouldGenerateAudit = source === 'audit_form' || Boolean(body.website);
    if (shouldGenerateAudit) {
      try {
        auditResult = await generateAutoAudit({
          clientName: name,
          leadId: newLead?.id,
          clientEmail: email,
          industry: industry || 'Digital Business',
          websiteOrHandle: body.website || industry,
        });
      } catch (auditErr) {
        console.error('Auto-audit generation error:', auditErr);
      }
    }

    sendLeadNotification(body).catch(console.error);

    sendTelegramLeadAlert({
      name,
      business: body.website || industry || 'Unknown',
      phone,
      email,
      city,
      industry,
      budget,
      score: auditResult?.overallScore || calculateLeadScore(budget || '', industry || '', source || ''),
      source: source === 'audit_form' ? 'Free Audit Form' : 'Website Contact',
    }).catch(console.error);

    return NextResponse.json({
      success: true,
      leadId: newLead?.id,
      auditId: auditResult?.auditId,
      reportUrl: auditResult?.reportUrl,
      overallScore: auditResult?.overallScore,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 });
  }
}
