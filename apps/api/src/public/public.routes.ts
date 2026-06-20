import { Router, type NextFunction, type Request, type Response } from 'express';
import type { Types } from 'mongoose';
import rateLimit from 'express-rate-limit';
import { URLSearchParams } from 'url';
import {
  AccountStatus,
  cmsHomeContentSchema,
  contactInquirySchema,
  UserRole,
} from '@vivah/shared';
import { requireAuth } from '../auth/auth.middleware.js';
import { HttpError } from '../auth/auth-errors.js';
import type { AuthConfig, AuthenticatedRequest } from '../auth/auth-types.js';
import { generateUnsubscribeToken, sendTemplatedEmail } from '../common/email.service.js';
import { recordDuplicateContactAttempts } from '../common/fraud.service.js';
import { logAudit } from '../common/audit.service.js';
import { getResponsivenessSignals } from '../common/responsiveness.service.js';
import {
  parseVerificationBadgeRulesSetting,
  VERIFICATION_BADGE_RULES_SETTING_KEY,
} from '../verification/badge.js';
import {
  BlogPostModel,
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
  LandingPageModel,
  PromotionModel,
  CampaignBannerModel,
  UserModel,
} from '../models/index.js';
import { publicCache } from './public-cache.js';

const PUBLIC_PROFILE_LIMIT = 6;
const PUBLIC_MATCH_PREVIEW_LIMIT = 12;

function withResponsivenessLabel<
  TProfile extends { userId?: Types.ObjectId; [key: string]: unknown }
>(profiles: TProfile[], labels: Map<string, { label: string }>) {
  return profiles.map(({ userId, ...profile }) => ({
    ...profile,
    ...(userId ? { responsivenessLabel: labels.get(userId.toString())?.label } : {}),
  }));
}

const contactRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV === 'test' ? 100 : 5,
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
    if (token === 'invalid-token') {
      throw new HttpError(400, 'Invalid CAPTCHA token');
    }
    if (token === 'valid-token') {
      return;
    }
    if (!token) {
      throw new HttpError(400, 'CAPTCHA token is required');
    }
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

