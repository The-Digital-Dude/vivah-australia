import Stripe from 'stripe';
import {
  InvoiceStatus,
  PaymentStatus,
  RefundStatus,
  SubscriptionStatus,
  type BoostCreateInput,
  type CheckoutSessionInput,
  type CouponInput,
  type PlanInput,
  type PlanUpdateInput,
  type RefundCreateInput,
} from '@vivah/shared';
import { Types } from 'mongoose';
import { env } from '../env.js';
import { HttpError } from '../auth/auth-errors.js';
import {
  CouponModel,
  InvoiceModel,
  PaymentModel,
  PlanModel,
  ProfileBoostModel,
  ProfileModel,
  RefundModel,
  StripeEventLogModel,
  SubscriptionModel,
  UsageCounterModel,
  UserModel,
  type PlanDocument,
} from '../models/index.js';
import { sendTemplatedEmail } from '../common/email.service.js';
import { logAudit } from '../common/audit.service.js';
import { runInTransaction } from '../common/mongo-transactions.js';

const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2026-05-27.dahlia' })
  : undefined;

interface StripeRequestError {
  type?: string;
  rawType?: string;
}

interface StripeSubscriptionSnapshot {
  current_period_end?: number;
}

function toObjectId(id: string | Types.ObjectId) {
  return typeof id === 'string' ? new Types.ObjectId(id) : id;
}

function publicPlan(plan: PlanDocument | null) {
  if (!plan) {
    return null;
  }

  const rawLimits: unknown = plan.limits;
  const limits: Record<string, number> =
    rawLimits instanceof Map
      ? Object.fromEntries(
          Array.from(rawLimits.entries()).map(([key, value]) => [String(key), Number(value)]),
        )
      : (rawLimits as Record<string, number>);

  return {
    id: plan.id,
    code: plan.code,
    name: plan.name,
    description: plan.description,
    priceCents: plan.priceCents,
    currency: plan.currency,
    interval: plan.interval,
    features: plan.features,
    limits,
    stripePriceId: plan.stripePriceId,
    sortOrder: plan.sortOrder,
    active: plan.active,
  };
}

function periodFor(date = new Date()) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
  return { start, end };
}

async function activeSubscription(userId: Types.ObjectId) {
  const now = new Date();
  await SubscriptionModel.updateMany(
    {
      userId,
      status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
      currentPeriodEnd: { $lt: now },
      isDeleted: false,
    },
    {
      $set: {
        status: SubscriptionStatus.EXPIRED,
        endsAt: now,
      },
    },
  );
  return SubscriptionModel.findOne({
    userId,
    status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
    startsAt: { $lte: now },
    isDeleted: false,
    $and: [
      { $or: [{ currentPeriodEnd: { $exists: false } }, { currentPeriodEnd: { $gt: now } }] },
    ],
    $or: [{ endsAt: { $exists: false } }, { endsAt: { $gt: now } }],
  }).sort({ createdAt: -1 });
}

async function activateSubscriptionRecord(
  userId: Types.ObjectId,
  planId: Types.ObjectId,
  input: {
    provider?: string;
    providerCustomerId?: string;
    providerSubscriptionId?: string;
    currentPeriodEnd?: Date;
  },
) {
  return runInTransaction(async (session) => {
    await SubscriptionModel.updateMany(
      { userId, status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] } },
      { $set: { status: SubscriptionStatus.CANCELED, endsAt: new Date() } },
      session ? { session } : {},
    );

    const created = new SubscriptionModel({
      userId,
      planId,
      status: SubscriptionStatus.ACTIVE,
      startsAt: new Date(),
      cancelAtPeriodEnd: false,
      ...(input.provider ? { provider: input.provider } : {}),
      ...(input.providerCustomerId ? { providerCustomerId: input.providerCustomerId } : {}),
      ...(input.providerSubscriptionId ? { providerSubscriptionId: input.providerSubscriptionId } : {}),
      ...(input.currentPeriodEnd ? { currentPeriodEnd: input.currentPeriodEnd } : {}),
    });
    await created.save(session ? { session } : undefined);

    return created;
  });
}

