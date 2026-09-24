import { z } from 'zod';

export function normalizeIndianPhone(input?: string): string {
  if (!input) return '';
  let cleaned = input.replace(/\D/g, '');
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    cleaned = cleaned.slice(2);
  }
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    cleaned = cleaned.slice(1);
  }
  return cleaned;
}

export const leadSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  business: z.string().min(2, "Business name required").max(200),
  phone: z.string().transform(normalizeIndianPhone).refine(
    (v) => /^[6-9]\d{9}$/.test(v),
    "Enter a valid 10-digit Indian mobile number"
  ),
  email: z.string().email("Enter a valid email").or(z.literal('')),
  city: z.string().min(1, "Select a city"),
  industry: z.string().min(1, "Select an industry"),
  value: z.number().min(0).max(10000000),
});

export const contactSubmissionSchema = z.object({
  name: z.string().min(2, "Name required"),
  source: z.string(),
  phone: z
    .string()
    .optional()
    .transform((v) => (v ? normalizeIndianPhone(v) : ''))
    .refine(
      (v) => {
        if (!v) return true;
        return /^[6-9]\d{9}$/.test(v);
      },
      "Enter a valid 10-digit Indian mobile number"
    ),
  email: z.string().email("Enter a valid email").optional().or(z.literal('')),
  // Allow additional fields from the landing form (city/industry/budget/message)
  // without failing validation; they are persisted server-side.
  city: z.string().optional(),
  industry: z.string().optional(),
  budget: z.string().optional(),
  message: z.string().optional(),
  website: z.string().optional(),
});

