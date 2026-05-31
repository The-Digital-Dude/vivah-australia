import { z } from 'zod';
import {
  AccountStatus,
  Gender,
  INCOME_VISIBILITY_VALUES,
  MaritalStatus,
  ProfileVisibility,
  UserRole,
  VerificationLevel,
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
export type ProfileDraftInput = z.infer<typeof profileDraftSchema>;
export type ProfileSubmitInput = z.infer<typeof profileSubmitSchema>;
export type NotificationPreferencesInput = z.infer<typeof notificationPreferencesSchema>;
export type AccountSettingsInput = z.infer<typeof accountSettingsSchema>;
