import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';

const authRouter = Router();

// Specific Registration Rate Limiter: max 3 account creations per IP per hour
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many accounts created from this network. Try again later.',
      code: 'TOO_MANY_REGISTRATIONS',
    });
  },
});

// Public routes
authRouter.post('/register', registerLimiter, authController.register);
authRouter.post('/login', authController.login);
authRouter.post('/refresh', authController.refresh);
authRouter.post('/logout', authController.logout);

// Protected routes
authRouter.get('/me', requireAuth, authController.me);

export default authRouter;
