import express, { Router, type NextFunction, type Request, type Response } from 'express';
import {
  boostCreateSchema,
  checkoutSessionSchema,
  couponInputSchema,
  planInputSchema,
  planUpdateSchema,
  refundCreateSchema,
  UserRole,
} from '@vivah/shared';
import { requireAuth } from '../auth/auth.middleware.js';
import type { AuthConfig, AuthenticatedRequest } from '../auth/auth-types.js';
import { HttpError } from '../auth/auth-errors.js';
import {
  cancelSubscription,
  constructStripeEvent,
  createCheckoutSession,
  createCoupon,
  createProfileBoost,
  createRefund,
  getSubscriptionOverview,
  handleStripeEvent,
  listInvoices,
  listCoupons,
  listOwnBoosts,
  listPayments,
  listPlans,
  listRefunds,
  listSubscriptions,
  updatePlan,
  upsertPlan,
} from './billing.service.js';

function asyncHandler(
  handler: (request: Request, response: Response, next: NextFunction) => Promise<void>,
) {
  return (request: Request, response: Response, next: NextFunction) => {
    void handler(request, response, next).catch(next);
  };
}

function requireRequestAuth(request: AuthenticatedRequest) {
  if (!request.auth) {
    throw new HttpError(401, 'Authentication required');
  }
  return request.auth;
}

function requireAdmin(request: AuthenticatedRequest) {
  const auth = requireRequestAuth(request);
  if (auth.role !== UserRole.ADMIN && auth.role !== UserRole.SUPER_ADMIN) {
    throw new HttpError(403, 'Admin access required');
  }
  return auth;
}

export function createBillingRouter(config: AuthConfig): Router {
  const router = Router();

  router.get(
    '/plans',
    asyncHandler(async (_request, response) => {
      response.status(200).json({ plans: await listPlans() });
    }),
  );

  router.get(
    '/me/subscription',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      response.status(200).json(await getSubscriptionOverview(auth.userId));
    }),
  );

  router.post(
    '/me/subscription/checkout',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const input = checkoutSessionSchema.parse(request.body);
      response.status(201).json(await createCheckoutSession(auth.userId, input));
    }),
  );

  router.delete(
    '/me/subscription',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      response.status(200).json(await cancelSubscription(auth.userId));
    }),
  );

  router.get(
    '/me/payments',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      response.status(200).json({
        payments: await listPayments(auth.userId),
        invoices: await listInvoices(auth.userId),
      });
    }),
  );

  router.post(
    '/me/boosts',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const input = boostCreateSchema.parse(request.body);
      const boost = await createProfileBoost(auth.userId, input);
      response.status(201).json({ boost, message: 'Profile boost activated' });
    }),
  );

  router.get(
    '/me/boosts',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      response.status(200).json({ boosts: await listOwnBoosts(auth.userId) });
    }),
  );

  router.get(
    '/admin/plans',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdmin(request);
      response.status(200).json({ plans: await listPlans(true) });
    }),
  );

  router.post(
    '/admin/plans',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdmin(request);
      const input = planInputSchema.parse(request.body);
      response.status(201).json({ plan: await upsertPlan(input) });
    }),
  );

  router.patch(
    '/admin/plans/:id',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdmin(request);
      const input = planUpdateSchema.parse(request.body);
      const planId = request.params.id;
      if (!planId) {
        throw new HttpError(404, 'Plan not found');
      }
      response.status(200).json({ plan: await updatePlan(planId, input) });
    }),
  );

  router.post(
    '/admin/coupons',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdmin(request);
      const input = couponInputSchema.parse(request.body);
      response.status(201).json({ coupon: await createCoupon(input) });
    }),
  );

  router.get(
    '/admin/coupons',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdmin(request);
      response.status(200).json({ coupons: await listCoupons() });
    }),
  );

  router.get(
    '/admin/subscriptions',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdmin(request);
      response.status(200).json({ subscriptions: await listSubscriptions() });
    }),
  );

  router.get(
    '/admin/payments',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdmin(request);
      response.status(200).json({
        payments: await listPayments(),
        invoices: await listInvoices(),
      });
    }),
  );

  router.get(
    '/admin/refunds',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdmin(request);
      response.status(200).json({ refunds: await listRefunds() });
    }),
  );

  router.post(
    '/admin/refunds',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdmin(request);
      const input = refundCreateSchema.parse(request.body);
      response.status(201).json({ refund: await createRefund(input) });
    }),
  );

  return router;
}

export function createStripeWebhookRouter(): Router {
  const router = Router();

  router.post(
    '/billing/webhook',
    express.raw({ type: 'application/json' }),
    asyncHandler(async (request, response) => {
      const body = Buffer.isBuffer(request.body)
        ? request.body
        : Buffer.from(JSON.stringify(request.body));
      const event = constructStripeEvent(body, request.header('stripe-signature') ?? undefined);
      await handleStripeEvent(event);
      response.status(200).json({ received: true });
    }),
  );

  return router;
}
