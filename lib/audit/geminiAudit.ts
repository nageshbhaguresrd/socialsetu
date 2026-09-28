import { GoogleGenAI } from '@google/genai';
import type { AuditReport } from '@/lib/types/audit';
import { sanitizeForPDF, sanitizeArrayForPDF, type PlatformKey } from './platformUtils';

const CANDIDATE_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash',
  'gemini-3.8-flash',
];

export interface GeminiAuditRequest {
  clientName: string;
  industry: string;
  targetAudience: string;
  businessGoal: string;
  platforms: {
    key: PlatformKey;
    handle: string;
    hasLiveData: boolean;
    liveData?: Record<string, unknown>;
  }[];
}

export interface GeminiPlatformSynthesis {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  strengths: string[];
  weaknesses: string[];
  quickWins: string[];
  dataSource: 'live' | 'ai_benchmark';
  syntheticMetrics?: {
    followers?: number;
    subscribers?: number;
    posts?: number;
    videoCount?: number;
    engagementRate?: number;
    postingFrequency?: string;
  };
}

export interface GeminiAuditResult {
  summary: string;
  overallScore: number;
  auditMode: 'live' | 'ai_benchmark' | 'hybrid';
  scores: {
    profileCompleteness: number;
    contentConsistency: number;
    engagementRate: number;
    growthPotential: number;
    brandPresence: number;
  };
  platforms: Record<string, GeminiPlatformSynthesis>;
  topIssues: string[];
  thirtyDayActionPlan: {
    week1: string[];
    week2: string[];
    week3: string[];
    week4: string[];
  };
  industryBenchmark: {
    engagementRate: string;
    postingFrequency: string;
    followerGrowthRate: string;
  };
  competitiveAdvantages: string[];
}

/**
 * Generate a comprehensive audit using Gemini with multi-model fallback.
 */
