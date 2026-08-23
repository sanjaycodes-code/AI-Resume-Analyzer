import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { createPersistentRateLimiter } from '../middleware/rateLimiter.middleware';

const authRouter = Router();

// Persistent Registration Rate Limiter: max 3 account creations per IP per hour in MongoDB
const registerLimiter = createPersistentRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many accounts created from this network. Try again later.',
  code: 'TOO_MANY_REGISTRATIONS',
  keyPrefix: 'auth:register',
});

// Public routes (Rate limiter is mounted strictly before handler)
authRouter.post('/register', registerLimiter, authController.register);
authRouter.post('/login', authController.login);
authRouter.post('/refresh', authController.refresh);
authRouter.post('/logout', authController.logout);

// Protected routes
authRouter.get('/me', requireAuth, authController.me);

export default authRouter;
