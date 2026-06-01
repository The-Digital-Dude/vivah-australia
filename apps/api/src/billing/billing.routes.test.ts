import request from 'supertest';
import type { Response } from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AccountStatus, Gender, PaymentStatus, SubscriptionStatus, UserRole } from '@vivah/shared';
import { createApp } from '../app.js';
import { createTokenPair } from '../auth/token.service.js';
import type { AuthConfig } from '../auth/auth-types.js';
import { connectDatabase, disconnectDatabase } from '../db/connection.js';
import {
  InvoiceModel,
  PaymentModel,
  PlanModel,
  ProfileApprovalStatus,
  ProfileBoostModel,
  ProfileModel,
  RefundModel,
  SubscriptionModel,
  UserModel,
} from '../models/index.js';

const authConfig: AuthConfig = {
  accessSecret: 'test-access-secret-minimum-32-characters',
  refreshSecret: 'test-refresh-secret-minimum-32-characters',
  accessExpiresIn: '15m',
  refreshExpiresIn: '30d',
  exposeSensitiveTokens: true,
};

const app = createApp({
  corsOrigins: ['http://localhost:3000'],
  auth: authConfig,
});

let mongoServer: MongoMemoryServer;

function bodyAs<TBody>(response: Response): TBody {
  return response.body as TBody;
}

async function createUser(email: string, role = UserRole.USER) {
  const user = await UserModel.create({
    email,
    authProviders: ['email'],
    role,
    status: AccountStatus.ACTIVE,
    emailVerified: true,
    mobileVerified: false,
    failedLoginAttempts: 0,
    refreshTokenVersion: 0,
    marketingConsent: false,
    metadata: {},
  });
  const accessToken = createTokenPair(authConfig, {
    id: user.id,
    role: user.role,
    refreshTokenVersion: user.refreshTokenVersion,
  }).accessToken;

  return { user, accessToken };
}

async function createProfile(userId: mongoose.Types.ObjectId) {
  return ProfileModel.create({
    userId,
    displayId: `VA${Date.now()}`,
    completionPercentage: 100,
    personal: {
      firstName: 'Amit',
      lastName: 'Member',
      gender: Gender.MALE,
      age: 31,
      dateOfBirth: new Date('1994-01-01'),
      maritalStatus: 'NEVER_MARRIED',
    },
    religion: { religion: 'Hindu', community: 'Indian', languagesSpoken: ['English'] },
    location: { country: 'Australia', state: 'VIC', city: 'Melbourne' },
    education: { highestQualification: 'Bachelor degree' },
    employment: { occupation: 'Engineer', annualIncomeVisibility: 'PRIVATE' },
    family: {},
    lifestyle: {},
    about: {
      aboutMe: 'A complete profile for billing and boost tests.',
      partnerExpectations: 'Looking for a compatible long-term match.',
    },
    partnerPreference: {},
    verification: {
      level: 'BASIC',
      emailVerified: true,
      mobileVerified: false,
      identityVerified: false,
      addressVerified: false,
      employmentVerified: false,
      visaVerified: false,
      policeClearanceVerified: false,
      facialVerified: false,
    },
    visibility: {
      status: 'MEMBERS_ONLY',
      showPhoto: true,
      showIncome: false,
      showEmployer: false,
      showLastName: false,
    },
    stats: { profileViews: 0, interestsReceived: 0, interestsSent: 0, favouritesCount: 0 },
    moderation: { approvalStatus: ProfileApprovalStatus.APPROVED },
  });
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await connectDatabase(mongoServer.getUri());
}, 180000);

beforeEach(async () => {
  await mongoose.connection.db?.dropDatabase();
});

afterAll(async () => {
  await disconnectDatabase();
  await mongoServer?.stop();
});

