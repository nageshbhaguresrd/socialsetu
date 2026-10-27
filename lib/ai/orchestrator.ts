import { ContentCreatorAgent, ContentGenerationPrompt, GeneratedPostContent } from './agents/contentCreator';
import { PlatformAdapterAgent, AdapterResult } from './agents/adapter';
import { QualityInspectorAgent, InspectionResult } from './agents/qualityInspector';
import { CalendarPlannerAgent, CalendarPlanResult } from './agents/calendarPlanner';
import { ClientWorkspace, ClientBrandProfile, PlatformId } from '@/lib/types/enterprise';
import { GoogleGenAI } from '@google/genai';

const CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.5-flash',
  'gemini-flash-latest',
  'gemini-pro-latest',
];

export interface CelebrationPrompt {
  contactName: string;
  eventType: 'birthday' | 'anniversary' | 'client_milestone' | 'festival';
  relationship: string; // e.g. "Customer", "VIP Partner", "Team Member"
  language: 'English' | 'Hindi' | 'Marathi' | 'Hinglish';
  yearsMilestone?: number;
  customNote?: string;
}

export interface CelebrationGreetingResult {
  headline: string;
  greetingText: string;
  callToAction: string;
  smsOrWhatsAppText: string;
  imagePrompt: string;
  suggestedHashtags: string[];
}

export class AISocialOrchestrator {
  private contentCreator = new ContentCreatorAgent();
  private adapter = new PlatformAdapterAgent();
  private inspector = new QualityInspectorAgent();
  private planner = new CalendarPlannerAgent();

  /**
   * Generate brand-aligned primary content
   */
  async createPost(
    client: Partial<ClientWorkspace>,
    brandProfile: Partial<ClientBrandProfile> | null,
    prompt: ContentGenerationPrompt
  ): Promise<GeneratedPostContent> {
    return this.contentCreator.generate(client, brandProfile, prompt);
  }

  /**
   * Adapt 1 master post into 5 platform-specific payloads
   */
  async adaptPost(
    masterText: string,
    brandName: string,
    brandVoice: string = 'Professional'
  ): Promise<AdapterResult> {
    return this.adapter.adapt(masterText, brandName, brandVoice);
  }

  /**
   * Inspect post quality and brand compliance
   */
  async inspectPost(
    content: string,
    platform: PlatformId,
    brandVoice: string = 'Professional',
    bannedWords: string[] = []
  ): Promise<InspectionResult> {
    return this.inspector.inspect(content, platform, brandVoice, bannedWords);
  }

  /**
   * Generate multi-day strategic calendar plan
   */
  async planCalendar(
    client: Partial<ClientWorkspace>,
    brandProfile: Partial<ClientBrandProfile> | null,
    days: 7 | 14 | 30 = 7
  ): Promise<CalendarPlanResult> {
    return this.planner.plan(client, brandProfile, days);
  }

  /**
   * Generate multilingual birthday or anniversary greeting
   */
  async generateCelebrationGreeting(
    client: Partial<ClientWorkspace>,
    brandProfile: Partial<ClientBrandProfile> | null,
    prompt: CelebrationPrompt
  ): Promise<CelebrationGreetingResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

    const brandName = client.name || 'Our Company';
    const lang = prompt.language || client.preferred_language || 'English';

    const systemInstruction = `You are the Celebration and Relationship Marketing Agent at SocialSetu.
You compose warm, genuine, culturally rich birthday, anniversary, and milestone greetings from brands to their clients, partners, and community members.
Language: ${lang}.
If Marathi: Use touching, authentic Marathi (e.g. हार्दिक शुभेच्छा, वाढदिवसाच्या मनःपूर्वक शुभेच्छा).
If Hindi: Use cordial, celebratory Hindi (e.g. जन्मदिन की हार्दिक शुभकामनाएं, वर्षगांठ की बधाई).
If English: Warm, elegant, non-robotic.
Tone: Warm, respectful, memorable.
Respond ONLY in valid JSON.`;

