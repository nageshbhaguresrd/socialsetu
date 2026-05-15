/**
 * Deterministic Scoring Engine
 * 
 * Production-grade scoring system that generates scores, strengths, weaknesses,
 * and quick wins based solely on actual metrics. No AI hallucinations.
 */

import type { AuditReport } from '@/lib/types/audit'
import { clamp, safeNumber, safeBool, type PlatformKey } from './platformUtils'

// ============================================================================
// Types
// ============================================================================

export interface ScoringInput {
  // Common metrics
  followers?: number
  following?: number
  posts?: number
  verified?: boolean
  
  // YouTube specific
  subscribers?: number
  videoCount?: number
  viewCount?: number
  avgViewsPerVideo?: number
  uploadFrequencyDays?: number
  
  // Engagement
  engagementRate?: number
  avgLikes?: number
  avgComments?: number
}

export interface ScoringResult {
  score: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  strengths: string[]
  weaknesses: string[]
  quickWins: string[]
}

export interface ComponentScores {
  engagement: number
  audience: number
  posting: number
  depth: number
  profile: number
}

// ============================================================================
// Grade Calculation
// ============================================================================

export function gradeFromScore(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'F'
}

// ============================================================================
// Component Scoring Functions
// ============================================================================

/**
 * Score based on engagement rate.
 * More forgiving for smaller creators - any engagement is good.
 */
export function scoreFromEngagementRate(ratePct?: number): number {
  if (ratePct == null || !Number.isFinite(ratePct)) return 50 // Neutral baseline
  
  const r = clamp(ratePct, 0, 25)
  
  // More forgiving curve for smaller creators
  // 1% = 40, 2% = 60, 3.5% = 80, 5%+ = 95+
  const score = Math.round(Math.sqrt(r) * 25)
  return clamp(score, 20, 100)
}

/**
 * Score based on audience size.
 * Uses logarithmic scale to be fair to smaller creators.
 */
export function scoreFromAudienceSize(count?: number): number {
  if (count == null || !Number.isFinite(count)) return 45
  
  const c = Math.max(0, count)
  const log = Math.log10(c + 1)
  
  // More forgiving: 100 followers = 30, 1K = 50, 10K = 70, 100K = 85, 1M = 95
  const score = Math.round(clamp((log / 6) * 100, 0, 100))
  return clamp(score, 15, 95)
}

/**
 * Score based on posting consistency.
 * Rewards regular posting without punishing smaller creators too harshly.
 */
export function scoreFromPostingConsistency(uploadFrequencyDays?: number): number {
  if (uploadFrequencyDays == null || !Number.isFinite(uploadFrequencyDays)) return 50
  
  const d = clamp(uploadFrequencyDays, 0.5, 120)
  
  // Daily = 95, every 2-3 days = 85, weekly = 75, bi-weekly = 60, monthly = 45
  let score = 100 - Math.log2(d + 1) * 12
  score = clamp(score, 25, 95)
  return Math.round(score)
}

/**
 * Score based on content depth (avg views per video for YouTube).
 */
export function scoreFromContentDepth(avgViewsPerVideo?: number): number {
  if (avgViewsPerVideo == null || !Number.isFinite(avgViewsPerVideo)) return 50
  
  const v = Math.max(0, avgViewsPerVideo)
  const log = Math.log10(v + 1)
  
  // 100 views = 35, 1K = 55, 10K = 75, 100K = 90
  const score = Math.round(clamp((log / 5) * 100, 0, 100))
  return clamp(score, 20, 95)
}

/**
 * Score based on profile completeness.
 * Verified status adds bonus but is not required for good score.
 */
export function scoreFromProfileCompleteness(input: ScoringInput): number {
  let score = 40
  
  // Has engagement data
  if (input.engagementRate != null) score += 15
  
  // Has posting frequency
  if (input.uploadFrequencyDays != null) score += 10
  
  // Has content metrics
  if (input.avgViewsPerVideo != null || input.posts != null) score += 10
  
  // Verified bonus (smaller bonus, not make-or-break)
  if (input.verified) score += 5
  
  return clamp(score, 20, 100)
}

// ============================================================================
// Platform-Specific Weights
// ============================================================================

interface PlatformWeights {
  engagement: number
  audience: number
  posting: number
  depth: number
  profile: number
}

const PLATFORM_WEIGHTS: Record<PlatformKey, PlatformWeights> = {
  youtube: { engagement: 0.3, audience: 0.2, posting: 0.2, depth: 0.2, profile: 0.1 },
  instagram: { engagement: 0.35, audience: 0.2, posting: 0.2, depth: 0.05, profile: 0.2 },
  twitter: { engagement: 0.35, audience: 0.25, posting: 0.2, depth: 0.05, profile: 0.15 },
  linkedin: { engagement: 0.3, audience: 0.25, posting: 0.25, depth: 0.05, profile: 0.15 },
  facebook: { engagement: 0.3, audience: 0.25, posting: 0.2, depth: 0.05, profile: 0.2 },
}

