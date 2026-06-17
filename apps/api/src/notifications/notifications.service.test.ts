import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountStatus, UserRole } from '@vivah/shared';
import { connectDatabase, disconnectDatabase } from '../db/connection.js';
import { NotificationModel, UserModel } from '../models/index.js';
import type { UserDocument } from '../models/index.js';
import {
  createNotification,
  deleteNotification,
  markAllNotificationsRead,
  markNotificationRead,
} from './notifications.service.js';

const emailMocks = vi.hoisted(() => ({
  sendEmail: vi.fn(),
  sendTemplatedEmail: vi.fn(),
}));

const smsMocks = vi.hoisted(() => ({
  sendSms: vi.fn(),
}));

const pushMocks = vi.hoisted(() => ({
  sendPush: vi.fn(),
}));

const realtimeMocks = vi.hoisted(() => ({
  emitUserNotification: vi.fn(),
}));

vi.mock('../common/email.service.js', () => ({
  sendEmail: emailMocks.sendEmail,
  sendTemplatedEmail: emailMocks.sendTemplatedEmail,
}));

vi.mock('../common/sms.service.js', () => ({
  sendSms: smsMocks.sendSms,
}));

vi.mock('../common/push.service.js', () => ({
  sendPush: pushMocks.sendPush,
}));

vi.mock('../messages/messages.realtime.js', () => ({
  emitUserNotification: realtimeMocks.emitUserNotification,
}));

let mongoServer: MongoMemoryServer;

async function createUser(overrides: Record<string, unknown> = {}): Promise<UserDocument> {
  return UserModel.create({
    email: 'member@example.com',
    mobile: '+61412345678',
    authProviders: ['email'],
    role: UserRole.USER,
    status: AccountStatus.ACTIVE,
    emailVerified: true,
    mobileVerified: true,
    failedLoginAttempts: 0,
    marketingConsent: true,
    notificationPreferences: {
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: false,
      marketingNotifications: true,
    },
    metadata: {},
    ...overrides,
  });
}

describe('notifications service', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await connectDatabase(mongoServer.getUri());
  }, 180000);

  beforeEach(async () => {
    emailMocks.sendEmail.mockReset();
    emailMocks.sendTemplatedEmail.mockReset();
    smsMocks.sendSms.mockReset();
    pushMocks.sendPush.mockReset();
    realtimeMocks.emitUserNotification.mockReset();
    await mongoose.connection.db?.dropDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
    await mongoServer?.stop();
  });

  it('blocks marketing emails when consent or marketing notifications are disabled', async () => {
    const optedOut = await createUser({
      email: 'opted-out@example.com',
      marketingConsent: false,
    });

    await createNotification({
      userId: optedOut._id,
      type: 'ONBOARDING_DRIP',
      title: 'Complete your profile',
      emailTemplateKey: 'ONBOARDING_DRIP_DAY_0',
      emailTemplateContext: { actionUrl: 'http://localhost:3000/member/profile/edit' },
      emailSubject: 'Complete your profile',
      emailBody: 'Complete your profile.',
      isMarketing: true,
    });

    expect(emailMocks.sendTemplatedEmail).not.toHaveBeenCalled();

    const disabledPref = await createUser({
      email: 'disabled-pref@example.com',
      notificationPreferences: {
        emailNotifications: true,
        smsNotifications: true,
        pushNotifications: false,
        marketingNotifications: false,
      },
    });

    await createNotification({
      userId: disabledPref._id,
      type: 'ONBOARDING_DRIP',
      title: 'Complete your profile',
      emailTemplateKey: 'ONBOARDING_DRIP_DAY_0',
      emailTemplateContext: { actionUrl: 'http://localhost:3000/member/profile/edit' },
      emailSubject: 'Complete your profile',
      emailBody: 'Complete your profile.',
      isMarketing: true,
    });

    expect(emailMocks.sendTemplatedEmail).not.toHaveBeenCalled();
    expect(await NotificationModel.countDocuments({ type: 'ONBOARDING_DRIP' })).toBe(2);
  });

  it('still sends transactional emails when marketing is unsubscribed', async () => {
    const user = await createUser({
      email: 'transactional@example.com',
      marketingConsent: false,
      notificationPreferences: {
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: false,
        marketingNotifications: false,
      },
    });

    await createNotification({
      userId: user._id,
      type: 'VERIFICATION_REVIEWED',
      title: 'Verification approved',
      emailTemplateKey: 'notification_verification_reviewed',
      emailTemplateContext: { status: 'APPROVED' },
      emailSubject: 'Verification approved',
      emailBody: 'Your verification was approved.',
    });

    expect(emailMocks.sendTemplatedEmail).toHaveBeenCalledTimes(1);
  });

  it('only sends SMS activity alerts to verified mobiles with SMS notifications enabled', async () => {
    const verified = await createUser({ email: 'verified@example.com' });
    await createNotification({
      userId: verified._id,
      type: 'NEW_MESSAGE',
      title: 'New message',
      smsBody: 'You have a new message.',
    });

    expect(smsMocks.sendSms).toHaveBeenCalledTimes(1);

    const unverified = await createUser({
      email: 'unverified@example.com',
      mobileVerified: false,
    });
    await createNotification({
      userId: unverified._id,
      type: 'NEW_MESSAGE',
      title: 'New message',
      smsBody: 'You have a new message.',
    });

    const disabled = await createUser({
      email: 'disabled@example.com',
      notificationPreferences: {
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: false,
        marketingNotifications: true,
      },
    });
    await createNotification({
      userId: disabled._id,
      type: 'NEW_MESSAGE',
      title: 'New message',
      smsBody: 'You have a new message.',
    });

    expect(smsMocks.sendSms).toHaveBeenCalledTimes(1);
  });

  it('emits realtime updates for create, read, read-all, and delete flows', async () => {
    const user = await createUser({ email: 'realtime@example.com' });
    const notification = await createNotification({
      userId: user._id,
      type: 'INTEREST_RECEIVED',
      title: 'New interest',
      body: 'A member sent you an interest.',
    });
    const notificationId = String(notification.id);

    expect(realtimeMocks.emitUserNotification).toHaveBeenCalledWith(
      user._id,
      'notification:new',
      expect.any(Object),
    );

    await markNotificationRead(user._id, notificationId);
    await markAllNotificationsRead(user._id);
    await deleteNotification(user._id, notificationId);

    expect(realtimeMocks.emitUserNotification).toHaveBeenCalledWith(
      user._id,
      'notification:updated',
      expect.any(Object),
    );
    expect(realtimeMocks.emitUserNotification).toHaveBeenCalledWith(
      user._id,
      'notification:all-read',
      expect.any(Object),
    );
    expect(realtimeMocks.emitUserNotification).toHaveBeenCalledWith(
      user._id,
      'notification:deleted',
      expect.objectContaining({ notificationId }),
    );
  });
});
