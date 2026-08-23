import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Analysis } from '../models/Analysis';
import { Resume } from '../models/Resume';
import { JobDescription } from '../models/JobDescription';
import { aiService } from '../services/ai/aiService';
import { calculateAtsScore, classifyRoleCategory, SCORING_VERSION } from '../services/scoring.service';
import { generatePdfReportStream } from '../services/reportGenerator.service';
import { createAnalysisSchema } from '../validators/analysis.validator';
import { bulletEnhanceRequestSchema } from '../validators/bulletEnhancement.validator';
import { ApiError } from '../utils/apiError';
import { asyncHandler } from '../utils/asyncHandler';

import crypto from 'crypto';

/**
 * Computes a deterministic SHA-256 hash of resumeText, optional job description text,
 * and the current SCORING_VERSION to automatically invalidate cached analyses on engine updates.
 */
export const computeContentHash = (
  resumeText: string,
  jobDescText?: string,
  scoringVersion: string = SCORING_VERSION
): string => {
  const payload = `${(resumeText || '').trim()}:::${(jobDescText || '').trim()}:::${scoringVersion}`;
  return crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
};

export const createAnalysis = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      throw ApiError.unauthorized('Authentication required.', 'UNAUTHORIZED');
    }

    const { resumeId, jobDescriptionId } = createAnalysisSchema.parse(req.body);

    // 1. Fetch & verify Resume ownership
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      throw ApiError.notFound('Resume not found.', 'RESUME_NOT_FOUND');
    }

    if (resume.userId.toString() !== userId) {
      throw ApiError.forbidden('You do not have permission to analyze this resume.', 'FORBIDDEN');
    }

    // 2. Fetch & verify JobDescription ownership (if provided)
    let jobDescription = null;
    if (jobDescriptionId) {
      jobDescription = await JobDescription.findById(jobDescriptionId);
      if (!jobDescription) {
        throw ApiError.notFound('Job description not found.', 'JOB_NOT_FOUND');
      }

      if (jobDescription.userId.toString() !== userId) {
        throw ApiError.forbidden('You do not have permission to use this job description.', 'FORBIDDEN');
      }
    }

    // 3. Compute Content Hash for deterministic caching (version-scoped)
    const contentHash = computeContentHash(
      resume.extractedText,
      jobDescription ? jobDescription.rawText : undefined,
      SCORING_VERSION
    );

    // 4. Check for existing cached analysis matching content AND current scoring engine version
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const cachedAnalysis = await Analysis.findOne({
      userId: userObjectId,
      contentHash,
      scoringVersion: SCORING_VERSION,
    }).sort({ createdAt: -1 });

    if (cachedAnalysis) {
      if (process.env.DEBUG || process.env.NODE_ENV !== 'production') {
        console.log(
          `[Analysis Cache HIT] Returning cached analysis: ${cachedAnalysis._id} (Created: ${cachedAnalysis.createdAt}, Engine: ${cachedAnalysis.scoringVersion || 'legacy'}, Hash: ${contentHash.substring(0, 10)}...) for user ${userId}`
        );
      }
      const sanitized = cachedAnalysis.toObject();
      delete (sanitized as unknown as Record<string, unknown>).rawAIResponse;

      res.status(200).json({
        success: true,
        message: 'Resume analysis retrieved from cache (identical content & engine version)',
        isCached: true,
        data: {
          analysis: sanitized,
        },
      });
      return;
    }

    if (process.env.DEBUG || process.env.NODE_ENV !== 'production') {
      console.log(
        `[Analysis Cache MISS] Computing fresh analysis (Engine Version: ${SCORING_VERSION}, Hash: ${contentHash.substring(0, 10)}...) for user ${userId}`
      );
    }

    // 5. Compute Role-Contextual Deterministic ATS Compatibility Score
    const roleCategory = jobDescription?.roleCategory || (jobDescription ? classifyRoleCategory(`${jobDescription.title} ${jobDescription.rawText}`) : undefined);
    const scoreResult = calculateAtsScore(
      resume.extractedText,
      resume.parsedSections,
      jobDescription ? jobDescription.rawText : undefined,
      roleCategory
    );

    // 6. Run AI Analysis (wrapped to handle transient AI provider errors cleanly without partial saves)
    let aiResult;
    try {
      aiResult = await aiService.analyzeResume({
        resumeText: resume.extractedText,
        jobDescriptionText: jobDescription ? jobDescription.rawText : undefined,
      });
    } catch (aiError: unknown) {
      console.error('[Analysis Error] AI Service call failed:', aiError);
      // Return clear 502/503 without saving a broken Analysis document in database
      const errMessage =
        aiError instanceof Error ? aiError.message : 'AI analysis engine is temporarily unavailable.';
      throw ApiError.badGateway(
        `AI Analysis failed: ${errMessage}. Please try again in a few moments.`,
        'AI_SERVICE_UNAVAILABLE'
      );
    }

    // 7. Calculate Overall Combined Score
    // Formula: 60% Deterministic ATS Score + 40% AI Evaluation Score
    const aiDerivedScore =
      ((aiResult.experienceAnalysis?.rating || 75) +
        (aiResult.educationAnalysis?.rating || 80) +
        (aiResult.projectAnalysis?.rating || 80) +
        (aiResult.keywordAnalysis?.keywordDensityScore || 70)) /
      4;

    const overallScore = Math.round(
      0.6 * scoreResult.estimatedAtsScore + 0.4 * aiDerivedScore
    );

    // 8. Save complete Analysis document with contentHash and scoringVersion
    const analysis = await Analysis.create({
      userId: userObjectId,
      resumeId: resume._id,
      jobDescriptionId: jobDescription ? jobDescription._id : undefined,
      contentHash,
      scoringVersion: SCORING_VERSION,
      atsScore: scoreResult.estimatedAtsScore,
      overallScore: Math.min(100, Math.max(0, overallScore)),
      skillsFound: aiResult.skillsFound,
      missingSkills: aiResult.missingSkills,
      strengths: aiResult.strengths,
      weaknesses: aiResult.weaknesses,
      recommendations: aiResult.recommendations,
      keywordAnalysis: {
        ...aiResult.keywordAnalysis,
        atsBreakdown: scoreResult.breakdown.keywordMatch,
      },
      experienceAnalysis: aiResult.experienceAnalysis,
      educationAnalysis: aiResult.educationAnalysis,
      projectAnalysis: aiResult.projectAnalysis,
      formattingAnalysis: {
        ...scoreResult.breakdown.formattingCleanliness,
        sectionStructure: scoreResult.breakdown.sectionCompleteness,
        contactInfo: scoreResult.breakdown.contactInfo,
        actionVerbs: scoreResult.breakdown.actionVerbs,
        quantifiedImpact: scoreResult.breakdown.quantifiedImpact,
        writingQuality: scoreResult.breakdown.writingQuality,
        disclaimer: scoreResult.disclaimer,
        summary: scoreResult.summary,
      },
      scoreBreakdown: scoreResult.breakdown,
      rawAIResponse: aiResult,
    });

    // Remove rawAIResponse from payload
    const sanitized = analysis.toObject();
    delete (sanitized as unknown as Record<string, unknown>).rawAIResponse;

    res.status(201).json({
      success: true,
      message: 'Resume analysis generated successfully',
      data: {
        analysis: sanitized,
      },
    });
  }
);

