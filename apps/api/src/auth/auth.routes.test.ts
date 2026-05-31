import request from 'supertest';
import type { Response } from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { AccountStatus } from '@vivah/shared';
import { createApp } from '../app.js';
import { connectDatabase, disconnectDatabase } from '../db/connection.js';
import { ProfileModel, UserModel } from '../models/index.js';
import type { AuthConfig } from './auth-types.js';

const authConfig: AuthConfig = {
  accessSecret: 'test-access-secret-minimum-32-characters',
  refreshSecret: 'test-refresh-secret-minimum-32-characters',
  accessExpiresIn: '15m',
  refreshExpiresIn: '30d',
  exposeSensitiveTokens: true,
};

const app = createApp({
  corsOrigins: ['http://localhost:3000'],
  auth: authConfig,
});

let mongoServer: MongoMemoryServer;

interface TokenResponseBody {
  accessToken: string;
  refreshToken: string;
}

interface RegisterResponseBody {
  verificationToken: string;
}

interface ForgotPasswordResponseBody {
  resetToken: string;
}

function bodyAs<TBody>(response: Response): TBody {
  return response.body as TBody;
}

async function registerAndVerify(email = 'user@example.com', password = 'StrongPassword123!') {
  const registerResponse = await request(app).post('/api/auth/register/email').send({
    email,
    password,
    firstName: 'Amit',
    lastName: 'Sharma',
    termsAccepted: true,
    marketingConsent: false,
  });

  const verificationToken = bodyAs<RegisterResponseBody>(registerResponse).verificationToken;
  await request(app).post('/api/auth/verify-email').send({ token: verificationToken }).expect(200);
  return { email, password, verificationToken };
}

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

describe('auth routes', () => {
  it('registers with email, creates a profile draft, and verifies email', async () => {
    const registerResponse = await request(app).post('/api/auth/register/email').send({
      email: 'new@example.com',
      password: 'StrongPassword123!',
      firstName: 'Amit',
      lastName: 'Sharma',
      termsAccepted: true,
      marketingConsent: true,
    });

    expect(registerResponse.status).toBe(201);
    const registerBody = bodyAs<RegisterResponseBody>(registerResponse);

    expect(registerBody.verificationToken).toEqual(expect.any(String));

    const user = await UserModel.findOne({ email: 'new@example.com' }).orFail();
    const profile = await ProfileModel.findOne({ userId: user._id }).orFail();

    expect(user.status).toBe(AccountStatus.PENDING);
    expect(profile.personal.firstName).toBe('Amit');

    await request(app)
      .post('/api/auth/verify-email')
      .send({ token: registerBody.verificationToken })
      .expect(200);

    const verifiedUser = await UserModel.findById(user._id).orFail();
    expect(verifiedUser.emailVerified).toBe(true);
    expect(verifiedUser.status).toBe(AccountStatus.ACTIVE);
  });

  it('rejects duplicate email registration', async () => {
    await registerAndVerify('duplicate@example.com');

    await request(app)
      .post('/api/auth/register/email')
      .send({
        email: 'duplicate@example.com',
        password: 'StrongPassword123!',
        firstName: 'Amit',
        lastName: 'Sharma',
        termsAccepted: true,
      })
      .expect(409);
  });

  it('logs in and rotates refresh tokens', async () => {
    const { email, password } = await registerAndVerify('login@example.com');

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);

    const loginBody = bodyAs<TokenResponseBody>(loginResponse);

    expect(loginBody.accessToken).toEqual(expect.any(String));
    expect(loginBody.refreshToken).toEqual(expect.any(String));

    const refreshResponse = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: loginBody.refreshToken })
      .expect(200);

    const refreshBody = bodyAs<TokenResponseBody>(refreshResponse);

    await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: loginBody.refreshToken })
      .expect(401);

    expect(refreshBody.refreshToken).not.toBe(loginBody.refreshToken);
  });

  it('logs out by invalidating the active refresh token', async () => {
    const { email, password } = await registerAndVerify('logout@example.com');
    const loginResponse = await request(app).post('/api/auth/login').send({ email, password });
    const loginBody = bodyAs<TokenResponseBody>(loginResponse);

    await request(app)
      .post('/api/auth/logout')
      .send({ refreshToken: loginBody.refreshToken })
      .expect(204);

    await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: loginBody.refreshToken })
      .expect(401);
  });

  it('issues reset tokens and resets passwords', async () => {
    const { email } = await registerAndVerify('reset@example.com');

    const forgotResponse = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email })
      .expect(200);

    await request(app)
      .post('/api/auth/reset-password')
      .send({
        token: bodyAs<ForgotPasswordResponseBody>(forgotResponse).resetToken,
        password: 'NewStrongPassword123!',
      })
      .expect(200);

    await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'NewStrongPassword123!' })
      .expect(200);
  });

  it('changes password for an authenticated user and revokes prior refresh token', async () => {
    const { email, password } = await registerAndVerify('change@example.com');
    const loginResponse = await request(app).post('/api/auth/login').send({ email, password });
    const loginBody = bodyAs<TokenResponseBody>(loginResponse);

    await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${loginBody.accessToken}`)
      .send({ currentPassword: password, newPassword: 'ChangedPassword123!' })
      .expect(200);

    await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: loginBody.refreshToken })
      .expect(401);

    await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'ChangedPassword123!' })
      .expect(200);
  }, 15000);
});
