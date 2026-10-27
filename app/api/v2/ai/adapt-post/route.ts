import { NextRequest, NextResponse } from 'next/server';
import { aiSocialOrchestrator } from '@/lib/ai/orchestrator';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { masterText, brandName = 'Brand', brandVoice = 'Professional' } = body;

    if (!masterText) {
      return NextResponse.json({ error: 'masterText is required' }, { status: 400 });
    }

    const result = await aiSocialOrchestrator.adaptPost(masterText, brandName, brandVoice);

    return NextResponse.json({
      success: true,
      variants: result.variants,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Platform adaptation failed' },
      { status: 500 }
    );
  }
}
