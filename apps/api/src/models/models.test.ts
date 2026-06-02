import { describe, expect, it } from 'vitest';
import { phaseOneModels, phaseOneSchemas, profileSchema, userSchema } from './index.js';

function hasIndex(indexes: Array<[Record<string, unknown>, Record<string, unknown>]>, key: string) {
  return indexes.some(([fields]) => Object.prototype.hasOwnProperty.call(fields, key));
}

describe('database models', () => {
  it('registers every Phase 1 collection model', () => {
    expect(phaseOneModels).toHaveLength(38);
  });

  it('defines required user indexes', () => {
    const indexes = userSchema.indexes();

    expect(indexes).toContainEqual([
      { email: 1 },
      expect.objectContaining({ unique: true, sparse: true }),
    ]);
    expect(indexes).toContainEqual([
      { mobile: 1 },
      expect.objectContaining({ unique: true, sparse: true }),
    ]);
  });

  it('defines required profile search indexes', () => {
    const indexes = profileSchema.indexes();

    expect(hasIndex(indexes, 'personal.gender')).toBe(true);
    expect(hasIndex(indexes, 'personal.dateOfBirth')).toBe(true);
    expect(hasIndex(indexes, 'religion.religion')).toBe(true);
    expect(hasIndex(indexes, 'location.city')).toBe(true);
    expect(hasIndex(indexes, 'employment.occupation')).toBe(true);
  });

  it('defines required relationship and activity indexes', () => {
    expect(phaseOneSchemas.interestSchema.indexes()).toContainEqual([
      { senderId: 1, receiverId: 1 },
      expect.objectContaining({ unique: true }),
    ]);
    expect(phaseOneSchemas.blockSchema.indexes()).toContainEqual([
      { blockerId: 1, blockedId: 1 },
      expect.objectContaining({ unique: true }),
    ]);
    expect(phaseOneSchemas.messageSchema.indexes()).toContainEqual([
      { conversationId: 1, createdAt: 1 },
      {},
    ]);
    expect(phaseOneSchemas.subscriptionSchema.indexes()).toContainEqual([
      { userId: 1, status: 1 },
      {},
    ]);
    expect(phaseOneSchemas.paymentSchema.indexes()).toContainEqual([
      { userId: 1, createdAt: 1 },
      {},
    ]);
    expect(phaseOneSchemas.profileViewSchema.indexes()).toContainEqual([
      { viewerId: 1, profileId: 1 },
      expect.objectContaining({ unique: true }),
    ]);
    expect(phaseOneSchemas.pushSubscriptionSchema.indexes()).toContainEqual([
      { userId: 1, endpoint: 1 },
      expect.objectContaining({ unique: true }),
    ]);
    expect(phaseOneSchemas.savedSearchSchema.indexes()).toContainEqual([
      { userId: 1, name: 1 },
      expect.objectContaining({ unique: true }),
    ]);
  });
});
