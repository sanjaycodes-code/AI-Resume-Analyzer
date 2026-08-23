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
  skipFailedRequests: false, // Count all attempts to prevent brute force
  keyGenerator: (req) => {
    // Normalize localhost loopback variants (::1, ::ffff:127.0.0.1) so localhost testing is 100% consistent
    const rawIp = req.ip || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const cleanIp = String(rawIp).split(',')[0].trim();
    if (cleanIp === '::1' || cleanIp === '::ffff:127.0.0.1' || cleanIp === 'localhost') {
      return '127.0.0.1';
    }
    return cleanIp;
  },
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
