import { z } from 'zod';

export const createAnalysisSchema = z
  .object({
    resumeId: z
      .string()
      .trim()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid resumeId format. Must be a 24-character hex ObjectId.'),
    jobDescriptionId: z
      .string()
      .trim()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid jobDescriptionId format. Must be a 24-character hex ObjectId.')
      .optional(),
  })
  .strict();

export type CreateAnalysisInput = z.infer<typeof createAnalysisSchema>;