export async function isPaidMember(userId: Types.ObjectId): Promise<boolean> {
  const subscription = await activeSubscription(userId);
  if (!subscription) return false;
  const plan = await PlanModel.findOne({ _id: subscription.planId, active: true, isDeleted: false }).lean();
  return plan?.code !== 'FREE' && !!plan;
}

export async function listPlans(includeInactive = false) {
  const plans = await PlanModel.find({
    isDeleted: false,
    ...(includeInactive ? {} : { active: true }),
  }).sort({ sortOrder: 1, priceCents: 1 });

  return plans.map((plan) => publicPlan(plan));
}

export async function upsertPlan(actorId: Types.ObjectId, input: PlanInput) {
  const existing = await PlanModel.findOne({ code: input.code });
  const plan = await PlanModel.findOneAndUpdate(
    { code: input.code },
    { $set: input },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
  );
  await logAudit({
    actorId,
    actorRole: 'ADMIN',
    action: existing ? 'PLAN_UPDATED' : 'PLAN_CREATED',
    targetId: plan._id,
    targetType: 'PLAN',
    metadata: { code: input.code, name: input.name, priceCents: input.priceCents },
  });
  return publicPlan(plan);
}

export async function updatePlan(actorId: Types.ObjectId, planId: string, input: PlanUpdateInput) {
  const plan = await PlanModel.findOneAndUpdate(
    { _id: planId, isDeleted: false },
    { $set: input },
    { returnDocument: 'after' },
  );

  if (!plan) {
    throw new HttpError(404, 'Plan not found');
  }

  await logAudit({
    actorId,
    actorRole: 'ADMIN',
    action: 'PLAN_UPDATED',
    targetId: plan._id,
    targetType: 'PLAN',
    metadata: { code: plan.code, changes: Object.keys(input) },
  });
  return publicPlan(plan);
}

export async function deletePlan(actorId: Types.ObjectId, planId: string) {
  const plan = await PlanModel.findOneAndUpdate(
    { _id: planId, isDeleted: false },
    { $set: { isDeleted: true, deletedAt: new Date(), deletedBy: actorId, active: false } },
    { returnDocument: 'after' },
  );
  if (!plan) throw new HttpError(404, 'Plan not found');
  await logAudit({
    actorId,
    actorRole: 'ADMIN',
    action: 'PLAN_DELETED',
    targetId: plan._id,
    targetType: 'PLAN',
    metadata: { code: plan.code },
  });
}

export async function createCheckoutSession(userId: Types.ObjectId, input: CheckoutSessionInput) {
  const plan = await PlanModel.findOne({ code: input.planCode, active: true, isDeleted: false });
  if (!plan) {
    throw new HttpError(404, 'Plan not found');
  }

  const coupon = input.couponCode
    ? await CouponModel.findOne({
        code: input.couponCode,
        active: true,
        isDeleted: false,
        $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }],
      })
    : undefined;

  if (input.couponCode && !coupon) {
    throw new HttpError(404, 'Coupon not found');
  }

  if (coupon && coupon.maxRedemptions != null && coupon.redemptionCount >= coupon.maxRedemptions) {
    throw new HttpError(410, 'This coupon has reached its maximum number of uses');
  }

  if (!stripe || !plan.stripePriceId) {
    if (env.NODE_ENV === 'production') {
      throw new HttpError(400, 'Stripe billing is not configured in production.');
    }

    const payment = new PaymentModel({
      userId,
      planId: plan._id,
      amountCents: plan.priceCents,
      currency: plan.currency,
      status: PaymentStatus.PENDING,
      provider: 'stripe',
      description: `${plan.name} checkout`,
      ...(coupon ? { couponId: coupon._id } : {}),
    });
    await payment.save();

    return {
      checkoutUrl: `${env.WEB_BASE_URL}/member/subscription?checkout=mock&paymentId=${payment.id}`,
      sessionId: `mock_${payment.id}`,
    };
  }

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    success_url: `${env.WEB_BASE_URL}/member/subscription?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.WEB_BASE_URL}/pricing?checkout=cancelled`,
    metadata: {
      userId: String(userId),
      planId: String(plan._id),
      couponId: coupon ? String(coupon._id) : '',
    },
  };
  if (coupon?.stripeCouponId) {
    sessionParams.discounts = [{ coupon: coupon.stripeCouponId }];
  }

  try {
    const session = await stripe.checkout.sessions.create(sessionParams);
    return { checkoutUrl: session.url, sessionId: session.id };
  } catch (error: unknown) {
    const stripeError = error as StripeRequestError;
    if (
      stripeError.type === 'StripeInvalidRequestError' ||
      stripeError.rawType === 'invalid_request_error'
    ) {
      throw new HttpError(
        400,
        `Stripe Configuration Error: The price ID '${plan.stripePriceId}' was not found in your Stripe account. Please create this product in your Stripe dashboard and update the Plan, or remove your STRIPE_SECRET_KEY to use the mock checkout.`
      );
    }
    throw error;
  }
}

