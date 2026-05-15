/**
 * Platform Validation and Filtering Utilities
 * 
 * Production-grade utilities to ensure only valid platforms with real data
 * are included in audit reports. Prevents hallucinations and empty sections.
 */

import type { AuditReport } from '@/lib/types/audit'

// ============================================================================
// Platform Types
// ============================================================================

export type PlatformKey = 'youtube' | 'instagram' | 'twitter' | 'linkedin' | 'facebook'

export const ALL_PLATFORMS: PlatformKey[] = ['youtube', 'instagram', 'twitter', 'linkedin', 'facebook']

export const ENHANCED_PLATFORMS: Array<'youtube' | 'instagram' | 'twitter'> = ['youtube', 'instagram', 'twitter']

// ============================================================================
// Platform Data Interfaces
// ============================================================================

export interface PlatformMetrics {
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

export interface ValidationResult {
  isValid: boolean
  hasMeaningfulData: boolean
  reason?: string
  metrics: PlatformMetrics
}

// ============================================================================
// Platform Validation
// ============================================================================

/**
 * Check if a platform has valid, meaningful data.
 * A platform is valid only if:
 * - Object exists
 * - No error field
 * - Has meaningful metrics (non-zero followers/subscribers/posts/videos)
 */
export function isPlatformAvailable(data: unknown): data is PlatformMetrics {
  if (!data || typeof data !== 'object') return false
  
  const d = data as Record<string, unknown>
  
  // Check for error field
  if (d.error) return false
  
  // Must have at least one meaningful metric
  const metrics = extractPlatformMetrics(d)
  return hasMeaningfulData(metrics)
}

/**
 * Extract metrics from platform data.
 */
export function extractPlatformMetrics(data: Record<string, unknown>): PlatformMetrics {
  const metrics: PlatformMetrics = {}
  
  // Common metrics
  metrics.followers = safeNumber(data.followersCount ?? data.followers)
  metrics.following = safeNumber(data.followingCount ?? data.following)
  metrics.posts = safeNumber(data.postsCount ?? data.posts ?? data.tweetCount)
  metrics.verified = safeBool(data.isVerified ?? data.verified)
  
  // YouTube specific
  metrics.subscribers = safeNumber(data.subscriberCount ?? data.subscribers)
  metrics.videoCount = safeNumber(data.videoCount)
  metrics.viewCount = safeNumber(data.viewCount)
  metrics.avgViewsPerVideo = safeNumber(data.avgViewsPerVideo)
  metrics.uploadFrequencyDays = safeNumber(data.uploadFrequencyDays)
  
  // Engagement
  metrics.engagementRate = safeNumber(data.estimatedEngagementRate ?? data.engagementRate)
  metrics.avgLikes = safeNumber(data.avgLikes)
  metrics.avgComments = safeNumber(data.avgComments)
  
  return metrics
}

/**
 * Check if metrics contain meaningful data.
 */
export function hasMeaningfulData(metrics: PlatformMetrics): boolean {
  // Must have at least one of these
  if (metrics.subscribers && metrics.subscribers > 0) return true
  if (metrics.followers && metrics.followers > 0) return true
  if (metrics.posts && metrics.posts > 0) return true
  if (metrics.videoCount && metrics.videoCount > 0) return true
  if (metrics.viewCount && metrics.viewCount > 0) return true
  
  return false
}

/**
 * Get a score-only validation (for platforms with minimal data).
 */
export function hasMinimalData(metrics: PlatformMetrics): boolean {
  return metrics.subscribers != null || 
         metrics.followers != null || 
         metrics.posts != null || 
         metrics.videoCount != null
}

// ============================================================================
// Safe Type Conversions
// ============================================================================

export function safeNumber(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string') {
    const n = Number(v)
    if (Number.isFinite(n)) return n
  }
  return undefined
}

