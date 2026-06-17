import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { VerificationLevel } from '@vivah/shared';
import { connectDatabase, disconnectDatabase } from '../db/connection.js';
import { SystemSettingModel } from '../models/index.js';
import {
  calculateVerificationBadge,
  DEFAULT_VERIFICATION_BADGE_RULES,
  VERIFICATION_BADGE_RULES_SETTING_KEY,
} from './badge.js';

let mongoServer: MongoMemoryServer;

describe('verification badge rules', () => {
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

  it('falls back to the default hardcoded rules when no setting is configured', async () => {
    const level = await calculateVerificationBadge({
      emailVerified: true,
      mobileVerified: true,
      identityVerified: true,
    });

    expect(level).toBe(VerificationLevel.SILVER);
    expect(DEFAULT_VERIFICATION_BADGE_RULES.GOLD.atLeast?.[0]?.count).toBe(1);
  });

  it('respects a custom configured rule set', async () => {
    await SystemSettingModel.create({
      key: VERIFICATION_BADGE_RULES_SETTING_KEY,
      value: {
        BASIC: { allOf: ['emailVerified'] },
        SILVER: { allOf: ['emailVerified', 'mobileVerified'] },
        GOLD: { allOf: ['emailVerified', 'mobileVerified', 'identityVerified', 'facialVerified'] },
        PLATINUM: {
          allOf: ['emailVerified', 'mobileVerified', 'identityVerified'],
          atLeast: [{ count: 2, from: ['addressVerified', 'employmentVerified'] }],
        },
        FULLY_VERIFIED: {
          allOf: ['emailVerified', 'mobileVerified', 'identityVerified', 'addressVerified'],
          atLeast: [{ count: 1, from: ['employmentVerified'] }],
        },
      },
      description: 'Custom verification badge rules',
    });

    const level = await calculateVerificationBadge({
      emailVerified: true,
      mobileVerified: true,
      identityVerified: true,
      addressVerified: true,
    });

    expect(level).toBe(VerificationLevel.SILVER);
  });
});
