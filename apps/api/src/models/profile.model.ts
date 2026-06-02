import {
  Gender,
  INCOME_VISIBILITY_VALUES,
  MaritalStatus,
  ProfileVisibility,
  VerificationLevel,
  type Gender as GenderType,
  type MaritalStatus as MaritalStatusType,
  type ProfileVisibility as ProfileVisibilityType,
  type VerificationLevel as VerificationLevelType,
} from '@vivah/shared';
import { Schema, type HydratedDocument, type Types } from 'mongoose';
import { auditedSchemaFields, getOrCreateModel, timestampedSchemaOptions } from './common.js';

export const ProfileApprovalStatus = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  NEEDS_CHANGES: 'NEEDS_CHANGES',
} as const;

export type ProfileApprovalStatus =
  (typeof ProfileApprovalStatus)[keyof typeof ProfileApprovalStatus];
export type IncomeVisibility = (typeof INCOME_VISIBILITY_VALUES)[number];

export interface Profile {
  userId: Types.ObjectId;
  displayId: string;
  slug?: string;
  completionPercentage: number;
  personal: {
    firstName?: string;
    lastName?: string;
    gender?: GenderType;
    dateOfBirth?: Date;
    age?: number;
    heightCm?: number;
    weightKg?: number;
    maritalStatus: MaritalStatusType;
    numberOfChildren?: number;
    disabilityStatus?: string;
  };
  religion: {
    religion?: string;
    community?: string;
    caste?: string;
    subCaste?: string;
    motherTongue?: string;
    languagesSpoken: string[];
  };
  location: {
    country?: string;
    state?: string;
    city?: string;
    suburb?: string;
    citizenshipStatus?: string;
    visaStatus?: string;
  };
  education: {
    highestQualification?: string;
    institutionName?: string;
    graduationYear?: number;
    additionalCertifications?: string[];
  };
  employment: {
    occupation?: string;
    industry?: string;
    employmentStatus?: string;
    employerName?: string;
    annualIncome?: number;
    annualIncomeVisibility: IncomeVisibility;
  };
  family: {
    fatherDetails?: string;
    motherDetails?: string;
    siblingDetails?: string;
    familyValues?: string;
    familyType?: string;
  };
  lifestyle: {
    smokingHabits?: string;
    drinkingHabits?: string;
    dietaryPreferences?: string;
    fitnessInterests?: string[];
    religiousPractices?: string;
  };
  about: {
    aboutMe?: string;
    hobbies?: string[];
    interests?: string[];
    personalGoals?: string;
    partnerExpectations?: string;
  };
  partnerPreference: {
    ageMin?: number;
    ageMax?: number;
    heightMinCm?: number;
    heightMaxCm?: number;
    religions?: string[];
    communities?: string[];
    castes?: string[];
    motherTongues?: string[];
    countries?: string[];
    states?: string[];
    cities?: string[];
    educationLevels?: string[];
    occupations?: string[];
    incomeMin?: number;
    incomeMax?: number;
    maritalStatuses?: MaritalStatusType[];
  };
  verification: {
    level: VerificationLevelType;
    emailVerified: boolean;
    mobileVerified: boolean;
    identityVerified: boolean;
    addressVerified: boolean;
    employmentVerified: boolean;
    visaVerified: boolean;
    policeClearanceVerified: boolean;
    facialVerified: boolean;
  };
  visibility: {
    status: ProfileVisibilityType;
    showPhoto: boolean;
    showIncome: boolean;
    showEmployer: boolean;
    showLastName: boolean;
  };
  stats: {
    profileViews: number;
    interestsReceived: number;
    interestsSent: number;
    favouritesCount: number;
    lastActiveAt?: Date;
    activeBoostEndsAt?: Date;
  };
  moderation: {
    approvalStatus: ProfileApprovalStatus;
    reviewedBy?: Types.ObjectId;
    reviewedAt?: Date;
    rejectionReason?: string;
    internalNote?: string;
    lastReviewSnapshot?: {
      previous?: unknown;
      current?: unknown;
    };
  };
  createdAt: Date;
  updatedAt: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
}

export type ProfileDocument = HydratedDocument<Profile>;

