import { GoogleGenAI } from '@google/genai';
import { ClientWorkspace, ClientBrandProfile } from '@/lib/types/enterprise';

const CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.5-flash',
  'gemini-flash-latest',
  'gemini-pro-latest',
];

export interface ContentGenerationPrompt {
  topic: string;
  campaignGoal?: string;
  postType?: 'post' | 'reel' | 'story' | 'carousel';
  targetAudience?: string;
  language?: 'English' | 'Hindi' | 'Marathi' | 'Hinglish';
  tone?: string;
  customInstructions?: string;
}

export interface GeneratedPostContent {
  headline: string;
  hook: string;
  caption: string;
  callToAction: string;
  hashtags: string[];
  visualPrompt: string;
  suggestedPlatforms: string[];
  engagementTip: string;
}

export class ContentCreatorAgent {
  private getClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({ apiKey });
  }

  async generate(
    client: Partial<ClientWorkspace>,
    brandProfile: Partial<ClientBrandProfile> | null,
    prompt: ContentGenerationPrompt
  ): Promise<GeneratedPostContent> {
    const ai = this.getClient();
    const lang = prompt.language || client.preferred_language || 'English';
    const voice = prompt.tone || brandProfile?.brand_voice || 'Professional and Inspiring';
    const industry = client.industry || client.business_category || 'General Business';
    const audience = prompt.targetAudience || client.target_audience || 'Customers and Community';

    const systemInstruction = `You are the Lead Creative Director and Social Copywriter at SocialSetu.
You create high-converting, platform-optimized social media content for clients across India.
Language: Output must be in ${lang}. If Marathi, use natural, authentic Marathi (Devanagari script). If Hindi, use natural conversational Hindi. If Hinglish, use modern urban Hinglish. If English, use clear, compelling English.
Tone & Voice: ${voice}.
Brand: ${client.name || 'Brand'} (${industry}).
Target Audience: ${audience}.
Respond ONLY in valid JSON conforming to the requested schema.`;

    const userPrompt = `Generate a compelling social media post on the topic: "${prompt.topic}".
Campaign Goal: ${prompt.campaignGoal || 'Brand Awareness and Engagement'}
Post Format: ${prompt.postType || 'post'}
Additional Guidance: ${prompt.customInstructions || 'Make it relatable, authentic, and action-oriented.'}

Schema to return:
{
  "headline": "Short punchy internal title for this post",
  "hook": "First 1-2 lines that stop the scroll",
  "caption": "Full body text of the post formatted with line breaks and emojis where appropriate",
  "callToAction": "Clear next step for the reader",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"],
  "visualPrompt": "Detailed prompt for graphic designer or AI image generator describing the ideal creative asset",
  "suggestedPlatforms": ["instagram", "facebook_page", "linkedin_page"],
  "engagementTip": "Tip on how to respond to early comments or maximize reach"
}`;

    if (ai) {
      for (const model of CANDIDATE_MODELS) {
        try {
          const res = await ai.models.generateContent({
            model,
            contents: userPrompt,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              temperature: 0.7,
            },
          });
          const text = res.text?.trim();
          if (text) {
            return JSON.parse(text) as GeneratedPostContent;
          }
        } catch (err) {
          console.warn(`[ContentCreatorAgent] Model ${model} failed:`, err);
        }
      }
    }

    // High quality deterministic fallback if no AI key configured
    return {
      headline: `${client.name || 'Brand'} - ${prompt.topic}`,
      hook: `✨ Transforming how you think about ${prompt.topic}! Here is what you need to know today.`,
      caption: `At ${client.name || 'our organization'}, we believe in delivering real impact.\n\n` +
        `When it comes to ${prompt.topic}, consistency and quality make all the difference.\n\n` +
        `💡 Key Insight: Focus on value, keep your community engaged, and embrace innovation every single day.\n\n` +
        `How does your team approach ${prompt.topic}? Drop your thoughts below! 👇`,
      callToAction: `Visit our website or message us today to learn more!`,
      hashtags: ['Growth', 'SocialMedia', 'Innovation', 'India', 'DigitalMarketing'],
      visualPrompt: `High quality modern corporate photography featuring warm ambient lighting, subtle brand accents in ${brandProfile?.primary_color || '#FF6B35'}, professional setup.`,
      suggestedPlatforms: ['instagram', 'facebook_page', 'linkedin_page'],
      engagementTip: `Reply to the first 5 comments within 30 minutes to boost algorithmic distribution.`,
    };
  }
}
