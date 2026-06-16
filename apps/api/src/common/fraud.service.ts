import type { Types } from 'mongoose';
import { ReportStatus } from '@vivah/shared';
import { ReportModel, FraudEventModel } from '../models/index.js';

type FraudSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

const FRAUD_RULES = {
  HIGH_VELOCITY_PROFILE_VIEWS: {
    label: 'High velocity profile views',
    dedupeWindowMs: 60 * 60 * 1000,
    severityFor: (_viewCount: number): FraudSeverity => 'MEDIUM',
    scoreFor: (viewCount: number) => Math.min(100, viewCount * 2),
  },
  REPEATED_REPORT_SUBMISSIONS: {
    label: 'Repeated report submissions',
    dedupeWindowMs: 60 * 60 * 1000,
    severityFor: (reportCount: number): FraudSeverity => (reportCount >= 10 ? 'HIGH' : 'MEDIUM'),
    scoreFor: (reportCount: number) => Math.min(100, reportCount * 10),
  },
  DUPLICATE_CONTACT_ATTEMPTS: {
    label: 'Duplicate contact attempts',
    dedupeWindowMs: 60 * 60 * 1000,
    severityFor: (count: number): FraudSeverity => (count >= 6 ? 'HIGH' : 'LOW'),
    scoreFor: (count: number) => Math.min(100, count * 12),
  },
  UNUSUAL_MESSAGE_VOLUME: {
    label: 'Unusual message volume',
    dedupeWindowMs: 60 * 60 * 1000,
    severityFor: (messageCount: number): FraudSeverity => (messageCount >= 80 ? 'HIGH' : 'MEDIUM'),
    scoreFor: (messageCount: number) => Math.min(100, messageCount * 2),
  },
  REPEATED_OTP_FAILURES: {
    label: 'Repeated OTP failures',
    dedupeWindowMs: 60 * 60 * 1000,
    severityFor: (attempts: number): FraudSeverity => (attempts >= 5 ? 'HIGH' : 'MEDIUM'),
    scoreFor: (attempts: number) => Math.min(100, attempts * 18),
  },
  REPORTED_USER_RISK_SCORE: {
    label: 'Reported user risk score',
    dedupeWindowMs: 0,
  },
} as const;

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
  reviewReason?: string,
) {
  return FraudEventModel.findOneAndUpdate(
    { _id: eventId, isDeleted: false },
    {
      $set: {
        status,
        updatedBy: reviewerId,
        reviewReason: reviewReason?.trim() || undefined,
      },
    },
    { returnDocument: 'after' },
  );
}

export async function recordHighVelocityProfileViews(userId: Types.ObjectId, viewCount: number) {
  const oneHourAgo = new Date(Date.now() - FRAUD_RULES.HIGH_VELOCITY_PROFILE_VIEWS.dedupeWindowMs);
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
      severity: FRAUD_RULES.HIGH_VELOCITY_PROFILE_VIEWS.severityFor(viewCount),
      score: FRAUD_RULES.HIGH_VELOCITY_PROFILE_VIEWS.scoreFor(viewCount),
      metadata: { window: '1h', viewCount },
    });
  }
}

async function recordDedupedFraudEvent(input: Parameters<typeof recordFraudEvent>[0]) {
  const dedupeWindowMs = FRAUD_RULES[input.rule as keyof typeof FRAUD_RULES]?.dedupeWindowMs ?? 60 * 60 * 1000;
  const oneHourAgo = new Date(Date.now() - dedupeWindowMs);
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
    severity: FRAUD_RULES.REPEATED_REPORT_SUBMISSIONS.severityFor(input.reportCount),
    score: FRAUD_RULES.REPEATED_REPORT_SUBMISSIONS.scoreFor(input.reportCount),
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
    severity: FRAUD_RULES.DUPLICATE_CONTACT_ATTEMPTS.severityFor(input.count),
    score: FRAUD_RULES.DUPLICATE_CONTACT_ATTEMPTS.scoreFor(input.count),
    metadata: { window: '24h', email: input.email, phone: input.phone, count: input.count },
  });
}

