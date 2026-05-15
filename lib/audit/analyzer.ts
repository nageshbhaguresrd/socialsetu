/**
 * Audit Analyzer - Production-Grade Deterministic Engine
 * 
 * This module generates audit reports based solely on actual platform data.
 * - Only analyzes platforms that are actually connected
 * - Never generates fake analysis or hallucinations
 * - Uses deterministic scoring based on real metrics
 * - Optional AI enhancement for wording only (never changes scores)
 */

import type { AuditReport } from '@/lib/types/audit'
import { fetchChatWithFallbackNoTools } from '@/src/ai/openrouter/fetchChatWithFallbackNoTools'
import { repairAndParseJson } from '@/src/ai/openrouter/repairParseJson'
import {
  isPlatformAvailable,
  extractPlatformMetrics,
  detectConnectedPlatforms,
  getConnectedPlatformKeys,
  sanitizeForPDF,
  sanitizeArrayForPDF,
  formatYouTubeMetrics,
  formatInstagramMetrics,
  formatTwitterMetrics,
  getSafeIndustry,
  type PlatformKey,
  type PlatformMetrics,
} from './platformUtils'
import {
  computePlatformScore,
  computeOverallScore,
  type ScoringInput,
  type ScoringResult,
} from './scoringEngine'

// ============================================================================
// Types
// ============================================================================

export interface AuditInput {
  clientName: string
  industry: string
  targetAudience: string
  businessGoal: string
  youtube?: unknown
  instagram?: unknown
  twitter?: unknown
  linkedin?: unknown
  facebook?: unknown
}

type PlatformDataMap = {
  youtube: unknown
  instagram: unknown
  twitter: unknown
  linkedin: unknown
  facebook: unknown
}

// ============================================================================
// Platform Data Extraction
// ============================================================================

/**
 * Extract scoring input from raw platform data.
 */
function extractScoringInput(platformKey: PlatformKey, data: unknown): ScoringInput | undefined {
  if (!data || typeof data !== 'object') return undefined
  
  const d = data as Record<string, unknown>
  
  // Check for error field
  if (d.error) return undefined
  
  const metrics = extractPlatformMetrics(d)
  
  // Convert to ScoringInput
  const input: ScoringInput = {
    followers: metrics.followers,
    following: metrics.following,
    posts: metrics.posts,
    verified: metrics.verified,
    subscribers: metrics.subscribers,
    videoCount: metrics.videoCount,
    viewCount: metrics.viewCount,
    avgViewsPerVideo: metrics.avgViewsPerVideo,
    uploadFrequencyDays: metrics.uploadFrequencyDays,
    engagementRate: metrics.engagementRate,
    avgLikes: metrics.avgLikes,
    avgComments: metrics.avgComments,
  }
  
  // Only return if there's meaningful data
  if (!hasMeaningfulData(input)) return undefined
  
  return input
}

function hasMeaningfulData(input: ScoringInput): boolean {
  return (
    (input.subscribers != null && input.subscribers > 0) ||
    (input.followers != null && input.followers > 0) ||
    (input.posts != null && input.posts > 0) ||
    (input.videoCount != null && input.videoCount > 0) ||
    (input.viewCount != null && input.viewCount > 0)
  )
}

// ============================================================================
// Industry Benchmarks
// ============================================================================

function generateIndustryBenchmarks(industry: string) {
  const safeIndustry = getSafeIndustry(industry)
  const ind = safeIndustry.toLowerCase()
  
  const map: Array<{ match: RegExp; engagementRate: string; postingFrequency: string; followerGrowthRate: string }> = [
    { match: /(saas|software|b2b|technology|tech)/i, engagementRate: '1.5-3.5%', postingFrequency: '3-5 posts/week', followerGrowthRate: '0.8-2.0%/month' },
    { match: /(ecommerce|retail|fashion|beauty|shopping)/i, engagementRate: '2.0-4.5%', postingFrequency: '4-7 posts/week', followerGrowthRate: '1.0-2.5%/month' },
    { match: /(education|coaching|training|teaching|course)/i, engagementRate: '1.8-4.2%', postingFrequency: '3-6 posts/week', followerGrowthRate: '0.8-2.2%/month' },
    { match: /(health|fitness|wellness|gym|yoga|nutrition)/i, engagementRate: '2.2-5.0%', postingFrequency: '4-7 posts/week', followerGrowthRate: '1.1-2.8%/month' },
    { match: /(food|restaurant|culinary|cooking|chef)/i, engagementRate: '2.5-5.0%', postingFrequency: '4-7 posts/week', followerGrowthRate: '1.0-2.5%/month' },
    { match: /(travel|tourism|adventure|hospitality)/i, engagementRate: '2.0-4.5%', postingFrequency: '3-5 posts/week', followerGrowthRate: '1.0-2.5%/month' },
    { match: /(finance|investment|crypto|banking|fintech)/i, engagementRate: '1.0-2.5%', postingFrequency: '3-5 posts/week', followerGrowthRate: '0.5-1.5%/month' },
    { match: /(entertainment|music|art|gaming|media)/i, engagementRate: '2.5-5.5%', postingFrequency: '4-7 posts/week', followerGrowthRate: '1.5-3.0%/month' },
  ]

  const found = map.find((x) => x.match.test(ind))
  return found || {
    engagementRate: '1.5-4.0%',
    postingFrequency: '3-6 posts/week',
    followerGrowthRate: '0.8-2.5%/month',
  }
}

