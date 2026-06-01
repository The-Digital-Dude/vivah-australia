import { z } from 'zod';
import {
  AccountStatus,
  CommunityPostStatus,
  Gender,
  INCOME_VISIBILITY_VALUES,
  InterestStatus,
  MaritalStatus,
  MediaCategory,
  MediaUploadStatus,
  MediaVisibility,
  PaymentStatus,
  ReportStatus,
  ProfileVisibility,
  UserRole,
  VerificationLevel,
  VerificationStatus,
} from './constants.js';

export const emailSchema = z.string().trim().email().max(254).toLowerCase();

export const passwordSchema = z
  .string()
  .min(12)
  .max(128)
  .regex(/[a-z]/, 'Password must include a lowercase letter')
  .regex(/[A-Z]/, 'Password must include an uppercase letter')
  .regex(/[0-9]/, 'Password must include a number')
  .regex(/[^A-Za-z0-9]/, 'Password must include a symbol');

export const australianMobileSchema = z
  .string()
  .trim()
  .regex(/^(\+?61|0)4\d{8}$/, 'Mobile number must be a valid Australian mobile number');

export const registerEmailSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  termsAccepted: z.literal(true),
  marketingConsent: z.boolean().default(false),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().trim().min(1),
});

export const logoutSchema = refreshTokenSchema;

export const verifyEmailSchema = z.object({
  token: z.string().trim().min(32).max(256),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(32).max(256),
  password: passwordSchema,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: passwordSchema,
});

export const cmsPageInputSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().trim().min(2).max(160),
  body: z.string().trim().min(1).max(50000),
  seoTitle: z.string().trim().max(180).optional(),
  seoDescription: z.string().trim().max(300).optional(),
  published: z.boolean().default(false),
});

export const cmsContentInputSchema = cmsPageInputSchema.omit({
  seoTitle: true,
  seoDescription: true,
});

export const cmsSuccessStoryInputSchema = cmsContentInputSchema.extend({
  coupleName: z.string().trim().max(160).optional(),
});

export const cmsTestimonialInputSchema = z.object({
  name: z.string().trim().min(2).max(160),
  quote: z.string().trim().min(5).max(2000),
  published: z.boolean().default(false),
});

export const cmsBannerInputSchema = z.object({
  key: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().trim().max(160).optional(),
  imageUrl: z.string().trim().url().optional(),
  active: z.boolean().default(true),
});

export const cmsHomeContentSchema = z.object({
  hero: z.object({
    title: z.string().trim().min(2).max(160),
    subtitle: z.string().trim().min(2).max(500),
    primaryAction: z.string().trim().min(2).max(80),
    secondaryAction: z.string().trim().min(2).max(80),
  }),
  howItWorks: z.array(z.string().trim().min(2).max(160)).min(1).max(8),
  safety: z.array(z.string().trim().min(2).max(160)).min(1).max(8),
  faq: z
    .array(
      z.object({
        question: z.string().trim().min(2).max(200),
        answer: z.string().trim().min(2).max(1000),
      }),
    )
    .min(1)
    .max(20),
  contact: z.object({
    email: emailSchema,
    location: z.string().trim().min(2).max(160),
  }),
});

export const contactInquirySchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: emailSchema,
  phone: z.string().trim().max(40).optional(),
  subject: z.string().trim().min(2).max(160),
  message: z.string().trim().min(10).max(5000),
  captchaToken: z.string().trim().min(1).optional(),
});

export const userRoleSchema = z.nativeEnum(UserRole);
export const accountStatusSchema = z.nativeEnum(AccountStatus);
export const genderSchema = z.nativeEnum(Gender);
export const maritalStatusSchema = z.nativeEnum(MaritalStatus);
export const verificationLevelSchema = z.nativeEnum(VerificationLevel);
export const profileVisibilitySchema = z.nativeEnum(ProfileVisibility);
export const mediaVisibilitySchema = z.nativeEnum(MediaVisibility);
export const mediaCategorySchema = z.nativeEnum(MediaCategory);
export const mediaUploadStatusSchema = z.nativeEnum(MediaUploadStatus);
export const verificationStatusSchema = z.nativeEnum(VerificationStatus);
export const interestStatusSchema = z.nativeEnum(InterestStatus);
export const reportStatusSchema = z.nativeEnum(ReportStatus);
export const paymentStatusSchema = z.nativeEnum(PaymentStatus);

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, 'Invalid identifier');

