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
  SubscriptionModel,
  UsageCounterModel,
  type PlanDocument,
} from '../models/index.js';

const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2026-05-27.dahlia' })
  : undefined;

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
  return SubscriptionModel.findOne({
    userId,
    status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
    startsAt: { $lte: now },
    isDeleted: false,
    $or: [{ endsAt: { $exists: false } }, { endsAt: { $gt: now } }],
  }).sort({ createdAt: -1 });
}

export async function listPlans(includeInactive = false) {
  const plans = await PlanModel.find({
    isDeleted: false,
    ...(includeInactive ? {} : { active: true }),
  }).sort({ sortOrder: 1, priceCents: 1 });

  return plans.map((plan) => publicPlan(plan));
}

export async function upsertPlan(input: PlanInput) {
  const plan = await PlanModel.findOneAndUpdate(
    { code: input.code },
    { $set: input },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
  return publicPlan(plan);
}

export async function updatePlan(planId: string, input: PlanUpdateInput) {
  const plan = await PlanModel.findOneAndUpdate(
    { _id: planId, isDeleted: false },
    { $set: input },
    { new: true },
  );

  if (!plan) {
    throw new HttpError(404, 'Plan not found');
  }

  return publicPlan(plan);
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

  if (!stripe || !plan.stripePriceId) {
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
    success_url: `${env.WEB_BASE_URL}/member/subscription?checkout=success`,
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

  const session = await stripe.checkout.sessions.create(sessionParams);

  return { checkoutUrl: session.url, sessionId: session.id };
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

export async function listInvoices(userId?: Types.ObjectId) {
  const invoices = await InvoiceModel.find({ ...(userId ? { userId } : {}), isDeleted: false })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  return invoices;
}

export async function createCoupon(input: CouponInput) {
  const coupon = await CouponModel.findOneAndUpdate(
    { code: input.code },
    { $set: input },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  ).lean();
  return coupon;
}

export async function createRefund(input: RefundCreateInput) {
  const payment = await PaymentModel.findOne({ _id: input.paymentId, isDeleted: false });
  if (!payment) {
    throw new HttpError(404, 'Payment not found');
  }

  const remaining = payment.amountCents - payment.refundedAmountCents;
  const amountCents = input.amountCents ?? remaining;
  if (amountCents > remaining) {
    throw new HttpError(400, 'Refund exceeds remaining payment amount');
  }

  const refund = new RefundModel({
    userId: payment.userId,
    paymentId: payment._id,
    amountCents,
    currency: payment.currency,
    status: stripe && payment.providerPaymentId ? RefundStatus.PENDING : RefundStatus.SUCCEEDED,
    provider: payment.provider,
    ...(input.reason ? { reason: input.reason } : {}),
  });
  await refund.save();

  if (stripe && payment.providerPaymentId) {
    const stripeRefund = await stripe.refunds.create({
      payment_intent: payment.providerPaymentId,
      amount: amountCents,
      metadata: { refundId: refund.id },
    });
    refund.providerRefundId = stripeRefund.id;
    refund.status =
      stripeRefund.status === 'succeeded' ? RefundStatus.SUCCEEDED : RefundStatus.PENDING;
    await refund.save();
  }

  payment.refundedAmountCents += amountCents;
  payment.status =
    payment.refundedAmountCents >= payment.amountCents
      ? PaymentStatus.REFUNDED
      : PaymentStatus.PARTIALLY_REFUNDED;
  await payment.save();

  return refund;
}

export async function incrementUsage(userId: Types.ObjectId, key: string, amount = 1) {
  const { start, end } = periodFor();
  const counter = await UsageCounterModel.findOneAndUpdate(
    { userId, key, periodStart: start },
    { $setOnInsert: { periodEnd: end }, $inc: { count: amount } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
  return counter;
}

export async function requireEntitlement(userId: Types.ObjectId, key: string, amount = 1) {
  const overview = await getSubscriptionOverview(userId);
  const limit = Number(overview.plan?.limits?.[key] ?? 0);
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
  await incrementUsage(userId, 'profileBoostsMonthly');

  return boost.toObject();
}

export async function listOwnBoosts(userId: Types.ObjectId) {
  const boosts = await ProfileBoostModel.find({ userId, isDeleted: false })
    .sort({ createdAt: -1 })
    .lean();
  return boosts;
}

export async function handleStripeEvent(event: Stripe.Event) {
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata?.userId;
    const planId = session.metadata?.planId;
    if (!userId || !planId) {
      return;
    }

    await SubscriptionModel.updateMany(
      { userId: toObjectId(userId), status: SubscriptionStatus.ACTIVE },
      { $set: { status: SubscriptionStatus.CANCELED, endsAt: new Date() } },
    );
    const subscriptionData = {
      userId: toObjectId(userId),
      planId: toObjectId(planId),
      status: SubscriptionStatus.ACTIVE,
      startsAt: new Date(),
      provider: 'stripe',
      cancelAtPeriodEnd: false,
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
    };
    await SubscriptionModel.create(subscriptionData);
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
      { new: true, upsert: true, setDefaultsOnInsert: true },
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
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    await SubscriptionModel.findOneAndUpdate(
      { providerSubscriptionId: subscription.id },
      { $set: { status: SubscriptionStatus.CANCELED, endsAt: new Date() } },
    );
  }
}

export function constructStripeEvent(body: Buffer, signature?: string) {
  if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
    return JSON.parse(body.toString('utf8')) as unknown as Stripe.Event;
  }

  if (!signature) {
    throw new HttpError(400, 'Missing Stripe signature');
  }

  return stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
}
