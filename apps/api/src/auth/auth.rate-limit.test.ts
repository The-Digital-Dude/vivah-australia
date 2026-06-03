import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createApp } from '../app.js';
import { connectDatabase, disconnectDatabase } from '../db/connection.js';
import type { AuthConfig } from './auth-types.js';

const authConfig: AuthConfig = {
  accessSecret: 'test-access-secret-minimum-32-characters',
  refreshSecret: 'test-refresh-secret-minimum-32-characters',
  accessExpiresIn: '15m',
  refreshExpiresIn: '30d',
  exposeSensitiveTokens: true,
};

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await connectDatabase(mongoServer.getUri());
}, 180000);

beforeEach(async () => {
  await mongoose.connection.db?.dropDatabase();
});

afterAll(async () => {
  await disconnectDatabase();
  await mongoServer?.stop();
});

describe('auth rate limits', () => {
  it('rate limits repeated OTP send requests', async () => {
    const app = createApp({
      corsOrigins: ['http://localhost:3000'],
      auth: authConfig,
    });
    const mobile = '+61412345681';

    await request(app).post('/api/auth/register/mobile').send({
      mobile,
      password: 'StrongPassword123!',
      firstName: 'Kiran',
      lastName: 'Singh',
      termsAccepted: true,
      marketingConsent: false,
    });

    for (let index = 0; index < 98; index += 1) {
      await request(app).post('/api/auth/otp/send').send({ mobile }).expect(201);
    }

    const finalAllowed = await request(app).post('/api/auth/otp/send').send({ mobile });
    expect([201, 429]).toContain(finalAllowed.status);

    if (finalAllowed.status === 201) {
      await request(app).post('/api/auth/otp/send').send({ mobile }).expect(429);
    }
  });
});
