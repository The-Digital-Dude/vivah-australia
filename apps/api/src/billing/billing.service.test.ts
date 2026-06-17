import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountStatus, PaymentStatus, RefundStatus, UserRole } from '@vivah/shared';
import { connectDatabase, disconnectDatabase } from '../db/connection.js';
import { PaymentModel, RefundModel, UserModel, type UserDocument } from '../models/index.js';
import type { createRefund as createRefundFunction } from './billing.service.js';

const stripeMocks = vi.hoisted(() => ({
  refundsCreate: vi.fn(),
}));

vi.mock('stripe', () => ({
  default: vi.fn().mockImplementation(() => ({
    refunds: {
      create: stripeMocks.refundsCreate,
    },
  })),
}));

let mongoServer: MongoMemoryServer;
let createRefund: typeof createRefundFunction;

async function createUser(email: string): Promise<UserDocument> {
  return UserModel.create({
    email,
    authProviders: ['email'],
    role: UserRole.USER,
    status: AccountStatus.ACTIVE,
    emailVerified: true,
    mobileVerified: false,
    failedLoginAttempts: 0,
    refreshTokenVersion: 0,
    marketingConsent: false,
    metadata: {},
  });
}

describe('billing refund service', () => {
  beforeAll(async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_refunds';
    mongoServer = await MongoMemoryServer.create();
    await connectDatabase(mongoServer.getUri());
    ({ createRefund } = await import('./billing.service.js'));
  }, 180000);

  beforeEach(async () => {
    stripeMocks.refundsCreate.mockReset();
    await mongoose.connection.db?.dropDatabase();
  });

  afterAll(async () => {
    delete process.env.STRIPE_SECRET_KEY;
    await disconnectDatabase();
    await mongoServer?.stop();
  });

  it('rejects concurrent over-refunds before a second Stripe refund is created', async () => {
    const user = await createUser('refund-race@example.com');
    const payment = await PaymentModel.create({
      userId: user._id,
      amountCents: 1000,
      currency: 'AUD',
      status: PaymentStatus.SUCCEEDED,
      provider: 'stripe',
      providerPaymentId: 'pi_concurrent_refund',
      refundedAmountCents: 0,
    });
    stripeMocks.refundsCreate.mockResolvedValue({ id: 're_one', status: 'succeeded' });

    const results = await Promise.allSettled([
      createRefund({ paymentId: payment.id, amountCents: 1000 }),
      createRefund({ paymentId: payment.id, amountCents: 1000 }),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
    expect(stripeMocks.refundsCreate).toHaveBeenCalledTimes(1);

    const updatedPayment = await PaymentModel.findById(payment._id).orFail();
    expect(updatedPayment.refundedAmountCents).toBe(1000);
    expect(updatedPayment.status).toBe(PaymentStatus.REFUNDED);
    expect(await RefundModel.countDocuments({ paymentId: payment._id })).toBe(1);
  });

  it('rolls back the reserved refunded amount when Stripe refund creation fails', async () => {
    const user = await createUser('refund-failure@example.com');
    const payment = await PaymentModel.create({
      userId: user._id,
      amountCents: 2500,
      currency: 'AUD',
      status: PaymentStatus.SUCCEEDED,
      provider: 'stripe',
      providerPaymentId: 'pi_failed_refund',
      refundedAmountCents: 0,
    });
    stripeMocks.refundsCreate.mockRejectedValue(new Error('stripe refund unavailable'));

    await expect(createRefund({ paymentId: payment.id, amountCents: 1200 })).rejects.toThrow(
      'stripe refund unavailable',
    );

    const updatedPayment = await PaymentModel.findById(payment._id).orFail();
    expect(updatedPayment.refundedAmountCents).toBe(0);
    expect(updatedPayment.status).toBe(PaymentStatus.SUCCEEDED);

    const refund = await RefundModel.findOne({ paymentId: payment._id }).orFail();
    expect(refund.status).toBe(RefundStatus.FAILED);
  });
});
