import { Router, type NextFunction, type Request, type Response } from 'express';
import fs from 'fs';
import type { Types } from 'mongoose';
import {
  cmsBannerInputSchema,
  cmsCampaignBannerInputSchema,
  cmsContentInputSchema,
  cmsFaqInputSchema,
  cmsHomeContentSchema,
  cmsLandingPageInputSchema,
  cmsPageInputSchema,
  cmsPromotionInputSchema,
  cmsSectionInputSchema,
  cmsSuccessStoryInputSchema,
  cmsTemplateInputSchema,
  cmsTestimonialInputSchema,
  auditLogQuerySchema,
  adminUserQuerySchema,
  adminUserNoteSchema,
  adminInterestListQuerySchema,
  adminUserRoleUpdateSchema,
  adminUserStatusUpdateSchema,
  adminUserUpdateSchema,
  profileModerationQuerySchema,
  profileModerationReviewSchema,
  verificationRequestCreateSchema,
  verificationReviewSchema,
  VerificationStatus,
  verificationStatusSchema,
  UserRole,
} from '@vivah/shared';
import {
  AdminPermission,
  requireAuth,
  requirePermission,
  requireRoles,
} from '../auth/auth.middleware.js';
import type { AuthConfig, AuthenticatedRequest } from '../auth/auth-types.js';
import { HttpError } from '../auth/auth-errors.js';
import { logAudit } from '../common/audit.service.js';
import {
  createVerificationRequest,
  addUserNote,
  getAnalyticsCsv,
  getAnalyticsSummary,
  getDashboardSummary,
  getFraudEvents,
  getModerationDashboard,
  getOwnVerificationRequest,
  getProfileModerationDetail,
  getUserDetail,
  getVerificationDocumentPreview,
  getVerificationRequestDetail,
  listAuditLogs,
  listOwnVerificationRequests,
  listProfilesForModeration,
  listUsers,
  listVerificationRequests,
  performModerationAction,
  performBulkModerationAction,
  recalculateVerificationBadges,
  reviewProfile,
  reviewVerificationRequest,
  updateFraudEventStatus,
  updateUserRole,
  updateUserStatus,
  updateUser,
  getRevenueAnalytics,
  getVerificationAnalytics,
  getInterestActivityDetail,
  listInterestActivity,
} from './admin.service.js';
import { resolveVerificationDocumentPreview } from '../verification/verification-document.service.js';
import { publicCache } from '../public/public-cache.js';
import {
  BannerModel,
  BlogPostModel,
  CampaignBannerModel,
  CmsPageModel,
  CmsSectionModel,
  FaqModel,
  LandingPageModel,
  PromotionModel,
  SuccessStoryModel,
  SystemSettingModel,
  TemplateModel,
  TestimonialModel,
} from '../models/index.js';

type AuditEntity = { _id: Types.ObjectId };
type SlugAuditEntity = AuditEntity & { slug?: unknown };
type KeyAuditEntity = AuditEntity & { key?: unknown };
type CodeAuditEntity = AuditEntity & { code?: unknown };

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

function parseDateQuery(value: unknown) {
  if (typeof value !== 'string' || value.trim() === '') return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new HttpError(400, 'Invalid date range');
  }
  return date;
}

