import { Router } from 'express';
import healthRouter from './health.route';
import authRouter from './auth.routes';
import resumeRouter from './resume.routes';
import jobRouter from './job.routes';
import analysisRouter from './analysis.routes';

const apiRouter = Router();

apiRouter.use('/', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/resumes', resumeRouter);
apiRouter.use('/job-descriptions', jobRouter);
apiRouter.use('/analysis', analysisRouter);

export default apiRouter;
