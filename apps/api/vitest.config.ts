import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 30000,
    hookTimeout: 180000,
    fileParallelism: false,
    env: {
      MONGODB_URI: 'mongodb://localhost:27017/vivah_test',
      JWT_ACCESS_SECRET: 'test-secret-that-is-at-least-32-characters-long',
      JWT_REFRESH_SECRET: 'test-secret-that-is-at-least-32-characters-long',
      CORS_ORIGINS: 'http://localhost:3000',
    },
  },
});
