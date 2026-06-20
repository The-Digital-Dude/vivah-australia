import type { Types } from 'mongoose';
import { Types as MongooseTypes } from 'mongoose';
import crypto from 'crypto';
import { VerificationStatus, type PushSubscriptionInput } from '@vivah/shared';
import { sendPush } from '../common/push.service.js';
import { sendSms } from '../common/sms.service.js';
import { sendEmail, sendTemplatedEmail } from '../common/email.service.js';
import { logActivity } from '../common/audit.service.js';
import { recordRepeatedOtpFailures } from '../common/fraud.service.js';
import { emitUserNotification } from '../messages/messages.realtime.js';
import {
  MobileOtpModel,
  NotificationModel,
  ProfileModel,
  PushSubscriptionModel,
  UserModel,
} from '../models/index.js';
import { HttpError } from '../auth/auth-errors.js';

function encodeCursor(value: { timestamp: string; id: string }) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function decodeCursor(cursor?: string) {
  if (!cursor) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as {
      timestamp?: string;
      id?: string;
    };
    if (!decoded.timestamp || !decoded.id) {
      throw new Error('Invalid cursor');
    }
    const timestamp = new Date(decoded.timestamp);
    if (Number.isNaN(timestamp.getTime())) {
      throw new Error('Invalid cursor');
    }
    return { timestamp, id: decoded.id };
  } catch {
    throw new HttpError(400, 'Invalid cursor');
  }
}

function publicNotification(
  notification:
    | {
        _id?: unknown;
        id?: string;
        userId?: unknown;
        type: string;
        title: string;
        body?: string;
        data?: unknown;
        readAt?: Date | string;
        createdAt: Date | string;
        updatedAt?: Date | string;
      }
    | null,
) {
  if (!notification) {
    return null;
  }

  const notificationId =
    typeof notification.id === 'string'
      ? notification.id
      : notification._id instanceof MongooseTypes.ObjectId
        ? notification._id.toHexString()
        : undefined;
  const userId =
    notification.userId instanceof MongooseTypes.ObjectId
      ? notification.userId.toHexString()
      : typeof notification.userId === 'string'
        ? notification.userId
        : undefined;

  return {
    ...(notificationId ? { _id: notificationId } : {}),
    ...(userId ? { userId } : {}),
    type: notification.type,
    title: notification.title,
    ...(notification.body ? { body: notification.body } : {}),
    ...(notification.data !== undefined ? { data: notification.data } : {}),
    ...(notification.readAt ? { readAt: notification.readAt } : {}),
    createdAt: notification.createdAt,
    ...(notification.updatedAt ? { updatedAt: notification.updatedAt } : {}),
  };
}