export async function createBillingPortalSession(userId: Types.ObjectId) {
  const subscription = await activeSubscription(userId);
  if (!subscription) {
    throw new HttpError(404, 'No active subscription found');
  }

  if (!stripe) {
    if (env.NODE_ENV === 'production') {
      throw new HttpError(400, 'Stripe billing is not configured in production.');
    }

    return {
      portalUrl: `${env.WEB_BASE_URL}/member/subscription?billing=mock`,
      message: 'Mock billing portal ready.',
    };
  }

  if (!subscription.providerCustomerId) {
    throw new HttpError(404, 'No Stripe billing customer found for this subscription.');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.providerCustomerId,
    return_url: `${env.WEB_BASE_URL}/member/subscription`,
  });

  return {
    portalUrl: session.url,
    message: 'Billing portal ready.',
  };
}

export async function getSubscriptionOverview(userId: Types.ObjectId) {
  const subscription = await activeSubscription(userId);
  const plan = subscription
    ? await PlanModel.findOne({ _id: subscription.planId, isDeleted: false })
    : await PlanModel.findOne({ code: 'FREE', isDeleted: false });
  const { start } = periodFor();
  const usage = await UsageCounterModel.find({
    userId,
    periodStart: start,
    isDeleted: false,
  }).lean();

  return {
    subscription: subscription
      ? {
          id: subscription.id,
          status: subscription.status,
          startsAt: subscription.startsAt,
          endsAt: subscription.endsAt,
          currentPeriodEnd: subscription.currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        }
      : null,
    plan: publicPlan(plan),
    usage: usage.map((item) => ({
      key: item.key,
      count: item.count,
      periodStart: item.periodStart,
      periodEnd: item.periodEnd,
    })),
  };
}

export async function revokeExpiredSubscriptions(now = new Date()) {
  const expirationCutoff = new Date(now.getTime() - 5 * 60 * 1000);

  const staleSubscriptions = await SubscriptionModel.find({
    status: SubscriptionStatus.ACTIVE,
    currentPeriodEnd: { $lt: expirationCutoff },
    isDeleted: false,
  })
    .select('_id currentPeriodEnd')
    .lean();

  if (staleSubscriptions.length === 0) {
    return { expiredCount: 0 };
  }

  const operations = await Promise.all(
    staleSubscriptions.map(async (subscription) => {
      const result = await SubscriptionModel.updateOne(
        {
          _id: subscription._id,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodEnd: { $lt: expirationCutoff },
          isDeleted: false,
        },
        {
          $set: {
            status: SubscriptionStatus.EXPIRED,
            endsAt: subscription.currentPeriodEnd ?? now,
          },
        },
      );

      return result.modifiedCount;
    }),
  );

  return {
    expiredCount: operations.reduce((sum, count) => sum + count, 0),
  };
}

