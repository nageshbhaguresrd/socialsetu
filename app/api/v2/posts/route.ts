import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { PostStatus, PlatformId } from '@/lib/types/enterprise';

export async function GET(req: NextRequest) {
  try {
    const admin = getSupabaseAdmin();
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const status = searchParams.get('status') as PostStatus | null;
    const platform = searchParams.get('platform') as PlatformId | null;

    if (!clientId) {
      return NextResponse.json({ error: 'clientId is required' }, { status: 400 });
    }

    let query = admin
      .from('content_posts')
      .select(`
        *,
        client:clients(name, timezone),
        approvals:approval_requests(*)
      `)
      .eq('client_id', clientId)
      .order('scheduled_at', { ascending: true, nullsFirst: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (platform) {
      query = query.contains('target_platforms', [platform]);
    }

    const { data: posts, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ posts: posts || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = getSupabaseAdmin();
    const body = await req.json();

    const {
      clientId,
      primaryCaption,
      headline,
      postType = 'post',
      targetPlatforms = ['instagram'],
      mediaUrls = [],
      hashtags = [],
      scheduledAt,
      publishImmediately = false,
      platformVariants = {},
    } = body;

    if (!clientId || !primaryCaption) {
      return NextResponse.json(
        { error: 'clientId and primaryCaption are required' },
        { status: 400 }
      );
    }

    // Check client approval requirements
    const { data: permissions } = await admin
      .from('client_permissions')
      .select('require_approval_all_posts')
      .eq('client_id', clientId)
      .single();

    const requiresApproval = permissions?.require_approval_all_posts !== false;

    let initialStatus: PostStatus = 'draft';
    if (publishImmediately) {
      initialStatus = requiresApproval ? 'pending_approval' : 'publishing';
    } else if (scheduledAt) {
      initialStatus = requiresApproval ? 'pending_approval' : 'scheduled';
    }

    const { data: post, error } = await admin
      .from('content_posts')
      .insert({
        client_id: clientId,
        headline,
        post_type: postType,
        primary_caption: primaryCaption,
        target_platforms: targetPlatforms,
        platform_variants: platformVariants,
        media_urls: mediaUrls,
        hashtags,
        scheduled_at: scheduledAt || null,
        status: initialStatus,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If requires approval, record in approval_requests
    if (requiresApproval && (scheduledAt || publishImmediately)) {
      await admin.from('approval_requests').insert({
        post_id: post.id,
        status: 'pending',
      });
    }

    // Log in audit log
    await admin.from('audit_logs').insert({
      action: 'post_created',
      entity_type: 'content_post',
      entity_id: post.id,
      metadata: { initialStatus, targetPlatforms, scheduledAt },
    });

    return NextResponse.json({ success: true, post });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create post' }, { status: 500 });
  }
}
