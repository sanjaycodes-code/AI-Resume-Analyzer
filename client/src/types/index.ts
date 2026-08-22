// Global and shared TypeScript definitions
export * from './auth.types';
export * from './resume.types';
export * from './analysis.types';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  code?: string;
}