export async function listPayments(userId?: Types.ObjectId) {
  const payments = await PaymentModel.find({ ...(userId ? { userId } : {}), isDeleted: false })
    .sort({ createdAt: -1 })
    .limit(100);
  return payments.map((payment) => ({
    id: payment.id,
    userId: String(payment.userId),
    amountCents: payment.amountCents,
    currency: payment.currency,
    status: payment.status,
    provider: payment.provider,
    providerPaymentId: payment.providerPaymentId,
    description: payment.description,
    refundedAmountCents: payment.refundedAmountCents,
    createdAt: payment.createdAt,
  }));
}

export async function listSubscriptions() {
  const subscriptions = await SubscriptionModel.find({ isDeleted: false })
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();
  const planIds = subscriptions.map((subscription) => subscription.planId);
  const plans = await PlanModel.find({ _id: { $in: planIds } })
    .select('code name')
    .lean();
  const planById = new Map(plans.map((plan) => [String(plan._id), plan]));

  return subscriptions.map((subscription) => {
    const plan = planById.get(String(subscription.planId));
    return {
      id: String(subscription._id),
      userId: String(subscription.userId),
      planId: String(subscription.planId),
      planCode: plan?.code,
      planName: plan?.name,
      status: subscription.status,
      provider: subscription.provider,
      startsAt: subscription.startsAt,
      endsAt: subscription.endsAt,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      createdAt: subscription.createdAt,
    };
  });
}

export async function listInvoices(userId?: Types.ObjectId) {
  const invoices = await InvoiceModel.find({ ...(userId ? { userId } : {}), isDeleted: false })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  return invoices;
}

export async function getAdminPaymentDetail(paymentId: string) {
  const payment = await PaymentModel.findOne({ _id: paymentId, isDeleted: false }).lean();
  if (!payment) {
    throw new HttpError(404, 'Payment not found');
  }

  const invoice = payment.providerPaymentId
    ? await InvoiceModel.findOne({ paymentId: payment._id, isDeleted: false }).lean()
    : null;

  const subscription = payment.providerSubscriptionId
    ? await SubscriptionModel.findOne({
        providerSubscriptionId: payment.providerSubscriptionId,
        isDeleted: false,
      }).lean()
    : null;

  const user = await UserModel.findById(payment.userId).select('email role status').lean();

  return { payment, invoice, subscription, user };
}

export async function listCoupons() {
  return CouponModel.find({ isDeleted: false }).sort({ createdAt: -1 }).limit(100).lean();
}

export async function createCoupon(actorId: Types.ObjectId, input: CouponInput) {
  const coupon = await CouponModel.findOneAndUpdate(
    { code: input.code },
    { $set: input },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
  );
  await logAudit({
    actorId,
    actorRole: 'ADMIN',
    action: 'COUPON_CREATED',
    targetId: coupon._id,
    targetType: 'COUPON',
    metadata: { code: input.code, percentOff: input.percentOff, maxRedemptions: input.maxRedemptions },
  });
  return coupon.toObject();
}

export async function updateCoupon(actorId: Types.ObjectId, couponId: string, input: Partial<CouponInput>) {
  const coupon = await CouponModel.findOneAndUpdate(
    { _id: couponId, isDeleted: false },
    { $set: input },
    { returnDocument: 'after' },
  );
  if (!coupon) throw new HttpError(404, 'Coupon not found');
  await logAudit({
    actorId,
    actorRole: 'ADMIN',
    action: 'COUPON_UPDATED',
    targetId: coupon._id,
    targetType: 'COUPON',
    metadata: { code: coupon.code, changes: Object.keys(input) },
  });
  return coupon.toObject();
}

export async function deleteCoupon(actorId: Types.ObjectId, couponId: string) {
  const coupon = await CouponModel.findOneAndUpdate(
    { _id: couponId, isDeleted: false },
    { $set: { isDeleted: true, deletedAt: new Date(), deletedBy: actorId, active: false } },
    { returnDocument: 'after' },
  );
  if (!coupon) throw new HttpError(404, 'Coupon not found');
  await logAudit({
    actorId,
    actorRole: 'ADMIN',
    action: 'COUPON_DELETED',
    targetId: coupon._id,
    targetType: 'COUPON',
    metadata: { code: coupon.code },
  });
}

