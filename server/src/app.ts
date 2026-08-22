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

// 1. Helmet HTTP Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allows client to load uploads/assets
    contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
  })
);

// 2. Strict CORS Configuration - locked strictly to CLIENT_URL (no wildcard)
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, automated test suites) or strictly matching CLIENT_URL
      if (!origin || origin === env.CLIENT_URL) {
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

// 5. Body Parsing Middleware (JSON limit 1MB to prevent large payload DoS)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 6. Serve static uploads (for local fallback storage)
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// 7. API Routes
app.use('/api', apiRouter);

// 8. Handle unknown API routes
app.use((req: Request, _res: Response, next: NextFunction) => {
  next(ApiError.notFound(`Cannot ${req.method} ${req.originalUrl}`, 'ROUTE_NOT_FOUND'));
});

// 9. Centralized Error Handling Middleware (must be registered last)
app.use(errorHandler);

export default app;
