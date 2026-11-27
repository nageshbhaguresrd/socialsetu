import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { assistantChatSchema } from '@/src/lib/validation/bizpilotSchemas';
import { AIUsageService } from '@/src/services/aiUsageService';
import { BusinessAssistantService } from '@/src/services/businessAssistantService';

export async function POST(req: NextRequest) {
  let reservationId: string | undefined;

  try {
    const body = await req.json();
    const validation = assistantChatSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
    }

    const { business_id, conversation_id, message, language } = validation.data;
    const admin = getSupabaseAdmin();

    // 1. Fetch Business Profile
    const { data: business, error: bizErr } = await admin
      .from('businesses')
      .select('name')
      .eq('id', business_id)
      .single();

    if (bizErr || !business) {
      return NextResponse.json({ error: 'Business workspace not found' }, { status: 404 });
    }

    // 2. Reserve AI Quota Atomically
    const quota = await AIUsageService.reserveQuota(business_id, 'system_user');
    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: quota.errorMessage || 'Monthly AI quota reached.',
          currentUsage: quota.currentUsage,
          limit: quota.limit,
          planName: quota.planName,
        },
        { status: 403 }
      );
    }
    reservationId = quota.reservationId;

    // 3. Query Assistant with Grounded Telemetry
    const result = await BusinessAssistantService.query({
      businessId: business_id,
      businessName: business.name,
      question: message,
      language,
    });

    // 4. Finalize Quota
    await AIUsageService.finalizeUsage({
      reservationId,
      businessId: business_id,
      userId: 'system_user',
      feature: 'business_assistant_chat',
      model: result.modelUsed,
      inputTokens: 350,
      outputTokens: 450,
    });

    // 5. Manage Conversation & Save Messages
    let convId = conversation_id;
    if (!convId) {
      const { data: conv } = await admin
        .from('ai_conversations')
        .insert({
          business_id,
          user_id: '00000000-0000-0000-0000-000000000000', // System or auth user
          title: message.slice(0, 40) + '...',
        })
        .select('id')
        .single();
      convId = conv?.id;
    }

    if (convId) {
      await admin.from('ai_messages').insert([
        { conversation_id: convId, role: 'user', content: message },
        { conversation_id: convId, role: 'assistant', content: result.answer },
      ]);
    }

    return NextResponse.json({
      success: true,
      answer: result.answer,
      verifiedData: result.verifiedData,
      conversationId: convId,
      modelUsed: result.modelUsed,
    });
  } catch (err: any) {
    if (reservationId) {
      await AIUsageService.releaseReservation(reservationId);
    }
    return NextResponse.json({ error: err.message || 'Chat query failed' }, { status: 500 });
  }
}
