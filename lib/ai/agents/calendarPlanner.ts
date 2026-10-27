import { GoogleGenAI } from '@google/genai';
import { ClientWorkspace, ClientBrandProfile, PlatformId } from '@/lib/types/enterprise';

const CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.5-flash',
  'gemini-flash-latest',
  'gemini-pro-latest',
];

export interface PlannedSlot {
  dayIndex: number; // 1 to 7/14/30
  dateFormatted: string;
  recommendedTime: string; // e.g. "11:30 AM IST"
  pillar: 'Educational' | 'Promotional' | 'Behind The Scenes' | 'Social Proof' | 'Celebration';
  topic: string;
  hookConcept: string;
  targetPlatforms: PlatformId[];
  format: 'post' | 'reel' | 'story' | 'carousel';
}

export interface CalendarPlanResult {
  clientName: string;
  period: '7_days' | '14_days' | '30_days';
  strategySummary: string;
  slots: PlannedSlot[];
}

export class CalendarPlannerAgent {
  private getClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({ apiKey });
  }

  async plan(
    client: Partial<ClientWorkspace>,
    brandProfile: Partial<ClientBrandProfile> | null,
    days: 7 | 14 | 30 = 7
  ): Promise<CalendarPlanResult> {
    const ai = this.getClient();
    const clientName = client.name || 'Client Brand';
    const industry = client.industry || client.business_category || 'Business Services';
    const lang = client.preferred_language || 'English';

    const systemInstruction = `You are the Principal Social Media Strategist at SocialSetu.
You engineer highly strategic, conversion-oriented content calendars for Indian brands.
Incorporate Indian cultural context, peak mobile engagement windows (11:00 AM - 1:00 PM and 7:00 PM - 9:30 PM IST), and diverse content pillars.
Language: ${lang}.
Respond ONLY in valid JSON conforming to the requested schema.`;

    const prompt = `Plan a ${days}-day social media content calendar for:
Brand: ${clientName}
Industry: ${industry}
Target Audience: ${client.target_audience || 'Entrepreneurs and Consumers'}
Brand Voice: ${brandProfile?.brand_voice || 'Professional and Inspiring'}

Generate ${days} planned content slots.

Schema:
{
  "strategySummary": "A 2-3 sentence strategic rationale for this calendar cycle",
  "slots": [
    {
      "dayIndex": 1,
      "dateFormatted": "Day 1 (e.g. Monday)",
      "recommendedTime": "11:30 AM IST",
      "pillar": "Educational",
      "topic": "Specific actionable topic",
      "hookConcept": "Specific 1-line hook concept to stop the scroll",
      "targetPlatforms": ["instagram", "facebook_page", "linkedin_page"],
      "format": "carousel"
    }
  ]
}`;

    if (ai) {
      for (const model of CANDIDATE_MODELS) {
        try {
          const res = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              temperature: 0.6,
            },
          });
          const text = res.text?.trim();
          if (text) {
            const parsed = JSON.parse(text);
            return {
              clientName,
              period: `${days}_days` as any,
              strategySummary: parsed.strategySummary || `Strategic ${days}-day growth roadmap for ${clientName}`,
              slots: parsed.slots || [],
            };
          }
        } catch (err) {
          console.warn(`[CalendarPlannerAgent] Model ${model} failed:`, err);
        }
      }
    }

    // High quality deterministic calendar fallback
    const defaultPillars: Array<PlannedSlot['pillar']> = [
      'Educational',
      'Behind The Scenes',
      'Promotional',
      'Social Proof',
      'Educational',
      'Celebration',
      'Promotional',
    ];

    const slots: PlannedSlot[] = [];
    for (let i = 1; i <= Math.min(days, 7); i++) {
      const pillar = defaultPillars[(i - 1) % defaultPillars.length];
      slots.push({
        dayIndex: i,
        dateFormatted: `Day ${i}`,
        recommendedTime: i % 2 === 0 ? '7:30 PM IST' : '11:30 AM IST',
        pillar,
        topic: `${pillar} spotlight for ${industry} in India`,
        hookConcept: `The secret to faster growth in ${industry} that nobody talks about.`,
        targetPlatforms: ['instagram', 'facebook_page', 'linkedin_page'],
        format: pillar === 'Educational' ? 'carousel' : 'post',
      });
    }

    return {
      clientName,
      period: `${days}_days` as any,
      strategySummary: `Comprehensive growth rhythm alternating between educational authority, trust-building behind the scenes, and direct conversion offers.`,
      slots,
    };
  }
}
