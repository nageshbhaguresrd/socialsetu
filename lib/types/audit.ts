export interface AuditPlatformInput {
  handle: string
  url: string
}

export interface AuditPlatforms {
  youtube?: AuditPlatformInput
  instagram?: AuditPlatformInput
  twitter?: AuditPlatformInput
  linkedin?: AuditPlatformInput
  facebook?: AuditPlatformInput
}

export interface AuditScores {
  overall: number
  youtube?: number
  instagram?: number
  twitter?: number
  linkedin?: number
  facebook?: number
  profileCompleteness: number
  contentConsistency: number
  engagementRate: number
  growthPotential: number
}

export interface AuditReport {
  summary: string
  overallScore: number
  scores: {
    profileCompleteness: number
    contentConsistency: number
    engagementRate: number
    growthPotential: number
    brandPresence: number
  }
  platforms: {
    [platform: string]: {
      score: number
      grade: 'A' | 'B' | 'C' | 'D' | 'F'
      strengths: string[]
      weaknesses: string[]
      quickWins: string[]
    }
  }
  topIssues: string[]
  thirtyDayActionPlan: {
    week1: string[]
    week2: string[]
    week3: string[]
    week4: string[]
  }
  industryBenchmark: {
    engagementRate: string
    postingFrequency: string
    followerGrowthRate: string
  }
  competitiveAdvantages: string[]
  generatedAt: string
}

export type AuditStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface Audit {
  id: string
  lead_id: string | null
  client_name: string
  platforms: AuditPlatforms
  scores: AuditScores
  report: AuditReport
  status: AuditStatus
  created_at: string
  updated_at: string
}