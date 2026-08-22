import { Request, Response } from 'express';
import mongoose from 'mongoose';
import path from 'path';
import { Resume, ResumeFileType } from '../models/Resume';
import { Analysis } from '../models/Analysis';
import { extractText, parseSections } from '../services/resumeParser.service';
import { uploadBuffer, deleteFile } from '../services/storage.service';
import { ApiError } from '../utils/apiError';
import { asyncHandler } from '../utils/asyncHandler';

export const uploadResume = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId;
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw ApiError.unauthorized('Authentication required to upload resumes.', 'UNAUTHORIZED');
  }

  const file = req.file;
  if (!file) {
    throw ApiError.badRequest('No file uploaded. Please provide a resume under the "file" field.', 'FILE_REQUIRED');
  }

  // Determine file type
  const ext = path.extname(file.originalname).toLowerCase();
  const fileType: ResumeFileType = ext === '.docx' ? 'docx' : 'pdf';

  // 1. Text extraction (defends against corrupted/malformed files before storage upload)
  const extractedText = await extractText(file.buffer, fileType);

  // 2. Heuristic section parsing
  const parsedSections = parseSections(extractedText);

  // 3. Storage upload
  const { fileUrl, publicId } = await uploadBuffer(file.buffer, file.originalname);

  // 4. Save to MongoDB with compensating cleanup on failure
  let savedResume;
  try {
    savedResume = await Resume.create({
      userId: new mongoose.Types.ObjectId(userId),
      originalFileName: file.originalname,
      fileUrl,
      fileType,
      extractedText,
      parsedSections,
    });
  } catch (dbError) {
    // Cleanup cloud/local storage asset if database write failed
    console.error('[Compensating Cleanup] Database creation failed, removing uploaded storage asset:', publicId);
    await deleteFile(publicId).catch((err) =>
      console.error('[Compensating Cleanup Error] Failed to delete orphaned asset:', err)
    );
    throw dbError;
  }

  res.status(201).json({
    success: true,
    message: 'Resume uploaded and parsed successfully',
    data: {
      resume: savedResume,
    },
  });
});

export const getResumes = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId;
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw ApiError.unauthorized('Authentication required.', 'UNAUTHORIZED');
  }

  const resumes = await Resume.find({
    userId: new mongoose.Types.ObjectId(userId),
  }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: resumes.length,
    data: {
      resumes,
    },
  });
});

export const getResumeById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId;
  const id = String(req.params.id);

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw ApiError.unauthorized('Authentication required.', 'UNAUTHORIZED');
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest('Invalid resume ID format.', 'INVALID_ID');
  }

  const resume = await Resume.findById(id);
  if (!resume) {
    throw ApiError.notFound('Resume not found.', 'RESUME_NOT_FOUND');
  }

  // Ownership verification
  if (resume.userId.toString() !== userId) {
    throw ApiError.forbidden('You do not have permission to access this resume.', 'FORBIDDEN');
  }

  res.status(200).json({
    success: true,
    data: {
      resume,
    },
  });
});

export const deleteResume = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId;
  const id = String(req.params.id);

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw ApiError.unauthorized('Authentication required.', 'UNAUTHORIZED');
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest('Invalid resume ID format.', 'INVALID_ID');
  }

  const resume = await Resume.findById(id);
  if (!resume) {
    throw ApiError.notFound('Resume not found.', 'RESUME_NOT_FOUND');
  }

  // Ownership verification
  if (resume.userId.toString() !== userId) {
    throw ApiError.forbidden('You do not have permission to delete this resume.', 'FORBIDDEN');
  }

  // Delete storage asset (if local or Cloudinary)
  if (resume.fileUrl) {
    const urlParts = resume.fileUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    if (fileName) {
      await deleteFile(`local_${fileName}`).catch(() => {});
    }
  }

  // Cascading delete: clean up associated analyses to prevent dangling references
  await Analysis.deleteMany({ resumeId: resume._id });

  // Delete resume document
  await resume.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Resume and associated analyses deleted successfully.',
  });
});
