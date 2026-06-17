import { AccountStatus, UserRole } from '@vivah/shared';
import type { Types } from 'mongoose';
import { sendTemplatedEmail } from '../common/email.service.js';
import {
  MemberEmailDripProgressModel,
  UserModel,
} from '../models/index.js';

interface OnboardingDripStep {
  key: string;
  offsetDays: number;
  templateKey: string;
  subjectFallback: string;
  textFallback: string;
  actionPath: string;
}

const WEB_BASE_URL = process.env.WEB_BASE_URL ?? 'http://localhost:3000';

const ONBOARDING_DRIP_STEPS: OnboardingDripStep[] = [
  {
    key: 'DAY_0_COMPLETE_PROFILE',
    offsetDays: 0,
    templateKey: 'ONBOARDING_DRIP_DAY_0',
    subjectFallback: 'Welcome to Vivah Australia',
    textFallback:
      'Hi {{ firstName }}, complete your profile so serious matches can get a real sense of you. Update your profile: {{ actionUrl }}',
    actionPath: '/member/profile/edit',
  },
  {
    key: 'DAY_3_ADD_PHOTO_AND_DETAILS',
    offsetDays: 3,
    templateKey: 'ONBOARDING_DRIP_DAY_3',
    subjectFallback: 'Add the details members notice first',
    textFallback:
      'Add a clear photo and thoughtful profile details so members can understand you better. Update your profile: {{ actionUrl }}',
    actionPath: '/member/profile/edit',
  },
  {
    key: 'DAY_7_DISCOVER_MATCHES',
    offsetDays: 7,
    templateKey: 'ONBOARDING_DRIP_DAY_7',
    subjectFallback: 'Start exploring your matches',
    textFallback:
      'Browse recommended profiles and send thoughtful interests to members you genuinely connect with. Discover matches: {{ actionUrl }}',
    actionPath: '/member/matches',
  },
  {
    key: 'DAY_10_BUILD_TRUST',
    offsetDays: 10,
    templateKey: 'ONBOARDING_DRIP_DAY_10',
    subjectFallback: 'Build trust with verification',
    textFallback:
      'Verified members tend to get more attention and stronger replies. View verification: {{ actionUrl }}',
    actionPath: '/member/verification',
  },
  {
    key: 'DAY_14_KEEP_MOMENTUM',
    offsetDays: 14,
    templateKey: 'ONBOARDING_DRIP_DAY_14',
    subjectFallback: 'Keep your momentum going',
    textFallback:
      'Consistent activity, profile strength, and thoughtful outreach help you get the most from Vivah Australia. See your dashboard: {{ actionUrl }}',
    actionPath: '/member',
  },
];

function userFirstName(user: {
  email?: string;
}) {
  if (!user.email) {
    return 'there';
  }

  const [localPart] = user.email.split('@');
  return localPart ? localPart.slice(0, 1).toUpperCase() + localPart.slice(1) : 'there';
}

async function sendStepEmail(userId: Types.ObjectId, email: string, step: OnboardingDripStep) {
  await sendTemplatedEmail({
    to: email,
    recipientUserId: userId,
    isMarketing: true,
    templateKey: step.templateKey,
    subjectFallback: step.subjectFallback,
    textFallback: step.textFallback,
    context: {
      firstName: userFirstName({ email }),
      actionUrl: `${WEB_BASE_URL}${step.actionPath}`,
    },
  });
}

export async function sendNewMemberDripEmails(now = new Date()) {
  const dripWindowStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  let sent = 0;
  let skipped = 0;

  const cursor = UserModel.find({
    role: UserRole.USER,
    status: AccountStatus.ACTIVE,
    isDeleted: false,
    marketingConsent: true,
    'notificationPreferences.emailNotifications': true,
    'notificationPreferences.marketingNotifications': true,
    createdAt: { $gte: dripWindowStart, $lte: now },
  }).cursor();

  for await (const user of cursor) {
    if (!user.email) {
      skipped += 1;
      continue;
    }

    const ageDays = Math.floor(
      (now.getTime() - user.createdAt.getTime()) / (24 * 60 * 60 * 1000),
    );
    const dueSteps = ONBOARDING_DRIP_STEPS.filter((step) => ageDays >= step.offsetDays);

    let sentForUser = false;

    for (const step of dueSteps) {
      const alreadySent = await MemberEmailDripProgressModel.findOne({
        userId: user._id,
        stepKey: step.key,
        isDeleted: false,
      }).lean();

      if (alreadySent) {
        continue;
      }

      await sendStepEmail(user._id, user.email, step);
      await MemberEmailDripProgressModel.create({
        userId: user._id,
        stepKey: step.key,
        sentAt: now,
      });
      sent += 1;
      sentForUser = true;
    }

    if (!sentForUser) {
      skipped += 1;
    }
  }

  return { sent, skipped };
}

export { ONBOARDING_DRIP_STEPS };
