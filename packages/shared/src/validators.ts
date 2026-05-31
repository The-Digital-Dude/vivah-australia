import { z } from 'zod';
import {
  AccountStatus,
  Gender,
  INCOME_VISIBILITY_VALUES,
  InterestStatus,
  MaritalStatus,
  MediaCategory,
  MediaUploadStatus,
  MediaVisibility,
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
export type ProfileDraftInput = z.infer<typeof profileDraftSchema>;
export type ProfileSubmitInput = z.infer<typeof profileSubmitSchema>;
export type NotificationPreferencesInput = z.infer<typeof notificationPreferencesSchema>;
export type AccountSettingsInput = z.infer<typeof accountSettingsSchema>;
