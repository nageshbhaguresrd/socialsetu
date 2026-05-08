import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { sendLeadNotification } from '@/lib/email/resend';
import { contactSubmissionSchema } from '@/lib/validation/schemas';
import { logActivity } from '@/lib/supabase/logActivity';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
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

    try {
      const leadData = {
        name,
        business: industry || 'Unknown',
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


      const { data: newLead, error: leadError } = await supabase
        .from('leads')
        .insert(leadData)
        .select()
        .single();

      if (leadError) {
        console.error('Supabase lead error:', leadError);
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

    sendLeadNotification(body).catch(console.error);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 });
  }
}
