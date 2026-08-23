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

// Persistent Forgot Password Rate Limiter: max 10 requests per IP per 15 minutes to prevent abuse
const forgotPasswordLimiter = createPersistentRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'Too many password reset requests from this network. Please try again in 15 minutes.',
  code: 'TOO_MANY_RESET_REQUESTS',
  keyPrefix: 'auth:forgot-password',
});

// Public routes (Rate limiters mounted strictly before handlers)
authRouter.post('/register', registerLimiter, authController.register);
authRouter.post('/login', authController.login);
authRouter.post('/refresh', authController.refresh);
authRouter.post('/logout', authController.logout);
authRouter.post('/forgot-password', forgotPasswordLimiter, authController.forgotPassword);
authRouter.post('/reset-password', authController.resetPassword);

// Protected routes
authRouter.get('/me', requireAuth, authController.me);

export default authRouter;
