import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/auth.service';
import { ApiError } from '../utils/apiError';

export const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(
      ApiError.unauthorized(
        'Authentication required. Please provide a valid Bearer token in the Authorization header.',
        'MISSING_BEARER_TOKEN'
      )
    );
  }

  const token = authHeader.split(' ')[1]?.trim();

  if (!token) {
    return next(
      ApiError.unauthorized('Authentication token is missing.', 'MISSING_TOKEN')
    );
  }

  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.userId;
    next();
  } catch (error) {
    next(error);
  }
};

export default requireAuth;
