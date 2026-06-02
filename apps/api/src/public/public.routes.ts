import { Router, type NextFunction, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import { URLSearchParams } from 'url';
import {
  cmsBannerInputSchema,
  cmsContentInputSchema,
  cmsHomeContentSchema,
  cmsPageInputSchema,
  cmsSuccessStoryInputSchema,
  cmsTestimonialInputSchema,
  contactInquirySchema,
  UserRole,
} from '@vivah/shared';
import { requireAuth } from '../auth/auth.middleware.js';
import { HttpError } from '../auth/auth-errors.js';
import type { AuthConfig, AuthenticatedRequest } from '../auth/auth-types.js';
import { sendEmail } from '../common/email.service.js';
import { recordDuplicateContactAttempts } from '../common/fraud.service.js';
import {
  BlogPostModel,
  BannerModel,
  CmsPageModel,
  ContactInquiryModel,
  PlanModel,
  ProfileApprovalStatus,
  ProfileModel,
  SuccessStoryModel,
  SystemSettingModel,
  TestimonialModel,
} from '../models/index.js';

const PUBLIC_PROFILE_LIMIT = 6;

const contactRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

async function verifyCaptcha(token: string | undefined) {
  const secret = process.env.HCAPTCHA_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new HttpError(400, 'hCaptcha secret is required in production.');
    }
    console.warn('HCAPTCHA_SECRET not set, skipping CAPTCHA verification.');
    return;
  }

  if (process.env.NODE_ENV === 'test') {
    return;
  }

  if (!token) {
    throw new HttpError(400, 'CAPTCHA token is required');
  }

  const response = await fetch('https://api.hcaptcha.com/siteverify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      secret,
      response: token,
    }),
  });

  const result = (await response.json()) as { success: boolean };

  if (!result.success) {
    throw new HttpError(400, 'Invalid CAPTCHA token');
  }
}

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

function contentProjection() {
  return 'slug title body published updatedAt';
}

function successStoryProjection() {
  return 'slug title body coupleName published updatedAt';
}

function testimonialProjection() {
  return 'name quote published updatedAt';
}

function bannerProjection() {
  return 'key title imageUrl active updatedAt';
}

async function getHomeContent() {
  const setting = (await SystemSettingModel.findOne({
    key: 'homepageContent',
    isDeleted: false,
  })
    .select('value')
    .lean()) as { value?: unknown } | null;

  const parsed = cmsHomeContentSchema.safeParse(setting?.value);
  return parsed.success ? parsed.data : fallbackHomeContent();
}