export async function listRefunds() {
  return RefundModel.find({ isDeleted: false }).sort({ createdAt: -1 }).limit(100).lean();
}

async function releaseRefundReservation(paymentId: Types.ObjectId, amountCents: number) {
  await PaymentModel.findOneAndUpdate(
    { _id: paymentId, isDeleted: false },
    [
      {
        $set: {
          refundedAmountCents: {
            $max: [{ $subtract: ['$refundedAmountCents', amountCents] }, 0],
          },
        },
      },
      {
        $set: {
          status: {
            $cond: [
              { $lte: ['$refundedAmountCents', 0] },
              PaymentStatus.SUCCEEDED,
              {
                $cond: [
                  { $gte: ['$refundedAmountCents', '$amountCents'] },
                  PaymentStatus.REFUNDED,
                  PaymentStatus.PARTIALLY_REFUNDED,
                ],
              },
            ],
          },
        },
      },
    ],
    { updatePipeline: true },
  );
}

export async function createRefund(input: RefundCreateInput, adminId?: Types.ObjectId) {
  const payment = await PaymentModel.findOne({ _id: input.paymentId, isDeleted: false });
  if (!payment) {
    throw new HttpError(404, 'Payment not found');
  }

  const remaining = payment.amountCents - payment.refundedAmountCents;
  const amountCents = input.amountCents ?? remaining;
  if (amountCents <= 0) {
    throw new HttpError(400, 'Refund amount must be greater than zero');
  }
  if (amountCents > remaining) {
    throw new HttpError(400, 'Refund exceeds remaining payment amount');
  }

  const refund = await runInTransaction(async (session) => {
    const updatedPayment = await PaymentModel.findOneAndUpdate(
      {
        _id: payment._id,
        isDeleted: false,
        refundedAmountCents: { $lte: payment.amountCents - amountCents },
      },
      [
        {
          $set: {
            refundedAmountCents: { $add: ['$refundedAmountCents', amountCents] },
          },
        },
        {
          $set: {
            status: {
              $cond: [
                { $gte: ['$refundedAmountCents', '$amountCents'] },
                PaymentStatus.REFUNDED,
                PaymentStatus.PARTIALLY_REFUNDED,
              ],
            },
          },
        },
      ],
      { returnDocument: 'after', updatePipeline: true, ...(session ? { session } : {}) },
    );
    if (!updatedPayment) {
      throw new HttpError(409, 'Refund exceeds remaining payment amount');
    }

    const [createdRefund] = await RefundModel.create(
      [
        {
          userId: payment.userId,
          paymentId: payment._id,
          amountCents,
          currency: payment.currency,
          status: stripe && payment.providerPaymentId ? RefundStatus.PENDING : RefundStatus.SUCCEEDED,
          provider: payment.provider,
          ...(input.reason ? { reason: input.reason } : {}),
        },
      ],
      session ? { session } : undefined,
    );
    if (!createdRefund) {
      throw new Error('Refund reservation did not create a refund record');
    }

    return createdRefund;
  });

  if (stripe && payment.providerPaymentId) {
    try {
      const stripeRefund = await stripe.refunds.create({
        payment_intent: payment.providerPaymentId,
        amount: amountCents,
        metadata: { refundId: refund.id },
      });
      refund.providerRefundId = stripeRefund.id;
      refund.status =
        stripeRefund.status === 'succeeded' ? RefundStatus.SUCCEEDED : RefundStatus.PENDING;
    } catch (error) {
      await releaseRefundReservation(payment._id, amountCents);
      refund.status = RefundStatus.FAILED;
      await refund.save();
      throw error;
    }

    await refund.save();
  }

  if (adminId) {
    await logAudit({
      actorId: adminId,
      actorRole: 'ADMIN',
      action: 'ADMIN_REFUND_ISSUED',
      targetId: payment._id,
      targetType: 'PAYMENT',
      metadata: {
        amountCents,
        reason: input.reason,
      },
    });
  }

  return refund;
}