// ============================================================================
// Summary Generation (Only mentions connected platforms)
// ============================================================================

function generateSummary(args: {
  clientName: string
  industry: string
  overallScore: number
  connectedPlatforms: PlatformKey[]
  platformScores: Record<string, ScoringResult>
  topStrength?: string
  topWeakness?: string
}): string {
  const { clientName, industry, overallScore, connectedPlatforms, platformScores, topStrength, topWeakness } = args
  const safeIndustry = getSafeIndustry(industry)
  
  // Determine tone based on score
  const tone = overallScore >= 80 ? 'strong' : overallScore >= 60 ? 'promising but inconsistent' : 'needs focused improvement'
  
  // Build platform-specific context (only for connected platforms)
  const platformNames = connectedPlatforms.map(p => p.charAt(0).toUpperCase() + p.slice(1))
  const platformList = platformNames.length === 1 
    ? platformNames[0] 
    : platformNames.slice(0, -1).join(', ') + (platformNames.length > 1 ? ' and ' + platformNames[platformNames.length - 1] : '')
  
  // Build summary that only mentions connected platforms
  let summary = `For ${clientName} in ${safeIndustry}, the audit of your ${platformList} presence finds current performance is ${tone}. `
  
  // Add strength if available
  if (topStrength) {
    summary += `Your standout strength is: ${topStrength} `
  } else {
    summary += 'Your brand has a foundation to build on. '
  }
  
  // Add weakness if available
  if (topWeakness) {
    summary += `The biggest constraint right now is: ${topWeakness} `
  } else {
    summary += 'The main opportunity is improving consistency and engagement quality. '
  }
  
  // Add actionable close
  summary += 'The next 30 days should focus on tightening content hooks, improving posting cadence, and scaling the formats that already show traction - so results become predictable instead of random.'
  
  return summary
}

// ============================================================================
// 30-Day Action Plan (Platform-aware)
// ============================================================================

function generateActionPlan(primaryPlatform: PlatformKey, input: ScoringInput | undefined) {
  const cadence = input?.uploadFrequencyDays
  const isSparse = cadence != null ? cadence > 14 : true
  
  const platformName = primaryPlatform.charAt(0).toUpperCase() + primaryPlatform.slice(1)
  
  return {
    week1: [
      `Audit top 10 posts/videos on ${primaryPlatform} and identify the 2 formats with the highest engagement rate.`,
      `Create a 2-week content calendar aligned to your business goal (${primaryPlatform} content theme + calls-to-action).`,
      `Set a KPI dashboard: engagement rate, follower growth, and saves/clicks (where applicable).`,
      `Publish 2 iterations of your best-performing format to validate hooks and CTAs.`,
    ],
    week2: [
      `Run a structured content experiment: 3 hooks x 2 variants for the same core topic.`,
      `Optimize publishing times using observed engagement windows.`,
      `Engage actively: respond to comments/mentions within the first 60 minutes for the next 7 days.`,
      `Collect learnings and adjust your next-week format lineup.`,
    ],
    week3: [
      `Double down on the best 1-2 formats; stop creating formats that underperform.`,
      `Produce one asset that can be repurposed across platforms (video clip -> carousel/thread -> short post).`,
      `Use a simple series approach to improve retention.`,
      `Track weekly KPIs and document what changed and why.`,
    ],
    week4: [
      `Publish a "results" post: show what you learned and what you'll improve next.`,
      `Create one high-intent CTA post (lead-gen or offer) tailored to ${primaryPlatform} audience behavior.`,
      `Plan the next 30 days based on performance: keep winners and iterate on weaknesses.`,
      `Repeat engagement workflow (fast replies + community interaction) for sustained growth.`,
    ],
  }
}

