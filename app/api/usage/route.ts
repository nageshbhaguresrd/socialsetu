import { NextRequest, NextResponse } from 'next/server';
import { AIUsageService } from '@/src/services/aiUsageService';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('business_id');

    if (!businessId) {
      return NextResponse.json({ error: 'business_id is required' }, { status: 400 });
    }

    const summary = await AIUsageService.getUsageSummary(businessId);
    return NextResponse.json(summary);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Error' }, { status: 500 });
  }
}