const profileSchema = new Schema<Profile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    displayId: { type: String, required: true, trim: true },
    slug: { type: String, trim: true, lowercase: true },
    completionPercentage: { type: Number, default: 0, min: 0, max: 100, required: true },
    personal: {
      firstName: { type: String, trim: true },
      lastName: { type: String, trim: true },
      gender: { type: String, enum: Object.values(Gender) },
      dateOfBirth: { type: Date },
      age: { type: Number, min: 18, max: 120 },
      heightCm: { type: Number, min: 90, max: 250 },
      weightKg: { type: Number, min: 30, max: 250 },
      maritalStatus: { type: String, enum: Object.values(MaritalStatus) },
      numberOfChildren: { type: Number, min: 0 },
      disabilityStatus: { type: String, trim: true },
    },
    religion: {
      religion: { type: String, trim: true },
      community: { type: String, trim: true },
      caste: { type: String, trim: true },
      subCaste: { type: String, trim: true },
      motherTongue: { type: String, trim: true },
      languagesSpoken: { type: [String], default: [] },
    },
    location: {
      country: { type: String, trim: true },
      state: { type: String, trim: true },
      city: { type: String, trim: true },
      suburb: { type: String, trim: true },
      citizenshipStatus: { type: String, trim: true },
      visaStatus: { type: String, trim: true },
    },
    education: {
      highestQualification: { type: String, trim: true },
      institutionName: { type: String, trim: true },
      graduationYear: { type: Number, min: 1900 },
      additionalCertifications: { type: [String], default: [] },
    },
    employment: {
      occupation: { type: String, trim: true },
      industry: { type: String, trim: true },
      employmentStatus: { type: String, trim: true },
      employerName: { type: String, trim: true },
      annualIncome: { type: Number, min: 0 },
      annualIncomeVisibility: {
        type: String,
        enum: INCOME_VISIBILITY_VALUES,
        default: 'PRIVATE',
        required: true,
      },
    },
    family: {
      fatherDetails: { type: String, trim: true },
      motherDetails: { type: String, trim: true },
      siblingDetails: { type: String, trim: true },
      familyValues: { type: String, trim: true },
      familyType: { type: String, trim: true },
    },
    lifestyle: {
      smokingHabits: { type: String, trim: true },
      drinkingHabits: { type: String, trim: true },
      dietaryPreferences: { type: String, trim: true },
      fitnessInterests: { type: [String], default: [] },
      religiousPractices: { type: String, trim: true },
    },
    about: {
      aboutMe: { type: String, trim: true, maxlength: 5000 },
      hobbies: { type: [String], default: [] },
      interests: { type: [String], default: [] },
      personalGoals: { type: String, trim: true, maxlength: 2000 },
      partnerExpectations: { type: String, trim: true, maxlength: 5000 },
    },
    partnerPreference: {
      ageMin: { type: Number, min: 18 },
      ageMax: { type: Number, max: 120 },
      heightMinCm: { type: Number, min: 90 },
      heightMaxCm: { type: Number, max: 250 },
      religions: { type: [String], default: [] },
      communities: { type: [String], default: [] },
      castes: { type: [String], default: [] },
      motherTongues: { type: [String], default: [] },
      countries: { type: [String], default: [] },
      states: { type: [String], default: [] },
      cities: { type: [String], default: [] },
      educationLevels: { type: [String], default: [] },
      occupations: { type: [String], default: [] },
      incomeMin: { type: Number, min: 0 },
      incomeMax: { type: Number, min: 0 },
      maritalStatuses: { type: [String], enum: Object.values(MaritalStatus), default: [] },
    },
    verification: {
      level: {
        type: String,
        enum: Object.values(VerificationLevel),
        default: VerificationLevel.NONE,
        required: true,
      },
      emailVerified: { type: Boolean, default: false },
      mobileVerified: { type: Boolean, default: false },
      identityVerified: { type: Boolean, default: false },
      addressVerified: { type: Boolean, default: false },
      employmentVerified: { type: Boolean, default: false },
      visaVerified: { type: Boolean, default: false },
      policeClearanceVerified: { type: Boolean, default: false },
      facialVerified: { type: Boolean, default: false },
    },
    visibility: {
      status: {
        type: String,
        enum: Object.values(ProfileVisibility),
        default: ProfileVisibility.MEMBERS_ONLY,
        required: true,
      },
      showPhoto: { type: Boolean, default: true },
      showIncome: { type: Boolean, default: false },
      showEmployer: { type: Boolean, default: false },
      showLastName: { type: Boolean, default: false },
    },
    stats: {
      profileViews: { type: Number, default: 0, min: 0 },
      interestsReceived: { type: Number, default: 0, min: 0 },
      interestsSent: { type: Number, default: 0, min: 0 },
      favouritesCount: { type: Number, default: 0, min: 0 },
      lastActiveAt: { type: Date },
      activeBoostEndsAt: { type: Date },
    },
    moderation: {
      approvalStatus: {
        type: String,
        enum: Object.values(ProfileApprovalStatus),
        default: ProfileApprovalStatus.PENDING,
        required: true,
      },
      reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      reviewedAt: { type: Date },
      rejectionReason: { type: String, trim: true },
      internalNote: { type: String, trim: true },
      lastReviewSnapshot: {
        previous: { type: Schema.Types.Mixed },
        current: { type: Schema.Types.Mixed },
      },
    },
    ...auditedSchemaFields,
  },
  timestampedSchemaOptions,
);

profileSchema.index({ userId: 1 }, { unique: true });
profileSchema.index({ displayId: 1 }, { unique: true });
profileSchema.index({ slug: 1 }, { unique: true, sparse: true });
profileSchema.index({ 'personal.gender': 1 });
profileSchema.index({ 'personal.dateOfBirth': 1 });
profileSchema.index({ 'religion.religion': 1 });
profileSchema.index({ 'religion.community': 1 });
profileSchema.index({ 'religion.caste': 1 });
profileSchema.index({ 'religion.motherTongue': 1 });
profileSchema.index({ 'location.country': 1 });
profileSchema.index({ 'location.state': 1 });
profileSchema.index({ 'location.city': 1 });
profileSchema.index({ 'location.suburb': 1 });
profileSchema.index({ 'employment.occupation': 1 });
profileSchema.index({ 'education.highestQualification': 1 });
profileSchema.index({ 'verification.level': 1 });
profileSchema.index({ 'visibility.status': 1 });
profileSchema.index({
  'moderation.approvalStatus': 1,
  'visibility.status': 1,
  'personal.gender': 1,
  'personal.dateOfBirth': 1,
  'location.country': 1,
  'location.state': 1,
  'location.city': 1,
  'religion.religion': 1,
  'religion.community': 1,
  'religion.caste': 1,
  'religion.motherTongue': 1,
  'employment.occupation': 1,
  'education.highestQualification': 1,
});

export const ProfileModel = getOrCreateModel<Profile>('Profile', profileSchema);
export { profileSchema };
