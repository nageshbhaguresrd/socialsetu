import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface AuditRequestBody {
  clientName: string
  industry: string
  targetAudience: string
  businessGoal: string
  leadId?: string
  platforms: {
    youtube?: string
    instagram?: string
    twitter?: string
    linkedin?: string
    facebook?: string
  }
}

async function processAudit(auditId: string, body: AuditRequestBody) {
  try {
    const { fetchYouTubeData } = await import('@/lib/audit/youtube')
    const { fetchInstagramData } = await import('@/lib/audit/instagram')
    const { fetchTwitterData } = await import('@/lib/audit/twitter')
    const { analyzeAudit } = await import('@/lib/audit/analyzer')

    const [youtube, instagram, twitter] = await Promise.allSettled([
      body.platforms.youtube ? fetchYouTubeData(body.platforms.youtube) : Promise.resolve(undefined),
      body.platforms.instagram ? fetchInstagramData(body.platforms.instagram) : Promise.resolve(undefined),
      body.platforms.twitter ? fetchTwitterData(body.platforms.twitter) : Promise.resolve(undefined),
    ])

    const auditInput = {
      clientName: body.clientName,
      industry: body.industry,
      targetAudience: body.targetAudience,
      businessGoal: body.businessGoal,
      youtube: youtube.status === 'fulfilled' ? youtube.value : undefined,
      instagram: instagram.status === 'fulfilled' ? instagram.value : undefined,
      twitter: twitter.status === 'fulfilled' ? twitter.value : undefined,
    }

    const { report, scores } = await analyzeAudit(auditInput)

    const supabase = await createClient()
    await supabase.from('audits').update({
      report,
      scores,
      status: 'completed',
      updated_at: new Date().toISOString(),
    }).eq('id', auditId)

  } catch (error) {
    console.error('Audit processing failed:', error)
    const supabase = await createClient()
    await supabase.from('audits').update({
      status: 'failed',
      report: { error: String(error) },
      updated_at: new Date().toISOString(),
    }).eq('id', auditId)
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body: AuditRequestBody = await request.json()

    if (!body.clientName?.trim()) {
      return NextResponse.json({ error: 'clientName is required' }, { status: 400 })
    }

    const hasPlatform = Object.values(body.platforms || {}).some(Boolean)
    if (!hasPlatform) {
      return NextResponse.json({ error: 'At least one platform handle is required' }, { status: 400 })
    }

    const { data: audit, error } = await supabase
      .from('audits')
      .insert({
        client_name: body.clientName,
        lead_id: body.leadId || null,
        platforms: body.platforms,
        scores: {},
        report: {},
        status: 'processing',
      })
      .select()
      .single()

    if (error || !audit) {
      return NextResponse.json({ error: 'Failed to create audit' }, { status: 500 })
    }

    processAudit(audit.id, body).catch(console.error)

    return NextResponse.json({ auditId: audit.id, status: 'processing' })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('audits')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}