import { Router, type NextFunction, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import { cmsPageInputSchema, contactInquirySchema, UserRole } from '@vivah/shared';
import { requireAuth } from '../auth/auth.middleware.js';
import { HttpError } from '../auth/auth-errors.js';
import type { AuthConfig, AuthenticatedRequest } from '../auth/auth-types.js';
import {
  BlogPostModel,
  CmsPageModel,
  ContactInquiryModel,
  PlanModel,
  ProfileApprovalStatus,
  ProfileModel,
  SuccessStoryModel,
  TestimonialModel,
} from '../models/index.js';

const PUBLIC_PROFILE_LIMIT = 6;

const contactRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

function asyncHandler(
  handler: (request: Request, response: Response, next: NextFunction) => Promise<void>,
) {
  return (request: Request, response: Response, next: NextFunction) => {
    void handler(request, response, next).catch(next);
  };
}

function requireAdminRole(request: AuthenticatedRequest) {
  const role = request.auth?.role;

  if (role !== UserRole.ADMIN && role !== UserRole.SUPER_ADMIN) {
    throw new HttpError(403, 'Admin access required');
  }
}

function fallbackHomeContent() {
  return {
    hero: {
      title: 'Vivah Australia',
      subtitle: 'A premium matrimonial platform for Australian singles and families.',
      primaryAction: 'Create profile',
      secondaryAction: 'Browse plans',
    },
    howItWorks: ['Create a profile', 'Verify your details', 'Connect with compatible matches'],
    safety: ['Manual moderation', 'Verification badges', 'Private media controls'],
    faq: [
      {
        question: 'Is Vivah Australia available nationally?',
        answer: 'Yes, the platform is designed for members across Australia.',
      },
      {
        question: 'Can I control profile visibility?',
        answer: 'Yes, member visibility and private fields are controlled from profile settings.',
      },
    ],
    contact: {
      email: 'support@vivahaustralia.com.au',
      location: 'Australia',
    },
  };
}

function pageProjection() {
  return 'slug title body seoTitle seoDescription published updatedAt';
}

export function createPublicRouter(authConfig: AuthConfig): Router {
  const router = Router();

  router.get('/public/home', (_request, response) => {
    response.status(200).json(fallbackHomeContent());
  });

  router.get(
    '/public/featured-profiles',
    asyncHandler(async (_request, response) => {
      const profiles = await ProfileModel.find({
        isDeleted: false,
        'moderation.approvalStatus': ProfileApprovalStatus.APPROVED,
        'visibility.status': { $ne: 'HIDDEN' },
      })
        .sort({ 'stats.lastActiveAt': -1, updatedAt: -1 })
        .limit(PUBLIC_PROFILE_LIMIT)
        .select(
          'displayId slug personal.firstName personal.age personal.gender location.city location.state religion.religion employment.occupation verification.level',
        )
        .lean();

      response.status(200).json({ profiles });
    }),
  );

  router.get(
    '/public/plans',
    asyncHandler(async (_request, response) => {
      const plans = await PlanModel.find({ active: true, isDeleted: false })
        .sort({ priceCents: 1 })
        .select('code name priceCents currency interval features limits')
        .lean();

      response.status(200).json({ plans });
    }),
  );

  router.get(
    '/public/success-stories',
    asyncHandler(async (_request, response) => {
      const stories = await SuccessStoryModel.find({ published: true, isDeleted: false })
        .sort({ updatedAt: -1 })
        .limit(6)
        .select(pageProjection())
        .lean();

      response.status(200).json({ stories });
    }),
  );

  router.get(
    '/public/testimonials',
    asyncHandler(async (_request, response) => {
      const testimonials = await TestimonialModel.find({ published: true, isDeleted: false })
        .sort({ updatedAt: -1 })
        .limit(6)
        .select('name quote updatedAt')
        .lean();

      response.status(200).json({ testimonials });
    }),
  );

  router.get(
    '/public/blogs',
    asyncHandler(async (request, response) => {
      const limit = Math.min(Number(request.query.limit ?? 3), 12);
      const blogs = await BlogPostModel.find({ published: true, isDeleted: false })
        .sort({ updatedAt: -1 })
        .limit(limit)
        .select(pageProjection())
        .lean();

      response.status(200).json({ blogs });
    }),
  );

  router.get(
    '/public/pages/:slug',
    asyncHandler(async (request, response) => {
      const page: unknown = await CmsPageModel.findOne({
        slug: request.params.slug,
        published: true,
        isDeleted: false,
      })
        .select(pageProjection())
        .lean();

      if (!page) {
        throw new HttpError(404, 'Page not found');
      }

      response.status(200).json({ page });
    }),
  );

  router.post(
    '/public/contact',
    contactRateLimit,
    asyncHandler(async (request, response) => {
      const input = contactInquirySchema.parse(request.body);
      const inquiry = await ContactInquiryModel.create({
        name: input.name,
        email: input.email,
        ...(input.phone ? { phone: input.phone } : {}),
        subject: input.subject,
        message: input.message,
      });

      response.status(201).json({
        message: 'Contact inquiry received.',
        inquiryId: inquiry.id,
      });
    }),
  );

  router.post(
    '/admin/cms/pages',
    requireAuth(authConfig),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdminRole(request);
      const input = cmsPageInputSchema.parse(request.body);
      const page: unknown = await CmsPageModel.create(input);

      response.status(201).json({ page });
    }),
  );

  router.patch(
    '/admin/cms/pages/:id',
    requireAuth(authConfig),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdminRole(request);
      const input = cmsPageInputSchema.partial().parse(request.body);
      const page: unknown = await CmsPageModel.findByIdAndUpdate(request.params.id, input, {
        returnDocument: 'after',
        runValidators: true,
      });

      if (!page) {
        throw new HttpError(404, 'Page not found');
      }

      response.status(200).json({ page });
    }),
  );

  router.delete(
    '/admin/cms/pages/:id',
    requireAuth(authConfig),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdminRole(request);
      const page: unknown = await CmsPageModel.findByIdAndUpdate(
        request.params.id,
        { isDeleted: true, deletedAt: new Date(), deletedBy: request.auth?.userId },
        { returnDocument: 'after' },
      );

      if (!page) {
        throw new HttpError(404, 'Page not found');
      }

      response.status(204).send();
    }),
  );

  return router;
}
