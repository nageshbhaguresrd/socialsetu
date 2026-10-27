import { NextRequest, NextResponse } from 'next/server';
import { connectorRegistry } from '@/lib/connectors/registry';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { PlatformId } from '@/lib/types/enterprise';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ platform: string }> }
) {
  try {
    const { platform } = await context.params;
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const errorParam = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    const origin = req.nextUrl.origin || process.env.APP_URL || 'http://localhost:3000';

    if (errorParam) {
      return NextResponse.redirect(
        `${origin}/crm?error=${encodeURIComponent(errorDescription || errorParam)}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(`${origin}/crm?error=Missing+authorization+code+or+state`);
    }

    let parsedState: { clientId: string } = { clientId: '' };
    try {
      parsedState = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
    } catch {
      return NextResponse.redirect(`${origin}/crm?error=Invalid+OAuth+state+parameter`);
    }

    const { clientId } = parsedState;
    if (!clientId) {
      return NextResponse.redirect(`${origin}/crm?error=Client+ID+not+found+in+state`);
    }

    const platformId = platform as PlatformId;
    if (!connectorRegistry.has(platformId)) {
      return NextResponse.redirect(`${origin}/crm?error=Unsupported+platform+callback`);
    }

    const connector = connectorRegistry.get(platformId);
    const redirectUri = `${origin}/api/v2/social-accounts/callback/${platform}`;

    // Exchange code for tokens
    const tokens = await connector.exchangeCode(code, redirectUri);

    // Fetch user profile from connector
    const profile = await connector.getProfile(tokens);

    const admin = getSupabaseAdmin();

    // 1. Upsert into social_accounts
    const { data: account, error: accError } = await admin
      .from('social_accounts')
      .upsert(
        {
          client_id: clientId,
          platform: platformId,
          external_account_id: profile.externalId,
          account_name: profile.accountName,
          account_handle: profile.accountHandle,
          profile_picture_url: profile.profilePictureUrl,
          connection_status: 'connected',
          last_synced_at: new Date().toISOString(),
        },
        { onConflict: 'client_id,platform,external_account_id' }
      )
      .select()
      .single();

    if (accError) {
      return NextResponse.redirect(
        `${origin}/crm?error=${encodeURIComponent(accError.message)}`
      );
    }

    // 2. Save tokens in oauth_credentials
    if (account) {
      await admin.from('oauth_credentials').upsert(
        {
          account_id: account.id,
          access_token_encrypted: tokens.accessToken,
          refresh_token_encrypted: tokens.refreshToken || null,
          token_secret: tokens.tokenSecret || null,
          expires_at: tokens.expiresAt || null,
          scopes: tokens.scopes || [],
        },
        { onConflict: 'account_id' }
      );
    }

    // Redirect to CRM with success notice
    return NextResponse.redirect(
      `${origin}/crm?client_id=${clientId}&connected=${platform}&status=success`
    );
  } catch (err: any) {
    const origin = req.nextUrl.origin || process.env.APP_URL || 'http://localhost:3000';
    return NextResponse.redirect(
      `${origin}/crm?error=${encodeURIComponent(err.message || 'OAuth callback failed')}`
    );
  }
}
