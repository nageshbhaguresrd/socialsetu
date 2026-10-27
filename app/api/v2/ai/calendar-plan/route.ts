import { NextRequest, NextResponse } from 'next/server';
import { aiSocialOrchestrator } from '@/lib/ai/orchestrator';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clientId, days = 7 } = body;

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

    const plan = await aiSocialOrchestrator.planCalendar(
      clientData,
      brandProfile,
      days === 14 || days === 30 ? days : 7
    );

    return NextResponse.json({
      success: true,
      plan,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Calendar planning failed' },
      { status: 500 }
    );
  }
}
