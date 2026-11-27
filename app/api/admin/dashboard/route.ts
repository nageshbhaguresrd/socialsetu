import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const admin = getSupabaseAdmin();

    // 1. Total Businesses
    const { count: totalBusinesses } = await admin
      .from('businesses')
      .select('id', { count: 'exact', head: true });

    // 2. Total Members
    const { count: totalMembers } = await admin
      .from('business_members')
      .select('id', { count: 'exact', head: true });

    // 3. Subscriptions Breakdown & MRR
    const { data: subs } = await admin
      .from('subscriptions')
      .select('status, plan:plans(code, monthly_price_paise)');

    let mrrPaise = 0;
    let paidSubscribers = 0;
    let freeSubscribers = 0;

    (subs || []).forEach((s: any) => {
      if (s.status === 'active') {
        const price = s.plan?.monthly_price_paise || 0;
        if (price > 0) {
          mrrPaise += price;
          paidSubscribers += 1;
        } else {
          freeSubscribers += 1;
        }
      }
    });

    // 4. AI Usage & Cost Summary
    const { data: aiLogs } = await admin
      .from('ai_usage_logs')
      .select('estimated_cost, input_tokens, output_tokens, status, business_id');

    const totalAIGenerations = aiLogs?.length || 0;
    const totalAICostINR = (aiLogs || []).reduce((acc, l) => acc + Number(l.estimated_cost || 0), 0);

    // 5. Recent Businesses
    const { data: recentBusinesses } = await admin
      .from('businesses')
      .select('id, name, industry, preferred_language, created_at')
      .order('created_at', { ascending: false })
      .limit(6);

    return NextResponse.json({
      metrics: {
        totalBusinesses: totalBusinesses || 0,
        totalMembers: totalMembers || 0,
        paidSubscribers,
        freeSubscribers,
        mrrINR: mrrPaise / 100,
        totalAIGenerations,
        totalAICostINR: Number(totalAICostINR.toFixed(2)),
      },
      recentBusinesses: recentBusinesses || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Admin analytics error' }, { status: 500 });
  }
}