const imageMimeTypes = ['image/jpeg', 'image/png', 'image/webp'] as const;

export const mediaSignUploadSchema = z.object({
  category: mediaCategorySchema,
  visibility: mediaVisibilitySchema.optional(),
  fileName: z.string().trim().min(1).max(180),
  mimeType: z.enum(imageMimeTypes),
  fileSizeBytes: z
    .number()
    .int()
    .min(1)
    .max(10 * 1024 * 1024),
});

export const mediaCompleteUploadSchema = z.object({
  mediaId: z.string().trim().min(1),
  assetUrl: z.string().trim().url(),
  storageKey: z.string().trim().min(1).max(500).optional(),
  bytes: z
    .number()
    .int()
    .min(1)
    .max(10 * 1024 * 1024)
    .optional(),
  width: z.number().int().positive().max(10000).optional(),
  height: z.number().int().positive().max(10000).optional(),
});

export const mediaUpdateSchema = z.object({
  visibility: mediaVisibilitySchema.optional(),
  isPrimary: z.boolean().optional(),
});

export const mediaReviewSchema = z.object({
  approvalStatus: z.enum([
    VerificationStatus.APPROVED,
    VerificationStatus.REJECTED,
    VerificationStatus.NEEDS_RESUBMISSION,
  ]),
  reason: z.string().trim().max(1000).optional(),
});

function csvQueryParam(maxItems = 20) {
  return z.preprocess(
    (value) => {
      if (Array.isArray(value)) {
        return value
          .flatMap((item) => String(item).split(','))
          .map((item) => item.trim())
          .filter(Boolean);
      }

      if (typeof value === 'string') {
        return value
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);
      }

      return undefined;
    },
    z.array(z.string().trim().min(1).max(120)).max(maxItems).optional(),
  );
}

export const matchSortSchema = z.enum(['RECOMMENDED', 'NEWEST', 'RECENTLY_ACTIVE', 'VERIFIED']);

export const profileSearchQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).max(500).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(12),
    sort: matchSortSchema.default('RECOMMENDED'),
    gender: genderSchema.optional(),
    ageMin: z.coerce.number().int().min(18).max(120).optional(),
    ageMax: z.coerce.number().int().min(18).max(120).optional(),
    heightMinCm: z.coerce.number().int().min(90).max(250).optional(),
    heightMaxCm: z.coerce.number().int().min(90).max(250).optional(),
    incomeMin: z.coerce.number().min(0).max(10000000).optional(),
    incomeMax: z.coerce.number().min(0).max(10000000).optional(),
    religion: csvQueryParam(),
    community: csvQueryParam(),
    caste: csvQueryParam(),
    motherTongue: csvQueryParam(),
    country: csvQueryParam(),
    state: csvQueryParam(),
    city: csvQueryParam(),
    education: csvQueryParam(),
    occupation: csvQueryParam(),
    maritalStatus: z.preprocess((value) => {
      if (Array.isArray(value)) {
        return value.flatMap((item) => String(item).split(','));
      }

      if (typeof value === 'string') {
        return value.split(',');
      }

      return undefined;
    }, z.array(maritalStatusSchema).max(10).optional()),
    verificationLevel: verificationLevelSchema.optional(),
    hasPhoto: z.coerce.boolean().optional(),
    visaStatus: csvQueryParam(),
    citizenshipStatus: csvQueryParam(),
    dietaryPreference: csvQueryParam(),
    smokingHabits: csvQueryParam(),
    drinkingHabits: csvQueryParam(),
    familyValues: csvQueryParam(),
    recentlyActive: z.coerce.boolean().optional(),
  })
  .refine(
    (input) =>
      input.ageMin === undefined || input.ageMax === undefined || input.ageMin <= input.ageMax,
    { message: 'Minimum age must be less than or equal to maximum age', path: ['ageMin'] },
  )
  .refine(
    (input) =>
      input.heightMinCm === undefined ||
      input.heightMaxCm === undefined ||
      input.heightMinCm <= input.heightMaxCm,
    {
      message: 'Minimum height must be less than or equal to maximum height',
      path: ['heightMinCm'],
    },
  )
  .refine(
    (input) =>
      input.incomeMin === undefined ||
      input.incomeMax === undefined ||
      input.incomeMin <= input.incomeMax,
    { message: 'Minimum income must be less than or equal to maximum income', path: ['incomeMin'] },
  );

