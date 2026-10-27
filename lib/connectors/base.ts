import { PlatformId } from '@/lib/types/enterprise';

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  tokenSecret?: string;
  expiresAt?: string;
  scopes: string[];
  rawPayload?: Record<string, any>;
}

export interface SocialAccountProfile {
  externalId: string;
  accountName: string;
  accountHandle?: string;
  profilePictureUrl?: string;
  accountType: string;
}

export interface PostPayload {
  caption: string;
  hashtags?: string[];
  mediaUrls?: string[];
  postType: 'post' | 'reel' | 'story' | 'carousel';
}

export interface PublishResult {
  success: boolean;
  externalPostId?: string;
  postUrl?: string;
  errorMessage?: string;
  rawResponse?: Record<string, any>;
}

export interface PlatformMetrics {
  followersCount: number;
  followingCount?: number;
  reach: number;
  impressions: number;
  engagementRate: number;
  postsCount: number;
  profileViews?: number;
  rawMetrics?: Record<string, any>;
}

export interface Interaction {
  id: string;
  externalId: string;
  authorName: string;
  authorHandle?: string;
  content: string;
  occurredAt: string;
  postId?: string;
}

/**
 * Abstract Connector Interface
 * All social connectors (Meta, LinkedIn, YouTube, X) implement this interface.
 */
export interface SocialConnector {
  platformId: PlatformId;
  getAuthUrl(state: string, redirectUri: string): Promise<string>;
  exchangeCode(code: string, redirectUri: string): Promise<OAuthTokens>;
  refreshToken(refreshToken: string): Promise<OAuthTokens>;
  getProfile(tokens: OAuthTokens): Promise<SocialAccountProfile>;
  publishPost(tokens: OAuthTokens, content: PostPayload): Promise<PublishResult>;
  getAnalytics(tokens: OAuthTokens): Promise<PlatformMetrics>;
  getRecentInteractions(tokens: OAuthTokens): Promise<Interaction[]>;
  replyToInteraction(tokens: OAuthTokens, interactionId: string, message: string): Promise<{ success: boolean; error?: string }>;
}
