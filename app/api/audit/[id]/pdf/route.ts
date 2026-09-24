import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateAuditPDF } from '@/lib/audit/generate'

async function handlePdfDownload(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('audits')
    .select('*')
    .or(`id.eq.${id},share_id.eq.${id}`)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Audit not found' }, { status: 404 })
  }

  const report = typeof data.report === 'string' ? JSON.parse(data.report) : (data.report || {})

  const pdfBuffer = await generateAuditPDF({
    clientName: data.client_name,
    report,
    generatedAt: data.updated_at,
    rawMetrics: data.raw_metrics,
  })

  const filename = `SocialSetu-Audit-${data.client_name.replace(/[^a-z0-9]/gi, '-')}.pdf`

  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    return await handlePdfDownload(id)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'PDF generation failed' }, { status: 500 })
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    return await handlePdfDownload(id)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'PDF generation failed' }, { status: 500 })
  }
}