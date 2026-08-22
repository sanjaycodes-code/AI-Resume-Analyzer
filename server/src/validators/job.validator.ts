import { z } from 'zod';

export const createJobSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Job title is required')
      .max(200, 'Job title cannot exceed 200 characters'),
    rawText: z
      .string()
      .trim()
      .min(10, 'Job description must be at least 10 characters long')
      .max(50000, 'Job description cannot exceed 50,000 characters'),
  })
  .strict();

export type CreateJobInput = z.infer<typeof createJobSchema>;
