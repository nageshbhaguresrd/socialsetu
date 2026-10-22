import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sendTelegramAuditAlert } from '@/lib/notifications/telegram'

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
    website?: string
  }
}


// Timeout constants (milliseconds)
const PLATFORM_FETCH_TIMEOUT = 15_000 // 15 seconds per platform
const AI_ANALYSIS_TIMEOUT = 45_000 // 45 seconds for AI
const TOTAL_AUDIT_TIMEOUT = 90_000 // 90 seconds total

/**
 * Create a promise that rejects after a timeout.
 */
function timeoutPromise(ms: number, message: string): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Timeout: ${message} after ${ms}ms`))
    }, ms)
  })
}

/**
 * Fetch with timeout wrapper.
 */
async function fetchWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string
): Promise<T> {
  return Promise.race([
    promise,
    timeoutPromise(timeoutMs, label)
  ])
}

/**
 * Log with timestamp and audit context.
 */
function logAudit(message: string, auditId?: string, data?: unknown) {
  const timestamp = new Date().toISOString()
  const prefix = auditId ? `[${auditId}]` : ''
  console.log(`[AUDIT ${timestamp}] ${prefix} ${message}`, data ?? '')
}

/**
 * Process audit with proper timeouts and error handling.
 * This function is now awaited, not fire-and-forget.
 */
async function processAudit(auditId: string, body: AuditRequestBody): Promise<void> {
  const supabase = getSupabaseAdmin()
  
  logAudit('Started processing', auditId)
  
  try {
    // Wrap entire process in global timeout
    await Promise.race([
      doProcessAudit(auditId, body),
      timeoutPromise(TOTAL_AUDIT_TIMEOUT, 'total audit processing')
    ])
  } catch (error) {
    logAudit('Processing failed', auditId, { error: String(error), stack: (error as Error).stack })
    
    // Always update status to failed on any error
    await supabase.from('audits').update({
      status: 'failed',
      report: {
        error: (error as Error).message || String(error),
        stack: (error as Error).stack,
        timestamp: new Date().toISOString()
      },
      updated_at: new Date().toISOString(),
    }).eq('id', auditId)
    
    logAudit('Marked as failed', auditId)
  }
}

/**
 * Actual audit processing logic.
 */
async function doProcessAudit(auditId: string, body: AuditRequestBody): Promise<void> {
  const supabase = getSupabaseAdmin()
  
  try {
    // Import data fetchers
    logAudit('Importing modules', auditId)
    const { fetchYouTubeData } = await import('@/lib/audit/youtube')
    const { fetchInstagramData } = await import('@/lib/audit/instagram')
    const { fetchTwitterData } = await import('@/lib/audit/twitter')
    const { fetchLinkedInData } = await import('@/lib/audit/linkedin')
    const { fetchFacebookData } = await import('@/lib/audit/facebook')
    const { fetchWebsiteSEOData } = await import('@/lib/audit/website')
    const { analyzeAudit } = await import('@/lib/audit/analyzer')
    
    logAudit('Fetching platform data', auditId)
    
    // Fetch all platform data concurrently with individual timeouts
    const [youtube, instagram, twitter, linkedin, facebook, website] = await Promise.allSettled([
      body.platforms.youtube 
        ? fetchWithTimeout(fetchYouTubeData(body.platforms.youtube), PLATFORM_FETCH_TIMEOUT, 'YouTube data fetch')
        : Promise.resolve(undefined),
      body.platforms.instagram 
        ? fetchWithTimeout(fetchInstagramData(body.platforms.instagram), PLATFORM_FETCH_TIMEOUT, 'Instagram data fetch')
        : Promise.resolve(undefined),
      body.platforms.twitter 
        ? fetchWithTimeout(fetchTwitterData(body.platforms.twitter), PLATFORM_FETCH_TIMEOUT, 'Twitter data fetch')
        : Promise.resolve(undefined),
      body.platforms.linkedin
        ? fetchWithTimeout(fetchLinkedInData(body.platforms.linkedin), PLATFORM_FETCH_TIMEOUT, 'LinkedIn data fetch')
        : Promise.resolve(undefined),
      body.platforms.facebook
        ? fetchWithTimeout(fetchFacebookData(body.platforms.facebook), PLATFORM_FETCH_TIMEOUT, 'Facebook data fetch')
        : Promise.resolve(undefined),
      body.platforms.website
        ? fetchWithTimeout(fetchWebsiteSEOData(body.platforms.website), PLATFORM_FETCH_TIMEOUT, 'Website SEO fetch')
        : Promise.resolve(undefined),
    ])
    
    // Log any platform fetch failures but continue
    const platformResults: Record<string, { status: string; reason?: string }> = {
      youtube: youtube.status,
      instagram: instagram.status,
      twitter: twitter.status,
      linkedin: linkedin.status,
      facebook: facebook.status,
      website: website.status,
    }
    for (const [platform, result] of Object.entries({ youtube, instagram, twitter, linkedin, facebook, website })) {
      if ((result as PromiseRejectedResult).status === 'rejected') {
        logAudit(`${platform} fetch failed`, auditId, { error: (result as PromiseRejectedResult).reason })
      }
    }
    logAudit('Platform fetch results', auditId, platformResults)
    
    // Build audit input from successful fetches only
    const auditInput = {
      clientName: body.clientName,
      industry: body.industry || 'Digital Creator',
      targetAudience: body.targetAudience,
      businessGoal: body.businessGoal,
      youtube: youtube.status === 'fulfilled' ? youtube.value : undefined,
      instagram: instagram.status === 'fulfilled' ? instagram.value : undefined,
      twitter: twitter.status === 'fulfilled' ? twitter.value : undefined,
      linkedin: linkedin.status === 'fulfilled' ? linkedin.value : undefined,
      facebook: facebook.status === 'fulfilled' ? facebook.value : undefined,
      website: website.status === 'fulfilled' ? website.value : undefined,
    }
    
    logAudit('Running AI analysis', auditId, { 
      hasYoutube: !!auditInput.youtube && !(auditInput.youtube as any)?.error,
      hasInstagram: !!auditInput.instagram && !(auditInput.instagram as any)?.error,
      hasTwitter: !!auditInput.twitter && !(auditInput.twitter as any)?.error,
      hasLinkedIn: !!auditInput.linkedin && !(auditInput.linkedin as any)?.error,
      hasFacebook: !!auditInput.facebook && !(auditInput.facebook as any)?.error,
      hasWebsite: !!auditInput.website && !(auditInput.website as any)?.error,
    })
    
    // Run analysis with timeout
    const { report, scores, rawMetrics } = await fetchWithTimeout(
      analyzeAudit(auditInput),
      AI_ANALYSIS_TIMEOUT,
      'AI analysis'
    )
    
    logAudit('AI analysis completed', auditId, { 
      overallScore: report.overallScore,
      platformCount: Object.keys(report.platforms || {}).length
    })
    
    // Save completed audit
    logAudit('Saving report to database', auditId)
    const { error: updateError } = await supabase.from('audits').update({
      report,
      scores,
      raw_metrics: rawMetrics,
      status: 'completed',
      updated_at: new Date().toISOString(),
    }).eq('id', auditId)
    
    if (updateError) {
      throw new Error(`Database update failed: ${updateError.message}`)
    }
    
    logAudit('Audit completed successfully', auditId)

    sendTelegramAuditAlert({
      clientName: body.clientName,
      auditId,
      overallScore: report?.overallScore,
      platforms: body.platforms,
    }).catch(console.error)
  } catch (error) {
    // Re-throw to be caught by processAudit wrapper
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();

    const body: AuditRequestBody = await request.json()

    if (!body.clientName?.trim()) {
      return NextResponse.json({ error: 'clientName is required' }, { status: 400 })
    }

    const hasPlatform = Object.values(body.platforms || {}).some(Boolean)
    if (!hasPlatform) {
      return NextResponse.json({ error: 'At least one platform handle is required' }, { status: 400 })
    }

    // Create audit record
    const { data: audit, error: insertError } = await supabase
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
      .single();
      console.debug('✅ Audit inserted:', audit);

    if (insertError || !audit) {
      return NextResponse.json(
        {
          error: 'Failed to create audit',
          details: insertError?.message || 'No audit row returned from insert',
        },
        { status: 500 }
      )
    }

    // IMPORTANT: Await the audit processing instead of fire-and-forget
    // This ensures the serverless function stays alive until processing completes
    await processAudit(audit.id, body)

    // Fetch updated status after processing
    const { data: updatedAudit } = await supabase
      .from('audits')
      .select('status, report')
      .eq('id', audit.id)
      .single()

    return NextResponse.json({
      auditId: audit.id,
      status: updatedAudit?.status || 'processing',
      report: updatedAudit?.report,
    })
  } catch (error) {
    console.error('Audit POST failed:', error)
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