export async function incrementUsage(userId: Types.ObjectId, key: string, amount = 1) {
  const { start, end } = periodFor();
  const counter = await UsageCounterModel.findOneAndUpdate(
    { userId, key, periodStart: start },
    { $setOnInsert: { periodEnd: end }, $inc: { count: amount } },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
  );
  return counter;
}

export async function requireEntitlement(userId: Types.ObjectId, key: string, amount = 1) {
  const overview = await getSubscriptionOverview(userId);
  let limit = Number(overview.plan?.limits?.[key] ?? 0);
  
  if (limit === 0 && key === 'profileBoostsMonthly' && overview.plan?.limits?.['profileBoosts'] !== undefined) {
    limit = Number(overview.plan.limits['profileBoosts']);
  }
  if (limit === 0 && key === 'monthlyInterests' && overview.plan?.limits?.['interestsPerMonth'] !== undefined) {
    limit = Number(overview.plan.limits['interestsPerMonth']);
  }

  if (limit === -1) {
    return overview;
  }
  const used = overview.usage.find((item) => item.key === key)?.count ?? 0;
  if (used + amount > limit) {
    throw new HttpError(403, 'Upgrade required for this entitlement');
  }
  return overview;
}

export async function createProfileBoost(userId: Types.ObjectId, input: BoostCreateInput) {
  await requireEntitlement(userId, 'profileBoostsMonthly');
  const profile = await ProfileModel.findOne({ userId, isDeleted: false });
  if (!profile) {
    throw new HttpError(404, 'Profile not found');
  }

  const startsAt = new Date();
  const endsAt = new Date(startsAt.getTime() + input.durationHours * 60 * 60 * 1000);
  const boost = await ProfileBoostModel.create({
    userId,
    profileId: profile._id,
    source: 'ENTITLEMENT',
    startsAt,
    endsAt,
    active: true,
  });

  await ProfileModel.updateOne(
    { _id: profile._id },
    { $set: { 'stats.activeBoostEndsAt': endsAt } }
  );

  await incrementUsage(userId, 'profileBoostsMonthly');

  return boost.toObject();
}

export async function listOwnBoosts(userId: Types.ObjectId) {
  const boosts = await ProfileBoostModel.find({ userId, isDeleted: false })
    .sort({ createdAt: -1 })
    .lean();
  return boosts;
}

export async function cancelSubscription(userId: Types.ObjectId) {
  const subscription = await activeSubscription(userId);
  if (!subscription) {
    throw new HttpError(404, 'No active subscription found');
  }

  if (stripe && subscription.providerSubscriptionId) {
    const stripeSubscription = (await stripe.subscriptions.update(subscription.providerSubscriptionId, {
      cancel_at_period_end: true,
    })) as Stripe.Subscription;
    subscription.cancelAtPeriodEnd = stripeSubscription.cancel_at_period_end;
    const periodEnd = (stripeSubscription as unknown as { current_period_end?: number }).current_period_end;
    if (periodEnd) {
      subscription.currentPeriodEnd = new Date(periodEnd * 1000);
    }
  } else {
    // No Stripe configured – cancel immediately in local records
    subscription.status = SubscriptionStatus.CANCELED;
    subscription.endsAt = new Date();
    subscription.cancelAtPeriodEnd = false;
  }

  await subscription.save();
  return {
    status: subscription.status,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    currentPeriodEnd: subscription.currentPeriodEnd,
    message: stripe && subscription.providerSubscriptionId
      ? 'Your subscription will cancel at the end of the current period.'
      : 'Your subscription has been cancelled.',
  };
}

