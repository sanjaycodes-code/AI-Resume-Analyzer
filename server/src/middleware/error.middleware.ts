import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import multer from 'multer';
import { ApiError } from '../utils/apiError';
import { env } from '../config/env';

export const errorHandler: ErrorRequestHandler = (
  err: Error | ApiError | ZodError | multer.MulterError | unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal server error';
  let code = 'INTERNAL_SERVER_ERROR';

  // 1. Handled Operational ApiError
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code;
  }
  // 2. Multer Upload Errors
  else if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      statusCode = 413;
      code = 'FILE_TOO_LARGE';
      message = 'File size exceeds the 5MB limit. Please upload a smaller file.';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      statusCode = 400;
      code = 'UNEXPECTED_FIELD';
      message = 'Unexpected field in upload. Please attach your file using the "file" field name.';
    } else {
      statusCode = 400;
      code = 'UPLOAD_ERROR';
      message = err.message || 'File upload error.';
    }
  }
  // 3. Zod Request Validation Error
  else if (err instanceof ZodError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    const issues = err.issues || [];
    message = issues.map((e: { message: string }) => e.message).join(', ') || 'Validation error';
  }
  // 4. Body-parser SyntaxError (Malformed JSON)
  else if (err instanceof SyntaxError && 'status' in err && (err as { status: number }).status === 400) {
    statusCode = 400;
    code = 'INVALID_JSON';
    message = 'Malformed JSON payload in request body.';
  }
  // 5. Mongoose Duplicate Key Error (E11000)
  else if (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: number }).code === 11000
  ) {
    statusCode = 409;
    code = 'RESOURCE_EXISTS';
    const keyValue = (err as { keyValue?: Record<string, unknown> }).keyValue;
    const field = keyValue ? Object.keys(keyValue)[0] : 'field';
    message = `A record with this ${field} already exists.`;
  }
  // 6. Mongoose CastError (Invalid ObjectId)
  else if (
    typeof err === 'object' &&
    err !== null &&
    'name' in err &&
    (err as { name: string }).name === 'CastError'
  ) {
    statusCode = 400;
    code = 'INVALID_ID';
    message = 'Invalid resource identifier format.';
  }
  // 7. Standard Error instance
  else if (err instanceof Error) {
    message = err.message || message;
  }

  // Log 500 errors in development/testing
  if (statusCode >= 500) {
    console.error('[Unhandled Server Error]', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    code,
    ...(env.NODE_ENV === 'development' && statusCode >= 500 && err instanceof Error
      ? { stack: err.stack }
      : {}),
  });
};

export default errorHandler;
