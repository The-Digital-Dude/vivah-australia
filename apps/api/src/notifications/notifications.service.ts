import type { Types } from 'mongoose';
import { sendEmail } from '../common/email.service.js';
import { logActivity } from '../common/audit.service.js';
import { NotificationModel, UserModel } from '../models/index.js';

export async function createNotification(input: {
  userId: Types.ObjectId;
  type: string;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
  emailSubject?: string;
  emailBody?: string;
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
    if (user?.email) {
      await sendEmail({
        to: user.email,
        subject: input.emailSubject,
        text: input.emailBody,
        html: `<p>${input.emailBody}</p>`,
      });
    }
  }

  await logActivity({
    actorId: input.userId,
    event: 'NOTIFICATION_CREATED',
    metadata: { type: input.type },
  });

  return notification;
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
    { new: true },
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
    { new: true },
  );
  return notification;
}
