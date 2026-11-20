import { NextRequest, NextResponse } from 'next/server';
import { revengEngine } from '@/lib/ai/vitos-reveng-engine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { targetUrl, targetName, category, clientId } = body;

    if (!targetUrl || typeof targetUrl !== 'string') {
      return NextResponse.json({ error: 'targetUrl is required' }, { status: 400 });
    }

    const audit = await revengEngine.auditTarget({
      targetUrl,
      targetName,
      category,
      clientId,
    });

    return NextResponse.json({
      success: true,
      data: audit,
    });
  } catch (error: any) {
    console.error('Reverse Engineering Audit Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to complete reverse engineering audit' },
      { status: 500 }
    );
  }
}
