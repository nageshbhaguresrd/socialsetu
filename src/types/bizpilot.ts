export type BusinessRole = 'owner' | 'admin' | 'manager' | 'staff';

export type LeadStatus = 'new' | 'contacted' | 'interested' | 'won' | 'lost';

export type MarketingPlatform = 'instagram' | 'facebook' | 'linkedin' | 'whatsapp';

export type ContentStatus = 'draft' | 'published' | 'archived';

export type SubscriptionPlanCode = 'free' | 'starter' | 'professional' | 'business' | 'enterprise';

export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';

export interface UserProfile {
  id: string;
  display_name?: string | null;
  avatar_url?: string | null;
  preferred_language: 'en' | 'hi' | 'mr';
  is_platform_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface Business {
  id: string;
  name: string;
  slug: string;
  industry?: string | null;
  description?: string | null;
  preferred_language: 'en' | 'hi' | 'mr';
  currency_code: string; // 'INR'
  timezone: string; // 'Asia/Kolkata'
  created_at: string;
  updated_at: string;
}

export interface BusinessMember {
  id: string;
  business_id: string;
  user_id: string;
  role: BusinessRole;
  created_at: string;
  user_profile?: UserProfile | null;
}

export interface Lead {
  id: string;
  business_id: string;
  assigned_to?: string | null;
  name: string;
  phone?: string | null;
  email?: string | null;
  company?: string | null;
  source?: string | null;
  requirement?: string | null;
  notes?: string | null;
  status: LeadStatus;
  next_follow_up_at?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadActivity {
  id: string;
  business_id: string;
  lead_id: string;
  activity_type: string; // 'call' | 'note' | 'status_change' | 'whatsapp' | 'email'
  description: string;
  created_by?: string | null;
  created_at: string;
}

export interface MarketingContent {
  id: string;
  business_id: string;
  platform: MarketingPlatform;
  content_type: string;
  language: string; // 'en' | 'hi' | 'mr' | 'hinglish'
  topic: string;
  prompt: string;
  generated_content: string;
  status: ContentStatus;
  created_by?: string | null;
  created_at: string;
}

export interface SalesEntry {
  id: string;
  business_id: string;
  amount: number; // Stored as NUMERIC(12,2)
  currency_code: string;
  description?: string | null;
  entry_date: string;
  created_by?: string | null;
  created_at: string;
}

export interface ExpenseEntry {
  id: string;
  business_id: string;
  amount: number; // Stored as NUMERIC(12,2)
  currency_code: string;
  category: string;
  description?: string | null;
  entry_date: string;
  created_by?: string | null;
  created_at: string;
}

export interface AIConversation {
  id: string;
  business_id: string;
  user_id: string;
  title: string;
  created_at: string;
}

export interface AIMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export interface AIUsageReservation {
  id: string;
  business_id: string;
  user_id: string;
  status: 'reserved' | 'consumed' | 'released';
  reserved_at: string;
  expires_at: string;
}

export interface AIUsageLog {
  id: string;
  business_id: string;
  user_id: string;
  feature: string;
  provider: string; // 'google'
  model: string; // 'gemini-3.8-flash'
  input_tokens: number;
  output_tokens: number;
  estimated_cost: number;
  status: string;
  created_at: string;
}

export interface Plan {
  id: string;
  code: SubscriptionPlanCode;
  name: string;
  monthly_price_paise: number;
  ai_generations_limit: number;
  member_limit: number;
  lead_limit: number;
  features: Record<string, boolean | string | number>;
  is_active: boolean;
}

export interface Subscription {
  id: string;
  business_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  provider?: string | null; // 'razorpay'
  provider_customer_id?: string | null;
  provider_subscription_id?: string | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
  created_at: string;
  updated_at: string;
  plan?: Plan | null;
}

export interface Notification {
  id: string;
  business_id: string;
  user_id?: string | null;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'alert' | 'follow_up';
  is_read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  business_id?: string | null;
  user_id?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  metadata?: Record<string, any>;
  created_at: string;
}
