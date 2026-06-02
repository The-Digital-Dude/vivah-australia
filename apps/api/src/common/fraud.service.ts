import type { Types } from 'mongoose';
import { FraudEventModel } from '../models/index.js';

export async function recordFraudEvent(input: {
  userId?: Types.ObjectId;
  rule: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  score: number;
  metadata?: Record<string, unknown>;
}) {
  return FraudEventModel.create({
    ...(input.userId ? { userId: input.userId } : {}),
    rule: input.rule,
    severity: input.severity,
    score: input.score,
    ...(input.metadata ? { metadata: input.metadata } : {}),
  });
}

export async function listFraudEvents() {
  return FraudEventModel.find({ isDeleted: false }).sort({ createdAt: -1 }).limit(100).lean();
}

export async function reviewFraudEvent(
  eventId: string,
  status: 'REVIEWED' | 'DISMISSED',
  reviewerId: Types.ObjectId,
) {
  return FraudEventModel.findOneAndUpdate(
    { _id: eventId, isDeleted: false },
    {
      $set: {
        status,
        updatedBy: reviewerId,
      },
    },
    { returnDocument: 'after' },
  );
}

export async function recordHighVelocityProfileViews(userId: Types.ObjectId, viewCount: number) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const existing = await FraudEventModel.countDocuments({
    userId,
    rule: 'HIGH_VELOCITY_PROFILE_VIEWS',
    createdAt: { $gte: oneHourAgo },
    isDeleted: false,
  });

  if (existing === 0) {
    await recordFraudEvent({
      userId,
      rule: 'HIGH_VELOCITY_PROFILE_VIEWS',
      severity: 'MEDIUM',
      score: Math.min(100, viewCount * 2),
      metadata: { window: '1h', viewCount },
    });
  }
}

async function recordDedupedFraudEvent(input: Parameters<typeof recordFraudEvent>[0]) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const existing = await FraudEventModel.countDocuments({
    ...(input.userId ? { userId: input.userId } : {}),
    rule: input.rule,
    createdAt: { $gte: oneHourAgo },
    isDeleted: false,
  });

  if (existing === 0) {
    await recordFraudEvent(input);
  }
}

export async function recordRepeatedReports(input: {
  reporterId: Types.ObjectId;
  reportCount: number;
  targetId?: string;
}) {
  await recordDedupedFraudEvent({
    userId: input.reporterId,
    rule: 'REPEATED_REPORT_SUBMISSIONS',
    severity: input.reportCount >= 10 ? 'HIGH' : 'MEDIUM',
    score: Math.min(100, input.reportCount * 10),
    metadata: { window: '24h', reportCount: input.reportCount, targetId: input.targetId },
  });
}

export async function recordDuplicateContactAttempts(input: {
  email: string;
  phone?: string;
  count: number;
}) {
  await recordDedupedFraudEvent({
    rule: 'DUPLICATE_CONTACT_ATTEMPTS',
    severity: input.count >= 6 ? 'HIGH' : 'LOW',
    score: Math.min(100, input.count * 12),
    metadata: { window: '24h', email: input.email, phone: input.phone, count: input.count },
  });
}

export async function recordUnusualMessageVolume(userId: Types.ObjectId, messageCount: number) {
  await recordDedupedFraudEvent({
    userId,
    rule: 'UNUSUAL_MESSAGE_VOLUME',
    severity: messageCount >= 80 ? 'HIGH' : 'MEDIUM',
    score: Math.min(100, messageCount * 2),
    metadata: { window: '1h', messageCount },
  });
}

export async function recordRepeatedOtpFailures(input: {
  userId: Types.ObjectId;
  mobile: string;
  attempts: number;
}) {
  await recordDedupedFraudEvent({
    userId: input.userId,
    rule: 'REPEATED_OTP_FAILURES',
    severity: input.attempts >= 5 ? 'HIGH' : 'MEDIUM',
    score: Math.min(100, input.attempts * 18),
    metadata: { mobile: input.mobile, attempts: input.attempts },
  });
}
