import { GoogleGenAI } from '@google/genai';
import { PlatformId } from '@/lib/types/enterprise';

const CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.5-flash',
  'gemini-flash-latest',
  'gemini-pro-latest',
];

export interface PlatformVariant {
  platform: PlatformId;
  caption: string;
  hashtags: string[];
  charCount: number;
  callToAction: string;
  formattingNotes: string;
}

export interface AdapterResult {
  variants: Record<PlatformId, PlatformVariant>;
}

export class PlatformAdapterAgent {
  private getClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({ apiKey });
  }

  async adapt(
    masterText: string,
    brandName: string,
    brandVoice: string = 'Professional'
  ): Promise<AdapterResult> {
    const ai = this.getClient();

    const systemInstruction = `You are the Cross-Platform Social Adaptation Specialist at SocialSetu.
You take a master social post and reformat/optimize it specifically for each individual platform's culture, algorithms, and formatting rules:
- Instagram: Visual-first copy, aesthetic line breaks, 10-15 targeted hashtags, carousel or reel hook.
- Facebook: Community storytelling, discussion starter, question at the end, 3-5 hashtags.
- LinkedIn: Professional tone, career or business takeaway, white-space readability, 3-5 authoritative hashtags.
- YouTube: Title format (<70 chars), keyword-rich description, video tags, YouTube Shorts description.
- X (Twitter): Strict character limit (<280 chars total including hashtags), snappy hook, punchy takeaway, 2 hashtags max.

Respond ONLY in valid JSON conforming to the requested schema.`;

    const userPrompt = `Master Post Concept:
"""
${masterText}
"""
Brand: ${brandName}
Brand Voice: ${brandVoice}

Generate platform-specific adaptations for instagram, facebook_page, linkedin_page, youtube, and x_twitter.

Schema:
{
  "instagram": {
    "caption": "Instagram caption with spacing and emojis",
    "hashtags": ["tag1", "tag2", "tag3"],
    "callToAction": "Instagram CTA (e.g., link in bio, comment below)",
    "formattingNotes": "Recommended visual format: 1:1 or 4:5 carousel"
  },
  "facebook_page": {
    "caption": "Facebook post text",
    "hashtags": ["tag1", "tag2"],
    "callToAction": "Facebook CTA",
    "formattingNotes": "Share as single image or link preview"
  },
  "linkedin_page": {
    "caption": "LinkedIn post text with professional spacing",
    "hashtags": ["tag1", "tag2", "tag3"],
    "callToAction": "LinkedIn CTA",
    "formattingNotes": "Ideal for PDF carousel or leadership text post"
  },
  "youtube": {
    "caption": "Video/Shorts Title and Description with timestamps and tags",
    "hashtags": ["Shorts", "tag1", "tag2"],
    "callToAction": "Subscribe and comment CTA",
    "formattingNotes": "Ideal for vertical 9:16 Short or community tab post"
  },
  "x_twitter": {
    "caption": "Concise tweet under 250 characters",
    "hashtags": ["tag1", "tag2"],
    "callToAction": "RT or reply CTA",
    "formattingNotes": "Single tweet with media attachment"
  }
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
              temperature: 0.5,
            },
          });
          const text = res.text?.trim();
          if (text) {
            const parsed = JSON.parse(text);
            const buildVariant = (p: PlatformId, v: any): PlatformVariant => ({
              platform: p,
              caption: v?.caption || masterText,
              hashtags: Array.isArray(v?.hashtags) ? v.hashtags : [],
              charCount: (v?.caption || masterText).length,
              callToAction: v?.callToAction || 'Learn more',
              formattingNotes: v?.formattingNotes || 'Standard post',
            });

            return {
              variants: {
                instagram: buildVariant('instagram', parsed.instagram),
                facebook_page: buildVariant('facebook_page', parsed.facebook_page),
                linkedin_page: buildVariant('linkedin_page', parsed.linkedin_page),
                youtube: buildVariant('youtube', parsed.youtube),
                x_twitter: buildVariant('x_twitter', parsed.x_twitter),
                tiktok: buildVariant('tiktok', parsed.instagram),
                pinterest: buildVariant('pinterest', parsed.instagram),
              },
            };
          }
        } catch (err) {
          console.warn(`[PlatformAdapterAgent] Model ${model} failed:`, err);
        }
      }
    }

    // High quality deterministic fallback
    const shortTweet = masterText.length > 220 ? masterText.substring(0, 217) + '...' : masterText;

    return {
      variants: {
        instagram: {
          platform: 'instagram',
          caption: `${masterText}\n\n✨ Follow @${brandName.toLowerCase().replace(/\s+/g, '')} for daily tips!`,
          hashtags: ['socialmedia', 'growth', 'marketing', 'india', 'brand'],
          charCount: masterText.length,
          callToAction: 'Tap link in bio to read more!',
          formattingNotes: 'Recommended as 4:5 vertical carousel',
        },
        facebook_page: {
          platform: 'facebook_page',
          caption: `${masterText}\n\nWhat are your thoughts on this? Let us know in the comments below! 👇`,
          hashtags: ['community', 'businessgrowth'],
          charCount: masterText.length,
          callToAction: 'Leave a comment below',
          formattingNotes: 'Single image post with conversation prompt',
        },
        linkedin_page: {
          platform: 'linkedin_page',
          caption: `Insight from ${brandName}:\n\n${masterText}\n\nAgree or disagree? Looking forward to perspectives from our network.`,
          hashtags: ['leadership', 'strategy', 'business'],
          charCount: masterText.length,
          callToAction: 'Share your perspective in the comments',
          formattingNotes: 'Thought leadership post with document attachment',
        },
        youtube: {
          platform: 'youtube',
          caption: `🔥 ${masterText.slice(0, 60)} | ${brandName}\n\n${masterText}\n\nSubscribe for more growth breakdowns!`,
          hashtags: ['Shorts', 'Growth', 'India'],
          charCount: masterText.length,
          callToAction: 'Subscribe for daily updates',
          formattingNotes: '9:16 YouTube Short or Community Tab update',
        },
        x_twitter: {
          platform: 'x_twitter',
          caption: shortTweet,
          hashtags: ['growth', 'india'],
          charCount: shortTweet.length,
          callToAction: 'Reply or repost',
          formattingNotes: 'Punchy single tweet',
        },
        tiktok: {
          platform: 'tiktok',
          caption: shortTweet,
          hashtags: ['viral', 'trends'],
          charCount: shortTweet.length,
          callToAction: 'Follow for part 2',
          formattingNotes: 'Fast-paced video caption',
        },
        pinterest: {
          platform: 'pinterest',
          caption: masterText,
          hashtags: ['inspiration', 'tips'],
          charCount: masterText.length,
          callToAction: 'Save pin',
          formattingNotes: '2:3 vertical graphic pin',
        },
      },
    };
  }
}
