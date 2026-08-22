import { z } from 'zod';

export const keywordAnalysisSchema = z.object({
  matchedKeywords: z.array(z.string()).default([]),
  missingKeywords: z.array(z.string()).default([]),
  keywordDensityScore: z.number().min(0).max(100).default(70),
});

export const experienceAnalysisSchema = z.object({
  rating: z.number().min(0).max(100).default(75),
  feedback: z.string().default(''),
  bulletPointSuggestions: z.array(z.string()).default([]),
});

export const educationAnalysisSchema = z.object({
  rating: z.number().min(0).max(100).default(80),
  feedback: z.string().default(''),
});

export const projectAnalysisSchema = z.object({
  rating: z.number().min(0).max(100).default(80),
  feedback: z.string().default(''),
  highlightedProjects: z.array(z.string()).default([]),
});

export const aiAnalysisResultSchema = z.object({
  skillsFound: z.array(z.string()).default([]),
  missingSkills: z.array(z.string()).default([]),
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
  recommendations: z.array(z.string()).default([]),
  keywordAnalysis: keywordAnalysisSchema.default({
    matchedKeywords: [],
    missingKeywords: [],
    keywordDensityScore: 70,
  }),
  experienceAnalysis: experienceAnalysisSchema.default({
    rating: 75,
    feedback: '',
    bulletPointSuggestions: [],
  }),
  educationAnalysis: educationAnalysisSchema.default({
    rating: 80,
    feedback: '',
  }),
  projectAnalysis: projectAnalysisSchema.default({
    rating: 80,
    feedback: '',
    highlightedProjects: [],
  }),
  executiveSummary: z.string().default(''),
});

export type AIAnalysisResult = z.infer<typeof aiAnalysisResultSchema>;
