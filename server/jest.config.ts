import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  setupFilesAfterEnv: ['./tests/setup.ts'],
  verbose: true,
  forceExit: true,
  detectOpenHandles: false,
  clearMocks: true,
  testTimeout: 30000,
};

export default config;
