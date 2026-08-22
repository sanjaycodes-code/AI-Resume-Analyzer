import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Analysis } from '../models/Analysis';
import { Resume } from '../models/Resume';
import { JobDescription } from '../models/JobDescription';
import { aiService } from '../services/ai/aiService';
import { calculateAtsScore } from '../services/scoring.service';
import { generatePdfReportStream } from '../services/reportGenerator.service';
import { createAnalysisSchema } from '../validators/analysis.validator';
import { bulletEnhanceRequestSchema } from '../validators/bulletEnhancement.validator';
import { ApiError } from '../utils/apiError';
import { asyncHandler } from '../utils/asyncHandler';

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

    // 3. Compute Deterministic ATS Compatibility Score
    const scoreResult = calculateAtsScore(
      resume.extractedText,
      resume.parsedSections,
      jobDescription ? jobDescription.rawText : undefined
    );

    // 4. Run AI Analysis (wrapped to handle transient AI provider errors cleanly without partial saves)
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

    // 5. Calculate Overall Combined Score
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

    // 6. Save complete Analysis document
    const analysis = await Analysis.create({
      userId: new mongoose.Types.ObjectId(userId),
      resumeId: resume._id,
      jobDescriptionId: jobDescription ? jobDescription._id : undefined,
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
      .populate('jobDescriptionId', 'title rawText');

    if (!analysis) {
      throw ApiError.notFound('Analysis not found.', 'ANALYSIS_NOT_FOUND');
    }

    if (analysis.userId.toString() !== userId) {
      throw ApiError.forbidden('You do not have permission to view this analysis.', 'FORBIDDEN');
    }

    const analysisObj = analysis.toObject();

    // Ensure scoreBreakdown is populated for existing older analyses
    if (!analysisObj.scoreBreakdown) {
      if (
        analysis.resumeId &&
        typeof analysis.resumeId === 'object' &&
        'extractedText' in analysis.resumeId
      ) {
        const resumeDoc = analysis.resumeId as unknown as { extractedText: string; parsedSections: unknown };
        const jdDoc = analysis.jobDescriptionId as unknown as { rawText?: string } | null;
        const calculated = calculateAtsScore(
          resumeDoc.extractedText,
          (resumeDoc.parsedSections || {}) as never,
          jdDoc?.rawText
        );
        analysisObj.scoreBreakdown = calculated.breakdown;
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


