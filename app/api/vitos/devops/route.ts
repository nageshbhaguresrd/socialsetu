import { NextRequest, NextResponse } from 'next/server';
import { devopsEngine } from '@/lib/ai/vitos-devops-engine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, hostUrl, serverName, errorSummary } = body;

    if (action === 'security_scan') {
      const result = await devopsEngine.auditSecurityHeaders(hostUrl || 'https://socialsetu.com');
      return NextResponse.json({ success: true, data: result });
    }

    if (action === 'diagnose_incident') {
      const incident = await devopsEngine.diagnoseIncident(errorSummary || 'HTTP 502 Bad Gateway', hostUrl || 'api.socialsetu.com');
      return NextResponse.json({ success: true, data: incident });
    }

    // Default: Ping server
    const server = await devopsEngine.checkServerHealth(hostUrl || 'https://google.com', serverName || 'Client Production Node');
    return NextResponse.json({ success: true, data: server });
  } catch (error: any) {
    console.error('DevOps Engine Error:', error);
    return NextResponse.json(
      { error: error?.message || 'DevOps execution failure' },
      { status: 500 }
    );
  }
}