export async function recordUnusualMessageVolume(userId: Types.ObjectId, messageCount: number) {
  await recordDedupedFraudEvent({
    userId,
    rule: 'UNUSUAL_MESSAGE_VOLUME',
    severity: FRAUD_RULES.UNUSUAL_MESSAGE_VOLUME.severityFor(messageCount),
    score: FRAUD_RULES.UNUSUAL_MESSAGE_VOLUME.scoreFor(messageCount),
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
    severity: FRAUD_RULES.REPEATED_OTP_FAILURES.severityFor(input.attempts),
    score: FRAUD_RULES.REPEATED_OTP_FAILURES.scoreFor(input.attempts),
    metadata: { mobile: input.mobile, attempts: input.attempts },
  });
}

export function fraudRuleLabel(rule: string) {
  return FRAUD_RULES[rule as keyof typeof FRAUD_RULES]?.label ?? rule;
}

const reportedUserRiskStatuses = [ReportStatus.OPEN, ReportStatus.ASSIGNED] as const;

function reportSeverityRank(value: string) {
  const rank: Record<string, number> = {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
    CRITICAL: 4,
  };
  return rank[value] ?? 1;
}

function reportRiskSeverity(openReportCount: number, highestSeverity: string) {
  if (highestSeverity === 'CRITICAL' || openReportCount >= 5) return 'CRITICAL' as const;
  if (highestSeverity === 'HIGH' || openReportCount >= 3) return 'HIGH' as const;
  if (highestSeverity === 'MEDIUM' || openReportCount >= 2) return 'MEDIUM' as const;
  return 'LOW' as const;
}

function reportRiskScore(openReportCount: number, highestSeverity: string) {
  const severityWeight: Record<string, number> = {
    LOW: 8,
    MEDIUM: 18,
    HIGH: 32,
    CRITICAL: 50,
  };
  return Math.min(100, openReportCount * 15 + (severityWeight[highestSeverity] ?? 8));
}

export async function syncReportedUserRiskCounter(reportedUserId: Types.ObjectId) {
  const activeReports = await ReportModel.find({
    reportedUserId,
    status: { $in: reportedUserRiskStatuses },
    isDeleted: false,
  })
    .select('severity status createdAt')
    .lean();

  const latestEvent = await FraudEventModel.findOne({
    userId: reportedUserId,
    rule: 'REPORTED_USER_RISK_SCORE',
    isDeleted: false,
  }).sort({ createdAt: -1 });

  if (activeReports.length === 0) {
    if (latestEvent) {
      latestEvent.status = 'REVIEWED';
      latestEvent.score = 0;
      latestEvent.metadata = {
        ...(typeof latestEvent.metadata === 'object' && latestEvent.metadata ? latestEvent.metadata : {}),
        activeReportCount: 0,
        highestSeverity: 'LOW',
        statuses: [],
      };
      await latestEvent.save();
    }
    return latestEvent;
  }

  const highestSeverity = activeReports
    .map((report) => report.severity)
    .sort((left, right) => reportSeverityRank(right) - reportSeverityRank(left))[0] ?? 'LOW';
  const activeReportCount = activeReports.length;
  const nextSeverity = reportRiskSeverity(activeReportCount, highestSeverity);
  const nextScore = reportRiskScore(activeReportCount, highestSeverity);
  const metadata = {
    activeReportCount,
    highestSeverity,
    statuses: [...new Set(activeReports.map((report) => report.status))],
  };

  if (latestEvent) {
    latestEvent.status = 'OPEN';
    latestEvent.severity = nextSeverity;
    latestEvent.score = nextScore;
    latestEvent.metadata = metadata;
    await latestEvent.save();
    return latestEvent;
  }

  return FraudEventModel.create({
    userId: reportedUserId,
    rule: 'REPORTED_USER_RISK_SCORE',
    severity: nextSeverity,
    status: 'OPEN',
    score: nextScore,
    metadata,
  });
}
