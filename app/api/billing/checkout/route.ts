import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { checkoutSchema } from '@/src/lib/validation/bizpilotSchemas';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = checkoutSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
    }

    const { business_id, plan_code } = validation.data;
    const admin = getSupabaseAdmin();

    const { data: targetPlan, error: planErr } = await admin
      .from('plans')
      .select('*')
      .eq('code', plan_code)
      .eq('is_active', true)
      .single();

    if (planErr || !targetPlan) {
      return NextResponse.json({ error: 'Selected plan is not active or found' }, { status: 404 });
    }

    // In Free plan switch, immediately activate
    if (plan_code === 'free') {
      await admin
        .from('subscriptions')
        .update({
          plan_id: targetPlan.id,
          status: 'active',
          provider: 'free_tier',
          current_period_end: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('business_id', business_id);

      return NextResponse.json({
        success: true,
        message: 'Switched to Free Plan successfully',
        plan: targetPlan,
      });
    }

    // For Paid Plans (Starter, Professional, Business, Enterprise)
    const amountPaise = targetPlan.monthly_price_paise;
    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder';
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    return NextResponse.json({
      success: true,
      orderId,
      amountPaise,
      amountINR: amountPaise / 100,
      currency: 'INR',
      keyId,
      plan: targetPlan,
      notes: {
        business_id,
        plan_code,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Checkout initialization failed' }, { status: 500 });
  }
}