    const userPrompt = `Generate a ${prompt.eventType} celebration message for:
Recipient: ${prompt.contactName} (${prompt.relationship})
Brand Sender: ${brandName}
${prompt.yearsMilestone ? `Milestone: ${prompt.yearsMilestone} Years` : ''}
${prompt.customNote ? `Personalized Note: ${prompt.customNote}` : ''}

Output JSON schema:
{
  "headline": "Short celebratory title",
  "greetingText": "Main social media or email greeting post text (2-3 paragraphs with emojis)",
  "callToAction": "Warm sign-off from the brand",
  "smsOrWhatsAppText": "Concise 2-3 sentence version perfect for WhatsApp or SMS",
  "imagePrompt": "Creative concept prompt for graphic designer for the personalized greeting card",
  "suggestedHashtags": ["tag1", "tag2", "tag3"]
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
              temperature: 0.6,
            },
          });
          const text = res.text?.trim();
          if (text) {
            return JSON.parse(text) as CelebrationGreetingResult;
          }
        } catch (err) {
          console.warn(`[CelebrationGreeting] Model ${model} failed:`, err);
        }
      }
    }

    // Deterministic fallback
    if (lang === 'Marathi') {
      return {
        headline: `वाढदिवसाच्या हार्दिक शुभेच्छा, ${prompt.contactName}! 🎂`,
        greetingText: `प्रिय ${prompt.contactName},\n\n${brandName} परिवारातर्फे आपणास वाढदिवसाच्या मनःपूर्वक हार्दिक शुभेच्छा! 💐\n\nआपले पुढील आयुष्य आरोग्यसंपन्न, सुख-समृद्धीचे आणि यशाचे जावो हीच ईश्वरचरणी प्रार्थना.`,
        callToAction: `- मनःपूर्वक, ${brandName} टीम`,
        smsOrWhatsAppText: `वाढदिवसाच्या हार्दिक शुभेच्छा ${prompt.contactName}! आपले आयुष्य सुख आणि यशाने बहरून जावो. - ${brandName}`,
        imagePrompt: `Elegant festive greeting card with marigold borders, diya/celebratory sparkles and gold typography`,
        suggestedHashtags: ['वाढदिवस', 'शुभेच्छा', 'SocialSetu', brandName.replace(/\s+/g, '')],
      };
    } else if (lang === 'Hindi') {
      return {
        headline: `जन्मदिन की हार्दिक शुभकामनाएं, ${prompt.contactName}! 🎂`,
        greetingText: `प्रिय ${prompt.contactName},\n\n${brandName} की पूरी टीम की तरफ से आपको जन्मदिन की ढेर सारी शुभकामनाएं! 🌸\n\nईश्वर से प्रार्थना है कि आपका यह नया साल आपके लिए अपार खुशियां, सफलता और उत्तम स्वास्थ्य लेकर आए।`,
        callToAction: `- सप्रेम, ${brandName} परिवार`,
        smsOrWhatsAppText: `जन्मदिन की बहुत-बहुत बधाई ${prompt.contactName}! आपका हर दिन शुभ और सफल रहे। - ${brandName}`,
        imagePrompt: `Festive greeting visual with soft golden accents and celebratory warm typography`,
        suggestedHashtags: ['जन्मदिन', 'शुभकामनाएं', brandName.replace(/\s+/g, '')],
      };
    }

    return {
      headline: `Happy Birthday, ${prompt.contactName}! 🎉`,
      greetingText: `Wishing a very Happy Birthday to ${prompt.contactName}!\n\nFrom all of us at ${brandName}, we hope your special day is filled with joy, laughter, and unforgettable moments.\n\nThank you for being such an inspiring part of our journey! 🥂`,
      callToAction: `With warm regards,\nTeam ${brandName}`,
      smsOrWhatsAppText: `Happy Birthday ${prompt.contactName}! Wishing you health, happiness, and tremendous success in the year ahead. - From everyone at ${brandName}`,
      imagePrompt: `Festive minimalist greeting card design with modern typography and confetti in brand colors`,
      suggestedHashtags: ['HappyBirthday', 'Celebration', 'Milestone', brandName.replace(/\s+/g, '')],
    };
  }
}

export const aiSocialOrchestrator = new AISocialOrchestrator();