export const recommendedMatchesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(30).default(12),
});

export const profileTargetSchema = z.object({
  profileId: objectIdSchema,
});

export const interestRespondSchema = z.object({
  action: z.enum(['ACCEPT', 'REJECT', 'WITHDRAW']),
});

export const interestListQuerySchema = z.object({
  box: z.enum(['sent', 'received']).default('received'),
});

export const reportTargetTypeSchema = z.enum([
  'PROFILE',
  'MEDIA',
  'MESSAGE',
  'USER',
  'POST',
  'COMMENT',
]);

export const reportCreateSchema = z.object({
  targetType: reportTargetTypeSchema.default('PROFILE'),
  targetId: objectIdSchema.optional(),
  profileId: objectIdSchema.optional(),
  reason: z.string().trim().min(10).max(2000),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('LOW'),
});

export const reportAdminReviewSchema = z.object({
  action: z.enum(['ASSIGN', 'RESOLVE', 'DISMISS']),
});

export const adminUserQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(500).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  role: userRoleSchema.optional(),
  status: accountStatusSchema.optional(),
  verificationLevel: verificationLevelSchema.optional(),
  q: z.string().trim().max(120).optional(),
});

export const adminUserUpdateSchema = z.object({
  role: userRoleSchema.optional(),
  status: accountStatusSchema.optional(),
  emailVerified: z.boolean().optional(),
  mobileVerified: z.boolean().optional(),
});

export const adminUserStatusUpdateSchema = z.object({
  status: accountStatusSchema,
});

export const adminUserRoleUpdateSchema = z.object({
  role: userRoleSchema,
});

export const adminUserNoteSchema = z.object({
  note: z.string().trim().min(2).max(2000),
});

export const profileModerationQuerySchema = z.object({
  status: z.enum(['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'NEEDS_CHANGES']).default('PENDING'),
  sort: z.enum(['RECENTLY_UPDATED', 'NEWEST']).default('RECENTLY_UPDATED'),
});

export const profileModerationReviewSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT', 'NEEDS_CHANGES']),
  reason: z.string().trim().max(1000).optional(),
  internalNote: z.string().trim().max(2000).optional(),
});

export const verificationRequestCreateSchema = z.object({
  type: z.enum([
    'EMAIL',
    'MOBILE',
    'IDENTITY',
    'ADDRESS',
    'EMPLOYMENT',
    'VISA',
    'POLICE_CLEARANCE',
    'FACIAL',
  ]),
  documentUrls: z.array(z.string().trim().url()).max(10).default([]),
  documentType: z.string().trim().min(2).max(120).optional(),
  storageKey: z.string().trim().min(2).max(500).optional(),
});

export const verificationReviewSchema = z.object({
  status: z.enum([
    VerificationStatus.APPROVED,
    VerificationStatus.REJECTED,
    VerificationStatus.NEEDS_RESUBMISSION,
  ]),
  reason: z.string().trim().max(1000).optional(),
  adminNote: z.string().trim().max(2000).optional(),
});

export const notificationListQuerySchema = z.object({
  unreadOnly: z.coerce.boolean().default(false),
});

export const mobileOtpRequestSchema = z.object({
  mobile: australianMobileSchema,
});

export const mobileOtpVerifySchema = z.object({
  mobile: australianMobileSchema,
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'OTP must be a 6 digit code'),
});

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().trim().url(),
  keys: z
    .object({
      p256dh: z.string().trim().min(10).max(500),
      auth: z.string().trim().min(10).max(500),
    })
    .optional(),
  userAgent: z.string().trim().max(500).optional(),
});

