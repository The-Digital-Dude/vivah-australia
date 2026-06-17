import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountStatus, UserRole } from '@vivah/shared';
import { connectDatabase, disconnectDatabase } from '../db/connection.js';
import { ProfileApprovalStatus, ProfileModel, UserModel } from '../models/index.js';
import {
  calculateProfileCompletionStrength,
  sendProfileCompletionNudges,
} from './profile.service.js';

const emailMocks = vi.hoisted(() => ({
  sendTemplatedEmail: vi.fn(),
}));

vi.mock('../common/email.service.js', () => ({
  sendEmail: vi.fn(),
  sendTemplatedEmail: emailMocks.sendTemplatedEmail,
}));

let mongoServer: MongoMemoryServer;

function baseProfile(overrides: Record<string, unknown> = {}) {
  return new ProfileModel({
    userId: new mongoose.Types.ObjectId(),
    displayId: `VA${Math.floor(Math.random() * 1000000)}`,
    completionPercentage: 0,
    personal: {},
    religion: { languagesSpoken: [] },
    location: {},
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
    moderation: { approvalStatus: ProfileApprovalStatus.DRAFT },
    ...overrides,
  });
}

function completeProfile() {
  return baseProfile({
    personal: {
      firstName: 'Priya',
      lastName: 'Patel',
      gender: 'FEMALE',
      dateOfBirth: new Date('1994-08-23'),
      maritalStatus: 'NEVER_MARRIED',
    },
    location: { country: 'Australia', city: 'Sydney' },
    religion: { religion: 'Hindu', community: 'Gujarati', languagesSpoken: ['English'] },
    education: { highestQualification: 'Bachelor degree' },
    employment: { occupation: 'Accountant', annualIncomeVisibility: 'PRIVATE' },
    family: { familyValues: 'Close-knit and supportive' },
    lifestyle: { dietaryPreferences: 'Vegetarian' },
    compatibility: {
      relationshipPace: 'INTENTIONAL_AND_STEADY',
      familyInvolvement: 'BALANCED',
      communicationStyle: 'CALM_AND_THOUGHTFUL',
      valuesPrompt: 'Kindness, trust, and emotional steadiness matter most to me.',
    },
    about: {
      aboutMe: 'I am a committed professional looking for a serious long-term match.',
      partnerExpectations: 'I value kindness, family connection, and shared goals.',
    },
    partnerPreference: {
      ageMin: 29,
      ageMax: 36,
      religions: ['Hindu'],
      countries: ['Australia'],
    },
    verification: {
      level: 'BASIC',
      emailVerified: true,
      mobileVerified: true,
      identityVerified: false,
      addressVerified: false,
      employmentVerified: false,
      visaVerified: false,
      policeClearanceVerified: false,
      facialVerified: false,
    },
  });
}

async function createUser(
  email: string,
  marketingConsent = true,
  _id = new mongoose.Types.ObjectId(),
) {
  return UserModel.create({
    _id,
    email,
    authProviders: ['email'],
    role: UserRole.USER,
    status: AccountStatus.ACTIVE,
    emailVerified: true,
    mobileVerified: true,
    failedLoginAttempts: 0,
    refreshTokenVersion: 0,
    marketingConsent,
    notificationPreferences: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: false,
      marketingNotifications: true,
    },
    metadata: {},
  });
}

describe('profile completion coaching', () => {
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

  it('returns 0% with a prioritized missing-field breakdown for an empty profile', () => {
    const strength = calculateProfileCompletionStrength(baseProfile());

    expect(strength.percentage).toBe(0);
    expect(strength.nextAction?.key).toBe('profilePhoto');
    expect(strength.missing.map((item) => item.key)).toContain('aboutMe');
    expect(strength.missing.map((item) => item.key)).toContain('compatibility');
  });

  it('returns 100% for a fully complete profile with photo and mobile verification', () => {
    const strength = calculateProfileCompletionStrength(completeProfile(), {
      hasProfilePhoto: true,
    });

    expect(strength.percentage).toBe(100);
    expect(strength.missing).toHaveLength(0);
    expect(strength.nextAction).toBeNull();
  });

  it('prioritizes high-impact missing items for a partial profile', () => {
    const profile = completeProfile();
    profile.about.aboutMe = undefined;
    profile.partnerPreference = {};
    profile.compatibility = {};

    const strength = calculateProfileCompletionStrength(profile, {
      hasProfilePhoto: false,
    });

    expect(strength.percentage).toBe(42);
    expect(strength.missing.slice(0, 3).map((item) => item.key)).toEqual([
      'profilePhoto',
      'aboutMe',
      'partnerPreference',
    ]);
    expect(strength.missing.slice(0, 4).map((item) => item.key)).toEqual([
      'profilePhoto',
      'aboutMe',
      'partnerPreference',
      'compatibility',
    ]);
  });

  it('sends a profile completion nudge only once during the cooldown window', async () => {
    const now = new Date('2026-06-17T09:00:00.000Z');
    const userId = new mongoose.Types.ObjectId();
    await createUser('completion-nudge@example.com', true, userId);
    await ProfileModel.create({
      ...baseProfile({
        userId,
        displayId: 'VA555001',
        personal: { firstName: 'Amit' },
        createdAt: new Date('2026-06-10T09:00:00.000Z'),
        userStatus: AccountStatus.ACTIVE,
        stats: { profileViews: 0, interestsReceived: 0, interestsSent: 0, favouritesCount: 0 },
      }).toObject(),
      _id: undefined,
      createdAt: new Date('2026-06-10T09:00:00.000Z'),
      updatedAt: new Date('2026-06-10T09:00:00.000Z'),
    });

    await expect(sendProfileCompletionNudges(now)).resolves.toMatchObject({ sent: 1 });
    await expect(sendProfileCompletionNudges(now)).resolves.toMatchObject({ sent: 0 });

    expect(emailMocks.sendTemplatedEmail).toHaveBeenCalledTimes(1);
    expect(emailMocks.sendTemplatedEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'completion-nudge@example.com',
        isMarketing: true,
        recipientUserId: userId,
        templateKey: 'PROFILE_COMPLETION_NUDGE',
      }),
    );
    const updatedProfile = await ProfileModel.findOne({ userId }).orFail();
    expect(updatedProfile.lastCompletionNudgeSentAt?.toISOString()).toBe(now.toISOString());
  });
});