export function createPublicRouter(authConfig: AuthConfig): Router {
  const router = Router();

  router.get(
    '/public/home',
    asyncHandler(async (_request, response) => {
      response.status(200).json(await getHomeContent());
    }),
  );

  router.get(
    '/public/featured-profiles',
    asyncHandler(async (_request, response) => {
      const baseFilter: Record<string, unknown> = {
        isDeleted: false,
        'moderation.approvalStatus': ProfileApprovalStatus.APPROVED,
        'visibility.status': { $ne: 'HIDDEN' },
      };
      
      const now = new Date();
      const selectFields = 'displayId slug personal.firstName personal.age personal.gender location.city location.state religion.religion employment.occupation verification.level stats.activeBoostEndsAt';

      const boosted = await ProfileModel.find({ ...baseFilter, 'stats.activeBoostEndsAt': { $gt: now } })
        .sort({ 'stats.lastActiveAt': -1, updatedAt: -1 })
        .limit(PUBLIC_PROFILE_LIMIT)
        .select(selectFields)
        .lean();

      let profiles = boosted.map(p => ({ ...p, isBoosted: true }));

      if (profiles.length < PUBLIC_PROFILE_LIMIT) {
        const standard = await ProfileModel.find({
          ...baseFilter,
          $or: [{ 'stats.activeBoostEndsAt': { $lte: now } }, { 'stats.activeBoostEndsAt': { $exists: false } }]
        })
          .sort({ 'stats.lastActiveAt': -1, updatedAt: -1 })
          .limit(PUBLIC_PROFILE_LIMIT - profiles.length)
          .select(selectFields)
          .lean();

        profiles = profiles.concat(standard.map(p => ({ ...p, isBoosted: false })));
      }

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
        .select(successStoryProjection())
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

      await verifyCaptcha(input.captchaToken);

      const inquiry = await ContactInquiryModel.create({
        name: input.name,
        email: input.email,
        ...(input.phone ? { phone: input.phone } : {}),
        subject: input.subject,
        message: input.message,
      });

      const recentDuplicateCount = await ContactInquiryModel.countDocuments({
        isDeleted: false,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        $or: [
          { email: input.email.toLowerCase() },
          ...(input.phone ? [{ phone: input.phone }] : []),
        ],
      });

      if (recentDuplicateCount >= 3) {
        await recordDuplicateContactAttempts({
          email: input.email.toLowerCase(),
          ...(input.phone ? { phone: input.phone } : {}),
          count: recentDuplicateCount,
        });
      }

      // Send email notification
      await sendEmail({
        to: process.env.ADMIN_SEED_EMAIL ?? 'support@vivahaustralia.com.au',
        from: 'noreply@vivahaustralia.com.au',
        subject: `New Contact Inquiry: ${inquiry.subject}`,
        text: `
          Name: ${inquiry.name}
          Email: ${inquiry.email}
          Phone: ${inquiry.phone ?? 'N/A'}
          Subject: ${inquiry.subject}
          Message:
          ${inquiry.message}
        `,
        html: `
          <h3>New Contact Inquiry</h3>
          <ul>
            <li><strong>Name:</strong> ${inquiry.name}</li>
            <li><strong>Email:</strong> ${inquiry.email}</li>
            <li><strong>Phone:</strong> ${inquiry.phone ?? 'N/A'}</li>
            <li><strong>Subject:</strong> ${inquiry.subject}</li>
          </ul>
          <h4>Message:</h4>
          <p>${inquiry.message}</p>
        `,
      });

      response.status(201).json({
        message: 'Contact inquiry received.',
        inquiryId: inquiry.id,
      });
    }),
  );

  router.get(
    '/admin/cms/pages',
    requireAuth(authConfig),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdminRole(request);
      const pages = await CmsPageModel.find({ isDeleted: false })
        .sort({ updatedAt: -1 })
        .select(pageProjection())
        .lean();

      response.status(200).json({ pages });
    }),
  );

  router.get(
    '/admin/cms/home',
    requireAuth(authConfig),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdminRole(request);
      response.status(200).json({ content: await getHomeContent() });
    }),
  );

  router.put(
    '/admin/cms/home',
    requireAuth(authConfig),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdminRole(request);
      const input = cmsHomeContentSchema.parse(request.body);
      await SystemSettingModel.findOneAndUpdate(
        { key: 'homepageContent' },
        { key: 'homepageContent', value: input, description: 'Public homepage CMS content' },
        { upsert: true, returnDocument: 'after', runValidators: true },
      );

      response.status(200).json({ content: input });
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

  router.get(
    '/admin/cms/blogs',
    requireAuth(authConfig),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdminRole(request);
      const blogs = await BlogPostModel.find({ isDeleted: false })
        .sort({ updatedAt: -1 })
        .select(contentProjection())
        .lean();

      response.status(200).json({ blogs });
    }),
  );

  router.post(
    '/admin/cms/blogs',
    requireAuth(authConfig),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdminRole(request);
      const input = cmsContentInputSchema.parse(request.body);
      const blog: unknown = await BlogPostModel.create({
        ...input,
        authorId: request.auth?.userId,
      });

      response.status(201).json({ blog });
    }),
  );

  router.patch(
    '/admin/cms/blogs/:id',
    requireAuth(authConfig),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdminRole(request);
      const input = cmsContentInputSchema.partial().parse(request.body);
      const blog: unknown = await BlogPostModel.findByIdAndUpdate(request.params.id, input, {
        returnDocument: 'after',
        runValidators: true,
      });

      if (!blog) {
        throw new HttpError(404, 'Blog not found');
      }

      response.status(200).json({ blog });
    }),
  );

  router.delete(
    '/admin/cms/blogs/:id',
    requireAuth(authConfig),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdminRole(request);
      const blog: unknown = await BlogPostModel.findByIdAndUpdate(
        request.params.id,
        { isDeleted: true, deletedAt: new Date(), deletedBy: request.auth?.userId },
        { returnDocument: 'after' },
      );

      if (!blog) {
        throw new HttpError(404, 'Blog not found');
      }

      response.status(204).send();
    }),
  );

  router.get(
    '/admin/cms/success-stories',
    requireAuth(authConfig),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdminRole(request);
      const stories = await SuccessStoryModel.find({ isDeleted: false })
        .sort({ updatedAt: -1 })
        .select(successStoryProjection())
        .lean();

      response.status(200).json({ stories });
    }),
  );

  router.post(
    '/admin/cms/success-stories',
    requireAuth(authConfig),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdminRole(request);
      const input = cmsSuccessStoryInputSchema.parse(request.body);
      const story: unknown = await SuccessStoryModel.create(input);

      response.status(201).json({ story });
    }),
  );

  router.patch(
    '/admin/cms/success-stories/:id',
    requireAuth(authConfig),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdminRole(request);
      const input = cmsSuccessStoryInputSchema.partial().parse(request.body);
      const story: unknown = await SuccessStoryModel.findByIdAndUpdate(request.params.id, input, {
        returnDocument: 'after',
        runValidators: true,
      });

      if (!story) {
        throw new HttpError(404, 'Success story not found');
      }

      response.status(200).json({ story });
    }),
  );

  router.delete(
    '/admin/cms/success-stories/:id',
    requireAuth(authConfig),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdminRole(request);
      const story: unknown = await SuccessStoryModel.findByIdAndUpdate(
        request.params.id,
        { isDeleted: true, deletedAt: new Date(), deletedBy: request.auth?.userId },
        { returnDocument: 'after' },
      );

      if (!story) {
        throw new HttpError(404, 'Success story not found');
      }

      response.status(204).send();
    }),
  );

  router.get(
    '/admin/cms/testimonials',
    requireAuth(authConfig),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdminRole(request);
      const testimonials = await TestimonialModel.find({ isDeleted: false })
        .sort({ updatedAt: -1 })
        .select(testimonialProjection())
        .lean();

      response.status(200).json({ testimonials });
    }),
  );

  router.post(
    '/admin/cms/testimonials',
    requireAuth(authConfig),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdminRole(request);
      const input = cmsTestimonialInputSchema.parse(request.body);
      const testimonial: unknown = await TestimonialModel.create(input);

      response.status(201).json({ testimonial });
    }),
  );

  router.patch(
    '/admin/cms/testimonials/:id',
    requireAuth(authConfig),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdminRole(request);
      const input = cmsTestimonialInputSchema.partial().parse(request.body);
      const testimonial: unknown = await TestimonialModel.findByIdAndUpdate(
        request.params.id,
        input,
        {
          returnDocument: 'after',
          runValidators: true,
        },
      );

      if (!testimonial) {
        throw new HttpError(404, 'Testimonial not found');
      }

      response.status(200).json({ testimonial });
    }),
  );

  router.delete(
    '/admin/cms/testimonials/:id',
    requireAuth(authConfig),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdminRole(request);
      const testimonial: unknown = await TestimonialModel.findByIdAndUpdate(
        request.params.id,
        { isDeleted: true, deletedAt: new Date(), deletedBy: request.auth?.userId },
        { returnDocument: 'after' },
      );

      if (!testimonial) {
        throw new HttpError(404, 'Testimonial not found');
      }

      response.status(204).send();
    }),
  );

  router.get(
    '/admin/cms/banners',
    requireAuth(authConfig),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdminRole(request);
      const banners = await BannerModel.find({ isDeleted: false })
        .sort({ updatedAt: -1 })
        .select(bannerProjection())
        .lean();

      response.status(200).json({ banners });
    }),
  );

  router.post(
    '/admin/cms/banners',
    requireAuth(authConfig),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdminRole(request);
      const input = cmsBannerInputSchema.parse(request.body);
      const banner: unknown = await BannerModel.create(input);

      response.status(201).json({ banner });
    }),
  );

  router.patch(
    '/admin/cms/banners/:id',
    requireAuth(authConfig),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdminRole(request);
      const input = cmsBannerInputSchema.partial().parse(request.body);
      const banner: unknown = await BannerModel.findByIdAndUpdate(request.params.id, input, {
        returnDocument: 'after',
        runValidators: true,
      });

      if (!banner) {
        throw new HttpError(404, 'Banner not found');
      }

      response.status(200).json({ banner });
    }),
  );

  router.delete(
    '/admin/cms/banners/:id',
    requireAuth(authConfig),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdminRole(request);
      const banner: unknown = await BannerModel.findByIdAndUpdate(
        request.params.id,
        { isDeleted: true, deletedAt: new Date(), deletedBy: request.auth?.userId },
        { returnDocument: 'after' },
      );

      if (!banner) {
        throw new HttpError(404, 'Banner not found');
      }

      response.status(204).send();
    }),
  );

  return router;
}
