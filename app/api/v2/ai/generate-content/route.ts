import { NextRequest, NextResponse } from 'next/server';
import { aiSocialOrchestrator } from '@/lib/ai/orchestrator';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      clientId,
      topic,
      campaignGoal,
      postType = 'post',
      language,
      tone,
      customInstructions,
      autoAdapt = false,
    } = body;

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    let clientData: any = {};
    let brandProfile: any = null;

    if (clientId) {
      const admin = getSupabaseAdmin();
      const { data: client } = await admin
        .from('clients')
        .select('*, brand_profile:client_brand_profiles(*)')
        .eq('id', clientId)
        .single();

      if (client) {
        clientData = client;
        brandProfile = client.brand_profile?.[0] || null;
      }
    }

    const generated = await aiSocialOrchestrator.createPost(
      clientData,
      brandProfile,
      {
        topic,
        campaignGoal,
        postType,
        language,
        tone,
        customInstructions,
      }
    );

    let adaptations = null;
    if (autoAdapt) {
      adaptations = await aiSocialOrchestrator.adaptPost(
        generated.caption,
        clientData.name || 'Brand',
        tone || brandProfile?.brand_voice || 'Professional'
      );
    }

    return NextResponse.json({
      success: true,
      content: generated,
      adaptations: adaptations?.variants || null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'AI generation failed' },
      { status: 500 }
    );
  }
}
