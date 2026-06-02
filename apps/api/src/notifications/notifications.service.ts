import type { Types } from 'mongoose';
import crypto from 'crypto';
import { VerificationStatus, type PushSubscriptionInput } from '@vivah/shared';
import { sendPush } from '../common/push.service.js';
import { sendSms } from '../common/sms.service.js';
import { sendEmail } from '../common/email.service.js';
import { logActivity } from '../common/audit.service.js';
import { recordRepeatedOtpFailures } from '../common/fraud.service.js';
import {
  MobileOtpModel,
  NotificationModel,
  ProfileModel,
  PushSubscriptionModel,
  UserModel,
} from '../models/index.js';
import { HttpError } from '../auth/auth-errors.js';

export async function createNotification(input: {
  userId: Types.ObjectId;
  type: string;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
  emailSubject?: string;
  emailBody?: string;
  smsBody?: string;
  pushBody?: string;
}) {
  const notification = await NotificationModel.create({
    userId: input.userId,
    type: input.type,
    title: input.title,
    ...(input.body ? { body: input.body } : {}),
    ...(input.data ? { data: input.data } : {}),
  });

  if (input.emailSubject && input.emailBody) {
    const user = await UserModel.findById(input.userId);
    if (user?.email && (user.notificationPreferences?.emailNotifications ?? true)) {
      await sendEmail({
        to: user.email,
        subject: input.emailSubject,
        text: input.emailBody,
        html: `<p>${input.emailBody}</p>`,
      });
    }
  }

  if (input.smsBody) {
    const user = await UserModel.findById(input.userId);
    const mobile = user?.mobile;
    if (mobile && (user.notificationPreferences?.smsNotifications ?? false)) {
      await sendSms({ to: mobile, message: input.smsBody });
    }
  }

  if (input.pushBody) {
    const user = await UserModel.findById(input.userId);
    if (user?.notificationPreferences?.pushNotifications ?? false) {
      const subscriptions = await PushSubscriptionModel.find({
        userId: input.userId,
        active: true,
        isDeleted: false,
      }).lean();
      await Promise.all(
        subscriptions.map((subscription) =>
          sendPush({
            endpoint: subscription.endpoint,
            title: input.title,
            body: input.pushBody ?? input.body ?? input.title,
            data: input.data,
          }),
        ),
      );
    }
  }

  await logActivity({
    actorId: input.userId,
    event: 'NOTIFICATION_CREATED',
    metadata: { type: input.type },
  });

  return notification;
}

function hashOtp(code: string) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function createOtp() {
  if (process.env.NODE_ENV === 'test') {
    return '123456';
  }
  return String(crypto.randomInt(100000, 1000000));
}

export async function requestMobileOtp(userId: Types.ObjectId, mobile: string) {
  const code = createOtp();
  await MobileOtpModel.updateMany(
    { userId, mobile, usedAt: { $exists: false }, isDeleted: false },
    { $set: { isDeleted: true, deletedAt: new Date(), deletedBy: userId } },
  );
  await MobileOtpModel.create({
    userId,
    mobile,
    codeHash: hashOtp(code),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });
  await UserModel.updateOne({ _id: userId }, { $set: { mobile } });
  await sendSms({ to: mobile, message: `Your Vivah Australia verification code is ${code}` });
  await logActivity({ actorId: userId, event: 'MOBILE_OTP_REQUESTED', metadata: { mobile } });

  return { message: 'Verification code sent.' };
}

export async function verifyMobileOtp(userId: Types.ObjectId, mobile: string, code: string) {
  const otp = await MobileOtpModel.findOne({
    userId,
    mobile,
    usedAt: { $exists: false },
    expiresAt: { $gt: new Date() },
    isDeleted: false,
  }).sort({ createdAt: -1 });

  if (!otp) {
    throw new HttpError(400, 'Invalid or expired OTP');
  }

  otp.attempts += 1;
  if (otp.attempts > 5 || otp.codeHash !== hashOtp(code)) {
    await otp.save();
    if (otp.attempts >= 3) {
      await recordRepeatedOtpFailures({ userId, mobile, attempts: otp.attempts });
    }
    throw new HttpError(400, 'Invalid or expired OTP');
  }

  otp.usedAt = new Date();
  await otp.save();
  await UserModel.updateOne({ _id: userId }, { $set: { mobile, mobileVerified: true } });
  await ProfileModel.updateOne(
    { userId, isDeleted: false },
    {
      $set: {
        'verification.mobileVerified': true,
        'verification.mobileStatus': VerificationStatus.APPROVED,
      },
    },
  );
  await logActivity({ actorId: userId, event: 'MOBILE_OTP_VERIFIED', metadata: { mobile } });
  return { message: 'Mobile verified.' };
}

export async function savePushSubscription(userId: Types.ObjectId, input: PushSubscriptionInput) {
  const subscription = await PushSubscriptionModel.findOneAndUpdate(
    { userId, endpoint: input.endpoint },
    {
      $set: {
        userId,
        endpoint: input.endpoint,
        keys: input.keys,
        userAgent: input.userAgent,
        active: true,
        isDeleted: false,
      },
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  );
  return subscription;
}

export async function sendTestPush(userId: Types.ObjectId) {
  await createNotification({
    userId,
    type: 'PUSH_TEST',
    title: 'Push notifications ready',
    body: 'Your push notification subscription is configured.',
    pushBody: 'Your Vivah Australia push subscription is configured.',
  });
}

export async function listNotifications(userId: Types.ObjectId, unreadOnly = false) {
  return NotificationModel.find({
    userId,
    isDeleted: false,
    ...(unreadOnly ? { readAt: { $exists: false } } : {}),
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
}

export async function unreadNotificationCount(userId: Types.ObjectId) {
  return NotificationModel.countDocuments({ userId, isDeleted: false, readAt: { $exists: false } });
}

export async function markNotificationRead(userId: Types.ObjectId, notificationId: string) {
  const notification = await NotificationModel.findOneAndUpdate(
    { _id: notificationId, userId, isDeleted: false },
    { $set: { readAt: new Date() } },
    { returnDocument: 'after' },
  );
  return notification;
}

export async function markAllNotificationsRead(userId: Types.ObjectId) {
  const result = await NotificationModel.updateMany(
    { userId, isDeleted: false, readAt: { $exists: false } },
    { $set: { readAt: new Date() } },
  );
  return result.modifiedCount;
}

export async function deleteNotification(userId: Types.ObjectId, notificationId: string) {
  const notification = await NotificationModel.findOneAndUpdate(
    { _id: notificationId, userId, isDeleted: false },
    { $set: { isDeleted: true, deletedAt: new Date(), deletedBy: userId } },
    { returnDocument: 'after' },
  );
  return notification;
}
