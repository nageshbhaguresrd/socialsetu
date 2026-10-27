import { NextRequest, NextResponse } from 'next/server';
import { connectorRegistry } from '@/lib/connectors/registry';
import { PlatformId } from '@/lib/types/enterprise';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ platform: string }> }
) {
  try {
    const { platform } = await context.params;
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json({ error: 'clientId query parameter is required' }, { status: 400 });
    }

    const platformId = platform as PlatformId;
    if (!connectorRegistry.has(platformId)) {
      return NextResponse.json(
        { error: `Platform ${platform} is not supported or registered` },
        { status: 400 }
      );
    }

    const connector = connectorRegistry.get(platformId);
    const origin = req.nextUrl.origin || process.env.APP_URL || 'http://localhost:3000';
    const redirectUri = `${origin}/api/v2/social-accounts/callback/${platform}`;

    // State payload encodes clientId and anti-forgery timestamp
    const statePayload = Buffer.from(
      JSON.stringify({ clientId, timestamp: Date.now() })
    ).toString('base64');

    const authUrl = await connector.getAuthUrl(statePayload, redirectUri);

    // Can either redirect directly or return the authUrl for frontend popups
    if (searchParams.get('format') === 'json') {
      return NextResponse.json({ authUrl, redirectUri });
    }

    return NextResponse.redirect(authUrl);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'OAuth init failed' }, { status: 500 });
  }
}
