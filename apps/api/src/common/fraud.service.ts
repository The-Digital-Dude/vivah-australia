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
