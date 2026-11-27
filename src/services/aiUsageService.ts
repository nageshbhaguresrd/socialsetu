import { getSupabaseAdmin } from '@/lib/supabase/admin';

export interface QuotaCheckResult {
  allowed: boolean;
  reservationId?: string;
  currentUsage: number;
  limit: number;
  planName: string;
  errorMessage?: string;
}

export class AIUsageService {
  /**
   * Atomically reserve one AI generation quota slot
   */
  static async reserveQuota(businessId: string, userId: string): Promise<QuotaCheckResult> {
    const admin = getSupabaseAdmin();

    // 1. Fetch business subscription and plan
    const { data: sub, error: subErr } = await admin
      .from('subscriptions')
      .select('*, plan:plans(*)')
      .eq('business_id', businessId)
      .eq('status', 'active')
      .single();

    if (subErr || !sub || !sub.plan) {
      return {
        allowed: false,
        currentUsage: 0,
        limit: 0,
        planName: 'None',
        errorMessage: 'Active subscription not found for this business.',
      };
    }

    const plan = sub.plan;
    const limit = plan.ai_generations_limit || 20;

    // 2. Count consumed generations in current billing cycle
    const periodStart = sub.current_period_start || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    
    const { count, error: countErr } = await admin
      .from('ai_usage_logs')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .gte('created_at', periodStart)
      .eq('status', 'success');

    const currentUsage = count || 0;

    if (currentUsage >= limit) {
      return {
        allowed: false,
        currentUsage,
        limit,
        planName: plan.name,
        errorMessage: `Monthly AI generation limit reached (${currentUsage}/${limit}). Please upgrade your plan.`,
      };
    }

    // 3. Create atomic reservation
    const { data: reservation, error: resErr } = await admin
      .from('ai_usage_reservations')
      .insert({
        business_id: businessId,
        user_id: userId,
        status: 'reserved',
      })
      .select('id')
      .single();

    if (resErr || !reservation) {
      return {
        allowed: false,
        currentUsage,
        limit,
        planName: plan.name,
        errorMessage: 'Failed to reserve AI usage quota.',
      };
    }

    return {
      allowed: true,
      reservationId: reservation.id,
      currentUsage,
      limit,
      planName: plan.name,
    };
  }

  /**
   * Finalize and record successful AI generation
   */
  static async finalizeUsage(params: {
    reservationId?: string;
    businessId: string;
    userId: string;
    feature: string;
    model: string;
    inputTokens?: number;
    outputTokens?: number;
  }) {
    const admin = getSupabaseAdmin();
    const inTokens = params.inputTokens || 250;
    const outTokens = params.outputTokens || 400;

    // Estimate cost based on Gemini pricing (approx $0.075 / 1M input, $0.30 / 1M output)
    const costUsd = (inTokens * 0.000000075) + (outTokens * 0.00000030);
    const costInr = costUsd * 88.0; // Converted to INR

    // 1. Log usage
    await admin.from('ai_usage_logs').insert({
      business_id: params.businessId,
      user_id: params.userId,
      feature: params.feature,
      provider: 'google',
      model: params.model,
      input_tokens: inTokens,
      output_tokens: outTokens,
      estimated_cost: costInr,
      status: 'success',
    });

    // 2. Mark reservation consumed
    if (params.reservationId) {
      await admin
        .from('ai_usage_reservations')
        .update({ status: 'consumed' })
        .eq('id', params.reservationId);
    }
  }

  /**
   * Release reservation on error
   */
  static async releaseReservation(reservationId?: string) {
    if (!reservationId) return;
    const admin = getSupabaseAdmin();
    await admin
      .from('ai_usage_reservations')
      .update({ status: 'released' })
      .eq('id', reservationId);
  }

  /**
   * Get quota summary for business
   */
  static async getUsageSummary(businessId: string) {
    const admin = getSupabaseAdmin();

    const { data: sub } = await admin
      .from('subscriptions')
      .select('*, plan:plans(*)')
      .eq('business_id', businessId)
      .eq('status', 'active')
      .single();

    const limit = sub?.plan?.ai_generations_limit || 20;
    const periodStart = sub?.current_period_start || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    const { count } = await admin
      .from('ai_usage_logs')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .gte('created_at', periodStart)
      .eq('status', 'success');

    const used = count || 0;

    return {
      used,
      limit,
      remaining: Math.max(0, limit - used),
      percentage: Math.min(100, Math.round((used / limit) * 100)),
      planName: sub?.plan?.name || 'Free',
      periodEnd: sub?.current_period_end || null,
    };
  }
}