export const auditLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(500).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  actor: objectIdSchema.optional(),
  action: z.string().trim().max(120).optional(),
  entityType: z.string().trim().max(80).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const messageAttachmentSchema = z.object({
  attachmentType: z.enum(['IMAGE', 'DOCUMENT']),
  assetUrl: z.string().trim().url(),
  storageKey: z.string().trim().min(1).max(500).optional(),
  fileName: z.string().trim().min(1).max(180),
  mimeType: z
    .string()
    .trim()
    .regex(
      /^(image\/(jpeg|png|webp)|application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/,
      'Unsupported attachment type',
    ),
  fileSizeBytes: z
    .number()
    .int()
    .min(1)
    .max(10 * 1024 * 1024),
});

export const messageCreateSchema = z
  .object({
    body: z.string().trim().max(10000).optional(),
    attachments: z.array(messageAttachmentSchema).max(5).default([]),
  })
  .refine((input) => Boolean(input.body) || input.attachments.length > 0, {
    message: 'Message body or attachment is required',
    path: ['body'],
  });

export const typingEventSchema = z.object({
  conversationId: objectIdSchema,
  typing: z.boolean(),
});

export const conversationCreateSchema = z.object({
  profileId: objectIdSchema,
});

export const communityRoomInputSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).optional(),
  isDefault: z.boolean().default(false),
});

export const communityRoomUpdateSchema = communityRoomInputSchema.partial();

export const communityPostsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(500).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export const communityPostCreateSchema = z.object({
  title: z.string().trim().min(2).max(160).optional(),
  body: z.string().trim().min(5).max(5000),
});

export const communityPostUpdateSchema = communityPostCreateSchema.partial();

export const communityCommentCreateSchema = z.object({
  body: z.string().trim().min(2).max(2000),
});

export const communityReactionSchema = z.object({
  reaction: z.string().trim().min(1).max(40).default('LIKE'),
});

export const communityPostStatusUpdateSchema = z.object({
  status: z.nativeEnum(CommunityPostStatus),
  reason: z.string().trim().max(1000).optional(),
});

const planLimitSchema = z.record(z.string().trim().min(1), z.number().int().min(-1));

export const planInputSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[A-Za-z0-9_-]+$/)
    .transform((value) => value.toUpperCase()),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).optional(),
  priceCents: z.number().int().min(0).max(10000000),
  currency: z
    .string()
    .trim()
    .length(3)
    .default('AUD')
    .transform((value) => value.toUpperCase()),
  interval: z.enum(['MONTH', 'YEAR']),
  features: z.array(z.string().trim().min(1).max(160)).max(30).default([]),
  limits: planLimitSchema.default({}),
  stripePriceId: z.string().trim().max(120).optional(),
  sortOrder: z.number().int().min(0).max(10000).default(0),
  active: z.boolean().default(true),
});

export const planUpdateSchema = planInputSchema.partial();

export const checkoutSessionSchema = z.object({
  planCode: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .transform((value) => value.toUpperCase()),
  couponCode: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .transform((value) => value.toUpperCase())
    .optional(),
});

export const couponInputSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(2)
      .max(40)
      .regex(/^[A-Za-z0-9_-]+$/)
      .transform((value) => value.toUpperCase()),
    percentOff: z.number().int().min(1).max(100).optional(),
    amountOffCents: z.number().int().min(1).max(1000000).optional(),
    active: z.boolean().default(true),
    maxRedemptions: z.number().int().min(1).max(100000).optional(),
    expiresAt: z.coerce.date().optional(),
  })
  .refine((input) => input.percentOff !== undefined || input.amountOffCents !== undefined, {
    message: 'Coupon needs a percent or amount discount',
    path: ['percentOff'],
  });

export const refundCreateSchema = z.object({
  paymentId: objectIdSchema,
  amountCents: z.number().int().min(1).max(10000000).optional(),
  reason: z.string().trim().min(3).max(500).optional(),
});

export const boostCreateSchema = z.object({
  durationHours: z.number().int().min(1).max(168).default(24),
});

