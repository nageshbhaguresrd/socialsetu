import { z } from 'zod';

export const createBusinessSchema = z.object({
  name: z.string().min(2, 'Business name must be at least 2 characters').max(100),
  industry: z.string().optional(),
  description: z.string().optional(),
  preferred_language: z.enum(['en', 'hi', 'mr']).default('en'),
});

export const updateBusinessSchema = createBusinessSchema.partial();

export const leadSchema = z.object({
  business_id: z.string().uuid('Invalid business workspace ID'),
  name: z.string().min(1, 'Lead contact name is required').max(100),
  phone: z.string().max(25).optional().nullable(),
  email: z.string().email('Invalid email address').optional().nullable().or(z.literal('')),
  company: z.string().max(100).optional().nullable(),
  source: z.string().default('Direct'),
  requirement: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(['new', 'contacted', 'interested', 'won', 'lost']).default('new'),
  next_follow_up_at: z.string().optional().nullable(),
});

export const leadActivitySchema = z.object({
  lead_id: z.string().uuid('Invalid lead ID'),
  business_id: z.string().uuid('Invalid business workspace ID'),
  activity_type: z.string().min(1, 'Activity type is required'),
  description: z.string().min(1, 'Activity description is required'),
});

export const marketingGenerateSchema = z.object({
  business_id: z.string().uuid('Invalid business workspace ID'),
  topic: z.string().min(3, 'Topic must be at least 3 characters'),
  platform: z.enum(['instagram', 'facebook', 'linkedin', 'whatsapp']).default('instagram'),
  language: z.enum(['en', 'hi', 'mr', 'hinglish']).default('en'),
  tone: z.enum(['professional', 'friendly', 'promotional', 'creative', 'informative']).default('promotional'),
  target_audience: z.string().optional(),
  offer_details: z.string().optional(),
});

export const salesEntrySchema = z.object({
  business_id: z.string().uuid('Invalid business workspace ID'),
  amount: z.number().positive('Sales amount must be greater than zero'),
  description: z.string().optional().nullable(),
  entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

export const expenseEntrySchema = z.object({
  business_id: z.string().uuid('Invalid business workspace ID'),
  amount: z.number().positive('Expense amount must be greater than zero'),
  category: z.string().min(1, 'Category is required').default('General'),
  description: z.string().optional().nullable(),
  entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

export const assistantChatSchema = z.object({
  business_id: z.string().uuid('Invalid business workspace ID'),
  conversation_id: z.string().uuid().optional().nullable(),
  message: z.string().min(1, 'Question or prompt is required'),
  language: z.enum(['en', 'hi', 'mr']).default('en'),
});

export const checkoutSchema = z.object({
  business_id: z.string().uuid('Invalid business workspace ID'),
  plan_code: z.enum(['free', 'starter', 'professional', 'business', 'enterprise']),
});
