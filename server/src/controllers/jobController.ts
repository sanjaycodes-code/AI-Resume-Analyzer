import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { JobDescription } from '../models/JobDescription';
import { createJobSchema } from '../validators/job.validator';
import { ApiError } from '../utils/apiError';
import { asyncHandler } from '../utils/asyncHandler';

// Common technical stop-words to exclude from basic keyword extraction
const STOP_WORDS = new Set([
  'with', 'from', 'have', 'this', 'that', 'your', 'will', 'their', 'about',
  'more', 'must', 'were', 'been', 'then', 'than', 'into', 'only', 'such',
  'what', 'when', 'where', 'which', 'who', 'whom', 'whose', 'why', 'how',
  'the', 'and', 'for', 'are', 'is', 'in', 'at', 'of', 'to', 'a', 'an'
]);

/**
 * Extracts simple normalized keywords from raw job description text.
 */
const extractKeywords = (rawText: string): string[] => {
  if (!rawText) return [];
  const words = rawText
    .split(/[\s,.;:()/\-•|·]+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w.toLowerCase()) && !/^\d+$/.test(w));

  return Array.from(new Set(words));
};

export const createJobDescription = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      throw ApiError.unauthorized('Authentication required.', 'UNAUTHORIZED');
    }

    const { title, rawText } = createJobSchema.parse(req.body);

    const extractedKeywords = extractKeywords(rawText);

    const jobDescription = await JobDescription.create({
      userId: new mongoose.Types.ObjectId(userId),
      title,
      rawText,
      extractedKeywords,
    });

    res.status(201).json({
      success: true,
      message: 'Job description saved successfully',
      data: {
        jobDescription,
      },
    });
  }
);

export const getJobDescriptions = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      throw ApiError.unauthorized('Authentication required.', 'UNAUTHORIZED');
    }

    const jobDescriptions = await JobDescription.find({
      userId: new mongoose.Types.ObjectId(userId),
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: jobDescriptions.length,
      data: {
        jobDescriptions,
      },
    });
  }
);

export const getJobDescriptionById = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId;
    const id = String(req.params.id);

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      throw ApiError.unauthorized('Authentication required.', 'UNAUTHORIZED');
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid job description ID format.', 'INVALID_ID');
    }

    const jobDescription = await JobDescription.findById(id);
    if (!jobDescription) {
      throw ApiError.notFound('Job description not found.', 'JOB_NOT_FOUND');
    }

    if (jobDescription.userId.toString() !== userId) {
      throw ApiError.forbidden('You do not have permission to view this job description.', 'FORBIDDEN');
    }

    res.status(200).json({
      success: true,
      data: {
        jobDescription,
      },
    });
  }
);

export const deleteJobDescription = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId;
    const id = String(req.params.id);

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      throw ApiError.unauthorized('Authentication required.', 'UNAUTHORIZED');
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid job description ID format.', 'INVALID_ID');
    }

    const jobDescription = await JobDescription.findById(id);
    if (!jobDescription) {
      throw ApiError.notFound('Job description not found.', 'JOB_NOT_FOUND');
    }

    if (jobDescription.userId.toString() !== userId) {
      throw ApiError.forbidden('You do not have permission to delete this job description.', 'FORBIDDEN');
    }

    await jobDescription.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Job description deleted successfully.',
    });
  }
);
