import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { env } from './config/env';
import apiRouter from './routes';
import { errorHandler } from './middleware/error.middleware';
import { ApiError } from './utils/apiError';

const app: Application = express();

// Trust reverse proxy (Render, Vercel) for accurate client IP detection in rate limiters
app.set('trust proxy', 1);

// 1. Helmet HTTP Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allows client to load uploads/assets
    contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
  })
);

// 2. Multi-Environment CORS Configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, automated test suites)
      if (!origin) {
        return callback(null, true);
      }

      const allowedExactOrigins = [
        env.CLIENT_URL,
        'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000',
      ].filter(Boolean);

      // Check for exact matches or authorized Vercel deployments
      const isExactMatch = allowedExactOrigins.includes(origin);
      const isAllowedVercel =
        origin.endsWith('.vercel.app') &&
        (origin.includes('ai-resume-analyzer') || origin.includes('sanjay-codes'));

      if (isExactMatch || isAllowedVercel || env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(
          ApiError.forbidden(
            `Cross-Origin Request Blocked: Origin ${origin} is not allowed by CORS policy.`,
            'CORS_ORIGIN_DENIED'
          )
        );
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// 3. Global Rate Limiter (300 requests / 15 min per IP) in addition to route-specific limiters
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests received. Please slow down and try again later.',
      code: 'TOO_MANY_REQUESTS',
    });
  },
});
app.use('/api', globalLimiter);

// 4. Cookie Parsing Middleware
app.use(cookieParser());

// 5. Body Parsing Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 6. Static file serving for uploads (in development or local storage fallback)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 7. Mount API Routes under /api prefix
app.use('/api', apiRouter);

// 8. Handle 404 for Unmatched Routes
app.use((req: Request, _res: Response, next: NextFunction) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
});

// 9. Centralized Error Handler Middleware (MUST be last)
app.use(errorHandler);

export default app;
