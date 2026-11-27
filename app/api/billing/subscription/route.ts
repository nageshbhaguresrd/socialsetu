import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const admin = getSupabaseAdmin();
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('business_id');

    if (!businessId) {
      return NextResponse.json({ error: 'business_id is required' }, { status: 400 });
    }

    // 1. Fetch all active plans
    const { data: plans } = await admin
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('monthly_price_paise', { ascending: true });

    // 2. Fetch business active subscription
    const { data: sub } = await admin
      .from('subscriptions')
      .select('*, plan:plans(*)')
      .eq('business_id', businessId)
      .single();

    return NextResponse.json({
      subscription: sub,
      availablePlans: (plans || []).map((p) => ({
        ...p,
        monthly_price_inr: p.monthly_price_paise / 100,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Error' }, { status: 500 });
  }
}