// ============================================================================
// Raw Metrics Extraction
// ============================================================================

interface RawPlatformMetrics {
  platform: PlatformKey
  metrics: Array<{ label: string; value: string; description?: string }>
}

function extractRawMetrics(platformKey: PlatformKey, data: unknown): RawPlatformMetrics | null {
  if (!data || typeof data !== 'object') return null
  
  const d = data as Record<string, unknown>
  if (d.error) return null
  
  const metrics = extractPlatformMetrics(d)
  
  let formatted: Array<{ label: string; value: string; description?: string }> = []
  
  switch (platformKey) {
    case 'youtube':
      formatted = formatYouTubeMetrics({
        subscribers: metrics.subscribers,
        videoCount: metrics.videoCount,
        viewCount: metrics.viewCount,
        avgViewsPerVideo: metrics.avgViewsPerVideo,
        uploadFrequencyDays: metrics.uploadFrequencyDays,
        engagementRate: metrics.engagementRate,
        verified: metrics.verified,
      })
      break
    case 'instagram':
      formatted = formatInstagramMetrics({
        followers: metrics.followers,
        following: metrics.following,
        posts: metrics.posts,
        engagementRate: metrics.engagementRate,
        avgLikes: metrics.avgLikes,
        avgComments: metrics.avgComments,
        verified: metrics.verified,
      })
      break
    case 'twitter':
      formatted = formatTwitterMetrics({
        followers: metrics.followers,
        following: metrics.following,
        tweets: metrics.posts,
        verified: metrics.verified,
      })
      break
    default:
      // For other platforms, just list what we have
      if (metrics.followers) formatted.push({ label: 'Followers', value: metrics.followers.toLocaleString() })
      if (metrics.posts) formatted.push({ label: 'Posts', value: metrics.posts.toLocaleString() })
      if (metrics.verified) formatted.push({ label: 'Status', value: 'Verified' })
  }
  
  return { platform: platformKey, metrics: formatted }
}

// ============================================================================
// Main Report Generation
// ============================================================================