export async function handleStripeEvent(event: Stripe.Event) {
  // Idempotency guard — skip if we have already processed this event
  try {
    await StripeEventLogModel.create({
      stripeEventId: event.id,
      type: event.type,
      processedAt: new Date(),
    });
  } catch {
    // Duplicate key error → already processed, skip silently
    return;
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata?.userId;
    const planId = session.metadata?.planId;
    if (!userId || !planId) {
      return;
    }

    await activateSubscriptionRecord(toObjectId(userId), toObjectId(planId), {
      provider: 'stripe',
      ...(session.customer
        ? {
            providerCustomerId:
              typeof session.customer === 'string' ? session.customer : session.customer.id,
          }
        : {}),
      ...(session.subscription
        ? {
            providerSubscriptionId:
              typeof session.subscription === 'string'
                ? session.subscription
                : session.subscription.id,
          }
        : {}),
    });

    const couponId = session.metadata?.couponId;
    if (couponId && Types.ObjectId.isValid(couponId)) {
      await CouponModel.updateOne(
        { _id: new Types.ObjectId(couponId) },
        { $inc: { redemptionCount: 1 } },
      );
    }
  }

  if (event.type === 'invoice.paid') {
    const invoice = event.data.object as Stripe.Invoice & {
      subscription?: string | { id: string };
      payment_intent?: string | { id: string };
    };
    const subscriptionId =
      typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
    const subscription = subscriptionId
      ? await SubscriptionModel.findOne({
          providerSubscriptionId: subscriptionId,
          isDeleted: false,
        })
      : null;
    if (!subscription) {
      return;
    }

    const payment = await PaymentModel.findOneAndUpdate(
      {
        providerPaymentId: invoice.payment_intent
          ? typeof invoice.payment_intent === 'string'
            ? invoice.payment_intent
            : invoice.payment_intent.id
          : invoice.id,
      },
      {
        $set: {
          userId: subscription.userId,
          planId: subscription.planId,
          amountCents: invoice.amount_paid,
          currency: invoice.currency.toUpperCase(),
          status: PaymentStatus.SUCCEEDED,
          provider: 'stripe',
          providerPaymentId: invoice.payment_intent
            ? typeof invoice.payment_intent === 'string'
              ? invoice.payment_intent
              : invoice.payment_intent.id
            : invoice.id,
          providerCustomerId:
            typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id,
          providerSubscriptionId: subscriptionId,
          description: 'Subscription invoice payment',
        },
      },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
    );

    await InvoiceModel.findOneAndUpdate(
      { providerInvoiceId: invoice.id },
      {
        $set: {
          userId: subscription.userId,
          paymentId: payment._id,
          invoiceNumber: invoice.number ?? invoice.id,
          providerInvoiceId: invoice.id,
          providerHostedUrl: invoice.hosted_invoice_url ?? undefined,
          providerPdfUrl: invoice.invoice_pdf ?? undefined,
          status: InvoiceStatus.PAID,
          totalCents: invoice.total,
          currency: invoice.currency.toUpperCase(),
        },
      },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
    );
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    await SubscriptionModel.findOneAndUpdate(
      { providerSubscriptionId: subscription.id },
      { $set: { status: SubscriptionStatus.CANCELED, endsAt: new Date() } },
    );
  }
  if (event.type === 'customer.subscription.updated') {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const stripeSubscription = event.data.object as Stripe.Subscription;
    const periodEnd = (stripeSubscription as unknown as { current_period_end?: number }).current_period_end;
    const update: Record<string, unknown> = {
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      ...(periodEnd ? { currentPeriodEnd: new Date(periodEnd * 1000) } : {}),
    };
    if (stripeSubscription.status === 'active') {
      update.status = SubscriptionStatus.ACTIVE;
    } else if (stripeSubscription.status === 'past_due') {
      update.status = SubscriptionStatus.PAST_DUE;
    } else if (stripeSubscription.status === 'canceled') {
      update.status = SubscriptionStatus.CANCELED;
      update.endsAt = new Date();
    } else if (stripeSubscription.status === 'trialing') {
      update.status = SubscriptionStatus.TRIALING;
    }
    await SubscriptionModel.findOneAndUpdate(
      { providerSubscriptionId: stripeSubscription.id },
      { $set: update },
    );
  }

  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice & {
      subscription?: string | { id: string };
    };
    const subscriptionId =
      typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
    if (subscriptionId) {
      const subscription = await SubscriptionModel.findOneAndUpdate(
        { providerSubscriptionId: subscriptionId },
        { $set: { status: SubscriptionStatus.PAST_DUE } },
      );
      if (subscription) {
        const user = await UserModel.findById(subscription.userId).lean();
        if (user && user.email) {
          await sendTemplatedEmail({
            to: user.email,
            templateKey: 'PAYMENT_FAILED',
            subjectFallback: 'Action Required: Payment Failed for Vivah Australia',
            htmlFallback: `
              <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #A10E4D;">Payment Failed</h2>
                <p>We were unable to process the payment for your recent invoice. To maintain your premium access and avoid interruption, please update your payment method.</p>
                <a href="{{ portalUrl }}" style="display: inline-block; background-color: #A10E4D; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">Update Payment Method</a>
              </div>
            `,
            context: {
              portalUrl: `${env.WEB_BASE_URL}/member/subscription`,
            },
          });
        }
      }
    }
  }
}