export async function createNotification(input: {
  userId: Types.ObjectId;
  type: string;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
  emailSubject?: string;
  emailBody?: string;
  emailTemplateKey?: string;
  emailTemplateContext?: Record<string, unknown>;
  smsBody?: string;
  pushBody?: string;
  /** Set true for promotional / marketing emails — respects marketingNotifications preference */
  isMarketing?: boolean;
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
    const prefs = user?.notificationPreferences;
    const emailAllowed = input.isMarketing
      ? Boolean(user?.marketingConsent) && (prefs?.marketingNotifications ?? false)
      : (prefs?.emailNotifications ?? true);

    if (user?.email && emailAllowed) {
      if (input.emailTemplateKey) {
        await sendTemplatedEmail({
          to: user.email,
          templateKey: input.emailTemplateKey,
          context: {
            ...input.emailTemplateContext,
            title: input.title,
            body: input.body ?? input.emailBody,
            userId: String(input.userId),
          },
          subjectFallback: input.emailSubject,
          textFallback: input.emailBody,
          htmlFallback: `<p>${input.emailBody}</p>`,
          ...(input.isMarketing ? { isMarketing: true, recipientUserId: input.userId } : {}),
        });
      } else {
        await sendEmail({
          to: user.email,
          subject: input.emailSubject,
          text: input.emailBody,
          html: `<p>${input.emailBody}</p>`,
          ...(input.isMarketing ? { isMarketing: true, recipientUserId: input.userId } : {}),
        });
      }
    }
  }

  if (input.smsBody) {
    const user = await UserModel.findById(input.userId);
    const mobile = user?.mobile;
    if (mobile && user?.mobileVerified && (user.notificationPreferences?.smsNotifications ?? false)) {
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
            keys: subscription.keys as { p256dh: string; auth: string },
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

  emitUserNotification(input.userId, 'notification:new', {
    notification: publicNotification(notification.toObject()),
  });
  emitUserNotification(input.userId, 'notification:unread-count', {
    unreadCount: await unreadNotificationCount(input.userId),
  });

  return notification;
}

function hashOtp(code: string) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function createOtp(mobile: string) {
  let otp = '123456';
  if (process.env.NODE_ENV !== 'test') {
    otp = String(crypto.randomInt(100000, 1000000));
  }
  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n=== DEV MODE: OTP for ${mobile} is [ ${otp} ] ===\n`);
  }
  return otp;
}

export async function requestMobileOtp(userId: Types.ObjectId, mobile: string) {
  const recentOtp = await MobileOtpModel.findOne({
    userId,
    mobile,
    createdAt: { $gte: new Date(Date.now() - 60 * 1000) },
  });

  if (recentOtp) {
    throw new HttpError(429, 'Please wait 60 seconds before requesting a new code');
  }

  const code = createOtp(mobile);
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
  })
    .select('+codeHash')
    .sort({ createdAt: -1 });

  if (!otp) {
    throw new HttpError(400, 'Invalid or expired OTP');
  }

  otp.attempts += 1;
  if (otp.attempts > 5 || otp.codeHash !== hashOtp(code)) {
    await otp.save();
    if (otp.attempts >= 3) {
      void recordRepeatedOtpFailures({ userId, mobile, attempts: otp.attempts });
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

export async function listNotifications(
  userId: Types.ObjectId,
  unreadOnly = false,
  cursor?: string,
  limit = 50,
) {
  const decodedCursor = decodeCursor(cursor);
  const filter: Record<string, unknown> = {
    userId,
    isDeleted: false,
    ...(unreadOnly ? { readAt: { $exists: false } } : {}),
  };
  if (decodedCursor) {
    filter.$or = [
      { createdAt: { $lt: decodedCursor.timestamp } },
      { createdAt: decodedCursor.timestamp, _id: { $lt: decodedCursor.id } },
    ];
  }
  const notifications = await NotificationModel.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1)
    .lean();
  const hasMore = notifications.length > limit;
  const page = hasMore ? notifications.slice(0, limit) : notifications;
  const tail = page.at(-1);

  return {
    notifications: page,
    nextCursor:
      hasMore && tail
        ? encodeCursor({ timestamp: tail.createdAt.toISOString(), id: String(tail._id) })
        : null,
  };
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
  if (notification) {
    emitUserNotification(userId, 'notification:updated', {
      notification: publicNotification(notification.toObject()),
    });
    emitUserNotification(userId, 'notification:unread-count', {
      unreadCount: await unreadNotificationCount(userId),
    });
  }
  return notification;
}

export async function markAllNotificationsRead(userId: Types.ObjectId) {
  const result = await NotificationModel.updateMany(
    { userId, isDeleted: false, readAt: { $exists: false } },
    { $set: { readAt: new Date() } },
  );
  emitUserNotification(userId, 'notification:all-read', {
    readAt: new Date().toISOString(),
  });
  emitUserNotification(userId, 'notification:unread-count', { unreadCount: 0 });
  return result.modifiedCount;
}

export async function deleteNotification(userId: Types.ObjectId, notificationId: string) {
  const notification = await NotificationModel.findOneAndUpdate(
    { _id: notificationId, userId, isDeleted: false },
    { $set: { isDeleted: true, deletedAt: new Date(), deletedBy: userId } },
    { returnDocument: 'after' },
  );
  if (notification) {
    emitUserNotification(userId, 'notification:deleted', {
      notificationId: String(notification._id),
    });
    emitUserNotification(userId, 'notification:unread-count', {
      unreadCount: await unreadNotificationCount(userId),
    });
  }
  return notification;
}
