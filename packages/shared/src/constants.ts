export const UserRole = {
  USER: 'USER',
  PREMIUM_USER: 'PREMIUM_USER',
  MODERATOR: 'MODERATOR',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const AccountStatus = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  BANNED: 'BANNED',
  DELETED: 'DELETED',
} as const;

export type AccountStatus = (typeof AccountStatus)[keyof typeof AccountStatus];

export const Gender = {
  FEMALE: 'FEMALE',
  MALE: 'MALE',
  NON_BINARY: 'NON_BINARY',
  PREFER_NOT_TO_SAY: 'PREFER_NOT_TO_SAY',
} as const;

export type Gender = (typeof Gender)[keyof typeof Gender];

export const MaritalStatus = {
  NEVER_MARRIED: 'NEVER_MARRIED',
  DIVORCED: 'DIVORCED',
  WIDOWED: 'WIDOWED',
  SEPARATED: 'SEPARATED',
  ANNULLED: 'ANNULLED',
} as const;

export type MaritalStatus = (typeof MaritalStatus)[keyof typeof MaritalStatus];

export const VerificationStatus = {
  NOT_SUBMITTED: 'NOT_SUBMITTED',
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  NEEDS_RESUBMISSION: 'NEEDS_RESUBMISSION',
} as const;

export type VerificationStatus = (typeof VerificationStatus)[keyof typeof VerificationStatus];

export const VerificationLevel = {
  NONE: 'NONE',
  BASIC: 'BASIC',
  SILVER: 'SILVER',
  GOLD: 'GOLD',
  PLATINUM: 'PLATINUM',
  FULLY_VERIFIED: 'FULLY_VERIFIED',
} as const;

export type VerificationLevel = (typeof VerificationLevel)[keyof typeof VerificationLevel];

export const ProfileVisibility = {
  PUBLIC: 'PUBLIC',
  MEMBERS_ONLY: 'MEMBERS_ONLY',
  MATCHES_ONLY: 'MATCHES_ONLY',
  HIDDEN: 'HIDDEN',
} as const;

export type ProfileVisibility = (typeof ProfileVisibility)[keyof typeof ProfileVisibility];

export const MediaVisibility = {
  PUBLIC: 'PUBLIC',
  PRIVATE: 'PRIVATE',
  MATCHES_ONLY: 'MATCHES_ONLY',
} as const;

export type MediaVisibility = (typeof MediaVisibility)[keyof typeof MediaVisibility];

export const MediaCategory = {
  PROFILE_PHOTO: 'PROFILE_PHOTO',
  PUBLIC_GALLERY: 'PUBLIC_GALLERY',
  PRIVATE_GALLERY: 'PRIVATE_GALLERY',
} as const;

export type MediaCategory = (typeof MediaCategory)[keyof typeof MediaCategory];

export const MediaUploadStatus = {
  SIGNED: 'SIGNED',
  UPLOADED: 'UPLOADED',
  FAILED: 'FAILED',
} as const;

export type MediaUploadStatus = (typeof MediaUploadStatus)[keyof typeof MediaUploadStatus];

export const InterestStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  WITHDRAWN: 'WITHDRAWN',
} as const;

export type InterestStatus = (typeof InterestStatus)[keyof typeof InterestStatus];

export const SubscriptionStatus = {
  TRIALING: 'TRIALING',
  ACTIVE: 'ACTIVE',
  PAST_DUE: 'PAST_DUE',
  CANCELED: 'CANCELED',
  EXPIRED: 'EXPIRED',
} as const;

export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

export const PaymentStatus = {
  PENDING: 'PENDING',
  SUCCEEDED: 'SUCCEEDED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
  PARTIALLY_REFUNDED: 'PARTIALLY_REFUNDED',
} as const;

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const ReportStatus = {
  OPEN: 'OPEN',
  ASSIGNED: 'ASSIGNED',
  RESOLVED: 'RESOLVED',
  DISMISSED: 'DISMISSED',
} as const;

export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus];

export const CommunityPostStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  HIDDEN: 'HIDDEN',
  REMOVED: 'REMOVED',
} as const;

export type CommunityPostStatus = (typeof CommunityPostStatus)[keyof typeof CommunityPostStatus];

export const INCOME_VISIBILITY_VALUES = ['PUBLIC', 'MATCHES_ONLY', 'PRIVATE'] as const;