// ============================================================================
// Strength Generation (Deterministic, Data-Driven)
// ============================================================================

function generateStrengths(platformKey: PlatformKey, input: ScoringInput, scores: ComponentScores): string[] {
  const strengths: string[] = []
  
  // Engagement strengths
  if (input.engagementRate != null) {
    if (input.engagementRate >= 5) {
      strengths.push('Exceptional engagement rate - your audience is highly active and responsive.')
    } else if (input.engagementRate >= 3) {
      strengths.push('Strong engagement rate - content consistently resonates with your audience.')
    } else if (input.engagementRate >= 1.5) {
      strengths.push('Healthy engagement rate - audience interaction shows good content alignment.')
    }
  }
  
  // Verification strength (smaller bonus, not over-emphasized)
  if (input.verified) {
    strengths.push('Verified status enhances credibility and discoverability.')
  }
  
  // Posting consistency strengths
  if (input.uploadFrequencyDays != null) {
    if (input.uploadFrequencyDays <= 3) {
      strengths.push('Excellent posting consistency - regular content keeps audience engaged.')
    } else if (input.uploadFrequencyDays <= 7) {
      strengths.push('Good posting consistency - steady content flow maintains audience interest.')
    }
  }
  
  // Audience size strengths (scaled appropriately)
  if (input.subscribers != null && input.subscribers >= 10000) {
    strengths.push('Solid subscriber base provides a strong foundation for growth.')
  } else if (input.followers != null && input.followers >= 5000) {
    strengths.push('Growing follower base shows increasing brand awareness.')
  }
  
  // Content depth strengths (YouTube specific)
  if (platformKey === 'youtube' && input.avgViewsPerVideo != null) {
    if (input.avgViewsPerVideo >= 50000) {
      strengths.push('High average views indicate strong content discovery and retention.')
    } else if (input.avgViewsPerVideo >= 10000) {
      strengths.push('Good average views show consistent content discoverability.')
    } else if (input.avgViewsPerVideo >= 1000) {
      strengths.push('Steady viewership indicates a loyal core audience.')
    }
  }
  
  // Content volume strengths
  if (input.videoCount != null && input.videoCount >= 50) {
    strengths.push('Substantial video library provides evergreen content value.')
  } else if (input.posts != null && input.posts >= 100) {
    strengths.push('Consistent content history builds audience trust and authority.')
  }
  
  return strengths.slice(0, 3)
}

// ============================================================================
// Weakness Generation (Deterministic, Data-Driven)
// ============================================================================

function generateWeaknesses(platformKey: PlatformKey, input: ScoringInput, scores: ComponentScores): string[] {
  const weaknesses: string[] = []
  
  // Engagement weaknesses
  if (input.engagementRate != null && input.engagementRate < 1) {
    weaknesses.push('Low engagement rate suggests content may not be resonating with the audience.')
  } else if (input.engagementRate == null) {
    weaknesses.push('Engagement data is not available - consider tracking likes, comments, and shares.')
  }
  
  // Posting consistency weaknesses
  if (input.uploadFrequencyDays != null) {
    if (input.uploadFrequencyDays > 30) {
      weaknesses.push('Infrequent posting makes it difficult to build and maintain audience momentum.')
    } else if (input.uploadFrequencyDays > 14) {
      weaknesses.push('Posting frequency could be improved to increase audience retention and growth.')
    }
  } else {
    weaknesses.push('Posting consistency is unclear - establishing a regular schedule would help.')
  }
  
  // Content depth weaknesses (YouTube specific)
  if (platformKey === 'youtube') {
    if (input.avgViewsPerVideo != null && input.avgViewsPerVideo < 500) {
      weaknesses.push('Low average views suggest opportunities to improve titles, thumbnails, and content hooks.')
    } else if (input.avgViewsPerVideo == null && input.videoCount != null && input.videoCount > 0) {
      weaknesses.push('View data is unavailable - analyze video performance to optimize content strategy.')
    }
  }
  
  // Audience size context (not a weakness per se, but growth opportunity)
  if (input.subscribers != null && input.subscribers < 1000 && !input.verified) {
    // Only add if truly small and not verified
    weaknesses.push('Growing the subscriber base will amplify the impact of all other improvements.')
  }
  
  // Profile completeness
  if (!input.verified && (input.subscribers == null || input.subscribers < 10000)) {
    // Don't double-count if already mentioned
    if (!weaknesses.some(w => w.includes('verified'))) {
      weaknesses.push('Verification status can improve trust and discoverability once eligibility requirements are met.')
    }
  }
  
  return weaknesses.slice(0, 3)
}

// ============================================================================
// Quick Wins Generation (Actionable, Specific)
// ============================================================================

