import { Router, Request, Response } from 'express';
import { Resume } from '../models/Resume';
import { Analysis } from '../models/Analysis';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

router.get(
  '/stats',
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const [totalResumes, totalAnalyses] = await Promise.all([
      Resume.countDocuments(),
      Analysis.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalResumes,
        totalAnalyses,
      },
    });
  })
);

export default router;
