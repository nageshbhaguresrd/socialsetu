import { GoogleGenAI } from '@google/genai';
import { PlatformId } from '@/lib/types/enterprise';

const CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.5-flash',
  'gemini-flash-latest',
  'gemini-pro-latest',
];

export interface InspectionResult {
  isApproved: boolean;
  score: number; // 0 - 100
  flaggedIssues: string[];
  suggestions: string[];
  platformCompliance: {
    characterLimitOk: boolean;
    hashtagLimitOk: boolean;
    ctaPresent: boolean;
  };
}

export class QualityInspectorAgent {
  private getClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({ apiKey });
  }

  async inspect(
    content: string,
    platform: PlatformId,
    brandVoice: string = 'Professional',
    bannedWords: string[] = []
  ): Promise<InspectionResult> {
    // 1. Fast deterministic heuristic check
    const charCount = content.length;
    const hashtagCount = (content.match(/#\w+/g) || []).length;
    const hasCta = /comment|click|tap|link|share|visit|dm|call|reply|book|message/i.test(content);

    let charLimitOk = true;
    if (platform === 'x_twitter' && charCount > 280) charLimitOk = false;
    if (platform === 'instagram' && charCount > 2200) charLimitOk = false;

    const hashtagLimitOk = platform === 'x_twitter' ? hashtagCount <= 4 : hashtagCount <= 30;

    const detectedBannedWords = bannedWords.filter((w) =>
      content.toLowerCase().includes(w.toLowerCase())
    );

    const baseIssues: string[] = [];
    if (!charLimitOk) baseIssues.push(`Post exceeds ${platform} character limit (${charCount} chars).`);
    if (!hashtagLimitOk) baseIssues.push(`Too many hashtags for ${platform} (${hashtagCount} tags).`);
    if (detectedBannedWords.length > 0)
      baseIssues.push(`Contains restricted brand words: ${detectedBannedWords.join(', ')}.`);

    const ai = this.getClient();
    if (ai) {
      const systemInstruction = `You are the Lead Content Quality and Brand Compliance Officer at SocialSetu.
You verify that social media posts are safe, compliant, professional, aligned with the brand voice, and free of sensitive/misleading statements.
Respond ONLY in valid JSON.`;

      const prompt = `Inspect the following post for ${platform}:
Post Content:
"""
${content}
"""
Target Brand Voice: ${brandVoice}
Platform: ${platform}

Output JSON schema:
{
  "isApproved": boolean,
  "score": number (0-100),
  "flaggedIssues": ["issue 1", "issue 2"],
  "suggestions": ["improvement suggestion 1", "improvement suggestion 2"]
}`;

      for (const model of CANDIDATE_MODELS) {
        try {
          const res = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              temperature: 0.2,
            },
          });
          const text = res.text?.trim();
          if (text) {
            const parsed = JSON.parse(text);
            const combinedIssues = Array.from(
              new Set([...baseIssues, ...(parsed.flaggedIssues || [])])
            );
            return {
              isApproved: combinedIssues.length === 0 && parsed.isApproved !== false,
              score: baseIssues.length > 0 ? Math.min(parsed.score || 70, 65) : parsed.score || 88,
              flaggedIssues: combinedIssues,
              suggestions: parsed.suggestions || [],
              platformCompliance: {
                characterLimitOk: charLimitOk,
                hashtagLimitOk,
                ctaPresent: hasCta,
              },
            };
          }
        } catch (err) {
          console.warn(`[QualityInspectorAgent] Model ${model} failed:`, err);
        }
      }
    }

    // Deterministic fallback
    const passed = baseIssues.length === 0;
    return {
      isApproved: passed,
      score: passed ? 90 : 60,
      flaggedIssues: baseIssues,
      suggestions: !hasCta ? ['Consider adding a clear call-to-action to maximize engagement'] : [],
      platformCompliance: {
        characterLimitOk: charLimitOk,
        hashtagLimitOk,
        ctaPresent: hasCta,
      },
    };
  }
}