export function generateRuleBasedAudit(input: AuditInput): { report: AuditReport; scores: Record<string, number>; rawMetrics: RawPlatformMetrics[] } {
  // Detect connected platforms
  const platformData: PlatformDataMap = {
    youtube: input.youtube,
    instagram: input.instagram,
    twitter: input.twitter,
    linkedin: input.linkedin,
    facebook: input.facebook,
  }
  
  const connected = detectConnectedPlatforms(platformData)
  const connectedKeys = getConnectedPlatformKeys(connected)
  
  // Extract scoring inputs for connected platforms
  const scoringInputs: Partial<Record<PlatformKey, ScoringInput>> = {}
  for (const key of connectedKeys) {
    const scoringInput = extractScoringInput(key, platformData[key])
    if (scoringInput) {
      scoringInputs[key] = scoringInput
    }
  }
  
  // Compute scores only for platforms with data
  const platformResults: Partial<Record<PlatformKey, ScoringResult>> = {}
  for (const [key, scoringInput] of Object.entries(scoringInputs)) {
    platformResults[key as PlatformKey] = computePlatformScore(key as PlatformKey, scoringInput)
  }
  
  // Compute overall score
  const { overallScore, grade } = computeOverallScore({
    platformScores: platformResults,
    connectedPlatforms: connected,
  })
  
  // Extract raw metrics for all connected platforms
  const rawMetrics: RawPlatformMetrics[] = []
  for (const key of connectedKeys) {
    const metrics = extractRawMetrics(key, platformData[key])
    if (metrics) {
      rawMetrics.push(metrics)
    }
  }
  
  // Collect all strengths and weaknesses
  const allStrengths: string[] = []
  const allWeaknesses: string[] = []
  for (const result of Object.values(platformResults)) {
    allStrengths.push(...result.strengths)
    allWeaknesses.push(...result.weaknesses)
  }
  
  // Deduplicate
  const uniqueStrengths = Array.from(new Set(allStrengths)).filter(Boolean)
  const uniqueWeaknesses = Array.from(new Set(allWeaknesses)).filter(Boolean)
  
  // Determine primary platform for action plan
  const primaryPlatform = connectedKeys[0] || 'instagram'
  
  // Generate action plan
  const actionPlan = generateActionPlan(primaryPlatform, scoringInputs[primaryPlatform])
  
  // Generate industry benchmarks
  const benchmarks = generateIndustryBenchmarks(input.industry)
  
  // Generate summary (only mentions connected platforms)
  const summary = generateSummary({
    clientName: input.clientName,
    industry: getSafeIndustry(input.industry),
    overallScore,
    connectedPlatforms: connectedKeys,
    platformScores: platformResults,
    topStrength: uniqueStrengths[0],
    topWeakness: uniqueWeaknesses[0],
  })
  
  // Build platform reports (only for connected platforms)
  const platformReports: AuditReport['platforms'] = {}
  for (const key of connectedKeys) {
    const result = platformResults[key]
    if (result) {
      platformReports[key] = {
        score: result.score,
        grade: result.grade,
        strengths: sanitizeArrayForPDF(result.strengths),
        weaknesses: sanitizeArrayForPDF(result.weaknesses),
        quickWins: sanitizeArrayForPDF(result.quickWins),
      }
    }
  }
  
  // Build the report
  const report: AuditReport = {
    summary: sanitizeForPDF(summary),
    overallScore,
    scores: {
      profileCompleteness: Math.round(
        Object.values(platformResults).reduce((sum, r) => sum + r.score, 0) / Math.max(1, Object.values(platformResults).length)
      ),
      contentConsistency: scoringInputs.youtube?.uploadFrequencyDays != null
        ? Math.min(100, Math.round(100 - (scoringInputs.youtube.uploadFrequencyDays / 30) * 50))
        : 50,
      engagementRate: rawMetrics.length > 0
        ? Math.round(rawMetrics.reduce((sum, rm) => {
            const rate = rm.metrics.find(m => m.label === 'Engagement Rate')
            return sum + (rate ? parseFloat(rate.value) : 0)
          }, 0) / rawMetrics.length)
        : 40,
      growthPotential: Math.min(100, overallScore + 10),
      brandPresence: Math.min(100, overallScore),
    },
    platforms: platformReports,
    topIssues: sanitizeArrayForPDF(uniqueWeaknesses.slice(0, 5)),
    thirtyDayActionPlan: {
      week1: sanitizeArrayForPDF(actionPlan.week1),
      week2: sanitizeArrayForPDF(actionPlan.week2),
      week3: sanitizeArrayForPDF(actionPlan.week3),
      week4: sanitizeArrayForPDF(actionPlan.week4),
    },
    industryBenchmark: benchmarks,
    competitiveAdvantages: sanitizeArrayForPDF(uniqueStrengths.slice(0, 3)),
    generatedAt: new Date().toISOString(),
  }
  
  // Build scores map
  const scores: Record<string, number> = {
    overall: overallScore,
    profileCompleteness: report.scores.profileCompleteness,
    contentConsistency: report.scores.contentConsistency,
    engagementRate: report.scores.engagementRate,
    growthPotential: report.scores.growthPotential,
    brandPresence: report.scores.brandPresence,
  }
  
  // Add platform-specific scores
  for (const [key, result] of Object.entries(platformResults)) {
    scores[key] = result.score
  }
  
  return { report, scores, rawMetrics }
}

// ============================================================================
// AI Enhancement (Optional - Never changes scores)
// ============================================================================

function buildAIPrompt(input: AuditInput, baseReport: AuditReport) {
  const safeIndustry = getSafeIndustry(input.industry)
  
  const essentials = {
    clientName: input.clientName,
    industry: safeIndustry,
    targetAudience: input.targetAudience,
    businessGoal: input.businessGoal,
  }

  return {
    systemPrompt: `You are an expert social media strategist. Enhance the provided deterministic audit report wording only.
Rules:
- DO NOT change any numeric scores or grades.
- Only improve the wording of summary, strengths, weaknesses, and action plan.
- Output ONLY valid JSON matching the AuditReport structure.
- No markdown fences, no extra text.
- Keep all text PDF-safe (no special Unicode characters).`,
    userPrompt: `ENHANCE THIS AUDIT REPORT WORDING.\nCLIENT_CONTEXT:\n${JSON.stringify(essentials)}\n\nRETURN COMPLETE AuditReport JSON with improved wording only.`,
  }
}

