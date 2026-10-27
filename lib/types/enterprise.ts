export type UserRole = 'super_admin' | 'agency_manager' | 'client' | 'team_member';

export type SubscriptionPlan = 'starter' | 'professional' | 'agency' | 'enterprise';
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';

export type PostStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'scheduled'
  | 'publishing'
  | 'published'
  | 'failed'
  | 'rejected';

export type PostType = 'post' | 'reel' | 'story' | 'carousel' | 'short' | 'article';

export type PlatformId =
  | 'instagram'
  | 'facebook_page'
  | 'linkedin_page'
  | 'youtube'
  | 'x_twitter'
  | 'tiktok'
  | 'pinterest';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  website?: string | null;
  billing_email?: string | null;
  plan: SubscriptionPlan;
  subscription_status: SubscriptionStatus;
  current_period_end?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientWorkspace {
  id: string;
  organization_id: string;
  name: string;
  business_category?: string | null;
  description?: string | null;
  website_url?: string | null;
  industry?: string | null;
  target_audience?: string | null;
  country: string;
  state?: string | null;
  city?: string | null;
  timezone: string;
  preferred_language: 'English' | 'Hindi' | 'Marathi' | 'Hinglish';
  contact_email?: string | null;
  contact_phone?: string | null;
  opening_hours?: Record<string, string>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClientBrandProfile {
  id: string;
  client_id: string;
  brand_voice: string;
  tone_traits: string[];
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  logo_url?: string | null;
  font_preference: string;
  restricted_topics: string[];
  compliance_notes?: string | null;
  target_keywords: string[];
  cta_defaults: Record<string, string>;
}

export interface SocialAccount {
  id: string;
  client_id: string;
  platform_id: PlatformId;
  account_external_id: string;
  account_name: string;
  account_handle?: string | null;
  profile_picture_url?: string | null;
  account_type: string;
  is_connected: boolean;
  connection_status: 'active' | 'expired' | 'error' | 'disconnected';
  last_synced_at?: string | null;
}

export interface ContentPost {
  id: string;
  client_id: string;
  campaign_id?: string | null;
  created_by_user_id?: string | null;
  title?: string | null;
  content_text: string;
  hashtags: string[];
  target_platforms: PlatformId[];
  post_type: PostType;
  language: string;
  status: PostStatus;
  scheduled_for?: string | null;
  published_at?: string | null;
  ai_generated: boolean;
  ai_model?: string | null;
  quality_score?: number | null;
  error_message?: string | null;
  media?: PostMedia[];
  created_at: string;
  updated_at: string;
}

export interface PostMedia {
  id: string;
  post_id: string;
  media_url: string;
  media_type: 'image' | 'video' | 'carousel_item';
  position: number;
  caption?: string | null;
}

export interface ApprovalRequest {
  id: string;
  post_id: string;
  client_id: string;
  requested_by?: string | null;
  reviewed_by?: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  client_feedback?: string | null;
  reviewed_at?: string | null;
  created_at: string;
}

export interface ContactRecord {
  id: string;
  client_id: string;
  first_name: string;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  relationship: 'customer' | 'employee' | 'vip' | 'partner' | 'vendor';
  whatsapp_opt_in: boolean;
  email_opt_in: boolean;
  tags: string[];
  notes?: string | null;
  events?: ContactEvent[];
}

export interface ContactEvent {
  id: string;
  contact_id: string;
  client_id: string;
  event_type: 'birthday' | 'anniversary' | 'company_foundation' | 'work_anniversary' | 'customer_milestone';
  event_date: string;
  notify_days_in_advance: number;
}

export interface GreetingJob {
  id: string;
  contact_id: string;
  client_id: string;
  event_type: string;
  greeting_text: string;
  media_url?: string | null;
  channel: 'whatsapp' | 'email' | 'social_post' | 'manual';
  status: 'draft' | 'pending_approval' | 'approved' | 'scheduled' | 'sent' | 'failed';
  scheduled_for: string;
  sent_at?: string | null;
}

export interface EngagementItem {
  id: string;
  client_id: string;
  social_account_id: string;
  external_interaction_id: string;
  item_type: 'comment' | 'mention' | 'direct_message' | 'review';
  author_name: string;
  author_handle?: string | null;
  content: string;
  sentiment?: 'positive' | 'neutral' | 'negative' | 'urgent' | null;
  classification?: 'question' | 'complaint' | 'praise' | 'lead_inquiry' | 'spam' | null;
  is_answered: boolean;
  post_id?: string | null;
  occurred_at: string;
}

export interface AutomationRule {
  id: string;
  client_id: string;
  name: string;
  trigger_type: string;
  conditions: Record<string, any>;
  actions: Record<string, any>;
  is_enabled: boolean;
  requires_approval: boolean;
  last_executed_at?: string | null;
}
