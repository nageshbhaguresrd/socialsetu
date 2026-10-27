import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { connectorRegistry } from '@/lib/connectors/registry';
import { PlatformId } from '@/lib/types/enterprise';

export async function GET(req: NextRequest) {
  try {
    const admin = getSupabaseAdmin();
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json({ error: 'clientId is required' }, { status: 400 });
    }

    const { data: accounts, error } = await admin
      .from('social_accounts')
      .select(`
        *,
        credentials:oauth_credentials(id, token_type, expires_at, scopes)
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ accounts: accounts || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = getSupabaseAdmin();
    const body = await req.json();
    const {
      clientId,
      platform,
      accountName,
      accountHandle,
      externalAccountId,
      profilePictureUrl,
      accessToken,
    } = body;

    if (!clientId || !platform) {
      return NextResponse.json({ error: 'clientId and platform are required' }, { status: 400 });
    }

    const platformId = platform as PlatformId;

    // If access token is provided directly (e.g. from env or manual entry), verify via connector
    let profileName = accountName;
    let handle = accountHandle;
    let externalId = externalAccountId || `${platform}_${Date.now()}`;
    let avatarUrl = profilePictureUrl;

    if (accessToken && connectorRegistry.has(platformId)) {
      try {
        const connector = connectorRegistry.get(platformId);
        const profile = await connector.getProfile({ accessToken, scopes: [] });
        profileName = profileName || profile.accountName;
        handle = handle || profile.accountHandle;
        externalId = profile.externalId || externalId;
        avatarUrl = avatarUrl || profile.profilePictureUrl;
      } catch (e) {
        console.warn(`[SocialAccount] Connector profile lookup note:`, e);
      }
    }

    // Upsert into social_accounts
    const { data: account, error: accError } = await admin
      .from('social_accounts')
      .upsert(
        {
          client_id: clientId,
          platform: platformId,
          external_account_id: externalId,
          account_name: profileName || `${platform} Account`,
          account_handle: handle,
          profile_picture_url: avatarUrl,
          connection_status: 'connected',
          last_synced_at: new Date().toISOString(),
        },
        { onConflict: 'client_id,platform,external_account_id' }
      )
      .select()
      .single();

    if (accError) {
      return NextResponse.json({ error: accError.message }, { status: 500 });
    }

    // If an access token was provided, save in oauth_credentials
    if (accessToken && account) {
      await admin.from('oauth_credentials').upsert(
        {
          account_id: account.id,
          access_token_encrypted: accessToken,
          scopes: ['publish', 'read_insights'],
        },
        { onConflict: 'account_id' }
      );
    }

    return NextResponse.json({ success: true, account });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to connect account' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = getSupabaseAdmin();
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('id');

    if (!accountId) {
      return NextResponse.json({ error: 'Account id is required' }, { status: 400 });
    }

    const { error } = await admin
      .from('social_accounts')
      .update({ connection_status: 'disconnected' })
      .eq('id', accountId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Account disconnected successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to disconnect account' }, { status: 500 });
  }
}
