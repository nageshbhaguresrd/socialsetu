import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { aiSocialOrchestrator } from '@/lib/ai/orchestrator';
import { sendEmail } from '@/lib/email/resend';

export async function GET(req: NextRequest) {
  try {
    const admin = getSupabaseAdmin();
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const daysAhead = parseInt(searchParams.get('daysAhead') || '14', 10);

    if (!clientId) {
      return NextResponse.json({ error: 'clientId is required' }, { status: 400 });
    }

    const { data: contacts, error } = await admin
      .from('client_contacts')
      .select('*')
      .eq('client_id', clientId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const today = new Date();
    const currentYear = today.getFullYear();

    const upcomingEvents: any[] = [];

    for (const c of contacts || []) {
      // 1. Check Birthday
      if (c.birthday) {
        const bdate = new Date(c.birthday);
        const nextBirthday = new Date(currentYear, bdate.getMonth(), bdate.getDate());
        if (nextBirthday < today) {
          nextBirthday.setFullYear(currentYear + 1);
        }
        const diffDays = Math.ceil(
          (nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays >= 0 && diffDays <= daysAhead) {
          const turningAge = currentYear - bdate.getFullYear();
          upcomingEvents.push({
            id: `bday_${c.id}`,
            contactId: c.id,
            contactName: `${c.first_name} ${c.last_name || ''}`.trim(),
            relationship: c.relationship,
            email: c.email,
            phone: c.phone,
            eventType: 'birthday',
            eventDate: nextBirthday.toISOString().split('T')[0],
            daysUntil: diffDays,
            milestone: turningAge > 0 ? turningAge : undefined,
          });
        }
      }

      // 2. Check Anniversary
      if (c.anniversary) {
        const adate = new Date(c.anniversary);
        const nextAnniversary = new Date(currentYear, adate.getMonth(), adate.getDate());
        if (nextAnniversary < today) {
          nextAnniversary.setFullYear(currentYear + 1);
        }
        const diffDays = Math.ceil(
          (nextAnniversary.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays >= 0 && diffDays <= daysAhead) {
          const years = currentYear - adate.getFullYear();
          upcomingEvents.push({
            id: `anni_${c.id}`,
            contactId: c.id,
            contactName: `${c.first_name} ${c.last_name || ''}`.trim(),
            relationship: c.relationship,
            email: c.email,
            phone: c.phone,
            eventType: 'anniversary',
            eventDate: nextAnniversary.toISOString().split('T')[0],
            daysUntil: diffDays,
            milestone: years > 0 ? years : undefined,
          });
        }
      }
    }

    // Sort by nearest days until event
    upcomingEvents.sort((a, b) => a.daysUntil - b.daysUntil);

    return NextResponse.json({
      success: true,
      upcomingEvents,
      totalCount: upcomingEvents.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to calculate upcoming celebrations' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = getSupabaseAdmin();
    const body = await req.json();

    const {
      clientId,
      contactId,
      eventType = 'birthday',
      language = 'English',
      customNote,
      autoCreatePost = false,
      sendDirectEmail = false,
    } = body;

    if (!clientId || !contactId) {
      return NextResponse.json(
        { error: 'clientId and contactId are required' },
        { status: 400 }
      );
    }

    // Fetch client & contact
    const { data: client } = await admin
      .from('clients')
      .select('*, brand_profile:client_brand_profiles(*)')
      .eq('id', clientId)
      .single();

    const { data: contact } = await admin
      .from('client_contacts')
      .select('*')
      .eq('id', contactId)
      .single();

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    const contactName = `${contact.first_name} ${contact.last_name || ''}`.trim();

    // Generate AI celebration greeting
    const greeting = await aiSocialOrchestrator.generateCelebrationGreeting(
      client || {},
      client?.brand_profile?.[0] || null,
      {
        contactName,
        eventType,
        relationship: contact.relationship || 'Customer',
        language,
        customNote,
      }
    );

    let createdPost = null;
    if (autoCreatePost) {
      const { data: post } = await admin
        .from('content_posts')
        .insert({
          client_id: clientId,
          headline: greeting.headline,
          primary_caption: greeting.greetingText,
          post_type: 'post',
          target_platforms: ['instagram', 'facebook_page', 'linkedin_page'],
          hashtags: greeting.suggestedHashtags,
          status: 'pending_approval',
        })
        .select()
        .single();

      createdPost = post;
    }

    // Optionally send email via Resend if email is present
    let emailStatus = null;
    if (sendDirectEmail && contact.email) {
      emailStatus = await sendEmail({
        to: contact.email,
        subject: greeting.headline,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #FF6B35; margin-bottom: 16px;">${greeting.headline}</h2>
            <div style="font-size: 16px; line-height: 1.6; color: #1e293b; white-space: pre-wrap;">${greeting.greetingText}</div>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="font-size: 14px; color: #64748b;">${greeting.callToAction}</p>
          </div>
        `,
      });
    }

    return NextResponse.json({
      success: true,
      greeting,
      createdPost,
      emailStatus,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Greeting generation failed' },
      { status: 500 }
    );
  }
}