describe('billing routes and webhooks', () => {
  it('allows admins to configure plans and public users to list active plans', async () => {
    const admin = await createUser('admin@example.com', UserRole.ADMIN);

    await request(app)
      .post('/api/admin/plans')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        code: 'premium',
        name: 'Premium',
        description: 'Full discovery access',
        priceCents: 4900,
        currency: 'AUD',
        interval: 'MONTH',
        features: ['Advanced search', 'Profile boosts'],
        limits: { profileBoostsMonthly: 2, interestsMonthly: -1 },
        stripePriceId: 'price_premium',
        sortOrder: 10,
        active: true,
      })
      .expect(201);

    const response = await request(app).get('/api/plans').expect(200);
    const body = bodyAs<{ plans: Array<{ code: string; limits: Record<string, number> }> }>(
      response,
    );

    expect(body.plans).toHaveLength(1);
    expect(body.plans[0]).toMatchObject({
      code: 'PREMIUM',
      limits: { profileBoostsMonthly: 2, interestsMonthly: -1 },
    });
  });

  it('creates mock checkout sessions when Stripe credentials are not configured', async () => {
    const user = await createUser('member@example.com');
    await PlanModel.create({
      code: 'GOLD',
      name: 'Gold',
      priceCents: 9900,
      currency: 'AUD',
      interval: 'MONTH',
      features: [],
      limits: { profileBoostsMonthly: 1 },
      active: true,
    });

    const response = await request(app)
      .post('/api/me/subscription/checkout')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ planCode: 'gold' })
      .expect(201);

    expect(bodyAs<{ checkoutUrl: string }>(response).checkoutUrl).toContain('checkout=mock');
    expect(await PaymentModel.countDocuments({ userId: user.user._id })).toBe(1);
  });

  it('processes checkout and invoice webhooks into subscriptions, payments, and invoices', async () => {
    const user = await createUser('webhook@example.com');
    const plan = await PlanModel.create({
      code: 'PLATINUM',
      name: 'Platinum',
      priceCents: 14900,
      currency: 'AUD',
      interval: 'MONTH',
      features: [],
      limits: { profileBoostsMonthly: 4 },
      active: true,
    });

    await request(app)
      .post('/api/billing/webhook')
      .set('Content-Type', 'application/json')
      .send({
        id: 'evt_checkout',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test',
            object: 'checkout.session',
            customer: 'cus_test',
            subscription: 'sub_test',
            metadata: { userId: String(user.user._id), planId: String(plan._id) },
          },
        },
      })
      .expect(200);

    const subscription = await SubscriptionModel.findOne({ userId: user.user._id }).orFail();
    expect(subscription.status).toBe(SubscriptionStatus.ACTIVE);
    expect(subscription.providerSubscriptionId).toBe('sub_test');

    await request(app)
      .post('/api/billing/webhook')
      .set('Content-Type', 'application/json')
      .send({
        id: 'evt_invoice',
        type: 'invoice.paid',
        data: {
          object: {
            id: 'in_test',
            number: 'INV-001',
            customer: 'cus_test',
            subscription: 'sub_test',
            payment_intent: 'pi_test',
            amount_paid: 14900,
            total: 14900,
            currency: 'aud',
            hosted_invoice_url: 'https://stripe.example/invoice',
            invoice_pdf: 'https://stripe.example/invoice.pdf',
          },
        },
      })
      .expect(200);

    expect(await PaymentModel.countDocuments({ providerPaymentId: 'pi_test' })).toBe(1);
    expect(await InvoiceModel.countDocuments({ invoiceNumber: 'INV-001' })).toBe(1);
  });

  it('creates refunds and activates profile boosts with usage counters', async () => {
    const admin = await createUser('refund-admin@example.com', UserRole.ADMIN);
    const user = await createUser('boost@example.com');
    await createProfile(user.user._id);
    const plan = await PlanModel.create({
      code: 'BOOST',
      name: 'Boost',
      priceCents: 5900,
      currency: 'AUD',
      interval: 'MONTH',
      features: [],
      limits: { profileBoostsMonthly: 1 },
      active: true,
    });
    await SubscriptionModel.create({
      userId: user.user._id,
      planId: plan._id,
      status: SubscriptionStatus.ACTIVE,
      startsAt: new Date(),
      provider: 'stripe',
    });
    const payment = await PaymentModel.create({
      userId: user.user._id,
      planId: plan._id,
      amountCents: 5900,
      currency: 'AUD',
      status: PaymentStatus.SUCCEEDED,
      provider: 'stripe',
      providerPaymentId: 'pi_refund',
      refundedAmountCents: 0,
    });

    await request(app)
      .post('/api/admin/refunds')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ paymentId: payment.id, amountCents: 1000, reason: 'Goodwill' })
      .expect(201);

    expect(await RefundModel.countDocuments({ paymentId: payment._id })).toBe(1);
    expect((await PaymentModel.findById(payment._id).orFail()).status).toBe(
      PaymentStatus.PARTIALLY_REFUNDED,
    );

    await request(app)
      .post('/api/me/boosts')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ durationHours: 24 })
      .expect(201);
    await request(app)
      .post('/api/me/boosts')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ durationHours: 24 })
      .expect(403);

    expect(await ProfileBoostModel.countDocuments({ userId: user.user._id })).toBe(1);
  });
});
