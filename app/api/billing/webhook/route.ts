import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // 1. Signature Verification if secret configured
    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      if (expectedSignature !== signature) {
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
      }
    }

    const payload = JSON.parse(rawBody);
    const eventId = payload.event_id || payload.id || `evt_${Date.now()}`;
    const eventType = payload.event || 'payment.captured';

    const admin = getSupabaseAdmin();

    // 2. Strict Idempotency Check in payment_events table
    const { data: existingEvent } = await admin
      .from('payment_events')
      .select('id')
      .eq('event_id', eventId)
      .single();

    if (existingEvent) {
      // Event has already been processed idempotently
      return NextResponse.json({ status: 'already_processed', eventId });
    }

    // 3. Record event in payment_events
    await admin.from('payment_events').insert({
      event_id: eventId,
      event_type: eventType,
      provider: 'razorpay',
      payload,
    });

    // 4. Handle Subscription Activation
    const notes = payload.payload?.payment?.entity?.notes || payload.notes || {};
    const businessId = notes.business_id;
    const planCode = notes.plan_code;

    if (businessId && planCode) {
      const { data: plan } = await admin
        .from('plans')
        .select('id')
        .eq('code', planCode)
        .single();

      if (plan) {
        await admin
          .from('subscriptions')
          .update({
            plan_id: plan.id,
            status: 'active',
            provider: 'razorpay',
            provider_customer_id: payload.payload?.payment?.entity?.customer_id || null,
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('business_id', businessId);

        // Audit Log
        await admin.from('audit_logs').insert({
          business_id: businessId,
          action: 'subscription_activated',
          entity_type: 'subscription',
          metadata: { planCode, eventId },
        });
      }
    }

    return NextResponse.json({ success: true, processed: true, eventId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Webhook error' }, { status: 500 });
  }
}
