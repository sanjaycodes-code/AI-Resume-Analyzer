import { z } from 'zod';

export const bulletEnhanceRequestSchema = z
  .object({
    analysisId: z.string().trim().min(1, 'Analysis ID is required'),
    originalText: z
      .string()
      .trim()
      .min(5, 'Bullet text must be at least 5 characters long')
      .max(1000, 'Bullet text must be under 1,000 characters'),
    targetRole: z.string().trim().max(100).optional(),
  })
  .strict();

export const bulletEnhancementResultSchema = z.object({
  enhancedText: z.string().min(1, 'Enhanced text cannot be empty'),
  changesSummary: z.array(z.string()).default([]),
});

export type BulletEnhanceRequest = z.infer<typeof bulletEnhanceRequestSchema>;
export type BulletEnhancementResult = z.infer<typeof bulletEnhancementResultSchema>;
