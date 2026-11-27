import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createBusinessSchema } from '@/src/lib/validation/bizpilotSchemas';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    const admin = getSupabaseAdmin();

    // If session user exists, query businesses through memberships
    let query;
    if (user) {
      query = admin
        .from('business_members')
        .select(`
          role,
          business:businesses(*)
        `)
        .eq('user_id', user.id);
    } else {
      // Fallback: list active workspaces
      query = admin.from('businesses').select('*').limit(10);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const workspaces = user
      ? (data || []).map((m: any) => ({ ...m.business, role: m.role }))
      : data || [];

    return NextResponse.json({ businesses: workspaces });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await req.json();
    const validation = createBusinessSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
    }

    const { name, industry, description, preferred_language = 'en' } = validation.data;
    const admin = getSupabaseAdmin();

    // Call PostgreSQL transactional RPC create_business_workspace
    // Or fallback to direct transactional creation if running outside authenticated user session
    const effectiveUserId = user?.id;

    if (effectiveUserId) {
      const { data: rpcResult, error: rpcErr } = await supabase.rpc('create_business_workspace', {
        p_name: name,
        p_industry: industry || null,
        p_description: description || null,
        p_preferred_language: preferred_language,
      });

      if (!rpcErr && rpcResult) {
        return NextResponse.json({ success: true, business: rpcResult });
      }
    }

    // Direct admin creation fallback
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 7);

    const { data: biz, error: bizErr } = await admin
      .from('businesses')
      .insert({
        name,
        slug,
        industry,
        description,
        preferred_language,
        currency_code: 'INR',
        timezone: 'Asia/Kolkata',
      })
      .select()
      .single();

    if (bizErr) {
      return NextResponse.json({ error: bizErr.message }, { status: 500 });
    }

    // Seed free subscription for new business
    const { data: freePlan } = await admin.from('plans').select('id').eq('code', 'free').single();
    if (freePlan && biz) {
      await admin.from('subscriptions').insert({
        business_id: biz.id,
        plan_id: freePlan.id,
        status: 'active',
        provider: 'free_tier',
      });
    }

    return NextResponse.json({ success: true, business: biz });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create business' }, { status: 500 });
  }
}
