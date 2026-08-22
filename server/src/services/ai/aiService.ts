import { AIProvider, AnalyzeResumeInput, EnhanceBulletInput } from './provider.interface';
import { GeminiProvider } from './geminiProvider';
import { aiAnalysisResultSchema, AIAnalysisResult } from '../../validators/aiAnalysis.validator';
import {
  bulletEnhanceRequestSchema,
  bulletEnhancementResultSchema,
  BulletEnhancementResult,
} from '../../validators/bulletEnhancement.validator';
import { env } from '../../config/env';
import { ApiError } from '../../utils/apiError';

export class AIService {
  private provider: AIProvider;

  constructor() {
    this.provider = this.resolveProvider();
  }

  private resolveProvider(): AIProvider {
    switch (env.AI_PROVIDER.toLowerCase()) {
      case 'gemini':
      default:
        return new GeminiProvider();
    }
  }

  /**
   * Evaluates a resume (and optional job description) using the active AI provider,
   * validates against the Zod schema, and retries once on validation failure.
   */
  public async analyzeResume(input: AnalyzeResumeInput): Promise<AIAnalysisResult> {
    if (!input.resumeText || input.resumeText.trim() === '') {
      throw ApiError.badRequest('Resume text cannot be empty for AI analysis.', 'EMPTY_RESUME_TEXT');
    }

    let rawResult: unknown;
    let attempt = 1;
    const maxAttempts = 2;

    while (attempt <= maxAttempts) {
      try {
        rawResult = await this.provider.analyzeResume(input);

        // Validate structure with Zod
        const validation = aiAnalysisResultSchema.safeParse(rawResult);

        if (validation.success) {
          return validation.data;
        }

        console.warn(
          `[AIService] Validation attempt ${attempt} failed:`,
          validation.error.issues
        );

        if (attempt === maxAttempts) {
          throw ApiError.internal(
            `AI analysis output failed schema validation: ${validation.error.message}`,
            'AI_VALIDATION_FAILED'
          );
        }
      } catch (error: unknown) {
        if (error instanceof ApiError) {
          throw error;
        }
        if (attempt === maxAttempts) {
          const message = error instanceof Error ? error.message : 'Unknown AI analysis failure';
          throw ApiError.internal(`AI analysis failed: ${message}`, 'AI_ANALYSIS_FAILED');
        }
      }

      attempt++;
    }

    throw ApiError.internal('AI analysis failed after multiple attempts.', 'AI_ANALYSIS_FAILED');
  }

  /**
   * Rewrites a single resume bullet using STAR methodology and strong action verbs,
   * validating response shape with retry-once-then-fail pattern.
   */
  public async enhanceBullet(input: EnhanceBulletInput): Promise<BulletEnhancementResult> {
    const validatedInput = bulletEnhanceRequestSchema.parse(input);

    let rawResult: unknown;
    let attempt = 1;
    const maxAttempts = 2;

    while (attempt <= maxAttempts) {
      try {
        rawResult = await this.provider.enhanceBullet(validatedInput);

        const validation = bulletEnhancementResultSchema.safeParse(rawResult);

        if (validation.success) {
          return validation.data;
        }

        console.warn(
          `[AIService] Bullet enhancement validation attempt ${attempt} failed:`,
          validation.error.issues
        );

        if (attempt === maxAttempts) {
          throw ApiError.internal(
            `AI bullet enhancement output failed schema validation: ${validation.error.message}`,
            'AI_VALIDATION_FAILED'
          );
        }
      } catch (error: unknown) {
        if (error instanceof ApiError) {
          throw error;
        }
        if (attempt === maxAttempts) {
          const message = error instanceof Error ? error.message : 'Unknown AI enhancement failure';
          throw ApiError.internal(`AI bullet enhancement failed: ${message}`, 'AI_ENHANCEMENT_FAILED');
        }
      }

      attempt++;
    }

    throw ApiError.internal('AI bullet enhancement failed after multiple attempts.', 'AI_ENHANCEMENT_FAILED');
  }
}

export const aiService = new AIService();
export default aiService;
