import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { marketingGenerateSchema } from '@/src/lib/validation/bizpilotSchemas';
import { AIUsageService } from '@/src/services/aiUsageService';
import { GeminiMarketingService } from '@/src/services/geminiService';

export async function POST(req: NextRequest) {
  let reservationId: string | undefined;
  try {
    const body = await req.json();
    const validation = marketingGenerateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
    }

    const {
      business_id,
      topic,
      platform,
      language,
      tone,
      target_audience,
      offer_details,
    } = validation.data;

    const admin = getSupabaseAdmin();

    // 1. Fetch Business Profile
    const { data: business, error: bizErr } = await admin
      .from('businesses')
      .select('name, industry')
      .eq('id', business_id)
      .single();

    if (bizErr || !business) {
      return NextResponse.json({ error: 'Business workspace not found' }, { status: 404 });
    }

    // 2. Atomic Quota Reservation
    const quota = await AIUsageService.reserveQuota(business_id, 'system_user');
    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: quota.errorMessage || 'Monthly AI quota exceeded. Please upgrade plan.',
          currentUsage: quota.currentUsage,
          limit: quota.limit,
          planName: quota.planName,
        },
        { status: 403 }
      );
    }
    reservationId = quota.reservationId;

    // 3. Call Gemini Multi-lingual Marketing Engine
    const generated = await GeminiMarketingService.generate({
      businessName: business.name,
      industry: business.industry || undefined,
      platform,
      topic,
      language,
      tone,
      targetAudience: target_audience,
      offerDetails: offer_details,
    });

    // 4. Finalize Quota Consumption & Cost Tracking
    await AIUsageService.finalizeUsage({
      reservationId,
      businessId: business_id,
      userId: 'system_user',
      feature: `marketing_${platform}`,
      model: generated.modelUsed,
      inputTokens: generated.inputTokens,
      outputTokens: generated.outputTokens,
    });

    // 5. Automatically save to marketing_contents drafts
    const { data: savedContent } = await admin
      .from('marketing_contents')
      .insert({
        business_id,
        platform,
        content_type: 'post',
        language,
        topic,
        prompt: topic,
        generated_content: JSON.stringify(generated),
        status: 'draft',
      })
      .select()
      .single();

    return NextResponse.json({
      success: true,
      content: generated,
      savedContent,
    });
  } catch (err: any) {
    if (reservationId) {
      await AIUsageService.releaseReservation(reservationId);
    }
    return NextResponse.json({ error: err.message || 'Generation failed' }, { status: 500 });
  }
}