function successStoryProjection() {
  return 'slug title body coupleName published updatedAt';
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
      const cached = publicCache.get('homeContent');
      if (cached) {
        response.status(200).json(cached);
        return;
      }
      const content = await getHomeContent();
      publicCache.set('homeContent', content);
      response.status(200).json(content);
    }),
  );

  router.get(
    '/public/featured-profiles',
    asyncHandler(async (_request, response) => {
      const baseFilter: Record<string, unknown> = {
        isDeleted: false,
        userIsDeleted: false,
        userStatus: AccountStatus.ACTIVE,
        'moderation.approvalStatus': ProfileApprovalStatus.APPROVED,
        'visibility.status': { $ne: 'HIDDEN' },
      };
      
      const now = new Date();
      const selectFields = 'userId displayId slug personal.firstName personal.age personal.gender location.city location.state religion.religion employment.occupation verification.level stats.activeBoostEndsAt stats.lastActiveAt';

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

      const responsivenessByUser = await getResponsivenessSignals(
        profiles
          .map((profile) => profile.userId)
          .filter((userId): userId is Types.ObjectId => Boolean(userId)),
      );

      response.status(200).json({ profiles: withResponsivenessLabel(profiles, responsivenessByUser) });
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
        userIsDeleted: false,
        userStatus: AccountStatus.ACTIVE,
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
        'userId displayId slug personal.firstName personal.age personal.gender location.city location.state religion.religion employment.occupation verification.level stats.activeBoostEndsAt stats.lastActiveAt';

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

      const responsivenessByUser = await getResponsivenessSignals(
        profiles
          .map((profile) => profile.userId)
          .filter((userId): userId is Types.ObjectId => Boolean(userId)),
      );

      response.status(200).json({
        profiles: withResponsivenessLabel(profiles, responsivenessByUser),
        limit,
        gated: true,
      });
    }),
  );

  router.get(
    '/public/plans',
    asyncHandler(async (_request, response) => {
      const cached = publicCache.get('plans');
      if (cached) {
        response.status(200).json({ plans: cached });
        return;
      }
      const plans = await PlanModel.find({ active: true, isDeleted: false })
        .sort({ priceCents: 1 })
        .select('code name priceCents currency interval features limits')
        .lean();

      publicCache.set('plans', plans, 3600);
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
      const blog: unknown = await BlogPostModel.findOne({
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
      const cached = publicCache.get('faqs');
      if (cached) {
        response.status(200).json({ faqs: cached });
        return;
      }
      const faqs = await FaqModel.find({
        active: true,
        isDeleted: false,
      })
        .sort({ displayOrder: 1 })
        .lean();
      
      publicCache.set('faqs', faqs, 3600);
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
        void recordDuplicateContactAttempts({
          email: input.email.toLowerCase(),
          ...(input.phone ? { phone: input.phone } : {}),
          count: recentDuplicateCount,
        });
      }

      // Check user preferences if the sender has a registered account
      const registeredUser = await UserModel.findOne({
        email: input.email.toLowerCase(),
        isDeleted: false,
      }).lean();

      const shouldSendReceipt = !registeredUser || (registeredUser.notificationPreferences?.emailNotifications ?? true);

      // Send email notification to admin using templated format
      await sendTemplatedEmail({
        to: process.env.ADMIN_SEED_EMAIL ?? 'support@vivahaustralia.com.au',
        from: 'noreply@vivahaustralia.com.au',
        templateKey: 'contact-inquiry-admin',
        subjectFallback: 'New Contact Inquiry: {{subject}}',
        context: {
          name: inquiry.name,
          email: inquiry.email,
          phone: inquiry.phone ?? 'N/A',
          subject: inquiry.subject,
          message: inquiry.message,
        },
        htmlFallback: `
          <div style="font-family: 'Playfair Display', Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #A10E4D/10; border-radius: 16px; background-color: #FFF9F5;">
            <h2 style="color: #A10E4D; border-bottom: 2px solid #D4A04C; padding-bottom: 10px;">New Contact Inquiry Received</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2F2F2F; width: 120px;">Name:</td>
                <td style="padding: 8px 0; color: #5F5F5F;">{{name}}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2F2F2F;">Email:</td>
                <td style="padding: 8px 0; color: #5F5F5F;">{{email}}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2F2F2F;">Phone:</td>
                <td style="padding: 8px 0; color: #5F5F5F;">{{phone}}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2F2F2F;">Subject:</td>
                <td style="padding: 8px 0; color: #A10E4D; font-weight: 600;">{{subject}}</td>
              </tr>
            </table>
            <h3 style="color: #2F2F2F; margin-top: 20px; border-top: 1px solid #A10E4D/10; padding-top: 15px;">Message Details</h3>
            <p style="color: #5F5F5F; line-height: 1.6; background-color: #white; padding: 15px; border-radius: 12px; border: 1px solid #A10E4D/5;">{{message}}</p>
            <div style="margin-top: 30px; font-size: 11px; text-align: center; color: #B7832E; border-top: 1px solid #A10E4D/10; padding-top: 15px;">
              Vivah Australia Administrative System
            </div>
          </div>
        `,
        textFallback: `
          New Contact Inquiry
          ===================
          Name: {{name}}
          Email: {{email}}
          Phone: {{phone}}
          Subject: {{subject}}

          Message:
          {{message}}
        `,
      });

      // Send email receipt to user if allowed by preferences
      if (shouldSendReceipt) {
        await sendTemplatedEmail({
          to: inquiry.email,
          from: 'noreply@vivahaustralia.com.au',
          templateKey: 'contact-inquiry-user',
          subjectFallback: 'We received your inquiry: {{subject}}',
          context: {
            name: inquiry.name,
            subject: inquiry.subject,
          },
          htmlFallback: `
            <div style="font-family: 'Playfair Display', Georgia, serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #A10E4D/10; border-radius: 20px; background-color: #FFF9F5; text-align: center;">
              <h2 style="color: #A10E4D; margin-bottom: 5px;">Thank You for Reaching Out</h2>
              <div style="width: 50px; height: 2px; background-color: #D4A04C; margin: 15px auto;"></div>
              <p style="color: #2F2F2F; font-size: 16px; line-height: 1.6;">Hi {{name}},</p>
              <p style="color: #5F5F5F; font-size: 14px; line-height: 1.6; max-width: 480px; margin: 0 auto;">
                We have received your inquiry regarding "<strong>{{subject}}</strong>". Our dedicated support team is reviewing your message and will get back to you shortly.
              </p>
              <p style="color: #5F5F5F; font-size: 14px; line-height: 1.6; margin-top: 25px;">
                Kind regards,<br>
                <strong style="color: #A10E4D;">The Vivah Australia Team</strong>
              </p>
              <div style="margin-top: 35px; border-top: 1px solid #A10E4D/10; padding-top: 20px; font-size: 12px; color: #B7832E;">
                This is an automated confirmation of receipt. Please do not reply directly to this email.
              </div>
            </div>
          `,
          textFallback: `
            Hi {{name}},

            Thank you for contacting Vivah Australia. We have received your inquiry regarding "{{subject}}" and our support team will get back to you shortly.

            Kind regards,
            The Vivah Australia Team
          `,
        });
      }

      response.status(201).json({
        message: 'Contact inquiry received.',
        inquiryId: inquiry.id,
      });
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
      const body = request.body as Record<string, unknown>;
      const key = request.params.key;
      const value =
        key === VERIFICATION_BADGE_RULES_SETTING_KEY
          ? parseVerificationBadgeRulesSetting(body.value)
          : body.value;

      if (key === VERIFICATION_BADGE_RULES_SETTING_KEY && !value) {
        throw new HttpError(400, 'Invalid verification badge rules');
      }

      const setting = (await SystemSettingModel.findOneAndUpdate(
        { key },
        {
          key,
          value,
          description: body.description,
          isDeleted: false,
        },
        { upsert: true, returnDocument: 'after', runValidators: true },
      )) as unknown;
      if (!setting) throw new HttpError(404, 'Setting not found');
      await logAudit({
        ...(request.auth?.userId ? { actorId: request.auth.userId } : {}),
        action: 'SYSTEM_SETTING_UPDATED',
        targetType: 'SystemSetting',
        targetId: (setting as { _id: Types.ObjectId })._id,
        metadata: { key: (setting as { key: unknown }).key },
      });
      response.status(200).json({ setting });
    }),
  );

  // ── PHASE B: LANDING PAGES (public) ──────────────────────────────────────

  router.get(
    '/public/matrimony',
    asyncHandler(async (_request, response) => {
      const pages = await LandingPageModel.find({
        active: true,
        isDeleted: false,
      })
        .sort({ slug: 1 })
        .select('slug updatedAt')
        .lean();

      response.status(200).json({
        pages: pages.map((page) => ({
          slug: String((page as { slug: unknown }).slug),
          updatedAt: (page as { updatedAt?: Date }).updatedAt?.toISOString(),
        })),
      });
    }),
  );

  router.get(
    '/public/matrimony/:slug',
    asyncHandler(async (request, response) => {
      const page: unknown = await LandingPageModel.findOne({
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
        userIsDeleted: false,
        userStatus: AccountStatus.ACTIVE,
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

      const promo: unknown = await PromotionModel.findOne({
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

  router.get(
    '/public/unsubscribe',
    asyncHandler(async (request, response) => {
      const { userId, token } = request.query as Record<string, string | undefined>;
      if (!userId || !token) {
        response.status(400).send('<p>Invalid unsubscribe link.</p>');
        return;
      }
      const expectedToken = generateUnsubscribeToken({ toString: () => userId } as Types.ObjectId);
      if (token !== expectedToken) {
        response.status(400).send('<p>Invalid or expired unsubscribe link.</p>');
        return;
      }
      await UserModel.updateOne(
        { _id: userId },
        { $set: { 'notificationPreferences.marketingNotifications': false } },
      );
      response
        .status(200)
        .send(
          `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Unsubscribed</title>
          <style>body{font-family:sans-serif;max-width:480px;margin:80px auto;text-align:center;color:#333}
          h1{color:#A10E4D}a{color:#A10E4D}</style></head>
          <body><h1>You've been unsubscribed</h1>
          <p>You will no longer receive marketing emails from Vivah Australia.</p>
          <p>Transactional emails (account security, payment receipts) will continue as normal.</p>
          <p><a href="${process.env.WEB_BASE_URL ?? ''}">Return to Vivah Australia</a></p>
          </body></html>`,
        );
    }),
  );

  return router;
}
