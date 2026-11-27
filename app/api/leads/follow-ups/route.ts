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

    const today = new Date().toISOString().split('T')[0];

    // 1. Due Today
    const { data: todayFollowUps, error: todayErr } = await admin
      .from('leads')
      .select('*')
      .eq('business_id', businessId)
      .neq('status', 'won')
      .neq('status', 'lost')
      .gte('next_follow_up_at', `${today}T00:00:00`)
      .lte('next_follow_up_at', `${today}T23:59:59`)
      .order('next_follow_up_at', { ascending: true });

    // 2. Overdue
    const { data: overdueFollowUps, error: overdueErr } = await admin
      .from('leads')
      .select('*')
      .eq('business_id', businessId)
      .neq('status', 'won')
      .neq('status', 'lost')
      .lt('next_follow_up_at', `${today}T00:00:00`)
      .order('next_follow_up_at', { ascending: true });

    if (todayErr || overdueErr) {
      return NextResponse.json({ error: 'Failed to query follow-ups' }, { status: 500 });
    }

    return NextResponse.json({
      today: todayFollowUps || [],
      overdue: overdueFollowUps || [],
      todayCount: todayFollowUps?.length || 0,
      overdueCount: overdueFollowUps?.length || 0,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Error' }, { status: 500 });
  }
}
