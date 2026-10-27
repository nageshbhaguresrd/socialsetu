import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { connectorRegistry } from '@/lib/connectors/registry';
import { PlatformId, PostPayload } from '@/lib/connectors/base';

export async function GET(req: NextRequest) {
  return handlePublisher(req);
}

export async function POST(req: NextRequest) {
  return handlePublisher(req);
}

async function handlePublisher(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-cron-secret-12345';

    // Verify cron authorization (bearer token or query param)
    const url = new URL(req.url);
    const secretParam = url.searchParams.get('secret');

    if (
      authHeader !== `Bearer ${cronSecret}` &&
      secretParam !== cronSecret &&
      process.env.NODE_ENV === 'production'
    ) {
      return NextResponse.json({ error: 'Unauthorized cron runner' }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    const nowIso = new Date().toISOString();

    // Query posts due for publishing
    const { data: duePosts, error: fetchErr } = await admin
      .from('content_posts')
      .select(`
        *,
        client:clients(id, name, timezone)
      `)
      .in('status', ['scheduled', 'approved'])
      .lte('scheduled_at', nowIso)
      .limit(20);

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    if (!duePosts || duePosts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No posts due for publication',
        publishedCount: 0,
      });
    }

    const publishedResults: any[] = [];

    for (const post of duePosts) {
      // Mark as currently publishing to prevent race conditions
      await admin
        .from('content_posts')
        .update({ status: 'publishing' })
        .eq('id', post.id);

      const targetPlatforms = (post.target_platforms || ['instagram']) as PlatformId[];
      const mediaUrls = post.media_urls || [];
      const hashtags = post.hashtags || [];
      const platformVariants = post.platform_variants || {};

      let allSucceeded = true;
      const errors: string[] = [];

      for (const platform of targetPlatforms) {
        if (!connectorRegistry.has(platform)) {
          errors.push(`Connector for ${platform} is not registered`);
          allSucceeded = false;
          continue;
        }

        // Fetch client's connected social account and credentials
        const { data: account } = await admin
          .from('social_accounts')
          .select(`
            *,
            credentials:oauth_credentials(*)
          `)
          .eq('client_id', post.client_id)
          .eq('platform', platform)
          .eq('connection_status', 'connected')
          .single();

        const token =
          account?.credentials?.[0]?.access_token_encrypted ||
          (platform === 'instagram' || platform === 'facebook_page'
            ? process.env.META_GRAPH_ACCESS_TOKEN
            : platform === 'x_twitter'
            ? process.env.TWITTER_BEARER_TOKEN
            : platform === 'youtube'
            ? process.env.YOUTUBE_API_KEY
            : null);

        if (!token) {
          errors.push(`No active access token found for ${platform}`);
          allSucceeded = false;
          continue;
        }

        const connector = connectorRegistry.get(platform);

        // Pick platform-specific variant caption if available
        const caption =
          platformVariants[platform]?.caption || post.primary_caption;
        const platformHashtags =
          platformVariants[platform]?.hashtags || hashtags;

        const payload: PostPayload = {
          caption,
          hashtags: platformHashtags,
          mediaUrls,
          postType: post.post_type || 'post',
        };

        const result = await connector.publishPost(
          {
            accessToken: token,
            scopes: ['publish'],
          },
          payload
        );

        if (!result.success) {
          allSucceeded = false;
          errors.push(`${platform}: ${result.errorMessage || 'Failed to publish'}`);
        }

        // Record entry in published_posts
        await admin.from('published_posts').insert({
          post_id: post.id,
          social_account_id: account?.id || null,
          platform,
          external_post_id: result.externalPostId || null,
          post_url: result.postUrl || null,
          status: result.success ? 'published' : 'failed',
          error_message: result.errorMessage || null,
          published_at: result.success ? new Date().toISOString() : null,
        });
      }

      // Finalize post status
      const finalStatus = allSucceeded ? 'published' : 'failed';
      await admin
        .from('content_posts')
        .update({
          status: finalStatus,
          published_at: allSucceeded ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', post.id);

      // Record in audit log
      await admin.from('audit_logs').insert({
        action: allSucceeded ? 'post_published_cron' : 'post_publishing_partial_failure',
        entity_type: 'content_post',
        entity_id: post.id,
        metadata: {
          clientName: post.client?.name,
          finalStatus,
          errors,
        },
      });

      publishedResults.push({
        postId: post.id,
        client: post.client?.name,
        status: finalStatus,
        errors,
      });
    }

    return NextResponse.json({
      success: true,
      processed: publishedResults.length,
      results: publishedResults,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Publish cron runner failed' },
      { status: 500 }
    );
  }
}
