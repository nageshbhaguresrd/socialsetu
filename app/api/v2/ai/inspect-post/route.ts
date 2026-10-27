import { NextRequest, NextResponse } from 'next/server';
import { aiSocialOrchestrator } from '@/lib/ai/orchestrator';
import { PlatformId } from '@/lib/types/enterprise';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      content,
      platform = 'instagram',
      brandVoice = 'Professional',
      bannedWords = [],
    } = body;

    if (!content) {
      return NextResponse.json({ error: 'content is required' }, { status: 400 });
    }

    const inspection = await aiSocialOrchestrator.inspectPost(
      content,
      platform as PlatformId,
      brandVoice,
      bannedWords
    );

    return NextResponse.json({
      success: true,
      inspection,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Post inspection failed' },
      { status: 500 }
    );
  }
}
