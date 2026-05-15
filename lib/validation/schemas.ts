import { z } from 'zod';

export const leadSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  business: z.string().min(2, "Business name required").max(200),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
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
    .refine(
      (v) => {
        if (!v) return true
        // reuse the same indian mobile rule used in leadSchema
        return /^[6-9]\d{9}$/.test(v)
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