export const getAnalyses = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      throw ApiError.unauthorized('Authentication required.', 'UNAUTHORIZED');
    }

    const analyses = await Analysis.find({ userId: new mongoose.Types.ObjectId(userId) })
      .select('-rawAIResponse')
      .populate('resumeId', 'originalFileName fileType createdAt')
      .populate('jobDescriptionId', 'title createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: analyses.length,
      data: {
        analyses,
      },
    });
  }
);

export const getAnalysisById = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId;
    const id = String(req.params.id);

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      throw ApiError.unauthorized('Authentication required.', 'UNAUTHORIZED');
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid analysis ID format.', 'INVALID_ID');
    }

    const analysis = await Analysis.findById(id)
      .select('-rawAIResponse')
      .populate('resumeId', 'originalFileName fileType fileUrl extractedText parsedSections')
      .populate('jobDescriptionId', 'title rawText roleCategory');

    if (!analysis) {
      throw ApiError.notFound('Analysis not found.', 'ANALYSIS_NOT_FOUND');
    }

    if (analysis.userId.toString() !== userId) {
      throw ApiError.forbidden('You do not have permission to view this analysis.', 'FORBIDDEN');
    }

    const analysisObj = analysis.toObject();

    // Ensure scoreBreakdown is upgraded if from an older scoring engine version or missing writing quality
    const currentBreakdown = analysis.scoreBreakdown as Record<string, unknown> | undefined;
    if (analysis.scoringVersion !== SCORING_VERSION || !currentBreakdown || !currentBreakdown.writingQuality) {
      if (
        analysis.resumeId &&
        typeof analysis.resumeId === 'object' &&
        'extractedText' in analysis.resumeId
      ) {
        const resumeDoc = analysis.resumeId as unknown as { extractedText: string; parsedSections: unknown };
        const jdDoc = analysis.jobDescriptionId as unknown as { rawText?: string; roleCategory?: string } | null;
        const calculated = calculateAtsScore(
          resumeDoc.extractedText,
          (resumeDoc.parsedSections || {}) as never,
          jdDoc?.rawText,
          jdDoc?.roleCategory
        );

        const expRating = (analysis.experienceAnalysis as Record<string, number>)?.rating || 75;
        const eduRating = (analysis.educationAnalysis as Record<string, number>)?.rating || 80;
        const projRating = (analysis.projectAnalysis as Record<string, number>)?.rating || 80;
        const kwDensity = (analysis.keywordAnalysis as Record<string, number>)?.keywordDensityScore || 70;
        const aiDerivedScore = (expRating + eduRating + projRating + kwDensity) / 4;
        const newOverall = Math.min(100, Math.max(0, Math.round(0.6 * calculated.estimatedAtsScore + 0.4 * aiDerivedScore)));

        analysis.scoringVersion = SCORING_VERSION;
        analysis.contentHash = computeContentHash(resumeDoc.extractedText, jdDoc?.rawText, SCORING_VERSION);
        analysis.atsScore = calculated.estimatedAtsScore;
        analysis.overallScore = newOverall;
        analysis.scoreBreakdown = calculated.breakdown;
        analysis.formattingAnalysis = {
          ...calculated.breakdown.formattingCleanliness,
          sectionStructure: calculated.breakdown.sectionCompleteness,
          contactInfo: calculated.breakdown.contactInfo,
          actionVerbs: calculated.breakdown.actionVerbs,
          quantifiedImpact: calculated.breakdown.quantifiedImpact,
          writingQuality: calculated.breakdown.writingQuality,
          disclaimer: calculated.disclaimer,
          summary: calculated.summary,
        };
        await analysis.save();

        analysisObj.scoringVersion = SCORING_VERSION;
        analysisObj.atsScore = calculated.estimatedAtsScore;
        analysisObj.overallScore = newOverall;
        analysisObj.scoreBreakdown = calculated.breakdown;
        analysisObj.formattingAnalysis = analysis.formattingAnalysis;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        analysis: analysisObj,
      },
    });
  }
);

