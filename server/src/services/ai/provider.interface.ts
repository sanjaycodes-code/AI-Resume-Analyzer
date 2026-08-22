export interface AnalyzeResumeInput {
  resumeText: string;
  jobDescriptionText?: string;
}

export interface EnhanceBulletInput {
  originalText: string;
  targetRole?: string;
  analysisId?: string;
}

export interface AIProvider {
  analyzeResume(input: AnalyzeResumeInput): Promise<unknown>;
  enhanceBullet(input: EnhanceBulletInput): Promise<unknown>;
}