export async function generateGeminiAudit(request: GeminiAuditRequest): Promise<GeminiAuditResult | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[GeminiAudit] GEMINI_API_KEY is not set');
    return null;
  }

  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `You are the Lead Digital Growth Auditor at SocialSetu, India's premier social media and digital growth agency.
Your task is to analyze social media accounts and generate authentic, professional, and actionable audit reports.
Context: You specialize in Indian brands, local businesses, and digital creators (Pune, Mumbai, Delhi, Bangalore, etc.).
Rules:
1. SCORES: Must be realistic and balanced. Realistic scores for growing brands are between 58 and 82. NEVER output 0.
2. CONSTRUCTIVE & ACTIONABLE: Provide sharp, specific strengths and weaknesses (e.g. mention WhatsApp CTAs, local SEO, Instagram Reels audio trends, YouTube thumbnail retention, community replies).
3. JSON ONLY: Respond ONLY with valid JSON matching the exact schema requested. No markdown blocks outside JSON.`;

  const platformsContext = request.platforms.map(p => {
    return {
      platform: p.key,
      handle: p.handle,
      status: p.hasLiveData ? 'Live Data Available' : 'No Live Scraper API Key - Synthesize Realistic Benchmark for this Niche & Handle',
      liveMetrics: p.hasLiveData ? p.liveData : undefined,
    };
  });

  const prompt = `Analyze the following brand and generate an in-depth social media audit report:

Brand Name: ${request.clientName}
Industry / Niche: ${request.industry}
Target Audience: ${request.targetAudience}
Primary Business Goal: ${request.businessGoal}

Platforms to Audit:
${JSON.stringify(platformsContext, null, 2)}

Requirements for JSON response:
{
  "summary": "2-3 sentences summarizing the brand's digital health, key bottleneck, and 30-day focus.",
  "overallScore": number (58-82),
  "scores": {
    "profileCompleteness": number (60-90),
    "contentConsistency": number (50-85),
    "engagementRate": number (45-80),
    "growthPotential": number (65-90),
    "brandPresence": number (55-85)
  },
  "platforms": {
    // For each platform listed in platforms above (e.g. "instagram", "youtube", "twitter"):
    "<platform_key>": {
      "score": number (55-82),
      "grade": "A" | "B" | "C" | "D",
      "strengths": ["string", "string", "string"],
      "weaknesses": ["string", "string", "string"],
      "quickWins": ["string", "string"],
      "syntheticMetrics": {
        "followers": number,
        "subscribers": number,
        "posts": number,
        "videoCount": number,
        "engagementRate": number (percentage like 2.4),
        "postingFrequency": "e.g. 3-4 posts/week"
      }
    }
  },
  "topIssues": ["priority issue 1", "priority issue 2", "priority issue 3", "priority issue 4"],
  "thirtyDayActionPlan": {
    "week1": ["task 1", "task 2", "task 3", "task 4"],
    "week2": ["task 1", "task 2", "task 3", "task 4"],
    "week3": ["task 1", "task 2", "task 3", "task 4"],
    "week4": ["task 1", "task 2", "task 3", "task 4"]
  },
  "industryBenchmark": {
    "engagementRate": "e.g. 2.0-4.5%",
    "postingFrequency": "e.g. 4-6 posts/week",
    "followerGrowthRate": "e.g. 1.2-2.8%/month"
  },
  "competitiveAdvantages": ["advantage 1", "advantage 2", "advantage 3"]
}`;

  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      const text = response.text?.trim();
      if (!text) continue;

      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== 'object' || !parsed.scores) continue;

      // Determine audit mode
      const hasLive = request.platforms.some(p => p.hasLiveData);
      const hasSynthetic = request.platforms.some(p => !p.hasLiveData);
      const auditMode: 'live' | 'ai_benchmark' | 'hybrid' =
        hasLive && hasSynthetic ? 'hybrid' : hasLive ? 'live' : 'ai_benchmark';

      // Format platforms with dataSource tags
      const formattedPlatforms: Record<string, GeminiPlatformSynthesis> = {};
      for (const p of request.platforms) {
        const platData = parsed.platforms?.[p.key] || {};
        const score = typeof platData.score === 'number' ? Math.max(45, Math.min(95, platData.score)) : 68;
        const grade = platData.grade || (score >= 80 ? 'B' : score >= 65 ? 'C' : 'D');

        formattedPlatforms[p.key] = {
          score,
          grade,
          strengths: sanitizeArrayForPDF(platData.strengths || [
            'Clear brand positioning suited for Indian market demographic',
            'Strong foundation with untapped local organic discovery potential',
          ]),
          weaknesses: sanitizeArrayForPDF(platData.weaknesses || [
            'Inconsistent posting cadence causing algorithm distribution drop-off',
            'Missing direct lead capture CTAs (WhatsApp chat link / landing page)',
          ]),
          quickWins: sanitizeArrayForPDF(platData.quickWins || [
            'Add direct WhatsApp business inquiry link to profile bio',
            'Pin top 3 social proof and customer testimonial posts',
          ]),
          dataSource: p.hasLiveData ? 'live' : 'ai_benchmark',
          syntheticMetrics: platData.syntheticMetrics,
        };
      }

      return {
        summary: sanitizeForPDF(parsed.summary || `Comprehensive social media growth audit for ${request.clientName}.`),
        overallScore: typeof parsed.overallScore === 'number' ? Math.max(50, Math.min(95, parsed.overallScore)) : 68,
        auditMode,
        scores: {
          profileCompleteness: Math.max(40, Math.min(100, parsed.scores.profileCompleteness || 75)),
          contentConsistency: Math.max(40, Math.min(100, parsed.scores.contentConsistency || 65)),
          engagementRate: Math.max(30, Math.min(100, parsed.scores.engagementRate || 60)),
          growthPotential: Math.max(50, Math.min(100, parsed.scores.growthPotential || 75)),
          brandPresence: Math.max(40, Math.min(100, parsed.scores.brandPresence || 68)),
        },
        platforms: formattedPlatforms,
        topIssues: sanitizeArrayForPDF(parsed.topIssues || [
          'Inconsistent publishing schedule limiting algorithm reach',
          'Lack of frictionless WhatsApp / website lead capture channels',
          'Low audience interaction within first hour of publishing',
        ]),
        thirtyDayActionPlan: {
          week1: sanitizeArrayForPDF(parsed.thirtyDayActionPlan?.week1 || [
            'Audit profile bio and add high-converting WhatsApp CTA link',
            'Establish 3 core content pillars aligned to target Indian audience',
          ]),
          week2: sanitizeArrayForPDF(parsed.thirtyDayActionPlan?.week2 || [
            'Publish 3 short-form videos testing different opening hooks',
            'Engage with 10 industry/local creator accounts daily',
          ]),
          week3: sanitizeArrayForPDF(parsed.thirtyDayActionPlan?.week3 || [
            'Implement carousel format highlighting customer transformation or case study',
            'Analyze first 14-day engagement rates and double down on top performers',
          ]),
          week4: sanitizeArrayForPDF(parsed.thirtyDayActionPlan?.week4 || [
            'Launch high-intent offer post with direct DM/WhatsApp trigger',
            'Review monthly metrics and lock in 60-day content calendar',
          ]),
        },
        industryBenchmark: parsed.industryBenchmark || {
          engagementRate: '2.0-4.5%',
          postingFrequency: '3-5 posts/week',
          followerGrowthRate: '1.2-2.5%/month',
        },
        competitiveAdvantages: sanitizeArrayForPDF(parsed.competitiveAdvantages || [
          'Authentic local niche authority in Indian market',
          'High headroom for viral reach through structured short-form video',
        ]),
      };
    } catch (err: any) {
      console.warn(`[GeminiAudit] Model ${model} encountered an issue:`, err?.message || err);
      // Try next model in candidate chain
    }
  }

  console.error('[GeminiAudit] All candidate models failed to generate content');
  return null;
}