function generateQuickWins(platformKey: PlatformKey, input: ScoringInput, scores: ComponentScores): string[] {
  const quickWins: string[] = []
  
  // Engagement improvement
  if (input.engagementRate == null || input.engagementRate < 2) {
    quickWins.push('Test 3 different content formats over 2 weeks and track which generates the most engagement.')
  }
  
  // Consistency improvement
  if (input.uploadFrequencyDays == null || input.uploadFrequencyDays > 7) {
    quickWins.push('Commit to a fixed publishing schedule for 30 days - consistency beats perfection.')
  }
  
  // Platform-specific quick wins
  if (platformKey === 'youtube') {
    if (input.avgViewsPerVideo == null || input.avgViewsPerVideo < 5000) {
      quickWins.push('Optimize titles and thumbnails - these are the primary drivers of click-through rate.')
    }
    quickWins.push('Add a consistent 5-second intro pattern to improve brand recognition and retention.')
  } else if (platformKey === 'instagram') {
    quickWins.push('Use carousel posts with strong hooks in the first slide to increase saves and shares.')
    quickWins.push('Post during peak audience hours - check your insights for optimal timing.')
  } else if (platformKey === 'twitter') {
    quickWins.push('Create 1 thread per week on your most valuable topic to drive engagement and follows.')
    quickWins.push('Engage with 5 relevant accounts daily through thoughtful replies to increase visibility.')
  }
  
  // Verification path
  if (!input.verified) {
    quickWins.push('Build toward verification by maintaining consistent branding and growing authentic engagement.')
  }
  
  return quickWins.slice(0, 3)
}

// ============================================================================
// Main Scoring Function
// ============================================================================

export function computePlatformScore(platformKey: PlatformKey, input: ScoringInput | undefined): ScoringResult {
  // If no data, return empty result (platform not connected)
  if (!input || !hasAnyData(input)) {
    return {
      score: 0,
      grade: 'F',
      strengths: [],
      weaknesses: [],
      quickWins: [],
    }
  }
  
  // Calculate component scores
  const componentScores: ComponentScores = {
    engagement: scoreFromEngagementRate(input.engagementRate),
    audience: scoreFromAudienceSize(input.followers ?? input.subscribers),
    posting: scoreFromPostingConsistency(input.uploadFrequencyDays),
    depth: platformKey === 'youtube' ? scoreFromContentDepth(input.avgViewsPerVideo) : 50,
    profile: scoreFromProfileCompleteness(input),
  }
  
  // Get platform weights
  const weights = PLATFORM_WEIGHTS[platformKey]
  
  // Calculate weighted score
  const weightedScore =
    componentScores.engagement * weights.engagement +
    componentScores.audience * weights.audience +
    componentScores.posting * weights.posting +
    componentScores.depth * weights.depth +
    componentScores.profile * weights.profile
  
  const finalScore = Math.round(clamp(weightedScore, 0, 100))
  const grade = gradeFromScore(finalScore)
  
  // Generate deterministic insights
  const strengths = generateStrengths(platformKey, input, componentScores)
  const weaknesses = generateWeaknesses(platformKey, input, componentScores)
  const quickWins = generateQuickWins(platformKey, input, componentScores)
  
  return {
    score: finalScore,
    grade,
    strengths,
    weaknesses,
    quickWins,
  }
}

/**
 * Check if input has any meaningful data.
 */
function hasAnyData(input: ScoringInput): boolean {
  return (
    (input.subscribers != null && input.subscribers > 0) ||
    (input.followers != null && input.followers > 0) ||
    (input.posts != null && input.posts > 0) ||
    (input.videoCount != null && input.videoCount > 0) ||
    (input.viewCount != null && input.viewCount > 0)
  )
}

// ============================================================================
// Overall Score Calculation
// ============================================================================

export interface OverallScoreInput {
  platformScores: {
    youtube?: ScoringResult
    instagram?: ScoringResult
    twitter?: ScoringResult
    linkedin?: ScoringResult
    facebook?: ScoringResult
  }
  connectedPlatforms: {
    youtube: boolean
    instagram: boolean
    twitter: boolean
    linkedin: boolean
    facebook: boolean
  }
}

export function computeOverallScore(input: OverallScoreInput): { overallScore: number; grade: 'A' | 'B' | 'C' | 'D' | 'F' } {
  const { platformScores, connectedPlatforms } = input
  
  // Only score connected platforms
  const scores: number[] = []
  const weights: number[] = []
  
  // Platform weights for overall score
  const platformWeights: Record<string, number> = {
    youtube: 0.3,
    instagram: 0.25,
    twitter: 0.2,
    linkedin: 0.15,
    facebook: 0.1,
  }
  
  for (const platform of ['youtube', 'instagram', 'twitter', 'linkedin', 'facebook'] as const) {
    if (connectedPlatforms[platform] && platformScores[platform]) {
      scores.push(platformScores[platform].score)
      weights.push(platformWeights[platform])
    }
  }
  
  if (scores.length === 0) {
    return { overallScore: 0, grade: 'F' }
  }
  
  // Weighted average
  const totalWeight = weights.reduce((a, b) => a + b, 0)
  const weightedSum = scores.reduce((sum, score, i) => sum + score * weights[i], 0)
  const overallScore = Math.round(clamp(weightedSum / totalWeight, 0, 100))
  
  return {
    overallScore,
    grade: gradeFromScore(overallScore),
  }
}