import { GoogleGenAI } from '@google/genai'
import { AuditReport } from '@/lib/types/audit'
import { YouTubeData } from './youtube'
import { InstagramData } from './instagram'
import { TwitterData } from './twitter'

export interface AuditInput {
  clientName: string
  industry: string
  targetAudience: string
  businessGoal: string
  youtube?: YouTubeData
  instagram?: InstagramData
  twitter?: TwitterData
}

export async function analyzeAudit(
  input: AuditInput
): Promise<{ report: AuditReport; scores: Record<string, number> }> {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!
  })

  const systemPrompt = `You are a senior social media strategist with 10+ years experience auditing brand accounts for Indian businesses. You analyze social media data and provide brutally honest, actionable audit reports.

Always respond with ONLY valid JSON matching the AuditReport structure.
No markdown, no explanation outside the JSON.
All scores are 0-100 integers.
All text is specific to this client's actual data, not generic advice.`

  const userPrompt = `Audit the following social media presence for ${input.clientName}.

Business: ${input.clientName}
Industry: ${input.industry}
Target Audience: ${input.targetAudience}
Business Goal: ${input.businessGoal}

PLATFORM DATA:
${input.youtube && !input.youtube.error ? `
YouTube:
- Channel: ${input.youtube.title}
- Subscribers: ${input.youtube.subscriberCount.toLocaleString()}
- Total Videos: ${input.youtube.videoCount}
- Total Views: ${input.youtube.viewCount.toLocaleString()}
- Upload Frequency: every ${input.youtube.uploadFrequencyDays} days
- Avg Views per Video: ${input.youtube.avgViewsPerVideo}
- Estimated Engagement Rate: ${input.youtube.estimatedEngagementRate.toFixed(2)}%
- Description: ${input.youtube.description?.slice(0, 200)}
` : 'YouTube: Not provided or error fetching data'}

${input.instagram && !input.instagram.error ? `
Instagram:
- Username: @${input.instagram.username}
- Followers: ${input.instagram.followersCount.toLocaleString()}
- Following: ${input.instagram.followingCount}
- Posts: ${input.instagram.postsCount}
- Verified: ${input.instagram.isVerified}
- Business Account: ${input.instagram.isBusinessAccount}
- Engagement Rate: ${input.instagram.estimatedEngagementRate.toFixed(2)}%
- Bio: ${input.instagram.biography?.slice(0, 200)}
` : 'Instagram: Not provided or error fetching data'}

${input.twitter && !input.twitter.error ? `
X/Twitter:
- Handle: @${input.twitter.username}
- Followers: ${input.twitter.followersCount.toLocaleString()}
- Tweets: ${input.twitter.tweetCount}
- Verified: ${input.twitter.verified}
- Bio: ${input.twitter.description?.slice(0, 200)}
` : 'X/Twitter: Not provided or error fetching data'}

Generate a detailed audit with:
1. An overall score (weighted average of all platforms)
2. Specific scores for each metric
3. For each platform: score, grade, 3 strengths, 3 weaknesses, 3 quick wins
4. Top 5 most critical issues across all platforms
5. A realistic 30-day action plan (4 actions per week, specific not generic)
6. Industry benchmarks for ${input.industry}
7. Summary paragraph (3-4 sentences, honest assessment)

Be brutally honest. If numbers are low, say so clearly.
Reference actual data points in your analysis, not generic observations.
Tailor all advice to Indian market context where relevant.

Return ONLY the JSON object matching AuditReport interface.`

  const result = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: userPrompt,
    config: { systemInstruction: systemPrompt }
  })

  const text = (result.text || '')
    .replace(/```json|```/g, '')
    .trim()

  let parsed: AuditReport
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('AI returned invalid JSON')
  }

  parsed.generatedAt = new Date().toISOString()

  const scores = {
    overall: parsed.overallScore,
    profileCompleteness: parsed.scores.profileCompleteness,
    contentConsistency: parsed.scores.contentConsistency,
    engagementRate: parsed.scores.engagementRate,
    growthPotential: parsed.scores.growthPotential,
    brandPresence: parsed.scores.brandPresence,
    youtube: parsed.platforms?.youtube?.score || 0,
    instagram: parsed.platforms?.instagram?.score || 0,
    twitter: parsed.platforms?.twitter?.score || 0,
  }

  return { report: parsed, scores }
}