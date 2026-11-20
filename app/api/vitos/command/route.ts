import { NextRequest, NextResponse } from 'next/server';
import { ceoOrchestrator } from '@/lib/ai/vitos-ceo-orchestrator';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { command, clientId, projectId } = body;

    if (!command || typeof command !== 'string' || command.trim().length === 0) {
      return NextResponse.json({ error: 'Command text is required' }, { status: 400 });
    }

    const result = await ceoOrchestrator.processCommand(
      command.trim(),
      clientId || 'client-default-01',
      projectId
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('CEO Command Processing Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process command' },
      { status: 500 }
    );
  }
}
