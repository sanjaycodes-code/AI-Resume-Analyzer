import { Request, Response, NextFunction } from 'express';
import { RateLimitModel } from '../models/RateLimit';

export interface RateLimiterOptions {
  windowMs: number;
  max: number;
  message: string;
  code: string;
  keyPrefix?: string;
}

/**
 * Extracts and normalizes client IP across reverse proxies and local dev environments.
 */
export const getClientIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  let rawIp: string = '';

  if (typeof forwarded === 'string') {
    rawIp = forwarded.split(',')[0].trim();
  } else if (Array.isArray(forwarded) && forwarded.length > 0) {
    rawIp = forwarded[0].trim();
  } else {
    rawIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
  }

  // Normalize localhost and loopback variations
  if (
    rawIp === '::1' ||
    rawIp === '::ffff:127.0.0.1' ||
    rawIp === '127.0.0.1' ||
    rawIp === 'localhost'
  ) {
    return '127.0.0.1';
  }

  return rawIp;
};

/**
 * Persistent MongoDB-backed rate limiter middleware that survives server restarts and instance scaling.
 */
export const createPersistentRateLimiter = (options: RateLimiterOptions) => {
  const {
    windowMs,
    max,
    message,
    code,
    keyPrefix = 'ratelimit',
  } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const rlStart = Date.now();
    try {
      const clientIp = getClientIp(req);
      const key = `${keyPrefix}:${clientIp}`;
      const now = new Date();
      const expiresAt = new Date(now.getTime() + windowMs);

      // Atomic find and increment in MongoDB with automatic TTL expiry
      const record = await RateLimitModel.findOneAndUpdate(
        { key },
        {
          $inc: { count: 1 },
          $setOnInsert: { expiresAt },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      const currentCount = record.count;
      const rlDurationMs = Date.now() - rlStart;

      // Check if threshold exceeded
      if (currentCount > max) {
        // Structured debug log for rate limit verification
        console.warn(
          `[RateLimiter:BLOCKED] Key: "${key}" | Client IP: ${clientIp} | Count: ${currentCount}/${max} | Duration: ${rlDurationMs}ms`
        );

        res.status(429).json({
          success: false,
          message,
          code,
          meta: {
            limit: max,
            current: currentCount,
            resetTime: record.expiresAt,
          },
        });
        return; // Explicitly terminates request - NEVER calls next()
      }

      // Log successful increment in development / debugging
      console.log(
        `[RateLimiter:ALLOWED] Key: "${key}" | Client IP: ${clientIp} | Count: ${currentCount}/${max} | Duration: ${rlDurationMs}ms`
      );

      next();
    } catch (err) {
      console.error('[RateLimiter Error] Failed to process rate limit in MongoDB:', err);
      // Fail-open gracefully if database transiently errors so legitimate users aren't locked out
      next();
    }
  };
};
