import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Look for .env across common project paths
const envPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'server', '.env'),
  path.resolve(__dirname, '..', '..', '.env'),
];

for (const p of envPaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p, override: true });
    break;
  }
}

export interface EnvConfig {
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  CLIENT_URL: string;
  MONGODB_URI: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  CLOUDINARY_CLOUD_NAME?: string;
  CLOUDINARY_API_KEY?: string;
  CLOUDINARY_API_SECRET?: string;
  AI_PROVIDER: string;
  AI_API_KEY?: string;
  GEMINI_MODEL: string;
}

const nodeEnv = (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test';
const isProduction = nodeEnv === 'production';

// Fail-fast validation helper
const getRequiredEnv = (key: string, customMessage?: string): string => {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    const errorMsg =
      customMessage ||
      `[CRITICAL CONFIG ERROR] Missing required environment variable: "${key}". The application cannot start without this variable.`;
    console.error(`\n❌ ${errorMsg}\n`);
    throw new Error(errorMsg);
  }
  return value.trim();
};

const parsePort = (portStr?: string): number => {
  const port = Number(portStr || 5000);
  if (isNaN(port) || port <= 0 || port > 65535) {
    throw new Error(`[Config Error] Invalid PORT: "${portStr}". Must be a valid port number (1-65535).`);
  }
  return port;
};

// Core Variables
const port = parsePort(process.env.PORT);
const clientUrl = getRequiredEnv('CLIENT_URL', 'CLIENT_URL must be defined (e.g. http://localhost:5173 or https://your-app.vercel.app)');
const jwtSecret = getRequiredEnv('JWT_SECRET', 'JWT_SECRET must be defined for signing access tokens');
const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || jwtSecret;
const mongoUri = process.env.MONGODB_URI || '';

// Production Strict Invariant Assertions
if (isProduction) {
  if (!mongoUri || mongoUri.trim() === '') {
    throw new Error('[PRODUCTION CRITICAL ERROR] MONGODB_URI is required in production environment.');
  }

  if (!process.env.AI_API_KEY || process.env.AI_API_KEY.trim() === '') {
    throw new Error('[PRODUCTION CRITICAL ERROR] AI_API_KEY (Gemini API Key) is required in production.');
  }

  if (jwtSecret.length < 16) {
    console.warn('[PRODUCTION SECURITY WARNING] JWT_SECRET is shorter than 16 characters. Please use a long, cryptographically random secret.');
  }
}

export const env: EnvConfig = {
  PORT: port,
  NODE_ENV: nodeEnv,
  CLIENT_URL: clientUrl,
  MONGODB_URI: mongoUri,
  JWT_SECRET: jwtSecret,
  JWT_REFRESH_SECRET: jwtRefreshSecret,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  AI_PROVIDER: process.env.AI_PROVIDER || 'gemini',
  AI_API_KEY: process.env.AI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
};
