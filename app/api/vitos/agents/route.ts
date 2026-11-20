import { NextResponse } from 'next/server';
import { AI_EMPLOYEES_REGISTRY, AI_DEPARTMENTS } from '@/lib/ai/vitos-registry';

export async function GET() {
  return NextResponse.json({
    success: true,
    count: AI_EMPLOYEES_REGISTRY.length,
    agents: AI_EMPLOYEES_REGISTRY,
    departments: AI_DEPARTMENTS,
  });
}