export const profileDraftSchema = z.object({
  personal: z
    .object({
      firstName: z.string().trim().min(1).max(80).optional(),
      lastName: z.string().trim().min(1).max(80).optional(),
      gender: genderSchema.optional(),
      dateOfBirth: z.coerce.date().optional(),
      heightCm: z.number().int().min(90).max(250).optional(),
      weightKg: z.number().int().min(30).max(250).optional(),
      maritalStatus: maritalStatusSchema.optional(),
      numberOfChildren: z.number().int().min(0).max(20).optional(),
      disabilityStatus: z.string().trim().max(120).optional(),
    })
    .optional(),
  religion: z
    .object({
      religion: z.string().trim().max(80).optional(),
      community: z.string().trim().max(80).optional(),
      caste: z.string().trim().max(80).optional(),
      subCaste: z.string().trim().max(80).optional(),
      motherTongue: z.string().trim().max(80).optional(),
      languagesSpoken: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
    })
    .optional(),
  location: z
    .object({
      country: z.string().trim().min(2).max(80).optional(),
      state: z.string().trim().min(2).max(80).optional(),
      city: z.string().trim().min(1).max(80).optional(),
      suburb: z.string().trim().min(1).max(80).optional(),
      citizenshipStatus: z.string().trim().max(80).optional(),
      visaStatus: z.string().trim().max(80).optional(),
    })
    .optional(),
  education: z
    .object({
      highestQualification: z.string().trim().max(120).optional(),
      institutionName: z.string().trim().max(160).optional(),
      graduationYear: z.number().int().min(1900).max(2100).optional(),
      additionalCertifications: z.array(z.string().trim().min(1).max(120)).max(20).optional(),
    })
    .optional(),
  employment: z
    .object({
      occupation: z.string().trim().max(120).optional(),
      industry: z.string().trim().max(120).optional(),
      employmentStatus: z.string().trim().max(80).optional(),
      employerName: z.string().trim().max(160).optional(),
      annualIncome: z.number().min(0).max(10000000).optional(),
      annualIncomeVisibility: z.enum(INCOME_VISIBILITY_VALUES).optional(),
    })
    .optional(),
  family: z
    .object({
      fatherDetails: z.string().trim().max(500).optional(),
      motherDetails: z.string().trim().max(500).optional(),
      siblingDetails: z.string().trim().max(500).optional(),
      familyValues: z.string().trim().max(120).optional(),
      familyType: z.string().trim().max(120).optional(),
    })
    .optional(),
  lifestyle: z
    .object({
      smokingHabits: z.string().trim().max(80).optional(),
      drinkingHabits: z.string().trim().max(80).optional(),
      dietaryPreferences: z.string().trim().max(80).optional(),
      fitnessInterests: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
      religiousPractices: z.string().trim().max(200).optional(),
    })
    .optional(),
  about: z
    .object({
      aboutMe: z.string().trim().min(20).max(5000).optional(),
      hobbies: z.array(z.string().trim().min(1).max(80)).max(30).optional(),
      interests: z.array(z.string().trim().min(1).max(80)).max(30).optional(),
      personalGoals: z.string().trim().max(2000).optional(),
      partnerExpectations: z.string().trim().max(5000).optional(),
    })
    .optional(),
  partnerPreference: z
    .object({
      ageMin: z.number().int().min(18).max(120).optional(),
      ageMax: z.number().int().min(18).max(120).optional(),
      heightMinCm: z.number().int().min(90).max(250).optional(),
      heightMaxCm: z.number().int().min(90).max(250).optional(),
      religions: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
      communities: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
      castes: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
      motherTongues: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
      countries: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
      states: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
      cities: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
      educationLevels: z.array(z.string().trim().min(1).max(120)).max(20).optional(),
      occupations: z.array(z.string().trim().min(1).max(120)).max(20).optional(),
      incomeMin: z.number().min(0).max(10000000).optional(),
      incomeMax: z.number().min(0).max(10000000).optional(),
      maritalStatuses: z.array(maritalStatusSchema).max(10).optional(),
    })
    .optional(),
  visibility: z
    .object({
      status: profileVisibilitySchema.optional(),
      showPhoto: z.boolean().optional(),
      showIncome: z.boolean().optional(),
      showEmployer: z.boolean().optional(),
      showLastName: z.boolean().optional(),
    })
    .optional(),
});

export const profileSubmitSchema = z.object({
  confirm: z.literal(true),
});

export const notificationPreferencesSchema = z.object({
  emailNotifications: z.boolean().default(true),
  smsNotifications: z.boolean().default(false),
  marketingNotifications: z.boolean().default(false),
});

export const accountSettingsSchema = z.object({
  marketingConsent: z.boolean().optional(),
});

