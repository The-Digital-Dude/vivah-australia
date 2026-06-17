import { AccountStatus, UserRole } from '@vivah/shared';
import type { Types } from 'mongoose';
import { sendTemplatedEmail } from '../common/email.service.js';
import {
  InterestModel,
  ProfileModel,
  ProfileViewModel,
  UserModel,
} from '../models/index.js';

const WEB_BASE_URL = process.env.WEB_BASE_URL ?? 'http://localhost:3000';
const WEEKLY_DIGEST_INTERVAL_DAYS = 7;

function userFirstName(user: { email?: string }, fallback?: string) {
  if (fallback) {
    return fallback;
  }

  if (!user.email) {
    return 'there';
  }

  const [localPart] = user.email.split('@');
  return localPart ? localPart.slice(0, 1).toUpperCase() + localPart.slice(1) : 'there';
}

function weekWindowStart(now: Date) {
  return new Date(now.getTime() - WEEKLY_DIGEST_INTERVAL_DAYS * 24 * 60 * 60 * 1000);
}

interface WeeklyDigestStats {
  profileViews: number;
  interestsReceived: number;
  completionPercentage: number;
  firstName?: string;
  nextActionLabel: string;
  actionUrl: string;
}

async function collectWeeklyDigestStats(
  userId: Types.ObjectId,
  now: Date,
): Promise<WeeklyDigestStats | null> {
  const profile = await ProfileModel.findOne({
    userId,
    isDeleted: false,
    userIsDeleted: false,
    userStatus: AccountStatus.ACTIVE,
  }).lean();

  if (!profile) {
    return null;
  }

  const from = weekWindowStart(now);
  const [profileViews, interestsReceived] = await Promise.all([
    ProfileViewModel.countDocuments({
      profileUserId: userId,
      viewedAt: { $gte: from, $lte: now },
      isDeleted: false,
    }),
    InterestModel.countDocuments({
      receiverId: userId,
      createdAt: { $gte: from, $lte: now },
      isDeleted: false,
    }),
  ]);

  return {
    profileViews,
    interestsReceived,
    completionPercentage: profile.completionPercentage ?? 0,
    ...(profile.personal?.firstName ? { firstName: profile.personal.firstName } : {}),
    nextActionLabel:
      profile.completionPercentage >= 100 ? 'Check your latest matches' : 'Complete your profile',
    actionUrl:
      profile.completionPercentage >= 100
        ? `${WEB_BASE_URL}/member/matches`
        : `${WEB_BASE_URL}/member/profile/edit`,
  };
}

async function sendWeeklyDigest(
  userId: Types.ObjectId,
  email: string,
  firstName: string | undefined,
  stats: WeeklyDigestStats,
) {
  await sendTemplatedEmail({
    to: email,
    recipientUserId: userId,
    isMarketing: true,
    templateKey: 'WEEKLY_ACTIVITY_DIGEST',
    subjectFallback: 'Your Vivah Australia weekly activity digest',
    textFallback:
      'Hi {{ firstName }}, this week you had {{ profileViews }} profile views and {{ interestsReceived }} new interests. Your profile is {{ completionPercentage }}% complete. {{ nextActionLabel }}: {{ actionUrl }}',
    htmlFallback: `
      <div style="font-family:sans-serif;color:#333;max-width:600px;margin:0 auto;padding:20px;">
        <h2 style="color:#A10E4D;">Your weekly Vivah Australia update</h2>
        <p>Hi {{ firstName }}, here is your activity snapshot for the past 7 days.</p>
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin:20px 0;">
          <div style="min-width:160px;padding:16px;border:1px solid #f2d5de;border-radius:12px;background:#FFF8F1;">
            <p style="margin:0;font-size:12px;color:#6B7280;">Profile views</p>
            <p style="margin:8px 0 0;font-size:28px;font-weight:700;color:#A10E4D;">{{ profileViews }}</p>
          </div>
          <div style="min-width:160px;padding:16px;border:1px solid #f2d5de;border-radius:12px;background:#FFF8F1;">
            <p style="margin:0;font-size:12px;color:#6B7280;">Interests received</p>
            <p style="margin:8px 0 0;font-size:28px;font-weight:700;color:#A10E4D;">{{ interestsReceived }}</p>
          </div>
        </div>
        <p>Your profile is currently <strong>{{ completionPercentage }}% complete</strong>.</p>
        <a href="{{ actionUrl }}" style="display:inline-block;background:#A10E4D;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;">{{ nextActionLabel }}</a>
      </div>
    `,
    context: {
      firstName,
      profileViews: stats.profileViews,
      interestsReceived: stats.interestsReceived,
      completionPercentage: stats.completionPercentage,
      nextActionLabel: stats.nextActionLabel,
      actionUrl: stats.actionUrl,
    },
  });
}

export async function sendWeeklyActivityDigests(now = new Date()) {
  const resendBefore = weekWindowStart(now);
  let sent = 0;
  let skipped = 0;

  const cursor = UserModel.find({
    role: UserRole.USER,
    status: AccountStatus.ACTIVE,
    isDeleted: false,
    marketingConsent: true,
    'notificationPreferences.emailNotifications': true,
    'notificationPreferences.marketingNotifications': true,
    $or: [
      { lastWeeklyDigestSentAt: { $exists: false } },
      { lastWeeklyDigestSentAt: { $lte: resendBefore } },
    ],
  }).cursor();

  for await (const user of cursor) {
    if (!user.email) {
      skipped += 1;
      continue;
    }

    const stats = await collectWeeklyDigestStats(user._id, now);
    if (!stats) {
      skipped += 1;
      continue;
    }

    if (stats.profileViews === 0 && stats.interestsReceived === 0 && stats.completionPercentage >= 100) {
      skipped += 1;
      continue;
    }

    const firstName = stats.firstName ?? userFirstName(user);

    await sendWeeklyDigest(user._id, user.email, firstName, stats);
    user.lastWeeklyDigestSentAt = now;
    await user.save();
    sent += 1;
  }

  return { sent, skipped };
}