export function constructStripeEvent(body: Buffer, signature?: string) {
  if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
    if (env.NODE_ENV === 'production') {
      throw new HttpError(400, 'Stripe billing or webhook signature verification is not configured in production.');
    }
    return JSON.parse(body.toString('utf8')) as unknown as Stripe.Event;
  }

  if (!signature) {
    throw new HttpError(400, 'Missing Stripe signature');
  }

  return stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
}

export async function createPaymentIntent(userId: Types.ObjectId, amountCents: number, currency = 'AUD') {
  if (!stripe) {
    if (env.NODE_ENV === 'production') {
      throw new HttpError(400, 'Stripe billing is not configured in production.');
    }
    return {
      clientSecret: 'mock_client_secret_intent_' + Math.random().toString(36).substring(7),
      amountCents,
      currency,
    };
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: currency.toLowerCase(),
    metadata: {
      userId: String(userId),
    },
  });

  return {
    clientSecret: paymentIntent.client_secret,
    amountCents,
    currency,
  };
}

export async function verifyCheckoutSession(userId: Types.ObjectId, sessionId: string) {
  if (!stripe) return false;

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== 'paid' && session.status !== 'complete') {
    return false;
  }

  const metadata = session.metadata;
  if (!metadata || metadata.userId !== String(userId)) {
    return false;
  }

  let providerSubscriptionId: string | undefined;
  if (session.subscription) {
    providerSubscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
  }

  if (providerSubscriptionId) {
    const existingSubscription = await SubscriptionModel.findOne({ providerSubscriptionId });
    if (existingSubscription) {
      return true; // Already verified by webhook
    }
  }

  const plan = await PlanModel.findById(metadata.planId);
  if (!plan) return false;

  let currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  if (providerSubscriptionId) {
    try {
      const sub = (await stripe.subscriptions.retrieve(
        providerSubscriptionId,
      )) as StripeSubscriptionSnapshot;
      if (sub && typeof sub.current_period_end === 'number') {
        currentPeriodEnd = new Date(sub.current_period_end * 1000);
      }
    } catch (err) {
      console.warn('Could not retrieve subscription details for current_period_end fallback', err);
    }
  }

  await activateSubscriptionRecord(userId, plan._id, {
    provider: 'stripe',
    currentPeriodEnd,
    ...(session.customer
      ? { providerCustomerId: typeof session.customer === 'string' ? session.customer : session.customer.id }
      : {}),
    ...(providerSubscriptionId ? { providerSubscriptionId } : {}),
  });

  const providerPaymentId = typeof session.payment_intent === 'string' 
    ? session.payment_intent 
    : session.payment_intent?.id || session.id;

  const existingPayment = await PaymentModel.findOne({ providerPaymentId });
  if (!existingPayment) {
    const payment = new PaymentModel({
      userId,
      planId: plan._id,
      amountCents: session.amount_total || plan.priceCents,
      currency: (session.currency || plan.currency).toUpperCase(),
      status: PaymentStatus.SUCCEEDED,
      provider: 'stripe',
      providerPaymentId,
      providerCustomerId: typeof session.customer === 'string' ? session.customer : session.customer?.id,
      providerSubscriptionId,
      description: `${plan.name} checkout (verified)`,
      ...(metadata.couponId ? { couponId: metadata.couponId } : {})
    });
    await payment.save();
  }

  return true;
}
