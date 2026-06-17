import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountStatus, UserRole } from '@vivah/shared';
import { connectDatabase, disconnectDatabase } from '../db/connection.js';
import { MemberEmailDripProgressModel, UserModel } from '../models/index.js';
import type { UserDocument } from '../models/index.js';
import { sendNewMemberDripEmails } from './onboarding-drip.service.js';

const emailMocks = vi.hoisted(() => ({
  sendTemplatedEmail: vi.fn(),
}));

vi.mock('../common/email.service.js', () => ({
  sendEmail: vi.fn(),
  sendTemplatedEmail: emailMocks.sendTemplatedEmail,
}));

let mongoServer: MongoMemoryServer;

async function createUser(overrides: Record<string, unknown> = {}): Promise<UserDocument> {
  const createdAt =
    overrides.createdAt instanceof Date ? overrides.createdAt : new Date('2026-06-04T10:00:00.000Z');
  const updatedAt =
    overrides.updatedAt instanceof Date ? overrides.updatedAt : createdAt;

  const user = await UserModel.create({
    email: 'new-member@example.com',
    authProviders: ['email'],
    role: UserRole.USER,
    status: AccountStatus.ACTIVE,
    emailVerified: true,
    mobileVerified: false,
    failedLoginAttempts: 0,
    marketingConsent: true,
    notificationPreferences: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: false,
      marketingNotifications: true,
    },
    metadata: {},
    ...overrides,
  });

  await UserModel.collection.updateOne(
    { _id: user._id },
    { $set: { createdAt, updatedAt } },
  );
  return await UserModel.findById(user._id).orFail();
}

describe('onboarding drip emails', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await connectDatabase(mongoServer.getUri());
  }, 180000);

  beforeEach(async () => {
    emailMocks.sendTemplatedEmail.mockReset();
    await mongoose.connection.db?.dropDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
    await mongoServer?.stop();
  });

  it('sends each due step once and reruns idempotently', async () => {
    const user = await createUser();
    const now = new Date('2026-06-18T10:00:00.000Z');

    await expect(sendNewMemberDripEmails(now)).resolves.toMatchObject({ sent: 5 });
    await expect(sendNewMemberDripEmails(now)).resolves.toMatchObject({ sent: 0 });

    expect(emailMocks.sendTemplatedEmail).toHaveBeenCalledTimes(5);
    expect(await MemberEmailDripProgressModel.countDocuments({ userId: user._id })).toBe(5);
  });

  it('skips members without marketing eligibility', async () => {
    await createUser({
      email: 'opted-out@example.com',
      marketingConsent: false,
    });
    await createUser({
      email: 'pref-off@example.com',
      notificationPreferences: {
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: false,
        marketingNotifications: false,
      },
    });
    await createUser({
      email: 'suspended@example.com',
      status: AccountStatus.SUSPENDED,
    });

    await expect(sendNewMemberDripEmails(new Date('2026-06-18T10:00:00.000Z'))).resolves.toMatchObject({
      sent: 0,
    });

    expect(emailMocks.sendTemplatedEmail).not.toHaveBeenCalled();
  });
});