export function safeBool(v: unknown): boolean | undefined {
  if (typeof v === 'boolean') return v
  return undefined
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

// ============================================================================
// Platform-Specific Validation
// ============================================================================

export interface YouTubeValidation extends ValidationResult {
  platform: 'youtube'
  metrics: {
    subscribers?: number
    videoCount?: number
    viewCount?: number
    avgViewsPerVideo?: number
    uploadFrequencyDays?: number
    engagementRate?: number
    verified?: boolean
  }
}

export interface InstagramValidation extends ValidationResult {
  platform: 'instagram'
  metrics: {
    followers?: number
    following?: number
    posts?: number
    engagementRate?: number
    avgLikes?: number
    avgComments?: number
    verified?: boolean
  }
}

export interface TwitterValidation extends ValidationResult {
  platform: 'twitter'
  metrics: {
    followers?: number
    following?: number
    tweets?: number
    verified?: boolean
  }
}

export type PlatformValidation = YouTubeValidation | InstagramValidation | TwitterValidation

/**
 * Validate YouTube data.
 */
export function validateYouTube(data: unknown): YouTubeValidation {
  if (!data || typeof data !== 'object') {
    return {
      platform: 'youtube',
      isValid: false,
      hasMeaningfulData: false,
      reason: 'No data provided',
      metrics: {},
    }
  }
  
  const d = data as Record<string, unknown>
  
  if (d.error) {
    return {
      platform: 'youtube',
      isValid: false,
      hasMeaningfulData: false,
      reason: `Error: ${d.error}`,
      metrics: {},
    }
  }
  
  const metrics = {
    subscribers: safeNumber(d.subscriberCount ?? d.subscribers),
    videoCount: safeNumber(d.videoCount),
    viewCount: safeNumber(d.viewCount),
    avgViewsPerVideo: safeNumber(d.avgViewsPerVideo),
    uploadFrequencyDays: safeNumber(d.uploadFrequencyDays),
    engagementRate: safeNumber(d.estimatedEngagementRate ?? d.engagementRate),
    verified: safeBool(d.isVerified ?? d.verified),
  }
  
  const hasData = (metrics.subscribers != null && metrics.subscribers > 0) ||
                  (metrics.videoCount != null && metrics.videoCount > 0) ||
                  (metrics.viewCount != null && metrics.viewCount > 0)
  
  return {
    platform: 'youtube',
    isValid: true,
    hasMeaningfulData: hasData,
    metrics,
  }
}

/**
 * Validate Instagram data.
 */
export function validateInstagram(data: unknown): InstagramValidation {
  if (!data || typeof data !== 'object') {
    return {
      platform: 'instagram',
      isValid: false,
      hasMeaningfulData: false,
      reason: 'No data provided',
      metrics: {},
    }
  }
  
  const d = data as Record<string, unknown>
  
  if (d.error) {
    return {
      platform: 'instagram',
      isValid: false,
      hasMeaningfulData: false,
      reason: `Error: ${d.error}`,
      metrics: {},
    }
  }
  
  const metrics = {
    followers: safeNumber(d.followersCount ?? d.followers),
    following: safeNumber(d.followingCount ?? d.following),
    posts: safeNumber(d.postsCount ?? d.posts),
    engagementRate: safeNumber(d.estimatedEngagementRate ?? d.engagementRate),
    avgLikes: safeNumber(d.avgLikes),
    avgComments: safeNumber(d.avgComments),
    verified: safeBool(d.isVerified ?? d.verified),
  }
  
  const hasData = (metrics.followers != null && metrics.followers > 0) ||
                  (metrics.posts != null && metrics.posts > 0)
  
  return {
    platform: 'instagram',
    isValid: true,
    hasMeaningfulData: hasData,
    metrics,
  }
}

/**
 * Validate Twitter data.
 */
export function validateTwitter(data: unknown): TwitterValidation {
  if (!data || typeof data !== 'object') {
    return {
      platform: 'twitter',
      isValid: false,
      hasMeaningfulData: false,
      reason: 'No data provided',
      metrics: {},
    }
  }
  
  const d = data as Record<string, unknown>
  
  if (d.error) {
    return {
      platform: 'twitter',
      isValid: false,
      hasMeaningfulData: false,
      reason: `Error: ${d.error}`,
      metrics: {},
    }
  }
  
  const metrics = {
    followers: safeNumber(d.followersCount ?? d.followers),
    following: safeNumber(d.followingCount ?? d.following),
    tweets: safeNumber(d.tweetCount ?? d.tweets),
    verified: safeBool(d.verified),
  }
  
  const hasData = (metrics.followers != null && metrics.followers > 0) ||
                  (metrics.tweets != null && metrics.tweets > 0)
  
  return {
    platform: 'twitter',
    isValid: true,
    hasMeaningfulData: hasData,
    metrics,
  }
}

// ============================================================================
// Connected Platforms Detection
// ============================================================================

export interface ConnectedPlatforms {
  youtube: boolean
  instagram: boolean
  twitter: boolean
  linkedin: boolean
  facebook: boolean
}

/**
 * Detect which platforms are actually connected based on input data.
 */
export function detectConnectedPlatforms(input: {
  youtube?: unknown
  instagram?: unknown
  twitter?: unknown
  linkedin?: unknown
  facebook?: unknown
}): ConnectedPlatforms {
  return {
    youtube: isPlatformAvailable(input.youtube),
    instagram: isPlatformAvailable(input.instagram),
    twitter: isPlatformAvailable(input.twitter),
    linkedin: isPlatformAvailable(input.linkedin),
    facebook: isPlatformAvailable(input.facebook),
  }
}

/**
 * Get list of connected platform keys.
 */
export function getConnectedPlatformKeys(connected: ConnectedPlatforms): PlatformKey[] {
  return ALL_PLATFORMS.filter(p => connected[p])
}

// ============================================================================
// PDF-Safe Text Utilities
// ============================================================================

/**
 * Sanitize text for PDF rendering.
 * Replaces unsupported Unicode characters with safe ASCII alternatives.
 */
export function sanitizeForPDF(text: string): string {
  return text
    // Replace smart quotes and apostrophes
    .replace(/'/g, "'")  // Right single quotation mark
    .replace(/'/g, "'")  // Left single quotation mark
    .replace(/"/g, '"')  // Left double quotation mark
    .replace(/"/g, '"')  // Right double quotation mark
    
    // Replace special dashes
    .replace(/—/g, '-')  // Em dash
    .replace(/–/g, '-')  // En dash
    
    // Replace special bullets and symbols
    .replace(/•/g, '-')  // Bullet
    .replace(/◦/g, '-')  // White bullet
    .replace(/▪/g, '-')  // Black small square
    .replace(/→/g, '->') // Right arrow
    .replace(/←/g, '<-') // Left arrow
    .replace(/↑/g, '^')  // Up arrow
    .replace(/↓/g, 'v')  // Down arrow
    .replace(/★/g, '*')  // Black star
    .replace(/✓/g, 'Y')  // Check mark
    
    // Replace ellipsis
    .replace(/…/g, '...')
    
    // Replace trademark and copyright
    .replace(/™/g, '(TM)')
    .replace(/®/g, '(R)')
    .replace(/©/g, '(C)')
    
    // Replace non-breaking space and other whitespace
    .replace(/\u00A0/g, ' ')  // Non-breaking space
    .replace(/\u200B/g, '')   // Zero-width space
    .replace(/\uFEFF/g, '')   // BOM
    
    // Replace em dashes and other special punctuation
    .replace(/‽/g, '?!')      // Interrobang
    .replace(/‗/g, '==')      // Horizontal bar
    
    // Clean up any remaining control characters
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
}

/**
 * Sanitize an array of strings for PDF.
 */
export function sanitizeArrayForPDF(items: string[]): string[] {
  return items.map(item => sanitizeForPDF(item))
}

// ============================================================================
// Raw Metrics Formatting
// ============================================================================

export interface FormattedMetrics {
  label: string
  value: string
  description?: string
}

/**
 * Format YouTube metrics for display.
 */
export function formatYouTubeMetrics(metrics: {
  subscribers?: number
  videoCount?: number
  viewCount?: number
  avgViewsPerVideo?: number
  uploadFrequencyDays?: number
  engagementRate?: number
  verified?: boolean
}): FormattedMetrics[] {
  const formatted: FormattedMetrics[] = []
  
  if (metrics.subscribers != null && metrics.subscribers > 0) {
    formatted.push({
      label: 'Subscribers',
      value: formatNumber(metrics.subscribers),
      description: 'Total channel subscribers',
    })
  }
  
  if (metrics.videoCount != null && metrics.videoCount > 0) {
    formatted.push({
      label: 'Videos',
      value: formatNumber(metrics.videoCount),
      description: 'Total videos uploaded',
    })
  }
  
  if (metrics.viewCount != null && metrics.viewCount > 0) {
    formatted.push({
      label: 'Total Views',
      value: formatNumber(metrics.viewCount),
      description: 'Lifetime video views',
    })
  }
  
  if (metrics.avgViewsPerVideo != null && metrics.avgViewsPerVideo > 0) {
    formatted.push({
      label: 'Avg Views/Video',
      value: formatNumber(Math.round(metrics.avgViewsPerVideo)),
      description: 'Average views per video',
    })
  }
  
  if (metrics.uploadFrequencyDays != null && metrics.uploadFrequencyDays > 0) {
    const freq = metrics.uploadFrequencyDays < 1 
      ? 'Multiple per day'
      : metrics.uploadFrequencyDays === 1
      ? 'Daily'
      : `Every ${Math.round(metrics.uploadFrequencyDays)} days`
    formatted.push({
      label: 'Upload Frequency',
      value: freq,
      description: 'Average time between uploads',
    })
  }
  
  if (metrics.engagementRate != null && metrics.engagementRate >= 0) {
    formatted.push({
      label: 'Engagement Rate',
      value: `${metrics.engagementRate.toFixed(1)}%`,
      description: 'Average engagement per view',
    })
  }
  
  if (metrics.verified) {
    formatted.push({
      label: 'Status',
      value: 'Verified',
      description: 'Official verified channel',
    })
  }
  
  return formatted
}

/**
 * Format Instagram metrics for display.
 */
export function formatInstagramMetrics(metrics: {
  followers?: number
  following?: number
  posts?: number
  engagementRate?: number
  avgLikes?: number
  avgComments?: number
  verified?: boolean
}): FormattedMetrics[] {
  const formatted: FormattedMetrics[] = []
  
  if (metrics.followers != null && metrics.followers > 0) {
    formatted.push({
      label: 'Followers',
      value: formatNumber(metrics.followers),
      description: 'Total account followers',
    })
  }
  
  if (metrics.following != null && metrics.following > 0) {
    formatted.push({
      label: 'Following',
      value: formatNumber(metrics.following),
      description: 'Accounts followed',
    })
  }
  
  if (metrics.posts != null && metrics.posts > 0) {
    formatted.push({
      label: 'Posts',
      value: formatNumber(metrics.posts),
      description: 'Total posts published',
    })
  }
  
  if (metrics.engagementRate != null && metrics.engagementRate >= 0) {
    formatted.push({
      label: 'Engagement Rate',
      value: `${metrics.engagementRate.toFixed(1)}%`,
      description: 'Average engagement per post',
    })
  }
  
  if (metrics.avgLikes != null && metrics.avgLikes > 0) {
    formatted.push({
      label: 'Avg Likes',
      value: formatNumber(Math.round(metrics.avgLikes)),
      description: 'Average likes per post',
    })
  }
  
  if (metrics.avgComments != null && metrics.avgComments > 0) {
    formatted.push({
      label: 'Avg Comments',
      value: formatNumber(Math.round(metrics.avgComments)),
      description: 'Average comments per post',
    })
  }
  
  if (metrics.verified) {
    formatted.push({
      label: 'Status',
      value: 'Verified',
      description: 'Official verified account',
    })
  }
  
  return formatted
}

/**
 * Format Twitter metrics for display.
 */
export function formatTwitterMetrics(metrics: {
  followers?: number
  following?: number
  tweets?: number
  verified?: boolean
}): FormattedMetrics[] {
  const formatted: FormattedMetrics[] = []
  
  if (metrics.followers != null && metrics.followers > 0) {
    formatted.push({
      label: 'Followers',
      value: formatNumber(metrics.followers),
      description: 'Total account followers',
    })
  }
  
  if (metrics.following != null && metrics.following > 0) {
    formatted.push({
      label: 'Following',
      value: formatNumber(metrics.following),
      description: 'Accounts followed',
    })
  }
  
  if (metrics.tweets != null && metrics.tweets > 0) {
    formatted.push({
      label: 'Tweets',
      value: formatNumber(metrics.tweets),
      description: 'Total tweets posted',
    })
  }
  
  if (metrics.verified) {
    formatted.push({
      label: 'Status',
      value: 'Verified',
      description: 'Official verified account',
    })
  }
  
  return formatted
}

/**
 * Format a number for display (K, M, B suffixes).
 */
function formatNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1) + 'B'
  }
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + 'M'
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + 'K'
  }
  return num.toLocaleString()
}

// ============================================================================
// Industry Helpers
// ============================================================================

/**
 * Get a safe industry name with fallback.
 */
export function getSafeIndustry(industry: string | undefined | null): string {
  return (industry && industry.trim()) || 'Digital Creator'
}