import bcrypt from 'bcrypt';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { CookieOptions } from 'express';
import { env } from '../config/env';
import { ApiError } from '../utils/apiError';

export interface TokenPayload extends JwtPayload {
  userId: string;
  type: 'access' | 'refresh';
}

export const AUTH_COOKIE_NAME = 'refreshToken';

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateAccessToken = (userId: string): string => {
  const payload: TokenPayload = {
    userId,
    type: 'access',
  };
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '15m' });
};

export const generateRefreshToken = (userId: string): string => {
  const payload: TokenPayload = {
    userId,
    type: 'refresh',
  };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    if (decoded.type !== 'access') {
      throw ApiError.unauthorized('Invalid token type: expected access token', 'INVALID_TOKEN_TYPE');
    }
    return decoded;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof jwt.TokenExpiredError) {
      throw ApiError.unauthorized('Access token has expired', 'TOKEN_EXPIRED');
    }
    throw ApiError.unauthorized('Invalid access token', 'INVALID_TOKEN');
  }
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
    if (decoded.type !== 'refresh') {
      throw ApiError.unauthorized('Invalid token type: expected refresh token', 'INVALID_TOKEN_TYPE');
    }
    return decoded;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof jwt.TokenExpiredError) {
      throw ApiError.unauthorized('Refresh token has expired', 'TOKEN_EXPIRED');
    }
    throw ApiError.unauthorized('Invalid refresh token', 'INVALID_TOKEN');
  }
};

export const getRefreshTokenCookieOptions = (): CookieOptions => {
  const isProduction = env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
};