export const downloadReport = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId;
    const id = String(req.params.id);

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      throw ApiError.unauthorized('Authentication required.', 'UNAUTHORIZED');
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid analysis ID format.', 'INVALID_ID');
    }

    const analysis = await Analysis.findById(id)
      .populate('resumeId', 'originalFileName fileType')
      .populate('jobDescriptionId', 'title');

    if (!analysis) {
      throw ApiError.notFound('Analysis not found.', 'ANALYSIS_NOT_FOUND');
    }

    if (analysis.userId.toString() !== userId) {
      throw ApiError.forbidden('You do not have permission to download this report.', 'FORBIDDEN');
    }

    // Set PDF response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="analysis-report-${id}.pdf"`
    );

    const pdfStream = generatePdfReportStream(analysis);
    pdfStream.pipe(res);
  }
);

export const deleteAnalysis = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId;
    const id = String(req.params.id);

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      throw ApiError.unauthorized('Authentication required.', 'UNAUTHORIZED');
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid analysis ID format.', 'INVALID_ID');
    }

    const analysis = await Analysis.findById(id);
    if (!analysis) {
      throw ApiError.notFound('Analysis not found.', 'ANALYSIS_NOT_FOUND');
    }

    if (analysis.userId.toString() !== userId) {
      throw ApiError.forbidden('You do not have permission to delete this analysis.', 'FORBIDDEN');
    }

    await analysis.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Analysis deleted successfully.',
    });
  }
);

export const enhanceBullet = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      throw ApiError.unauthorized('Authentication required.', 'UNAUTHORIZED');
    }

    const { analysisId, originalText, targetRole } = bulletEnhanceRequestSchema.parse(req.body);

    if (!mongoose.Types.ObjectId.isValid(analysisId)) {
      throw ApiError.badRequest('Invalid analysis ID format.', 'INVALID_ID');
    }

    const analysis = await Analysis.findById(analysisId);
    if (!analysis) {
      throw ApiError.notFound('Analysis not found.', 'ANALYSIS_NOT_FOUND');
    }

    // Ownership check (403 Forbidden if not owner)
    if (analysis.userId.toString() !== userId) {
      throw ApiError.forbidden('You do not have permission to enhance bullets for this analysis.', 'FORBIDDEN');
    }

    const result = await aiService.enhanceBullet({ originalText, targetRole, analysisId });

    // Push new entry to analysis document and save
    if (!analysis.enhancedBullets) {
      analysis.enhancedBullets = [];
    }

    const newBulletEntry = {
      originalText,
      enhancedText: result.enhancedText,
      changesSummary: result.changesSummary,
      createdAt: new Date(),
    };

    analysis.enhancedBullets.unshift(newBulletEntry);
    await analysis.save();

    res.status(200).json({
      success: true,
      message: 'Resume bullet enhanced successfully.',
      data: {
        ...result,
        createdAt: newBulletEntry.createdAt,
      },
    });
  }
);


