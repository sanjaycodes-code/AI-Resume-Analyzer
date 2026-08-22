import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as analysisController from '../controllers/analysisController';
import { requireAuth } from '../middleware/auth.middleware';

const analysisRouter = Router();

// Rate limiter: 10 analyses per hour per authenticated user
const analysisLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.userId || req.ip || 'anonymous',
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      message: 'Analysis limit reached (10 requests per hour). Please try again later.',
      code: 'TOO_MANY_ANALYSES',
    });
  },
});

// Report download rate limiter: 30 downloads per hour per authenticated user
const reportDownloadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.userId || req.ip || 'anonymous',
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      message: 'Report download limit reached. Please try again in a little while.',
      code: 'TOO_MANY_REPORT_DOWNLOADS',
    });
  },
});

// Bullet enhancement rate limiter: 20 per hour per authenticated user
const enhanceBulletLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.userId || req.ip || 'anonymous',
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      message: 'Bullet enhancement limit reached (20 requests per hour). Please try again later.',
      code: 'TOO_MANY_BULLET_ENHANCEMENTS',
    });
  },
});

// All analysis routes are protected by requireAuth
analysisRouter.use(requireAuth);

analysisRouter.post('/', analysisLimiter, analysisController.createAnalysis);
analysisRouter.post('/enhance-bullet', enhanceBulletLimiter, analysisController.enhanceBullet);
analysisRouter.get('/', analysisController.getAnalyses);
analysisRouter.get('/:id', analysisController.getAnalysisById);
analysisRouter.get('/:id/report', reportDownloadLimiter, analysisController.downloadReport);
analysisRouter.delete('/:id', analysisController.deleteAnalysis);

export default analysisRouter;
