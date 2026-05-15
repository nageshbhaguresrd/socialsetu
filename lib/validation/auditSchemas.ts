import { z } from 'zod'

export const auditNewSchema = z.object({
  clientName: z.string().min(1, 'Client name is required'),
  industry: z.string().optional().or(z.literal('')),
  targetAudience: z.string().optional().or(z.literal('')),
  businessGoal: z.string().optional().or(z.literal('')),
  leadId: z.string().optional().or(z.literal('')),
  platforms: z
    .object({
      youtube: z.string().optional().or(z.literal('')),
      instagram: z.string().optional().or(z.literal('')),
      twitter: z.string().optional().or(z.literal('')),
      linkedin: z.string().optional().or(z.literal('')),
      facebook: z.string().optional().or(z.literal('')),
    })
    .refine((p) => Object.values(p).some((v) => String(v || '').trim().length > 0), {
      message: 'Enter at least one platform handle',
    }),
})

