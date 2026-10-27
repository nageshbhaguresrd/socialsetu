import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Use admin client for initial seed or fallback if auth session is initializing
    const admin = getSupabaseAdmin();
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('orgId');

    let query = admin
      .from('clients')
      .select(`
        *,
        brand_profile:client_brand_profiles(*),
        accounts:social_accounts(*),
        permissions:client_permissions(*)
      `)
      .order('created_at', { ascending: false });

    if (orgId) {
      query = query.eq('organization_id', orgId);
    }

    const { data: clients, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ clients: clients || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = getSupabaseAdmin();
    const body = await req.json();

    const {
      name,
      business_category,
      description,
      website_url,
      industry,
      target_audience,
      city,
      state,
      preferred_language = 'English',
      brand_voice,
      primary_color = '#FF6B35',
      organization_id,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Client name is required' }, { status: 400 });
    }

    // Auto-create or resolve default organization if not provided
    let finalOrgId = organization_id;
    if (!finalOrgId) {
      const { data: defaultOrg } = await admin
        .from('organizations')
        .select('id')
        .limit(1)
        .single();

      if (defaultOrg) {
        finalOrgId = defaultOrg.id;
      } else {
        const { data: newOrg } = await admin
          .from('organizations')
          .insert({
            name: 'SocialSetu Default Agency',
            slug: 'socialsetu-agency-' + Date.now(),
            plan: 'agency',
          })
          .select('id')
          .single();
        finalOrgId = newOrg?.id;
      }
    }

    // 1. Insert Client Workspace
    const { data: client, error: clientErr } = await admin
      .from('clients')
      .insert({
        organization_id: finalOrgId,
        name: name.trim(),
        business_category,
        description,
        website_url,
        industry,
        target_audience,
        city,
        state,
        preferred_language,
      })
      .select()
      .single();

    if (clientErr || !client) {
      return NextResponse.json({ error: clientErr?.message || 'Failed to create client' }, { status: 500 });
    }

    // 2. Initialize Brand Profile
    await admin.from('client_brand_profiles').insert({
      client_id: client.id,
      brand_voice: brand_voice || 'Professional, energetic, and growth-oriented',
      primary_color: primary_color || '#FF6B35',
      target_keywords: [industry || 'Business', city || 'India'].filter(Boolean),
    });

    // 3. Initialize Default Permissions
    await admin.from('client_permissions').insert({
      client_id: client.id,
      require_post_approval: true,
      require_birthday_approval: true,
      allow_ai_direct_publishing: false,
    });

    return NextResponse.json({ client, success: true }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Internal Server Error' }, { status: 500 });
  }
}
