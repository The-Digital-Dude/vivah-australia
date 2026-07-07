import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountStatus, UserRole } from '@vivah/shared';
import { connectDatabase, disconnectDatabase } from '../db/connection.js';
import {
  InterestModel,
  ProfileApprovalStatus,
  type ProfileDocument,
  ProfileModel,
  ProfileViewModel,
  type UserDocument,
  UserModel,
} from '../models/index.js';
import { sendWeeklyActivityDigests } from './weekly-digest.service.js';

const emailMocks = vi.hoisted(() => ({
  sendTemplatedEmail: vi.fn(),
}));

vi.mock('../common/email.service.js', () => ({
  sendEmail: vi.fn(),
  sendTemplatedEmail: emailMocks.sendTemplatedEmail,
}));

let mongoServer: MongoMemoryServer;

interface WeeklyDigestPayload {
  to: string;
  isMarketing: boolean;
  recipientUserId: mongoose.Types.ObjectId;
  templateKey: string;
  context: {
    profileViews: number;
    interestsReceived: number;
    completionPercentage: number;
  };
}

async function createUser(
  email: string,
  overrides: Partial<{
    marketingConsent: boolean;
    notificationPreferences: {
      emailNotifications: boolean;
      smsNotifications: boolean;
      pushNotifications: boolean;
      marketingNotifications: boolean;
    };
    lastWeeklyDigestSentAt: Date;
  }> = {},
): Promise<UserDocument> {
  return UserModel.create({
    email,
    authProviders: ['email'],
    role: UserRole.USER,
    status: AccountStatus.ACTIVE,
    emailVerified: true,
    mobileVerified: true,
    failedLoginAttempts: 0,
    refreshTokenVersion: 0,
    marketingConsent: overrides.marketingConsent ?? true,
    notificationPreferences:
      overrides.notificationPreferences ?? {
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: false,
        marketingNotifications: true,
      },
    metadata: {},
    ...(overrides.lastWeeklyDigestSentAt
      ? { lastWeeklyDigestSentAt: overrides.lastWeeklyDigestSentAt }
      : {}),
  });
}

async function createProfile(
  userId: mongoose.Types.ObjectId,
  displayId: string,
): Promise<ProfileDocument> {
  return ProfileModel.create({
    userId,
    displayId,
    completionPercentage: 78,
    personal: { firstName: 'Priya' },
    religion: { languagesSpoken: [] },
    location: { city: 'Sydney', country: 'Australia' },
    education: {},
    employment: { annualIncomeVisibility: 'PRIVATE' },
    family: {},
    lifestyle: {},
    compatibility: {},
    about: {},
    partnerPreference: {},
    verification: {
      level: 'NONE',
      emailVerified: true,
      mobileVerified: false,
      identityVerified: false,
      addressVerified: false,
      employmentVerified: false,
      visaVerified: false,
      policeClearanceVerified: false,
      facialVerified: false,
    },
    visibility: {
      status: 'MEMBERS_ONLY',
      showPhoto: true,
      showIncome: false,
      showEmployer: false,
      showLastName: false,
    },
    stats: { profileViews: 0, interestsReceived: 0, interestsSent: 0, favouritesCount: 0 },
    moderation: { approvalStatus: ProfileApprovalStatus.APPROVED },
  });
}