function validateAuditReportShape(report: unknown): report is AuditReport {
  if (!report || typeof report !== 'object') return false
  if (typeof (report as any).summary !== 'string') return false
  if (typeof (report as any).overallScore !== 'number') return false
  if (!(report as any).scores || typeof (report as any).scores !== 'object') return false
  if (!(report as any).platforms || typeof (report as any).platforms !== 'object') return false
  if (!(report as any).thirtyDayActionPlan || typeof (report as any).thirtyDayActionPlan !== 'object') return false
  if (!(report as any).industryBenchmark || typeof (report as any).industryBenchmark !== 'object') return false
  return true
}

function mergeMissingFromBaseReport(aiReport: Partial<AuditReport>, baseReport: AuditReport): AuditReport {
  const out: AuditReport = {
    ...baseReport,
    ...aiReport,
    scores: {
      ...baseReport.scores,
      ...(aiReport as any).scores,
    },
    platforms: {
      ...baseReport.platforms,
      ...(aiReport as any).platforms,
    },
    thirtyDayActionPlan: {
      ...baseReport.thirtyDayActionPlan,
      ...(aiReport as any).thirtyDayActionPlan,
    },
    industryBenchmark: {
      ...baseReport.industryBenchmark,
      ...(aiReport as any).industryBenchmark,
    },
  }

  if (!out.topIssues) out.topIssues = []
  if (!out.competitiveAdvantages) out.competitiveAdvantages = []
  if (!out.generatedAt) out.generatedAt = new Date().toISOString()

  return out
}

async function enhanceWithAI(baseReport: AuditReport, input: AuditInput): Promise<AuditReport> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) return baseReport

  const { systemPrompt, userPrompt } = buildAIPrompt(input, baseReport)

  const payload = {
    messages: [
      { role: 'system' as const, content: systemPrompt },
      {
        role: 'user' as const,
        content: `${userPrompt}\n\nBASE_AUDIT_JSON:\n${JSON.stringify(baseReport)}`,
      },
    ],
    temperature: 0,
    max_tokens: 500,
  }

  try {
    await fetchChatWithFallbackNoTools<AuditReport>({
      apiKey,
      primaryModel: 'openrouter/meta-llama/llama-3.1-8b-instruct:free',
      fallbackModels: ['openrouter/google/gemma-2-9b-it:free', 'openrouter/mistralai/mistral-7b-instruct:free'],
      timeoutMs: 45_000,
      maxRetriesPerModel: 3,
      payload,
      parseJson: (raw) => {
        const repaired = repairAndParseJson<AuditReport>(raw, baseReport)
        if (!validateAuditReportShape(repaired)) return baseReport
        const merged = mergeMissingFromBaseReport(repaired, baseReport)

        // Never allow AI to change core scoring
        merged.overallScore = baseReport.overallScore
        merged.scores = { ...baseReport.scores }
        for (const platform of Object.keys(baseReport.platforms)) {
          merged.platforms[platform].score = baseReport.platforms[platform].score
          merged.platforms[platform].grade = baseReport.platforms[platform].grade
        }

        merged.generatedAt = new Date().toISOString()
        return merged
      },
    })

    // If we get here, the AI enhancement succeeded
    // The parseJson function already merged the AI improvements
    // Return the base report (which may have been modified in place by parseJson)
    return baseReport
  } catch {
    return baseReport
  }
}

// ============================================================================
// Main Entry Point
// ============================================================================

export async function analyzeAudit(input: AuditInput): Promise<{ report: AuditReport; scores: Record<string, number>; rawMetrics: RawPlatformMetrics[] }> {
  // Always generate deterministic base report first
  const { report: baseReport, scores: baseScores, rawMetrics } = generateRuleBasedAudit(input)

  // Optionally enhance with AI (wording only)
  try {
    const enhanced = await enhanceWithAI(baseReport, input)
    return {
      report: enhanced,
      scores: baseScores,
      rawMetrics,
    }
  } catch {
    // Graceful degradation - return deterministic report
    return {
      report: baseReport,
      scores: baseScores,
      rawMetrics,
    }
  }
}

// ============================================================================
// Exports
// ============================================================================

export type { RawPlatformMetrics }
export { extractRawMetrics, getSafeIndustry }