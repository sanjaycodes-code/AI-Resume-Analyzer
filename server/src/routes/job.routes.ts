import { Router } from 'express';
import * as jobController from '../controllers/jobController';
import { requireAuth } from '../middleware/auth.middleware';

const jobRouter = Router();

// All job description routes are protected
jobRouter.use(requireAuth);

jobRouter.post('/', jobController.createJobDescription);
jobRouter.get('/', jobController.getJobDescriptions);
jobRouter.get('/:id', jobController.getJobDescriptionById);
jobRouter.delete('/:id', jobController.deleteJobDescription);

export default jobRouter;
