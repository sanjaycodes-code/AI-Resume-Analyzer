import type { ApiResponse } from './index';
import type { Resume } from './resume.types';

export interface ScoreCategory {
  score: number;
  maxScore: number;
  label: string;
  feedback: string;
}

export interface ScoreBreakdown {
  keywordMatch: ScoreCategory;
  sectionCompleteness: ScoreCategory;
  contactInfo: ScoreCategory;
  actionVerbs: ScoreCategory;
  quantifiedImpact: ScoreCategory;
  formattingCleanliness: ScoreCategory;
  scoringProfile?: string;
  roleCategory?: string;
}

export interface FormattingAnalysis {
  score: number;
  maxScore: number;
  label: string;
  feedback: string;
  sectionStructure?: ScoreCategory;
  contactInfo?: ScoreCategory;
  actionVerbs?: ScoreCategory;
  quantifiedImpact?: ScoreCategory;
  disclaimer?: string;
  summary?: string;
}

export interface KeywordAnalysis {
  matchedKeywords: string[];
  missingKeywords: string[];
  keywordDensityScore: number;
  atsBreakdown?: ScoreCategory;
}

export interface SectionAnalysis {
  rating: number;
  feedback: string;
  bulletPointSuggestions?: string[];
  highlightedProjects?: string[];
}

export interface JobDescription {
  _id: string;
  userId: string;
  title: string;
  rawText: string;
  roleCategory?: string;
  extractedKeywords: string[];
  createdAt: string;
  updatedAt: string;
}

export interface EnhancedBullet {
  originalText: string;
  enhancedText: string;
  changesSummary: string[];
  createdAt: string;
}

export interface Analysis {
  _id: string;
  userId: string;
  resumeId: Resume | string;
  jobDescriptionId?: JobDescription | string;
  atsScore: number;
  overallScore: number;
  skillsFound: string[];
  missingSkills: string[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  keywordAnalysis?: KeywordAnalysis;
  experienceAnalysis?: SectionAnalysis;
  educationAnalysis?: SectionAnalysis;
  projectAnalysis?: SectionAnalysis;
  formattingAnalysis?: FormattingAnalysis;
  scoreBreakdown?: ScoreBreakdown;
  enhancedBullets?: EnhancedBullet[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnalysisInput {
  resumeId: string;
  jobDescriptionId?: string;
}

export interface CreateJobInput {
  title: string;
  rawText: string;
}

export type AnalysisResponse = ApiResponse<{ analysis: Analysis }>;
export type AnalysisListResponse = ApiResponse<{ analyses: Analysis[] }> & { count: number };
export type JobResponse = ApiResponse<{ jobDescription: JobDescription }>;
export type JobListResponse = ApiResponse<{ jobDescriptions: JobDescription[] }> & { count: number };
