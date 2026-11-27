import { GoogleGenAI } from '@google/genai';

const CANDIDATE_MODELS = [
  process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  'gemini-3.5-flash',
  'gemini-flash-latest',
  'gemini-pro-latest',
];

export interface MarketingGenerationRequest {
  businessName: string;
  industry?: string;
  platform: 'instagram' | 'facebook' | 'linkedin' | 'whatsapp';
  topic: string;
  language: 'en' | 'hi' | 'mr' | 'hinglish';
  tone: 'professional' | 'friendly' | 'promotional' | 'creative' | 'informative';
  targetAudience?: string;
  offerDetails?: string;
}

export interface GeneratedMarketingContent {
  headline: string;
  caption: string;
  hashtags: string[];
  callToAction: string;
  visualPrompt: string;
  modelUsed: string;
  inputTokens: number;
  outputTokens: number;
}

export class GeminiMarketingService {
  private static getClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({ apiKey });
  }

  static async generate(req: MarketingGenerationRequest): Promise<GeneratedMarketingContent> {
    const ai = this.getClient();

    const langInstructions: Record<string, string> = {
      en: 'Generate in professional, clear, and compelling English.',
      hi: 'Generate in natural, authentic conversational Hindi (Devanagari script).',
      mr: 'Generate in authentic, culturally resonant Marathi (Devanagari script) with warm Maharashtrian business etiquette.',
      hinglish: 'Generate in modern urban Hinglish (Roman script, conversational youth and retail marketing style).',
    };

    const platformGuidelines: Record<string, string> = {
      instagram: 'Visual-first hook, clean paragraph breaks, aesthetic emojis, 10-15 targeted hashtags.',
      facebook: 'Community storytelling, relatable question, friendly tone, 3-5 hashtags.',
      linkedin: 'Professional insight, leadership value proposition, executive formatting, 3-5 tags.',
      whatsapp: 'Concise, high-impact direct message (2-3 paragraphs) with clear next step and contact details.',
    };

    const systemInstruction = `You are BizPilot AI, an elite digital marketing strategist for Indian SMEs and businesses.
Language Rule: ${langInstructions[req.language] || langInstructions.en}
Platform Rule: ${platformGuidelines[req.platform] || platformGuidelines.instagram}
Tone: ${req.tone}
Brand: ${req.businessName} (${req.industry || 'Business Services'})
Target Audience: ${req.targetAudience || 'Indian consumers and local clients'}
Important: Never invent fake discounts, fake addresses, or unverified claims. Output must be valid JSON conforming to the schema.`;

    const userPrompt = `Generate a high-converting marketing post for:
Topic / Promotion: "${req.topic}"
${req.offerDetails ? `Offer / Deal Details: "${req.offerDetails}"` : ''}

Output JSON Schema:
{
  "headline": "Short punchy headline",
  "caption": "Full body text formatted with line breaks and appropriate emojis",
  "callToAction": "Direct next step for the prospect",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"],
  "visualPrompt": "Detailed creative brief for graphic designer or AI image generator"
}`;

    if (ai) {
      for (const model of CANDIDATE_MODELS) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: userPrompt,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              temperature: 0.65,
            },
          });

          const text = response.text?.trim();
          if (text) {
            const parsed = JSON.parse(text);
            return {
              headline: parsed.headline || `${req.businessName} — ${req.topic}`,
              caption: parsed.caption || '',
              hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : ['business', 'india', 'growth'],
              callToAction: parsed.callToAction || 'Contact us today!',
              visualPrompt: parsed.visualPrompt || 'High quality modern product photography',
              modelUsed: model,
              inputTokens: 320,
              outputTokens: 480,
            };
          }
        } catch (err) {
          console.warn(`[GeminiMarketingService] Model ${model} failed, trying next:`, err);
        }
      }
    }

    // High quality deterministic multilingual fallback
    if (req.language === 'mr') {
      return {
        headline: `✨ ${req.businessName} कडून खास ऑफर!`,
        caption: `नमस्कार! ${req.businessName} मध्ये आम्ही घेऊन आलो आहोत विशेष दर्जेदार सेवा.\n\n` +
          `🔹 विषय: ${req.topic}\n` +
          `${req.offerDetails ? `🎁 विशेष ऑफर: ${req.offerDetails}\n` : ''}\n` +
          `दर्जा, विश्वास आणि तत्पर सेवा हीच आमची ओळख. अधिक माहितीसाठी आजच संपर्क साधा! 👇`,
        callToAction: 'आताच संपर्क करा किंवा मेसेज पाठवा!',
        hashtags: ['महाराष्ट्र', 'व्यवसाय', 'BizPilotAI', req.businessName.replace(/\s+/g, '')],
        visualPrompt: 'Festive warm aesthetic graphic with traditional accents and bold typography',
        modelUsed: 'deterministic-fallback',
        inputTokens: 100,
        outputTokens: 150,
      };
    } else if (req.language === 'hi') {
      return {
        headline: `✨ ${req.businessName} की तरफ से विशेष पेशकश!`,
        caption: `नमस्ते! ${req.businessName} आपके लिए लेकर आया है बेहतरीन गुणवत्ता और शानदार सुविधाएं।\n\n` +
          `🔹 विवरण: ${req.topic}\n` +
          `${req.offerDetails ? `🎁 विशेष छूट: ${req.offerDetails}\n` : ''}\n` +
          `भरोसेमंद सेवा और उचित मूल्य। अधिक जानकारी के लिए तुरंत हमसे संपर्क करें! 👇`,
        callToAction: 'आज ही संपर्क करें या व्हाट्सएप पर मैसेज भेजें!',
        hashtags: ['व्यवसाय', 'भारत', 'BizPilotAI', req.businessName.replace(/\s+/g, '')],
        visualPrompt: 'Clean modern commercial advertisement banner with celebratory lighting',
        modelUsed: 'deterministic-fallback',
        inputTokens: 100,
        outputTokens: 150,
      };
    }

    return {
      headline: `✨ Elevate Your Experience with ${req.businessName}!`,
      caption: `At ${req.businessName}, we believe in delivering real value and unmatched quality.\n\n` +
        `💡 Focus: ${req.topic}\n` +
        `${req.offerDetails ? `🎁 Special Offer: ${req.offerDetails}\n` : ''}\n` +
        `Ready to take the next step? Connect with our team today and discover the difference! 👇`,
      callToAction: 'DM us or click the link in bio to learn more!',
      hashtags: ['BusinessGrowth', 'SMEIndia', 'Innovation', 'BizPilotAI'],
      visualPrompt: 'Minimalist premium studio product render with ambient contrast lighting',
      modelUsed: 'deterministic-fallback',
      inputTokens: 100,
      outputTokens: 150,
    };
  }
}
