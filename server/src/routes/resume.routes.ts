import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as resumeController from '../controllers/resumeController';
import { requireAuth } from '../middleware/auth.middleware';
import { uploadSingleResume } from '../middleware/upload.middleware';

const resumeRouter = Router();

// Rate limiter: 10 uploads per 15 minutes per authenticated user
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.userId || req.ip || 'anonymous',
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      message: 'Upload limit reached (10 uploads per 15 minutes). Please try again later.',
      code: 'TOO_MANY_UPLOADS',
    });
  },
});

// All resume routes are protected by requireAuth
resumeRouter.use(requireAuth);

resumeRouter.post('/upload', uploadLimiter, uploadSingleResume, resumeController.uploadResume);
resumeRouter.get('/', resumeController.getResumes);
resumeRouter.get('/:id', resumeController.getResumeById);
resumeRouter.delete('/:id', resumeController.deleteResume);

export default resumeRouter;
