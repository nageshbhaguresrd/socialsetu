import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const admin = getSupabaseAdmin();
    const body = await req.json();
    const { action, feedback } = body; // action: 'approve' | 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be either "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Fetch existing post
    const { data: post, error: postErr } = await admin
      .from('content_posts')
      .select('*')
      .eq('id', id)
      .single();

    if (postErr || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const newStatus =
      action === 'approve'
        ? post.scheduled_at
          ? 'scheduled'
          : 'approved'
        : 'rejected';

    // Update post status
    const { data: updatedPost, error: updateErr } = await admin
      .from('content_posts')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Update approval_requests table
    await admin
      .from('approval_requests')
      .update({
        status: action === 'approve' ? 'approved' : 'rejected',
        notes: feedback || null,
        responded_at: new Date().toISOString(),
      })
      .eq('post_id', id);

    // Record audit trail
    await admin.from('audit_logs').insert({
      action: action === 'approve' ? 'post_approved' : 'post_rejected',
      entity_type: 'content_post',
      entity_id: id,
      metadata: { feedback, newStatus },
    });

    return NextResponse.json({
      success: true,
      post: updatedPost,
      message: `Post ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Approval action failed' },
      { status: 500 }
    );
  }
}