describe('weekly activity digest service', () => {
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

  it('sends one weekly digest and records the send timestamp', async () => {
    const now = new Date('2026-06-18T11:00:00.000Z');
    const user = await createUser('digest@example.com');
    await createProfile(user._id, 'VA700001');

    await ProfileViewModel.create({
      viewerId: new mongoose.Types.ObjectId(),
      profileId: new mongoose.Types.ObjectId(),
      profileUserId: user._id,
      viewedAt: new Date('2026-06-16T09:00:00.000Z'),
    });
    await InterestModel.create({
      senderId: new mongoose.Types.ObjectId(),
      receiverId: user._id,
      status: 'PENDING',
      createdAt: new Date('2026-06-16T09:00:00.000Z'),
    });

    await expect(sendWeeklyActivityDigests(now)).resolves.toMatchObject({ sent: 1 });
    await expect(sendWeeklyActivityDigests(now)).resolves.toMatchObject({ sent: 0 });

    expect(emailMocks.sendTemplatedEmail).toHaveBeenCalledTimes(1);
    const payloadUnknown: unknown = emailMocks.sendTemplatedEmail.mock.calls[0]?.[0];
    expect(payloadUnknown).toBeTruthy();

    const payload =
      typeof payloadUnknown === 'object' && payloadUnknown !== null
        ? (payloadUnknown as WeeklyDigestPayload)
        : null;

    expect(payload?.to).toBe('digest@example.com');
    expect(payload?.isMarketing).toBe(true);
    expect(payload?.recipientUserId).toEqual(user._id);
    expect(payload?.templateKey).toBe('WEEKLY_ACTIVITY_DIGEST');
    expect(payload?.context).toMatchObject({
      profileViews: 1,
      interestsReceived: 1,
      completionPercentage: 78,
    });

    const updatedUser = await UserModel.findById(user._id).orFail();
    expect(updatedUser.lastWeeklyDigestSentAt?.toISOString()).toBe(now.toISOString());
  });

  it('skips members who have opted out of marketing emails', async () => {
    const now = new Date('2026-06-18T11:00:00.000Z');
    const user = await createUser('digest-opt-out@example.com', {
      marketingConsent: false,
    });
    await createProfile(user._id, 'VA700002');
    await ProfileViewModel.create({
      viewerId: new mongoose.Types.ObjectId(),
      profileId: new mongoose.Types.ObjectId(),
      profileUserId: user._id,
      viewedAt: new Date('2026-06-16T09:00:00.000Z'),
    });

    await expect(sendWeeklyActivityDigests(now)).resolves.toMatchObject({ sent: 0 });
    expect(emailMocks.sendTemplatedEmail).not.toHaveBeenCalled();
  });

  it('skips members who disabled marketing notifications even when email notifications stay on', async () => {
    const now = new Date('2026-06-18T11:00:00.000Z');
    const user = await createUser('digest-marketing-off@example.com', {
      notificationPreferences: {
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: false,
        marketingNotifications: false,
      },
    });
    await createProfile(user._id, 'VA700003');
    await ProfileViewModel.create({
      viewerId: new mongoose.Types.ObjectId(),
      profileId: new mongoose.Types.ObjectId(),
      profileUserId: user._id,
      viewedAt: new Date('2026-06-16T09:00:00.000Z'),
    });

    await expect(sendWeeklyActivityDigests(now)).resolves.toMatchObject({ sent: 0 });
    expect(emailMocks.sendTemplatedEmail).not.toHaveBeenCalled();
  });

  it('skips fully complete members who had no weekly activity', async () => {
    const now = new Date('2026-06-18T11:00:00.000Z');
    const user = await createUser('digest-no-activity@example.com');
    const profile = await createProfile(user._id, 'VA700004');
    profile.completionPercentage = 100;
    await profile.save();

    await expect(sendWeeklyActivityDigests(now)).resolves.toMatchObject({ sent: 0, skipped: 1 });
    expect(emailMocks.sendTemplatedEmail).not.toHaveBeenCalled();
  });

  it('resends after the weekly cooldown window has passed', async () => {
    const firstRun = new Date('2026-06-18T11:00:00.000Z');
    const secondRun = new Date('2026-06-26T11:00:00.000Z');
    const user = await createUser('digest-repeat@example.com');
    await createProfile(user._id, 'VA700005');

    await ProfileViewModel.create({
      viewerId: new mongoose.Types.ObjectId(),
      profileId: new mongoose.Types.ObjectId(),
      profileUserId: user._id,
      viewedAt: new Date('2026-06-16T09:00:00.000Z'),
    });

    await expect(sendWeeklyActivityDigests(firstRun)).resolves.toMatchObject({ sent: 1 });
    await expect(sendWeeklyActivityDigests(secondRun)).resolves.toMatchObject({ sent: 1 });

    expect(emailMocks.sendTemplatedEmail).toHaveBeenCalledTimes(2);
  });
});
