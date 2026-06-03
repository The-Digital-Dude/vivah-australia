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
  cmsSectionInputSchema,
  cmsFaqInputSchema,
  cmsTemplateInputSchema,
  cmsLandingPageInputSchema,
  cmsPromotionInputSchema,
  cmsCampaignBannerInputSchema,
  contactInquirySchema,
  UserRole,
} from '@vivah/shared';
import { requireAuth } from '../auth/auth.middleware.js';
import { HttpError } from '../auth/auth-errors.js';
import type { AuthConfig, AuthenticatedRequest } from '../auth/auth-types.js';
import { sendEmail } from '../common/email.service.js';
import { recordDuplicateContactAttempts } from '../common/fraud.service.js';
import { logAudit } from '../common/audit.service.js';
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
  CmsSectionModel,
  FaqModel,
  TemplateModel,
  LandingPageModel,
  PromotionModel,
  CampaignBannerModel,
} from '../models/index.js';

const PUBLIC_PROFILE_LIMIT = 6;
const PUBLIC_MATCH_PREVIEW_LIMIT = 12;

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
    '/public/matches',
    asyncHandler(async (request, response) => {
      const limit = Math.min(
        Math.max(Number(request.query.limit ?? PUBLIC_MATCH_PREVIEW_LIMIT), 1),
        PUBLIC_MATCH_PREVIEW_LIMIT,
      );
      const ageMin = Number(request.query.ageMin);
      const ageMax = Number(request.query.ageMax);
      const gender = typeof request.query.gender === 'string' ? request.query.gender : undefined;
      const city = typeof request.query.city === 'string' ? request.query.city.trim() : undefined;
      const religion =
        typeof request.query.religion === 'string' ? request.query.religion.trim() : undefined;

      const baseFilter: Record<string, unknown> = {
        isDeleted: false,
        'moderation.approvalStatus': ProfileApprovalStatus.APPROVED,
        'visibility.status': { $ne: 'HIDDEN' },
      };

      if (gender) {
        baseFilter['personal.gender'] = gender;
      }

      if (!Number.isNaN(ageMin) || !Number.isNaN(ageMax)) {
        baseFilter['personal.age'] = {
          ...(!Number.isNaN(ageMin) ? { $gte: ageMin } : {}),
          ...(!Number.isNaN(ageMax) ? { $lte: ageMax } : {}),
        };
      }

      if (city) {
        baseFilter['location.city'] = { $regex: `^${city}$`, $options: 'i' };
      }

      if (religion) {
        baseFilter['religion.religion'] = { $regex: `^${religion}$`, $options: 'i' };
      }

      const now = new Date();
      const selectFields =
        'displayId slug personal.firstName personal.age personal.gender location.city location.state religion.religion employment.occupation verification.level stats.activeBoostEndsAt stats.lastActiveAt';

      const boosted = await ProfileModel.find({
        ...baseFilter,
        'stats.activeBoostEndsAt': { $gt: now },
      })
        .sort({ 'stats.lastActiveAt': -1, updatedAt: -1 })
        .limit(limit)
        .select(selectFields)
        .lean();

      let profiles = boosted.map((profile) => ({ ...profile, isBoosted: true }));

      if (profiles.length < limit) {
        const standard = await ProfileModel.find({
          ...baseFilter,
          $or: [
            { 'stats.activeBoostEndsAt': { $lte: now } },
            { 'stats.activeBoostEndsAt': { $exists: false } },
          ],
        })
          .sort({ 'stats.lastActiveAt': -1, updatedAt: -1 })
          .limit(limit - profiles.length)
          .select(selectFields)
          .lean();

        profiles = profiles.concat(standard.map((profile) => ({ ...profile, isBoosted: false })));
      }

      response.status(200).json({
        profiles,
        limit,
        gated: true,
      });
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

  router.get(
    '/public/blogs/:slug',
    asyncHandler(async (request, response) => {
      const blog = await BlogPostModel.findOne({
        slug: request.params.slug,
        published: true,
        isDeleted: false,
      })
        .populate('authorId', 'firstName lastName')
        .lean();

      if (!blog) {
        throw new HttpError(404, 'Blog post not found');
      }

      response.status(200).json({ blog });
    }),
  );

  router.get(
    '/public/sections/:pageKey',
    asyncHandler(async (request, response) => {
      const sections = await CmsSectionModel.find({
        pageKey: request.params.pageKey,
        visible: true,
        status: 'PUBLISHED',
        isDeleted: false,
      })
        .sort({ sortOrder: 1 })
        .lean();
      response.status(200).json({ sections });
    }),
  );

  router.get(
    '/public/faqs',
    asyncHandler(async (request, response) => {
      const faqs = await FaqModel.find({
        active: true,
        isDeleted: false,
      })
        .sort({ displayOrder: 1 })
        .lean();
      response.status(200).json({ faqs });
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

  // --- ADMIN CMS SECTIONS ---
  router.get(
    '/admin/cms/sections',
    requireAuth(authConfig),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdminRole(request);
      const sections = await CmsSectionModel.find({ isDeleted: false })
        .sort({ sortOrder: 1 })
        .lean();
      response.status(200).json({ sections });
    }),
  );

  router.post(
    '/admin/cms/sections',
    requireAuth(authConfig),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdminRole(request);
      const input = cmsSectionInputSchema.parse(request.body);
      const section = await CmsSectionModel.create(input);
      await logAudit({
        ...(request.auth?.userId ? { actorId: request.auth.userId } : {}),
        action: 'CMS_SECTION_CREATED',
        targetType: 'CmsSection',
        targetId: section._id,
        metadata: { key: section.key },
      });
      response.status(201).json({ section });
    }),
  );

  router.put(
    '/admin/cms/sections/:id',
    requireAuth(authConfig),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdminRole(request);
      const input = cmsSectionInputSchema.parse(request.body);
      const section = await CmsSectionModel.findByIdAndUpdate(request.params.id, input, {
        returnDocument: 'after',
        runValidators: true,
      });
      if (!section) throw new HttpError(404, 'Section not found');
      await logAudit({
        ...(request.auth?.userId ? { actorId: request.auth.userId } : {}),
        action: 'CMS_SECTION_UPDATED',
        targetType: 'CmsSection',
        targetId: section._id,
        metadata: { key: section.key },
      });
      response.status(200).json({ section });
    }),
  );

  router.delete(
    '/admin/cms/sections/:id',
    requireAuth(authConfig),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdminRole(request);
      const section = await CmsSectionModel.findByIdAndUpdate(
        request.params.id,
        { isDeleted: true, deletedAt: new Date(), deletedBy: request.auth?.userId },
        { returnDocument: 'after' },
      );
      if (!section) throw new HttpError(404, 'Section not found');
      await logAudit({
        ...(request.auth?.userId ? { actorId: request.auth.userId } : {}),
        action: 'CMS_SECTION_DELETED',
        targetType: 'CmsSection',
        targetId: section._id,
        metadata: { key: section.key },
      });
      response.status(204).send();
    }),
  );

  // --- ADMIN CMS FAQS ---
  router.get(
    '/admin/cms/faqs',
    requireAuth(authConfig),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdminRole(request);
      const faqs = await FaqModel.find({ isDeleted: false })
        .sort({ displayOrder: 1 })
        .lean();
      response.status(200).json({ faqs });
    }),
  );

  router.post(
    '/admin/cms/faqs',
    requireAuth(authConfig),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdminRole(request);
      const input = cmsFaqInputSchema.parse(request.body);
      const faq = await FaqModel.create(input);
      await logAudit({
        ...(request.auth?.userId ? { actorId: request.auth.userId } : {}),
        action: 'CMS_FAQ_CREATED',
        targetType: 'Faq',
        targetId: faq._id,
      });
      response.status(201).json({ faq });
    }),
  );

  router.put(
    '/admin/cms/faqs/:id',
    requireAuth(authConfig),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdminRole(request);
      const input = cmsFaqInputSchema.parse(request.body);
      const faq = await FaqModel.findByIdAndUpdate(request.params.id, input, {
        returnDocument: 'after',
        runValidators: true,
      });
      if (!faq) throw new HttpError(404, 'FAQ not found');
      await logAudit({
        ...(request.auth?.userId ? { actorId: request.auth.userId } : {}),
        action: 'CMS_FAQ_UPDATED',
        targetType: 'Faq',
        targetId: faq._id,
      });
      response.status(200).json({ faq });
    }),
  );

  router.delete(
    '/admin/cms/faqs/:id',
    requireAuth(authConfig),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdminRole(request);
      const faq = await FaqModel.findByIdAndUpdate(
        request.params.id,
        { isDeleted: true, deletedAt: new Date(), deletedBy: request.auth?.userId },
        { returnDocument: 'after' },
      );
      if (!faq) throw new HttpError(404, 'FAQ not found');
      await logAudit({
        ...(request.auth?.userId ? { actorId: request.auth.userId } : {}),
        action: 'CMS_FAQ_DELETED',
        targetType: 'Faq',
        targetId: faq._id,
      });
      response.status(204).send();
    }),
  );

  // --- ADMIN CMS TEMPLATES ---
  router.get(
    '/admin/cms/templates',
    requireAuth(authConfig),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdminRole(request);
      const templates = await TemplateModel.find({ isDeleted: false })
        .sort({ key: 1 })
        .lean();
      response.status(200).json({ templates });
    }),
  );

  router.post(
    '/admin/cms/templates',
    requireAuth(authConfig),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdminRole(request);
      const input = cmsTemplateInputSchema.parse(request.body);
      const template = await TemplateModel.create(input);
      await logAudit({
        ...(request.auth?.userId ? { actorId: request.auth.userId } : {}),
        action: 'CMS_TEMPLATE_CREATED',
        targetType: 'Template',
        targetId: template._id,
        metadata: { key: template.key },
      });
      response.status(201).json({ template });
    }),
  );

  router.put(
    '/admin/cms/templates/:id',
    requireAuth(authConfig),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdminRole(request);
      const input = cmsTemplateInputSchema.parse(request.body);
      const template = await TemplateModel.findByIdAndUpdate(request.params.id, input, {
        returnDocument: 'after',
        runValidators: true,
      });
      if (!template) throw new HttpError(404, 'Template not found');
      await logAudit({
        ...(request.auth?.userId ? { actorId: request.auth.userId } : {}),
        action: 'CMS_TEMPLATE_UPDATED',
        targetType: 'Template',
        targetId: template._id,
        metadata: { key: template.key },
      });
      response.status(200).json({ template });
    }),
  );

  router.delete(
    '/admin/cms/templates/:id',
    requireAuth(authConfig),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdminRole(request);
      const template = await TemplateModel.findByIdAndUpdate(
        request.params.id,
        { isDeleted: true, deletedAt: new Date(), deletedBy: request.auth?.userId },
        { returnDocument: 'after' },
      );
      if (!template) throw new HttpError(404, 'Template not found');
      await logAudit({
        ...(request.auth?.userId ? { actorId: request.auth.userId } : {}),
        action: 'CMS_TEMPLATE_DELETED',
        targetType: 'Template',
        targetId: template._id,
        metadata: { key: template.key },
      });
      response.status(204).send();
    }),
  );

  // --- ADMIN SETTINGS ---
  router.get(
    '/admin/settings',
    requireAuth(authConfig),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdminRole(request);
      const settings = await SystemSettingModel.find({ isDeleted: false }).lean();
      response.status(200).json({ settings });
    }),
  );

  router.put(
    '/admin/settings/:key',
    requireAuth(authConfig),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdminRole(request);
      const setting = await SystemSettingModel.findOneAndUpdate(
        { key: request.params.key },
        {
          key: request.params.key,
          value: request.body.value,
          description: request.body.description,
          isDeleted: false,
        },
        { upsert: true, returnDocument: 'after', runValidators: true },
      );
      await logAudit({
        ...(request.auth?.userId ? { actorId: request.auth.userId } : {}),
        action: 'SYSTEM_SETTING_UPDATED',
        targetType: 'SystemSetting',
        targetId: setting._id,
        metadata: { key: setting.key },
      });
      response.status(200).json({ setting });
    }),
  );

  // ── PHASE B: LANDING PAGES (public) ──────────────────────────────────────

  router.get(
    '/public/matrimony/:slug',
    asyncHandler(async (request, response) => {
      const page = await LandingPageModel.findOne({
        slug: request.params.slug,
        active: true,
        isDeleted: false,
      }).lean();

      if (!page) {
        throw new HttpError(404, 'Landing page not found');
      }

      // Fetch matching profiles filtered by city/religion
      const profileFilter: Record<string, unknown> = {
        isDeleted: false,
        'moderation.approvalStatus': ProfileApprovalStatus.APPROVED,
        'visibility.status': { $ne: 'HIDDEN' },
      };

      if ((page as { city?: string }).city) {
        profileFilter['location.city'] = { $regex: `^${(page as { city?: string }).city}$`, $options: 'i' };
      }

      if ((page as { religion?: string }).religion) {
        profileFilter['religion.religion'] = { $regex: `^${(page as { religion?: string }).religion}$`, $options: 'i' };
      }

      const profiles = await ProfileModel.find(profileFilter)
        .sort({ 'stats.lastActiveAt': -1, updatedAt: -1 })
        .limit(6)
        .select('displayId slug personal.firstName personal.age personal.gender location.city location.state religion.religion employment.occupation verification.level')
        .lean();

      response.status(200).json({ page, profiles });
    }),
  );

  // ── PHASE B: PROMOTIONS (public validate) ────────────────────────────────

  router.post(
    '/public/promotions/validate',
    contactRateLimit,
    asyncHandler(async (request, response) => {
      const { code, planCode } = request.body as { code?: string; planCode?: string };

      if (!code || typeof code !== 'string') {
        throw new HttpError(400, 'Coupon code is required');
      }

      const promo = await PromotionModel.findOne({
        code: code.toUpperCase().trim(),
        active: true,
        isDeleted: false,
      }).lean();

      if (!promo) {
        throw new HttpError(404, 'Coupon code not found or inactive');
      }

      const typed = promo as unknown as {
        expiresAt?: Date;
        maxUses?: number;
        usedCount: number;
        targetPlans?: string[];
        discountPercent: number;
        code: string;
        label: string;
      };

      if (typed.expiresAt && new Date(typed.expiresAt) < new Date()) {
        throw new HttpError(410, 'Coupon code has expired');
      }

      if (typed.maxUses && typed.usedCount >= typed.maxUses) {
        throw new HttpError(410, 'Coupon code has reached its usage limit');
      }

      if (planCode && typed.targetPlans && typed.targetPlans.length > 0) {
        if (!typed.targetPlans.includes(planCode)) {
          throw new HttpError(422, 'Coupon is not valid for this plan');
        }
      }

      response.status(200).json({
        valid: true,
        code: typed.code,
        label: typed.label,
        discountPercent: typed.discountPercent,
      });
    }),
  );

  // ── PHASE B: CAMPAIGN BANNERS (public) ───────────────────────────────────

  router.get(
    '/public/banners',
    asyncHandler(async (_request, response) => {
      const now = new Date();
      const banners = await CampaignBannerModel.find({
        active: true,
        isDeleted: false,
        $or: [{ startsAt: { $exists: false } }, { startsAt: { $lte: now } }],
        $and: [{ $or: [{ endsAt: { $exists: false } }, { endsAt: { $gte: now } }] }],
      })
        .sort({ createdAt: -1 })
        .lean();

      response.status(200).json({ banners });
    }),
  );

  // ── PHASE B: ADMIN LANDING PAGES CRUD ────────────────────────────────────

  router.get(
    '/admin/cms/landing-pages',
    requireAuth(authConfig),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdminRole(request);
      const pages = await LandingPageModel.find({ isDeleted: false })
        .sort({ updatedAt: -1 })
        .lean();
      response.status(200).json({ pages });
    }),
  );

  router.post(
    '/admin/cms/landing-pages',
    requireAuth(authConfig),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdminRole(request);
      const input = cmsLandingPageInputSchema.parse(request.body);
      const page = await LandingPageModel.create(input);
      await logAudit({
        ...(request.auth?.userId ? { actorId: request.auth.userId } : {}),
        action: 'CMS_LANDING_PAGE_CREATED',
        targetType: 'LandingPage',
        targetId: page._id,
        metadata: { slug: page.slug },
      });
      response.status(201).json({ page });
    }),
  );

  router.put(
    '/admin/cms/landing-pages/:id',
    requireAuth(authConfig),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdminRole(request);
      const input = cmsLandingPageInputSchema.parse(request.body);
      const page = await LandingPageModel.findByIdAndUpdate(request.params.id, input, {
        returnDocument: 'after',
        runValidators: true,
      });
      if (!page) throw new HttpError(404, 'Landing page not found');
      await logAudit({
        ...(request.auth?.userId ? { actorId: request.auth.userId } : {}),
        action: 'CMS_LANDING_PAGE_UPDATED',
        targetType: 'LandingPage',
        targetId: page._id,
        metadata: { slug: page.slug },
      });
      response.status(200).json({ page });
    }),
  );

  router.delete(
    '/admin/cms/landing-pages/:id',
    requireAuth(authConfig),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdminRole(request);
      const page = await LandingPageModel.findByIdAndUpdate(
        request.params.id,
        { isDeleted: true, deletedAt: new Date(), deletedBy: request.auth?.userId },
        { returnDocument: 'after' },
      );
      if (!page) throw new HttpError(404, 'Landing page not found');
      await logAudit({
        ...(request.auth?.userId ? { actorId: request.auth.userId } : {}),
        action: 'CMS_LANDING_PAGE_DELETED',
        targetType: 'LandingPage',
        targetId: page._id,
        metadata: { slug: page.slug },
      });
      response.status(204).send();
    }),
  );

  // ── PHASE B: ADMIN PROMOTIONS CRUD ───────────────────────────────────────

  router.get(
    '/admin/cms/promotions',
    requireAuth(authConfig),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdminRole(request);
      const promotions = await PromotionModel.find({ isDeleted: false })
        .sort({ updatedAt: -1 })
        .lean();
      response.status(200).json({ promotions });
    }),
  );

  router.post(
    '/admin/cms/promotions',
    requireAuth(authConfig),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdminRole(request);
      const input = cmsPromotionInputSchema.parse(request.body);
      const promotion = await PromotionModel.create(input);
      await logAudit({
        ...(request.auth?.userId ? { actorId: request.auth.userId } : {}),
        action: 'CMS_PROMOTION_CREATED',
        targetType: 'Promotion',
        targetId: promotion._id,
        metadata: { code: promotion.code },
      });
      response.status(201).json({ promotion });
    }),
  );

  router.put(
    '/admin/cms/promotions/:id',
    requireAuth(authConfig),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdminRole(request);
      const input = cmsPromotionInputSchema.parse(request.body);
      const promotion = await PromotionModel.findByIdAndUpdate(request.params.id, input, {
        returnDocument: 'after',
        runValidators: true,
      });
      if (!promotion) throw new HttpError(404, 'Promotion not found');
      await logAudit({
        ...(request.auth?.userId ? { actorId: request.auth.userId } : {}),
        action: 'CMS_PROMOTION_UPDATED',
        targetType: 'Promotion',
        targetId: promotion._id,
        metadata: { code: promotion.code },
      });
      response.status(200).json({ promotion });
    }),
  );

  router.delete(
    '/admin/cms/promotions/:id',
    requireAuth(authConfig),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdminRole(request);
      const promotion = await PromotionModel.findByIdAndUpdate(
        request.params.id,
        { isDeleted: true, deletedAt: new Date(), deletedBy: request.auth?.userId },
        { returnDocument: 'after' },
      );
      if (!promotion) throw new HttpError(404, 'Promotion not found');
      await logAudit({
        ...(request.auth?.userId ? { actorId: request.auth.userId } : {}),
        action: 'CMS_PROMOTION_DELETED',
        targetType: 'Promotion',
        targetId: promotion._id,
        metadata: { code: promotion.code },
      });
      response.status(204).send();
    }),
  );

  // ── PHASE B: ADMIN CAMPAIGN BANNERS CRUD ─────────────────────────────────

  router.get(
    '/admin/cms/campaign-banners',
    requireAuth(authConfig),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdminRole(request);
      const banners = await CampaignBannerModel.find({ isDeleted: false })
        .sort({ updatedAt: -1 })
        .lean();
      response.status(200).json({ banners });
    }),
  );

  router.post(
    '/admin/cms/campaign-banners',
    requireAuth(authConfig),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdminRole(request);
      const input = cmsCampaignBannerInputSchema.parse(request.body);
      const banner = await CampaignBannerModel.create(input);
      await logAudit({
        ...(request.auth?.userId ? { actorId: request.auth.userId } : {}),
        action: 'CMS_CAMPAIGN_BANNER_CREATED',
        targetType: 'CampaignBanner',
        targetId: banner._id,
        metadata: { key: banner.key },
      });
      response.status(201).json({ banner });
    }),
  );

  router.put(
    '/admin/cms/campaign-banners/:id',
    requireAuth(authConfig),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdminRole(request);
      const input = cmsCampaignBannerInputSchema.parse(request.body);
      const banner = await CampaignBannerModel.findByIdAndUpdate(request.params.id, input, {
        returnDocument: 'after',
        runValidators: true,
      });
      if (!banner) throw new HttpError(404, 'Campaign banner not found');
      await logAudit({
        ...(request.auth?.userId ? { actorId: request.auth.userId } : {}),
        action: 'CMS_CAMPAIGN_BANNER_UPDATED',
        targetType: 'CampaignBanner',
        targetId: banner._id,
        metadata: { key: banner.key },
      });
      response.status(200).json({ banner });
    }),
  );

  router.delete(
    '/admin/cms/campaign-banners/:id',
    requireAuth(authConfig),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      requireAdminRole(request);
      const banner = await CampaignBannerModel.findByIdAndUpdate(
        request.params.id,
        { isDeleted: true, deletedAt: new Date(), deletedBy: request.auth?.userId },
        { returnDocument: 'after' },
      );
      if (!banner) throw new HttpError(404, 'Campaign banner not found');
      await logAudit({
        ...(request.auth?.userId ? { actorId: request.auth.userId } : {}),
        action: 'CMS_CAMPAIGN_BANNER_DELETED',
        targetType: 'CampaignBanner',
        targetId: banner._id,
        metadata: { key: banner.key },
      });
      response.status(204).send();
    }),
  );

  return router;
}
