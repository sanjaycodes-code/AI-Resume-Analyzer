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
import { DailyAiUsage } from '../../models/DailyAiUsage';

export const DAILY_AI_CALL_LIMIT = 100;

/**
 * Checks and increments the global daily AI provider invocation count.
 * Throws 503 Service Unavailable if 100 calls have already occurred today (UTC).
 */
export const checkAndIncrementDailyAiQuota = async (): Promise<number> => {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD in UTC

  // 1. Pre-check existing count before performing atomic increment
  const existing = await DailyAiUsage.findOne({ date: today });
  if (existing && existing.count >= DAILY_AI_CALL_LIMIT) {
    console.warn(
      `[AI Daily Quota BLOCKED] Reached ${existing.count}/${DAILY_AI_CALL_LIMIT} for date: ${today} (UTC)`
    );
    throw ApiError.serviceUnavailable(
      'Daily community AI quota reached. Resets at midnight UTC.',
      'AI_DAILY_QUOTA_EXCEEDED'
    );
  }

  // 2. Atomic increment
  const updated = await DailyAiUsage.findOneAndUpdate(
    { date: today },
    { $inc: { count: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  if (updated.count > DAILY_AI_CALL_LIMIT) {
    console.warn(
      `[AI Daily Quota BLOCKED] Exceeded ${updated.count}/${DAILY_AI_CALL_LIMIT} for date: ${today} (UTC)`
    );
    throw ApiError.serviceUnavailable(
      'Daily community AI quota reached. Resets at midnight UTC.',
      'AI_DAILY_QUOTA_EXCEEDED'
    );
  }

  console.log(
    `[AI Daily Quota ALLOWED] Global AI Invocations: ${updated.count}/${DAILY_AI_CALL_LIMIT} for ${today} (UTC)`
  );
  return updated.count;
};

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

    // Enforce global daily AI quota (100 calls/day max) BEFORE calling provider
    await checkAndIncrementDailyAiQuota();

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

    // Enforce global daily AI quota (100 calls/day max) BEFORE calling provider
    await checkAndIncrementDailyAiQuota();

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