export type RegisterEmailInput = z.infer<typeof registerEmailSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type CmsPageInput = z.infer<typeof cmsPageInputSchema>;
export type CmsContentInput = z.infer<typeof cmsContentInputSchema>;
export type CmsSuccessStoryInput = z.infer<typeof cmsSuccessStoryInputSchema>;
export type CmsTestimonialInput = z.infer<typeof cmsTestimonialInputSchema>;
export type CmsBannerInput = z.infer<typeof cmsBannerInputSchema>;
export type CmsHomeContentInput = z.infer<typeof cmsHomeContentSchema>;
export type ContactInquiryInput = z.infer<typeof contactInquirySchema>;
export type MediaSignUploadInput = z.infer<typeof mediaSignUploadSchema>;
export type MediaCompleteUploadInput = z.infer<typeof mediaCompleteUploadSchema>;
export type MediaUpdateInput = z.infer<typeof mediaUpdateSchema>;
export type MediaReviewInput = z.infer<typeof mediaReviewSchema>;
export type ProfileSearchQueryInput = z.infer<typeof profileSearchQuerySchema>;
export type RecommendedMatchesQueryInput = z.infer<typeof recommendedMatchesQuerySchema>;
export type ProfileTargetInput = z.infer<typeof profileTargetSchema>;
export type InterestRespondInput = z.infer<typeof interestRespondSchema>;
export type InterestListQueryInput = z.infer<typeof interestListQuerySchema>;
export type ReportCreateInput = z.infer<typeof reportCreateSchema>;
export type ReportAdminReviewInput = z.infer<typeof reportAdminReviewSchema>;
export type AdminUserQueryInput = z.infer<typeof adminUserQuerySchema>;
export type AdminUserUpdateInput = z.infer<typeof adminUserUpdateSchema>;
export type AdminUserStatusUpdateInput = z.infer<typeof adminUserStatusUpdateSchema>;
export type AdminUserRoleUpdateInput = z.infer<typeof adminUserRoleUpdateSchema>;
export type AdminUserNoteInput = z.infer<typeof adminUserNoteSchema>;
export type ProfileModerationQueryInput = z.infer<typeof profileModerationQuerySchema>;
export type ProfileModerationReviewInput = z.infer<typeof profileModerationReviewSchema>;
export type VerificationRequestCreateInput = z.infer<typeof verificationRequestCreateSchema>;
export type VerificationReviewInput = z.infer<typeof verificationReviewSchema>;
export type NotificationListQueryInput = z.infer<typeof notificationListQuerySchema>;
export type MobileOtpRequestInput = z.infer<typeof mobileOtpRequestSchema>;
export type MobileOtpVerifyInput = z.infer<typeof mobileOtpVerifySchema>;
export type PushSubscriptionInput = z.infer<typeof pushSubscriptionSchema>;
export type AuditLogQueryInput = z.infer<typeof auditLogQuerySchema>;
export type MessageAttachmentInput = z.infer<typeof messageAttachmentSchema>;
export type MessageCreateInput = z.infer<typeof messageCreateSchema>;
export type TypingEventInput = z.infer<typeof typingEventSchema>;
export type ConversationCreateInput = z.infer<typeof conversationCreateSchema>;
export type CommunityRoomInput = z.infer<typeof communityRoomInputSchema>;
export type CommunityRoomUpdateInput = z.infer<typeof communityRoomUpdateSchema>;
export type CommunityPostsQueryInput = z.infer<typeof communityPostsQuerySchema>;
export type CommunityPostCreateInput = z.infer<typeof communityPostCreateSchema>;
export type CommunityPostUpdateInput = z.infer<typeof communityPostUpdateSchema>;
export type CommunityCommentCreateInput = z.infer<typeof communityCommentCreateSchema>;
export type CommunityReactionInput = z.infer<typeof communityReactionSchema>;
export type CommunityPostStatusUpdateInput = z.infer<typeof communityPostStatusUpdateSchema>;
export type PlanInput = z.infer<typeof planInputSchema>;
export type PlanUpdateInput = z.infer<typeof planUpdateSchema>;
export type CheckoutSessionInput = z.infer<typeof checkoutSessionSchema>;
export type CouponInput = z.infer<typeof couponInputSchema>;
export type RefundCreateInput = z.infer<typeof refundCreateSchema>;
export type BoostCreateInput = z.infer<typeof boostCreateSchema>;
export type ProfileDraftInput = z.infer<typeof profileDraftSchema>;
export type ProfileSubmitInput = z.infer<typeof profileSubmitSchema>;
export type NotificationPreferencesInput = z.infer<typeof notificationPreferencesSchema>;
export type AccountSettingsInput = z.infer<typeof accountSettingsSchema>;