function analyticsRangeFromQuery(query: Request['query']) {
  const from = parseDateQuery(query.from);
  const to = parseDateQuery(query.to);
  return {
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  };
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

export function createAdminRouter(config: AuthConfig): Router {
  const router = Router();
  const cmsAdminOnly = [requireAuth(config), requireRoles([UserRole.ADMIN, UserRole.SUPER_ADMIN])] as const;

  router.get(
    '/admin/dashboard/summary',
    requireAuth(config),
    requirePermission(AdminPermission.DASHBOARD_READ),
    asyncHandler(async (_request, response) => {
      response.status(200).json(await getDashboardSummary());
    }),
  );

  router.get(
    '/admin/moderation/dashboard',
    requireAuth(config),
    requirePermission(AdminPermission.DASHBOARD_READ),
    asyncHandler(async (_request, response) => {
      response.status(200).json(await getModerationDashboard());
    }),
  );

  router.get(
    '/admin/analytics/summary',
    requireAuth(config),
    requirePermission(AdminPermission.ANALYTICS_READ),
    asyncHandler(async (request, response) => {
      response.status(200).json(await getAnalyticsSummary(analyticsRangeFromQuery(request.query)));
    }),
  );

  router.get(
    '/admin/analytics/revenue',
    requireAuth(config),
    requirePermission(AdminPermission.ANALYTICS_READ),
    asyncHandler(async (request, response) => {
      response.status(200).json(await getRevenueAnalytics(analyticsRangeFromQuery(request.query)));
    }),
  );

  router.get(
    '/admin/analytics/verification',
    requireAuth(config),
    requirePermission(AdminPermission.ANALYTICS_READ),
    asyncHandler(async (_request, response) => {
      response.status(200).json(await getVerificationAnalytics());
    }),
  );

  router.get(
    '/admin/analytics/export.csv',
    requireAuth(config),
    requirePermission(AdminPermission.ANALYTICS_READ),
    asyncHandler(async (request, response) => {
      const csv = await getAnalyticsCsv(analyticsRangeFromQuery(request.query));
      response
        .status(200)
        .setHeader('Content-Type', 'text/csv; charset=utf-8')
        .setHeader('Content-Disposition', 'attachment; filename="vivah-admin-analytics.csv"')
        .send(csv);
    }),
  );

  router.get(
    '/admin/fraud/events',
    requireAuth(config),
    requirePermission(AdminPermission.FRAUD_MANAGE),
    asyncHandler(async (request, response) => {
      const rawStatus = typeof request.query.status === 'string' ? request.query.status : '';
      const rawRule = typeof request.query.rule === 'string' ? request.query.rule : '';
      const filter: { status?: string; rule?: string } = {};
      if (['OPEN', 'REVIEWED', 'DISMISSED'].includes(rawStatus)) filter.status = rawStatus;
      if (rawRule) filter.rule = rawRule;
      response.status(200).json(await getFraudEvents(filter));
    }),
  );

  router.patch(
    '/admin/fraud/events/:id',
    requireAuth(config),
    requirePermission(AdminPermission.FRAUD_MANAGE),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const eventId = request.params.id;
      const body = request.body as { status?: unknown; reviewReason?: unknown };
      const status = typeof body.status === 'string' ? body.status : '';
      const reviewReason = typeof body.reviewReason === 'string' ? body.reviewReason : undefined;
      if (!eventId || (status !== 'REVIEWED' && status !== 'DISMISSED')) {
        throw new HttpError(400, 'Valid fraud review status is required');
      }
      response
        .status(200)
        .json({ event: await updateFraudEventStatus(auth.userId, eventId, status, reviewReason) });
    }),
  );

  router.get(
    '/admin/interests',
    requireAuth(config),
    requirePermission(AdminPermission.MODERATION_MANAGE),
    asyncHandler(async (request, response) => {
      response.status(200).json(await listInterestActivity(adminInterestListQuerySchema.parse(request.query)));
    }),
  );

  router.get(
    '/admin/interests/:id',
    requireAuth(config),
    requirePermission(AdminPermission.MODERATION_MANAGE),
    asyncHandler(async (request, response) => {
      const interestId = request.params.id;
      if (!interestId) {
        throw new HttpError(404, 'Interest not found');
      }
      response.status(200).json({ interest: await getInterestActivityDetail(interestId) });
    }),
  );

  router.patch(
    '/admin/moderation/reports/bulk-action',
    requireAuth(config),
    requirePermission(AdminPermission.MODERATION_MANAGE),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const body = request.body as { reportIds?: unknown; action?: unknown };
      const action = typeof body.action === 'string' ? body.action : '';
      if (!Array.isArray(body.reportIds) || body.reportIds.length === 0) {
        throw new HttpError(400, 'Valid report IDs are required');
      }
      const reportIds = body.reportIds.filter(
        (reportId): reportId is string => typeof reportId === 'string' && reportId.trim().length > 0,
      );
      if (reportIds.length !== body.reportIds.length) {
        throw new HttpError(400, 'Valid report IDs are required');
      }
      if (!['WARN', 'SUSPEND', 'BAN', 'REMOVE_CONTENT', 'DISMISS'].includes(action)) {
        throw new HttpError(400, 'Valid moderation action is required');
      }
      const bulkResult = await performBulkModerationAction(
        auth.userId,
        auth.role,
        reportIds,
        action as 'WARN' | 'SUSPEND' | 'BAN' | 'REMOVE_CONTENT' | 'DISMISS',
      );
      response.status(200).json({
        ...bulkResult,
        message: `Processed ${bulkResult.results.length} actions with ${bulkResult.errors.length} errors`,
      });
    }),
  );

  router.patch(
    '/admin/moderation/reports/:id/action',
    requireAuth(config),
    requirePermission(AdminPermission.MODERATION_MANAGE),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const reportId = request.params.id;
      const body = request.body as { action?: unknown };
      const action = typeof body.action === 'string' ? body.action : '';
      if (!reportId || !['WARN', 'SUSPEND', 'BAN', 'REMOVE_CONTENT', 'DISMISS'].includes(action)) {
        throw new HttpError(400, 'Valid moderation action is required');
      }
      response.status(200).json({
        report: await performModerationAction(
          auth.userId,
          auth.role,
          reportId,
          action as 'WARN' | 'SUSPEND' | 'BAN' | 'REMOVE_CONTENT' | 'DISMISS',
        ),
        message: 'Moderation action applied',
      });
    }),
  );

  router.get(
    '/admin/users',
    requireAuth(config),
    requirePermission(AdminPermission.USERS_READ),
    asyncHandler(async (request, response) => {
      response.status(200).json(await listUsers(adminUserQuerySchema.parse(request.query)));
    }),
  );

  router.patch(
    '/admin/users/:id',
    requireAuth(config),
    requirePermission(AdminPermission.USERS_MANAGE),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const userId = request.params.id;
      if (!userId) throw new HttpError(404, 'User not found');
      response.status(200).json({
        user: await updateUser(
          auth.userId,
          auth.role,
          userId,
          adminUserUpdateSchema.parse(request.body),
        ),
      });
    }),
  );

  router.get(
    '/admin/users/:id',
    requireAuth(config),
    requirePermission(AdminPermission.USERS_READ),
    asyncHandler(async (request, response) => {
      const userId = request.params.id;
      if (!userId) throw new HttpError(404, 'User not found');
      response.status(200).json(await getUserDetail(userId));
    }),
  );

  router.patch(
    '/admin/users/:id/status',
    requireAuth(config),
    requirePermission(AdminPermission.USERS_MANAGE),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const userId = request.params.id;
      if (!userId) throw new HttpError(404, 'User not found');
      response.status(200).json({
        user: await updateUserStatus(
          auth.userId,
          auth.role,
          userId,
          adminUserStatusUpdateSchema.parse(request.body),
        ),
      });
    }),
  );

  router.patch(
    '/admin/users/:id/role',
    requireAuth(config),
    requirePermission(AdminPermission.USER_ROLES_MANAGE),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const userId = request.params.id;
      if (!userId) throw new HttpError(404, 'User not found');
      response.status(200).json({
        user: await updateUserRole(
          auth.userId,
          auth.role,
          userId,
          adminUserRoleUpdateSchema.parse(request.body),
        ),
      });
    }),
  );

  router.patch(
    '/admin/users/:id/notes',
    requireAuth(config),
    requirePermission(AdminPermission.USERS_READ),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const userId = request.params.id;
      if (!userId) throw new HttpError(404, 'User not found');
      response.status(201).json({
        note: await addUserNote(
          auth.userId,
          auth.role,
          userId,
          adminUserNoteSchema.parse(request.body),
        ),
      });
    }),
  );

  router.get(
    '/admin/audit-logs',
    requireAuth(config),
    requirePermission(AdminPermission.AUDIT_READ),
    asyncHandler(async (request, response) => {
      response.status(200).json(await listAuditLogs(auditLogQuerySchema.parse(request.query)));
    }),
  );

  router.get(
    '/admin/cms/pages',
    ...cmsAdminOnly,
    asyncHandler(async (_request, response) => {
      const pages = await CmsPageModel.find({ isDeleted: false })
        .sort({ updatedAt: -1 })
        .select(pageProjection())
        .lean();
      response.status(200).json({ pages });
    }),
  );

  router.get(
    '/admin/cms/home',
    ...cmsAdminOnly,
    asyncHandler(async (_request, response) => {
      response.status(200).json({ content: await getHomeContent() });
    }),
  );

  router.put(
    '/admin/cms/home',
    ...cmsAdminOnly,
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const input = cmsHomeContentSchema.parse(request.body);
      await SystemSettingModel.findOneAndUpdate(
        { key: 'homepageContent' },
        { key: 'homepageContent', value: input, description: 'Public homepage CMS content' },
        { upsert: true, returnDocument: 'after', runValidators: true },
      );
      publicCache.del('homeContent');
      await logAudit({
        actorId: auth.userId,
        action: 'CMS_HOME_UPDATED',
        targetType: 'SystemSetting',
        metadata: { key: 'homepageContent' },
      });
      response.status(200).json({ content: input });
    }),
  );

  router.post(
    '/admin/cms/pages',
    ...cmsAdminOnly,
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const input = cmsPageInputSchema.parse(request.body);
      const page = (await CmsPageModel.create(input)) as SlugAuditEntity;
      await logAudit({
        actorId: auth.userId,
        action: 'CMS_PAGE_CREATED',
        targetType: 'CmsPage',
        targetId: page._id,
        metadata: { slug: page.slug },
      });
      response.status(201).json({ page });
    }),
  );

  router.patch(
    '/admin/cms/pages/:id',
    ...cmsAdminOnly,
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const input = cmsPageInputSchema.partial().parse(request.body);
      const page: SlugAuditEntity | null = await CmsPageModel.findByIdAndUpdate(request.params.id, input, {
        returnDocument: 'after',
        runValidators: true,
      });
      if (!page) {
        throw new HttpError(404, 'Page not found');
      }
      await logAudit({
        actorId: auth.userId,
        action: 'CMS_PAGE_UPDATED',
        targetType: 'CmsPage',
        targetId: page._id,
        metadata: { slug: page.slug },
      });
      response.status(200).json({ page });
    }),
  );

  router.delete(
    '/admin/cms/pages/:id',
    ...cmsAdminOnly,
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const page: AuditEntity | null = await CmsPageModel.findByIdAndUpdate(
        request.params.id,
        { isDeleted: true, deletedAt: new Date(), deletedBy: auth.userId },
        { returnDocument: 'after' },
      );
      if (!page) {
        throw new HttpError(404, 'Page not found');
      }
      await logAudit({
        actorId: auth.userId,
        action: 'CMS_PAGE_DELETED',
        targetType: 'CmsPage',
        targetId: page._id,
      });
      response.status(204).send();
    }),
  );

  router.get(
    '/admin/cms/blogs',
    ...cmsAdminOnly,
    asyncHandler(async (_request, response) => {
      const blogs = await BlogPostModel.find({ isDeleted: false })
        .sort({ updatedAt: -1 })
        .select(contentProjection())
        .lean();
      response.status(200).json({ blogs });
    }),
  );

  router.post(
    '/admin/cms/blogs',
    ...cmsAdminOnly,
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const input = cmsContentInputSchema.parse(request.body);
      const blog = (await BlogPostModel.create({
        ...input,
        authorId: auth.userId,
      })) as SlugAuditEntity;
      await logAudit({
        actorId: auth.userId,
        action: 'CMS_BLOG_CREATED',
        targetType: 'BlogPost',
        targetId: blog._id,
        metadata: { slug: blog.slug },
      });
      response.status(201).json({ blog });
    }),
  );

  router.patch(
    '/admin/cms/blogs/:id',
    ...cmsAdminOnly,
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const input = cmsContentInputSchema.partial().parse(request.body);
      const blog: SlugAuditEntity | null = await BlogPostModel.findByIdAndUpdate(request.params.id, input, {
        returnDocument: 'after',
        runValidators: true,
      });
      if (!blog) {
        throw new HttpError(404, 'Blog not found');
      }
      await logAudit({
        actorId: auth.userId,
        action: 'CMS_BLOG_UPDATED',
        targetType: 'BlogPost',
        targetId: blog._id,
        metadata: { slug: blog.slug },
      });
      response.status(200).json({ blog });
    }),
  );

  router.delete(
    '/admin/cms/blogs/:id',
    ...cmsAdminOnly,
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const blog: AuditEntity | null = await BlogPostModel.findByIdAndUpdate(
        request.params.id,
        { isDeleted: true, deletedAt: new Date(), deletedBy: auth.userId },
        { returnDocument: 'after' },
      );
      if (!blog) {
        throw new HttpError(404, 'Blog not found');
      }
      await logAudit({
        actorId: auth.userId,
        action: 'CMS_BLOG_DELETED',
        targetType: 'BlogPost',
        targetId: blog._id,
      });
      response.status(204).send();
    }),
  );

  router.get(
    '/admin/cms/success-stories',
    ...cmsAdminOnly,
    asyncHandler(async (_request, response) => {
      const stories = await SuccessStoryModel.find({ isDeleted: false })
        .sort({ updatedAt: -1 })
        .select(successStoryProjection())
        .lean();
      response.status(200).json({ stories });
    }),
  );

  router.post(
    '/admin/cms/success-stories',
    ...cmsAdminOnly,
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const input = cmsSuccessStoryInputSchema.parse(request.body);
      const story = (await SuccessStoryModel.create(input)) as SlugAuditEntity;
      await logAudit({
        actorId: auth.userId,
        action: 'CMS_SUCCESS_STORY_CREATED',
        targetType: 'SuccessStory',
        targetId: story._id,
        metadata: { slug: story.slug },
      });
      response.status(201).json({ story });
    }),
  );

  router.patch(
    '/admin/cms/success-stories/:id',
    ...cmsAdminOnly,
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const input = cmsSuccessStoryInputSchema.partial().parse(request.body);
      const story: SlugAuditEntity | null = await SuccessStoryModel.findByIdAndUpdate(request.params.id, input, {
        returnDocument: 'after',
        runValidators: true,
      });
      if (!story) {
        throw new HttpError(404, 'Success story not found');
      }
      await logAudit({
        actorId: auth.userId,
        action: 'CMS_SUCCESS_STORY_UPDATED',
        targetType: 'SuccessStory',
        targetId: story._id,
        metadata: { slug: story.slug },
      });
      response.status(200).json({ story });
    }),
  );

  router.delete(
    '/admin/cms/success-stories/:id',
    ...cmsAdminOnly,
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const story: AuditEntity | null = await SuccessStoryModel.findByIdAndUpdate(
        request.params.id,
        { isDeleted: true, deletedAt: new Date(), deletedBy: auth.userId },
        { returnDocument: 'after' },
      );
      if (!story) {
        throw new HttpError(404, 'Success story not found');
      }
      await logAudit({
        actorId: auth.userId,
        action: 'CMS_SUCCESS_STORY_DELETED',
        targetType: 'SuccessStory',
        targetId: story._id,
      });
      response.status(204).send();
    }),
  );

  router.get(
    '/admin/cms/testimonials',
    ...cmsAdminOnly,
    asyncHandler(async (_request, response) => {
      const testimonials = await TestimonialModel.find({ isDeleted: false })
        .sort({ updatedAt: -1 })
        .select(testimonialProjection())
        .lean();
      response.status(200).json({ testimonials });
    }),
  );

  router.post(
    '/admin/cms/testimonials',
    ...cmsAdminOnly,
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const input = cmsTestimonialInputSchema.parse(request.body);
      const testimonial = (await TestimonialModel.create(input)) as AuditEntity;
      await logAudit({
        actorId: auth.userId,
        action: 'CMS_TESTIMONIAL_CREATED',
        targetType: 'Testimonial',
        targetId: testimonial._id,
      });
      response.status(201).json({ testimonial });
    }),
  );

  router.patch(
    '/admin/cms/testimonials/:id',
    ...cmsAdminOnly,
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const input = cmsTestimonialInputSchema.partial().parse(request.body);
      const testimonial: AuditEntity | null = await TestimonialModel.findByIdAndUpdate(request.params.id, input, {
        returnDocument: 'after',
        runValidators: true,
      });
      if (!testimonial) {
        throw new HttpError(404, 'Testimonial not found');
      }
      await logAudit({
        actorId: auth.userId,
        action: 'CMS_TESTIMONIAL_UPDATED',
        targetType: 'Testimonial',
        targetId: testimonial._id,
      });
      response.status(200).json({ testimonial });
    }),
  );

  router.delete(
    '/admin/cms/testimonials/:id',
    ...cmsAdminOnly,
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const testimonial: AuditEntity | null = await TestimonialModel.findByIdAndUpdate(
        request.params.id,
        { isDeleted: true, deletedAt: new Date(), deletedBy: auth.userId },
        { returnDocument: 'after' },
      );
      if (!testimonial) {
        throw new HttpError(404, 'Testimonial not found');
      }
      await logAudit({
        actorId: auth.userId,
        action: 'CMS_TESTIMONIAL_DELETED',
        targetType: 'Testimonial',
        targetId: testimonial._id,
      });
      response.status(204).send();
    }),
  );

  router.get(
    '/admin/cms/banners',
    ...cmsAdminOnly,
    asyncHandler(async (_request, response) => {
      const banners = await BannerModel.find({ isDeleted: false })
        .sort({ updatedAt: -1 })
        .select(bannerProjection())
        .lean();
      response.status(200).json({ banners });
    }),
  );

  router.post(
    '/admin/cms/banners',
    ...cmsAdminOnly,
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const input = cmsBannerInputSchema.parse(request.body);
      const banner = (await BannerModel.create(input)) as KeyAuditEntity;
      await logAudit({
        actorId: auth.userId,
        action: 'CMS_BANNER_CREATED',
        targetType: 'Banner',
        targetId: banner._id,
        metadata: { key: banner.key },
      });
      response.status(201).json({ banner });
    }),
  );

  router.patch(
    '/admin/cms/banners/:id',
    ...cmsAdminOnly,
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const input = cmsBannerInputSchema.partial().parse(request.body);
      const banner: KeyAuditEntity | null = await BannerModel.findByIdAndUpdate(request.params.id, input, {
        returnDocument: 'after',
        runValidators: true,
      });
      if (!banner) {
        throw new HttpError(404, 'Banner not found');
      }
      await logAudit({
        actorId: auth.userId,
        action: 'CMS_BANNER_UPDATED',
        targetType: 'Banner',
        targetId: banner._id,
        metadata: { key: banner.key },
      });
      response.status(200).json({ banner });
    }),
  );

  router.delete(
    '/admin/cms/banners/:id',
    ...cmsAdminOnly,
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const banner: AuditEntity | null = await BannerModel.findByIdAndUpdate(
        request.params.id,
        { isDeleted: true, deletedAt: new Date(), deletedBy: auth.userId },
        { returnDocument: 'after' },
      );
      if (!banner) {
        throw new HttpError(404, 'Banner not found');
      }
      await logAudit({
        actorId: auth.userId,
        action: 'CMS_BANNER_DELETED',
        targetType: 'Banner',
        targetId: banner._id,
      });
      response.status(204).send();
    }),
  );

  router.get(
    '/admin/cms/sections',
    ...cmsAdminOnly,
    asyncHandler(async (_request, response) => {
      const sections = await CmsSectionModel.find({ isDeleted: false })
        .sort({ sortOrder: 1 })
        .lean();
      response.status(200).json({ sections });
    }),
  );

  router.post(
    '/admin/cms/sections',
    ...cmsAdminOnly,
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const input = cmsSectionInputSchema.parse(request.body);
      const section = (await CmsSectionModel.create(input)) as KeyAuditEntity;
      await logAudit({
        actorId: auth.userId,
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
    ...cmsAdminOnly,
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const input = cmsSectionInputSchema.parse(request.body);
      const section: KeyAuditEntity | null = await CmsSectionModel.findByIdAndUpdate(request.params.id, input, {
        returnDocument: 'after',
        runValidators: true,
      });
      if (!section) {
        throw new HttpError(404, 'Section not found');
      }
      await logAudit({
        actorId: auth.userId,
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
    ...cmsAdminOnly,
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const section: KeyAuditEntity | null = await CmsSectionModel.findByIdAndUpdate(
        request.params.id,
        { isDeleted: true, deletedAt: new Date(), deletedBy: auth.userId },
        { returnDocument: 'after' },
      );
      if (!section) {
        throw new HttpError(404, 'Section not found');
      }
      await logAudit({
        actorId: auth.userId,
        action: 'CMS_SECTION_DELETED',
        targetType: 'CmsSection',
        targetId: section._id,
        metadata: { key: section.key },
      });
      response.status(204).send();
    }),
  );

  router.get(
    '/admin/cms/faqs',
    ...cmsAdminOnly,
    asyncHandler(async (_request, response) => {
      const faqs = await FaqModel.find({ isDeleted: false })
        .sort({ displayOrder: 1 })
        .lean();
      response.status(200).json({ faqs });
    }),
  );

  router.post(
    '/admin/cms/faqs',
    ...cmsAdminOnly,
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const input = cmsFaqInputSchema.parse(request.body);
      const faq = (await FaqModel.create(input)) as AuditEntity;
      await logAudit({
        actorId: auth.userId,
        action: 'CMS_FAQ_CREATED',
        targetType: 'Faq',
        targetId: faq._id,
      });
      response.status(201).json({ faq });
    }),
  );

  router.put(
    '/admin/cms/faqs/:id',
    ...cmsAdminOnly,
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const input = cmsFaqInputSchema.parse(request.body);
      const faq: AuditEntity | null = await FaqModel.findByIdAndUpdate(request.params.id, input, {
        returnDocument: 'after',
        runValidators: true,
      });
      if (!faq) {
        throw new HttpError(404, 'FAQ not found');
      }
      await logAudit({
        actorId: auth.userId,
        action: 'CMS_FAQ_UPDATED',
        targetType: 'Faq',
        targetId: faq._id,
      });
      response.status(200).json({ faq });
    }),
  );

  router.delete(
    '/admin/cms/faqs/:id',
    ...cmsAdminOnly,
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const faq: AuditEntity | null = await FaqModel.findByIdAndUpdate(
        request.params.id,
        { isDeleted: true, deletedAt: new Date(), deletedBy: auth.userId },
        { returnDocument: 'after' },
      );
      if (!faq) {
        throw new HttpError(404, 'FAQ not found');
      }
      await logAudit({
        actorId: auth.userId,
        action: 'CMS_FAQ_DELETED',
        targetType: 'Faq',
        targetId: faq._id,
      });
      response.status(204).send();
    }),
  );

  router.get(
    '/admin/cms/templates',
    ...cmsAdminOnly,
    asyncHandler(async (_request, response) => {
      const templates = await TemplateModel.find({ isDeleted: false })
        .sort({ key: 1 })
        .lean();
      response.status(200).json({ templates });
    }),
  );

  router.post(
    '/admin/cms/templates',
    ...cmsAdminOnly,
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const input = cmsTemplateInputSchema.parse(request.body);
      const template = (await TemplateModel.create(input)) as KeyAuditEntity;
      await logAudit({
        actorId: auth.userId,
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
    ...cmsAdminOnly,
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const input = cmsTemplateInputSchema.parse(request.body);
      const template: KeyAuditEntity | null = await TemplateModel.findByIdAndUpdate(request.params.id, input, {
        returnDocument: 'after',
        runValidators: true,
      });
      if (!template) {
        throw new HttpError(404, 'Template not found');
      }
      await logAudit({
        actorId: auth.userId,
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
    ...cmsAdminOnly,
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const template: KeyAuditEntity | null = await TemplateModel.findByIdAndUpdate(
        request.params.id,
        { isDeleted: true, deletedAt: new Date(), deletedBy: auth.userId },
        { returnDocument: 'after' },
      );
      if (!template) {
        throw new HttpError(404, 'Template not found');
      }
      await logAudit({
        actorId: auth.userId,
        action: 'CMS_TEMPLATE_DELETED',
        targetType: 'Template',
        targetId: template._id,
        metadata: { key: template.key },
      });
      response.status(204).send();
    }),
  );

  router.get(
    '/admin/cms/landing-pages',
    ...cmsAdminOnly,
    asyncHandler(async (_request, response) => {
      const pages = await LandingPageModel.find({ isDeleted: false })
        .sort({ updatedAt: -1 })
        .lean();
      response.status(200).json({ pages });
    }),
  );

  router.post(
    '/admin/cms/landing-pages',
    ...cmsAdminOnly,
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const input = cmsLandingPageInputSchema.parse(request.body);
      const page = (await LandingPageModel.create(input)) as SlugAuditEntity;
      await logAudit({
        actorId: auth.userId,
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
    ...cmsAdminOnly,
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const input = cmsLandingPageInputSchema.parse(request.body);
      const page: SlugAuditEntity | null = await LandingPageModel.findByIdAndUpdate(request.params.id, input, {
        returnDocument: 'after',
        runValidators: true,
      });
      if (!page) {
        throw new HttpError(404, 'Landing page not found');
      }
      await logAudit({
        actorId: auth.userId,
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
    ...cmsAdminOnly,
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const page: SlugAuditEntity | null = await LandingPageModel.findByIdAndUpdate(
        request.params.id,
        { isDeleted: true, deletedAt: new Date(), deletedBy: auth.userId },
        { returnDocument: 'after' },
      );
      if (!page) {
        throw new HttpError(404, 'Landing page not found');
      }
      await logAudit({
        actorId: auth.userId,
        action: 'CMS_LANDING_PAGE_DELETED',
        targetType: 'LandingPage',
        targetId: page._id,
        metadata: { slug: page.slug },
      });
      response.status(204).send();
    }),
  );

  router.get(
    '/admin/cms/promotions',
    ...cmsAdminOnly,
    asyncHandler(async (_request, response) => {
      const promotions = await PromotionModel.find({ isDeleted: false })
        .sort({ updatedAt: -1 })
        .lean();
      response.status(200).json({ promotions });
    }),
  );

  router.post(
    '/admin/cms/promotions',
    ...cmsAdminOnly,
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const input = cmsPromotionInputSchema.parse(request.body);
      const promotion = (await PromotionModel.create(input)) as CodeAuditEntity;
      await logAudit({
        actorId: auth.userId,
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
    ...cmsAdminOnly,
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const input = cmsPromotionInputSchema.parse(request.body);
      const promotion: CodeAuditEntity | null = await PromotionModel.findByIdAndUpdate(request.params.id, input, {
        returnDocument: 'after',
        runValidators: true,
      });
      if (!promotion) {
        throw new HttpError(404, 'Promotion not found');
      }
      await logAudit({
        actorId: auth.userId,
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
    ...cmsAdminOnly,
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const promotion: CodeAuditEntity | null = await PromotionModel.findByIdAndUpdate(
        request.params.id,
        { isDeleted: true, deletedAt: new Date(), deletedBy: auth.userId },
        { returnDocument: 'after' },
      );
      if (!promotion) {
        throw new HttpError(404, 'Promotion not found');
      }
      await logAudit({
        actorId: auth.userId,
        action: 'CMS_PROMOTION_DELETED',
        targetType: 'Promotion',
        targetId: promotion._id,
        metadata: { code: promotion.code },
      });
      response.status(204).send();
    }),
  );

  router.get(
    '/admin/cms/campaign-banners',
    ...cmsAdminOnly,
    asyncHandler(async (_request, response) => {
      const banners = await CampaignBannerModel.find({ isDeleted: false })
        .sort({ updatedAt: -1 })
        .lean();
      response.status(200).json({ banners });
    }),
  );

  router.post(
    '/admin/cms/campaign-banners',
    ...cmsAdminOnly,
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const input = cmsCampaignBannerInputSchema.parse(request.body);
      const banner = (await CampaignBannerModel.create(input)) as KeyAuditEntity;
      await logAudit({
        actorId: auth.userId,
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
    ...cmsAdminOnly,
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const input = cmsCampaignBannerInputSchema.parse(request.body);
      const banner: KeyAuditEntity | null = await CampaignBannerModel.findByIdAndUpdate(request.params.id, input, {
        returnDocument: 'after',
        runValidators: true,
      });
      if (!banner) {
        throw new HttpError(404, 'Campaign banner not found');
      }
      await logAudit({
        actorId: auth.userId,
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
    ...cmsAdminOnly,
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const banner: KeyAuditEntity | null = await CampaignBannerModel.findByIdAndUpdate(
        request.params.id,
        { isDeleted: true, deletedAt: new Date(), deletedBy: auth.userId },
        { returnDocument: 'after' },
      );
      if (!banner) {
        throw new HttpError(404, 'Campaign banner not found');
      }
      await logAudit({
        actorId: auth.userId,
        action: 'CMS_CAMPAIGN_BANNER_DELETED',
        targetType: 'CampaignBanner',
        targetId: banner._id,
        metadata: { key: banner.key },
      });
      response.status(204).send();
    }),
  );

  router.get(
    '/admin/profiles',
    requireAuth(config),
    requirePermission(AdminPermission.PROFILES_REVIEW),
    asyncHandler(async (request, response) => {
      const input = profileModerationQuerySchema.parse(request.query);
      response.status(200).json({ profiles: await listProfilesForModeration(input) });
    }),
  );

  router.get(
    '/admin/profiles/:id',
    requireAuth(config),
    requirePermission(AdminPermission.PROFILES_REVIEW),
    asyncHandler(async (request, response) => {
      const profileId = request.params.id;
      if (!profileId) throw new HttpError(404, 'Profile not found');
      response.status(200).json({ profile: await getProfileModerationDetail(profileId) });
    }),
  );

  router.patch(
    '/admin/profiles/:id/review',
    requireAuth(config),
    requirePermission(AdminPermission.PROFILES_REVIEW),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const input = profileModerationReviewSchema.parse(request.body);
      const profileId = request.params.id;
      if (!profileId) throw new HttpError(404, 'Profile not found');
      response.status(200).json({
        profile: await reviewProfile(auth.userId, auth.role, profileId, input),
        message: 'Profile reviewed',
      });
    }),
  );

  router.post(
    '/me/verifications',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const input = verificationRequestCreateSchema.parse(request.body);
      response.status(201).json({
        request: await createVerificationRequest(auth.userId, input),
        message: 'Verification request submitted',
      });
    }),
  );

  router.get(
    '/me/verifications',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      response.status(200).json({ requests: await listOwnVerificationRequests(auth.userId) });
    }),
  );

  router.get(
    '/me/verifications/:id',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const requestId = request.params.id;
      if (!requestId) throw new HttpError(404, 'Verification request not found');
      response
        .status(200)
        .json({ request: await getOwnVerificationRequest(auth.userId, requestId) });
    }),
  );

  router.get(
    '/admin/verifications',
    requireAuth(config),
    requirePermission(AdminPermission.VERIFICATIONS_REVIEW),
    asyncHandler(async (request, response) => {
      const status =
        typeof request.query.status === 'string'
          ? verificationStatusSchema.parse(request.query.status)
          : VerificationStatus.PENDING;
      response.status(200).json({ requests: await listVerificationRequests(status) });
    }),
  );

  router.post(
    '/admin/verifications/recalculate-badges',
    requireAuth(config),
    requirePermission(AdminPermission.ANALYTICS_READ),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      response.status(200).json({
        result: await recalculateVerificationBadges(auth.userId, auth.role),
        message: 'Verification badges recalculated',
      });
    }),
  );

  router.patch(
    '/admin/verifications/:id/review',
    requireAuth(config),
    requirePermission(AdminPermission.VERIFICATIONS_REVIEW),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const input = verificationReviewSchema.parse(request.body);
      const requestId = request.params.id;
      if (!requestId) throw new HttpError(404, 'Verification request not found');
      response.status(200).json({
        request: await reviewVerificationRequest(auth.userId, auth.role, requestId, input),
        message: 'Verification reviewed',
      });
    }),
  );

  router.get(
    '/admin/verifications/:id',
    requireAuth(config),
    requirePermission(AdminPermission.VERIFICATIONS_REVIEW),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const requestId = request.params.id;
      if (!requestId) throw new HttpError(404, 'Verification request not found');
      response.status(200).json(await getVerificationRequestDetail(requestId, auth.userId));
    }),
  );

  router.get(
    '/admin/verifications/:id/documents/:documentId/access',
    requireAuth(config),
    requirePermission(AdminPermission.VERIFICATIONS_REVIEW),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const requestId = request.params.id;
      const documentId = request.params.documentId;
      if (!requestId || !documentId) throw new HttpError(404, 'Verification document not found');
      response.status(200).json({
        preview: await getVerificationDocumentPreview(
          auth.userId,
          auth.role,
          requestId,
          documentId,
        ),
      });
    }),
  );

  router.get(
    '/admin/verifications/:id/documents/:documentId/preview',
    requireAuth(config),
    requirePermission(AdminPermission.VERIFICATIONS_REVIEW),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const requestId = request.params.id;
      const documentId = request.params.documentId;
      const token = typeof request.query.token === 'string' ? request.query.token : '';
      if (!requestId || !documentId) throw new HttpError(404, 'Verification document not found');
      const result = await resolveVerificationDocumentPreview(
        auth.userId,
        auth.role,
        requestId,
        documentId,
        token,
      );
      if (result.mode === 'redirect') {
        response.redirect(result.assetUrl);
        return;
      }
      if (!fs.existsSync(result.filePath)) {
        throw new HttpError(404, 'Verification document file not found');
      }
      response.type(result.mimeType);
      response.sendFile(result.filePath);
    }),
  );

  return router;
}
