import { Request, Response } from 'express';
import { User } from '../models/User';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getRefreshTokenCookieOptions,
  generateResetToken,
  hashResetToken,
  AUTH_COOKIE_NAME,
} from '../services/auth.service';
import { sendPasswordResetEmail } from '../services/email.service';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/auth.validator';
import { ApiError } from '../utils/apiError';
import { asyncHandler } from '../utils/asyncHandler';
import { env } from '../config/env';

export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const validatedData = registerSchema.parse(req.body);

  // Check optional invite code gate if configured in environment
  if (env.DEMO_INVITE_CODE) {
    const providedCode = (validatedData.inviteCode || '').trim();
    if (!providedCode || providedCode !== env.DEMO_INVITE_CODE) {
      throw ApiError.forbidden(
        'Invalid invite code. An invite code is required to register during private demo mode.',
        'INVALID_INVITE_CODE'
      );
    }
  }

  // Check if email is already taken
  const existingUser = await User.findOne({ email: validatedData.email });
  if (existingUser) {
    throw ApiError.conflict('An account with this email already exists.', 'EMAIL_ALREADY_EXISTS');
  }

  // Hash password securely
  const passwordHash = await hashPassword(validatedData.password);

  // Create user record in MongoDB
  const newUser = await User.create({
    name: validatedData.name,
    email: validatedData.email,
    passwordHash,
  });

  const userId = newUser._id.toString();
  const accessToken = generateAccessToken(userId);
  const refreshToken = generateRefreshToken(userId);

  // Attach refresh token in httpOnly secure cookie
  res.cookie(AUTH_COOKIE_NAME, refreshToken, getRefreshTokenCookieOptions());

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      },
      accessToken,
    },
  });
});

export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const validatedData = loginSchema.parse(req.body);

  // Find user by email
  const user = await User.findOne({ email: validatedData.email });
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password.', 'INVALID_CREDENTIALS');
  }

  // Verify password
  const isPasswordValid = await comparePassword(validatedData.password, user.passwordHash);
  if (!isPasswordValid) {
    throw ApiError.unauthorized('Invalid email or password.', 'INVALID_CREDENTIALS');
  }

  const userId = user._id.toString();
  const accessToken = generateAccessToken(userId);
  const refreshToken = generateRefreshToken(userId);

  // Attach refresh token in httpOnly secure cookie
  res.cookie(AUTH_COOKIE_NAME, refreshToken, getRefreshTokenCookieOptions());

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      accessToken,
    },
  });
});

export const refresh = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const incomingRefreshToken = req.cookies?.[AUTH_COOKIE_NAME];

  if (!incomingRefreshToken) {
    throw ApiError.unauthorized(
      'Refresh token is missing. Please log in again.',
      'MISSING_REFRESH_TOKEN'
    );
  }

  // Verify the refresh token and assert type === 'refresh'
  const payload = verifyRefreshToken(incomingRefreshToken);

  // Ensure user still exists
  const user = await User.findById(payload.userId);
  if (!user) {
    throw ApiError.unauthorized('User no longer exists.', 'USER_NOT_FOUND');
  }

  const userId = user._id.toString();
  const newAccessToken = generateAccessToken(userId);
  const newRefreshToken = generateRefreshToken(userId);

  // Rotate refresh token cookie
  res.cookie(AUTH_COOKIE_NAME, newRefreshToken, getRefreshTokenCookieOptions());

  res.status(200).json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      accessToken: newAccessToken,
    },
  });
});

export const logout = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  res.clearCookie(AUTH_COOKIE_NAME, getRefreshTokenCookieOptions());

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

export const me = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId;

  if (!userId) {
    throw ApiError.unauthorized('Authentication required.', 'UNAUTHORIZED');
  }

  const user = await User.findById(userId).select('-passwordHash');
  if (!user) {
    throw ApiError.notFound('User not found.', 'USER_NOT_FOUND');
  }

  res.status(200).json({
    success: true,
    data: {
      user,
    },
  });
});

/**
 * Initiates password reset flow by creating a secure token and sending a reset email.
 * Returns a uniform generic message to prevent email enumeration.
 */
export const forgotPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const reqStart = Date.now();
  const { email } = forgotPasswordSchema.parse(req.body);

  const dbStart = Date.now();
  const user = await User.findOne({ email });
  let dbDurationMs = Date.now() - dbStart;
  let emailDurationMs = 0;

  if (user) {
    const { rawToken, hashedToken } = generateResetToken();

    // Store hashed token with 15-minute expiration
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    const saveStart = Date.now();
    await user.save();
    dbDurationMs += Date.now() - saveStart;

    // Dynamically resolve client base URL from request origin (falling back to env.CLIENT_URL)
    const requestOrigin = (req.headers.origin as string) || (req.headers.referer as string);
    let clientBaseUrl = env.CLIENT_URL;
    if (requestOrigin && typeof requestOrigin === 'string') {
      try {
        const parsed = new URL(requestOrigin);
        clientBaseUrl = `${parsed.protocol}//${parsed.host}`;
      } catch {
        // Fall back to env.CLIENT_URL
      }
    }
    // Strip trailing slashes to prevent double-slash path routing errors in React Router
    clientBaseUrl = clientBaseUrl.replace(/\/+$/, '');

    const resetUrl = `${clientBaseUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(user.email)}`;
    
    const emailStart = Date.now();
    try {
      console.log(`[AuthController:forgotPassword] Generated reset URL: ${resetUrl}`);
      console.log(`[AuthController:forgotPassword] Triggering password reset email for user ID: ${user._id}, email: ${user.email}`);
      await sendPasswordResetEmail(user.email, resetUrl, user.name);
    } catch (emailErr) {
      console.error('[AuthController:forgotPassword] Unhandled error during sendPasswordResetEmail:', emailErr);
    }
    emailDurationMs = Date.now() - emailStart;
  } else {
    console.log(`[AuthController:forgotPassword] Password reset requested for non-existent email: ${email}`);
  }

  const totalHandlerMs = Date.now() - reqStart;
  console.log(
    `\n⏱️  [AuthController:forgotPassword:TIMING]\n` +
    `  - DB Lookup & Token Save : ${dbDurationMs}ms\n` +
    `  - Email Dispatch Duration: ${emailDurationMs}ms\n` +
    `  - Total Handler Duration : ${totalHandlerMs}ms\n`
  );

  // Always return the exact same generic message
  res.status(200).json({
    success: true,
    message: 'If an account exists with that email, a password reset link has been sent.',
  });
});

/**
 * Completes password reset using raw token, email, and new password.
 */
export const resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, token, newPassword } = resetPasswordSchema.parse(req.body);

  const user = await User.findOne({ email });
  if (!user || !user.passwordResetToken || !user.passwordResetExpires) {
    throw ApiError.badRequest('Invalid or expired password reset token.', 'INVALID_RESET_TOKEN');
  }

  const providedHash = hashResetToken(token);
  if (user.passwordResetToken !== providedHash) {
    throw ApiError.badRequest('Invalid or expired password reset token.', 'INVALID_RESET_TOKEN');
  }

  if (user.passwordResetExpires.getTime() < Date.now()) {
    // Clear expired token
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    throw ApiError.badRequest('Invalid or expired password reset token.', 'INVALID_RESET_TOKEN');
  }

  // Hash new password and clear reset fields
  user.passwordHash = await hashPassword(newPassword);
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password reset successful. You can now log in with your new password.',
  });
});
