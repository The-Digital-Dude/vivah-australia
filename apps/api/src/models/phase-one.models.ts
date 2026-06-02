import {
  CommunityPostStatus,
  InterestStatus,
  InvoiceStatus,
  MediaCategory,
  MediaUploadStatus,
  MediaVisibility,
  PaymentStatus,
  RefundStatus,
  ReportStatus,
  SubscriptionStatus,
  VerificationStatus,
  type CommunityPostStatus as CommunityPostStatusType,
  type InterestStatus as InterestStatusType,
  type MediaCategory as MediaCategoryType,
  type MediaUploadStatus as MediaUploadStatusType,
  type MediaVisibility as MediaVisibilityType,
  type PaymentStatus as PaymentStatusType,
  type RefundStatus as RefundStatusType,
  type ReportStatus as ReportStatusType,
  type SubscriptionStatus as SubscriptionStatusType,
  type VerificationStatus as VerificationStatusType,
} from '@vivah/shared';
import { Schema, type HydratedDocument, type Types } from 'mongoose';
import { auditedSchemaFields, getOrCreateModel, timestampedSchemaOptions } from './common.js';

type ObjectId = Types.ObjectId;

export interface ProfileMedia {
  userId: ObjectId;
  profileId: ObjectId;
  assetUrl: string;
  storageKey?: string;
  mediaType: 'PHOTO' | 'VIDEO';
  category: MediaCategoryType;
  uploadStatus: MediaUploadStatusType;
  mimeType: string;
  fileSizeBytes: number;
  originalFilename: string;
  width?: number;
  height?: number;
  visibility: MediaVisibilityType;
  approvalStatus: VerificationStatusType;
  moderationReason?: string;
  reviewedBy?: ObjectId;
  reviewedAt?: Date;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: ObjectId;
}

const profileMediaSchema = new Schema<ProfileMedia>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    profileId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true, index: true },
    assetUrl: { type: String, required: true },
    storageKey: { type: String },
    mediaType: { type: String, enum: ['PHOTO', 'VIDEO'], default: 'PHOTO', required: true },
    category: {
      type: String,
      enum: Object.values(MediaCategory),
      default: MediaCategory.PUBLIC_GALLERY,
      required: true,
      index: true,
    },
    uploadStatus: {
      type: String,
      enum: Object.values(MediaUploadStatus),
      default: MediaUploadStatus.SIGNED,
      required: true,
      index: true,
    },
    mimeType: { type: String, required: true, trim: true },
    fileSizeBytes: { type: Number, required: true, min: 1 },
    originalFilename: { type: String, required: true, trim: true },
    width: { type: Number, min: 1 },
    height: { type: Number, min: 1 },
    visibility: {
      type: String,
      enum: Object.values(MediaVisibility),
      default: MediaVisibility.PUBLIC,
      required: true,
    },
    approvalStatus: {
      type: String,
      enum: Object.values(VerificationStatus),
      default: VerificationStatus.PENDING,
      required: true,
      index: true,
    },
    moderationReason: { type: String, trim: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    isPrimary: { type: Boolean, default: false },
    ...auditedSchemaFields,
  },
  { ...timestampedSchemaOptions, collection: 'profile_media' },
);

profileMediaSchema.index({ profileId: 1, category: 1, approvalStatus: 1 });
profileMediaSchema.index({ userId: 1, uploadStatus: 1, createdAt: -1 });

export interface VerificationRequest {
  userId: ObjectId;
  profileId?: ObjectId;
  type: string;
  status: VerificationStatusType;
  documentUrls: string[];
  submittedAt: Date;
  reviewReason?: string;
  adminNote?: string;
  reviewedBy?: ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: ObjectId;
}

const verificationRequestSchema = new Schema<VerificationRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    profileId: { type: Schema.Types.ObjectId, ref: 'Profile' },
    type: { type: String, required: true, trim: true, index: true },
    status: {
      type: String,
      enum: Object.values(VerificationStatus),
      default: VerificationStatus.PENDING,
      required: true,
      index: true,
    },
    documentUrls: { type: [String], default: [] },
    submittedAt: { type: Date, default: Date.now, required: true },
    reviewReason: { type: String, trim: true },
    adminNote: { type: String, trim: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    ...auditedSchemaFields,
  },
  { ...timestampedSchemaOptions, collection: 'verification_requests' },
);

export interface VerificationDocument {
  requestId: ObjectId;
  userId: ObjectId;
  documentType: string;
  storageKey: string;
  encrypted: boolean;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: ObjectId;
}

const verificationDocumentSchema = new Schema<VerificationDocument>(
  {
    requestId: {
      type: Schema.Types.ObjectId,
      ref: 'VerificationRequest',
      required: true,
      index: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    documentType: { type: String, required: true, trim: true },
    storageKey: { type: String, required: true },
    encrypted: { type: Boolean, default: true },
    ...auditedSchemaFields,
  },
  { ...timestampedSchemaOptions, collection: 'verification_documents' },
);

verificationRequestSchema.index({ status: 1, createdAt: -1 });

export interface Interest {
  senderId: ObjectId;
  receiverId: ObjectId;
  status: InterestStatusType;
  respondedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

const interestSchema = new Schema<Interest>(
  {
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: Object.values(InterestStatus),
      default: InterestStatus.PENDING,
      required: true,
      index: true,
    },
    respondedAt: { type: Date },
    ...auditedSchemaFields,
  },
  { ...timestampedSchemaOptions, collection: 'interests' },
);

interestSchema.index({ senderId: 1, receiverId: 1 }, { unique: true });

export interface UserPair {
  userId?: ObjectId;
  profileId?: ObjectId;
  blockerId?: ObjectId;
  blockedId?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: ObjectId;
}

const favouriteSchema = new Schema<UserPair>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    profileId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
    ...auditedSchemaFields,
  },
  { ...timestampedSchemaOptions, collection: 'favourites' },
);

favouriteSchema.index({ userId: 1, profileId: 1 }, { unique: true });

const blockSchema = new Schema<UserPair>(
  {
    blockerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    blockedId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    ...auditedSchemaFields,
  },
  { ...timestampedSchemaOptions, collection: 'blocks' },
);

blockSchema.index({ blockerId: 1, blockedId: 1 }, { unique: true });

export interface Report {
  reporterId: ObjectId;
  reportedUserId?: ObjectId;
  targetType: string;
  targetId?: ObjectId;
  reason: string;
  status: ReportStatusType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assignedTo?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

export interface ProfileView {
  viewerId: ObjectId;
  profileId: ObjectId;
  profileUserId: ObjectId;
  viewedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

const profileViewSchema = new Schema<ProfileView>(
  {
    viewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    profileId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true, index: true },
    profileUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    viewedAt: { type: Date, default: Date.now, index: true },
    ...auditedSchemaFields,
  },
  { ...timestampedSchemaOptions, collection: 'profile_views' },
);

profileViewSchema.index({ viewerId: 1, profileId: 1 }, { unique: true });

export interface SavedSearch {
  userId: ObjectId;
  name: string;
  query: unknown;
  notifyOnNewMatches: boolean;
  lastRunAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: ObjectId;
}

const savedSearchSchema = new Schema<SavedSearch>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    query: { type: Schema.Types.Mixed, required: true },
    notifyOnNewMatches: { type: Boolean, default: false, index: true },
    lastRunAt: { type: Date },
    ...auditedSchemaFields,
  },
  { ...timestampedSchemaOptions, collection: 'saved_searches' },
);

savedSearchSchema.index({ userId: 1, name: 1 }, { unique: true });

const reportSchema = new Schema<Report>(
  {
    reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reportedUserId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    targetType: { type: String, required: true, trim: true, index: true },
    targetId: { type: Schema.Types.ObjectId },
    reason: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: Object.values(ReportStatus),
      default: ReportStatus.OPEN,
      required: true,
      index: true,
    },
    severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'LOW' },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    ...auditedSchemaFields,
  },
  { ...timestampedSchemaOptions, collection: 'reports' },
);

export interface Conversation {
  participantIds: ObjectId[];
  lastMessageAt?: Date;
  deletedFor: ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

const conversationSchema = new Schema<Conversation>(
  {
    participantIds: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    lastMessageAt: { type: Date, index: true },
    deletedFor: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    ...auditedSchemaFields,
  },
  { ...timestampedSchemaOptions, collection: 'conversations' },
);

conversationSchema.index({ participantIds: 1 });

export interface MobileOtp {
  userId: ObjectId;
  mobile: string;
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  usedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

const mobileOtpSchema = new Schema<MobileOtp>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    mobile: { type: String, required: true, trim: true, index: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    attempts: { type: Number, default: 0, min: 0 },
    usedAt: { type: Date },
    ...auditedSchemaFields,
  },
  { ...timestampedSchemaOptions, collection: 'mobile_otps' },
);

export interface PushSubscription {
  userId: ObjectId;
  endpoint: string;
  keys?: { p256dh?: string; auth?: string };
  userAgent?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

const pushSubscriptionSchema = new Schema<PushSubscription>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    endpoint: { type: String, required: true, trim: true, index: true },
    keys: { p256dh: { type: String, trim: true }, auth: { type: String, trim: true } },
    userAgent: { type: String, trim: true },
    active: { type: Boolean, default: true, index: true },
    ...auditedSchemaFields,
  },
  { ...timestampedSchemaOptions, collection: 'push_subscriptions' },
);

pushSubscriptionSchema.index({ userId: 1, endpoint: 1 }, { unique: true });

export interface FraudEvent {
  userId?: ObjectId;
  rule: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'REVIEWED' | 'DISMISSED';
  score: number;
  metadata?: unknown;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

const fraudEventSchema = new Schema<FraudEvent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    rule: { type: String, required: true, trim: true, index: true },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'LOW',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['OPEN', 'REVIEWED', 'DISMISSED'],
      default: 'OPEN',
      required: true,
      index: true,
    },
    score: { type: Number, default: 0, min: 0 },
    metadata: { type: Schema.Types.Mixed },
    ...auditedSchemaFields,
  },
  { ...timestampedSchemaOptions, collection: 'fraud_events' },
);

export interface MessageAttachment {
  uploadedBy: ObjectId;
  attachmentType: 'IMAGE' | 'DOCUMENT';
  assetUrl: string;
  storageKey?: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: ObjectId;
}

const messageAttachmentSchema = new Schema<MessageAttachment>(
  {
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    attachmentType: { type: String, enum: ['IMAGE', 'DOCUMENT'], required: true, index: true },
    assetUrl: { type: String, required: true, trim: true },
    storageKey: { type: String, trim: true },
    fileName: { type: String, required: true, trim: true },
    mimeType: { type: String, required: true, trim: true },
    fileSizeBytes: { type: Number, required: true, min: 1 },
    ...auditedSchemaFields,
  },
  { ...timestampedSchemaOptions, collection: 'message_attachments' },
);

export interface Message {
  conversationId: ObjectId;
  senderId: ObjectId;
  body?: string;
  attachmentIds?: ObjectId[];
  readBy: ObjectId[];
  deletedFor: ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

const messageSchema = new Schema<Message>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    body: { type: String, trim: true, maxlength: 10000 },
    attachmentIds: [{ type: Schema.Types.ObjectId, ref: 'MessageAttachment' }],
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    deletedFor: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    ...auditedSchemaFields,
  },
  { ...timestampedSchemaOptions, collection: 'messages' },
);

messageSchema.index({ conversationId: 1, createdAt: 1 });

export interface CommunityRoom {
  slug: string;
  name: string;
  description?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: ObjectId;
}

const communityRoomSchema = new Schema<CommunityRoom>(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    isDefault: { type: Boolean, default: false },
    ...auditedSchemaFields,
  },
  { ...timestampedSchemaOptions, collection: 'community_rooms' },
);

export interface CommunityPost {
  roomId: ObjectId;
  authorId: ObjectId;
  title?: string;
  body: string;
  status: CommunityPostStatusType;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: ObjectId;
}

const communityPostSchema = new Schema<CommunityPost>(
  {
    roomId: { type: Schema.Types.ObjectId, ref: 'CommunityRoom', required: true, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, trim: true },
    body: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: Object.values(CommunityPostStatus),
      default: CommunityPostStatus.PUBLISHED,
      required: true,
      index: true,
    },
    ...auditedSchemaFields,
  },
  { ...timestampedSchemaOptions, collection: 'community_posts' },
);

export interface CommunityComment {
  postId: ObjectId;
  authorId: ObjectId;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

const communityCommentSchema = new Schema<CommunityComment>(
  {
    postId: { type: Schema.Types.ObjectId, ref: 'CommunityPost', required: true, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    body: { type: String, required: true, trim: true },
    ...auditedSchemaFields,
  },
  { ...timestampedSchemaOptions, collection: 'community_comments' },
);

export interface CommunityReaction {
  targetType: 'POST' | 'COMMENT';
  targetId: ObjectId;
  userId: ObjectId;
  reaction: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: ObjectId;
}

const communityReactionSchema = new Schema<CommunityReaction>(
  {
    targetType: { type: String, enum: ['POST', 'COMMENT'], required: true },
    targetId: { type: Schema.Types.ObjectId, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reaction: { type: String, required: true, trim: true },
    ...auditedSchemaFields,
  },
  { ...timestampedSchemaOptions, collection: 'community_reactions' },
);

communityReactionSchema.index(
  { targetType: 1, targetId: 1, userId: 1, reaction: 1 },
  { unique: true },
);

export interface Plan {
  code: string;
  name: string;
  description?: string;
  priceCents: number;
  currency: string;
  interval: 'MONTH' | 'YEAR';
  features: string[];
  limits: Record<string, number>;
  stripePriceId?: string;
  sortOrder: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

const planSchema = new Schema<Plan>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    priceCents: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'AUD', uppercase: true, trim: true },
    interval: { type: String, enum: ['MONTH', 'YEAR'], default: 'MONTH', required: true },
    features: { type: [String], default: [] },
    limits: { type: Map, of: Number, default: {} },
    stripePriceId: { type: String, trim: true, index: true },
    sortOrder: { type: Number, default: 0, index: true },
    active: { type: Boolean, default: true, index: true },
    ...auditedSchemaFields,
  },
  { ...timestampedSchemaOptions, collection: 'plans' },
);

export interface Subscription {
  userId: ObjectId;
  planId: ObjectId;
  status: SubscriptionStatusType;
  startsAt: Date;
  endsAt?: Date;
  provider?: string;
  providerSubscriptionId?: string;
  providerCustomerId?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

const subscriptionSchema = new Schema<Subscription>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    planId: { type: Schema.Types.ObjectId, ref: 'Plan', required: true },
    status: {
      type: String,
      enum: Object.values(SubscriptionStatus),
      default: SubscriptionStatus.ACTIVE,
      required: true,
    },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date },
    provider: { type: String, trim: true },
    providerSubscriptionId: { type: String, trim: true },
    providerCustomerId: { type: String, trim: true, index: true },
    currentPeriodStart: { type: Date },
    currentPeriodEnd: { type: Date },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    ...auditedSchemaFields,
  },
  { ...timestampedSchemaOptions, collection: 'subscriptions' },
);

subscriptionSchema.index({ userId: 1, status: 1 });

export interface Payment {
  userId: ObjectId;
  amountCents: number;
  currency: string;
  status: PaymentStatusType;
  provider: string;
  providerPaymentId?: string;
  providerCustomerId?: string;
  providerSubscriptionId?: string;
  planId?: ObjectId;
  couponId?: ObjectId;
  description?: string;
  refundedAmountCents: number;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

const paymentSchema = new Schema<Payment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amountCents: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'AUD', uppercase: true, trim: true },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
      required: true,
      index: true,
    },
    provider: { type: String, required: true, trim: true },
    providerPaymentId: { type: String, trim: true, index: true },
    providerCustomerId: { type: String, trim: true, index: true },
    providerSubscriptionId: { type: String, trim: true, index: true },
    planId: { type: Schema.Types.ObjectId, ref: 'Plan' },
    couponId: { type: Schema.Types.ObjectId, ref: 'Coupon' },
    description: { type: String, trim: true },
    refundedAmountCents: { type: Number, default: 0, min: 0 },
    ...auditedSchemaFields,
  },
  { ...timestampedSchemaOptions, collection: 'payments' },
);

paymentSchema.index({ userId: 1, createdAt: 1 });

export interface UsageCounter {
  userId: ObjectId;
  key: string;
  periodStart: Date;
  periodEnd: Date;
  count: number;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

const usageCounterSchema = new Schema<UsageCounter>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    key: { type: String, required: true, trim: true, index: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    count: { type: Number, default: 0, min: 0 },
    ...auditedSchemaFields,
  },
  { ...timestampedSchemaOptions, collection: 'usage_counters' },
);

usageCounterSchema.index({ userId: 1, key: 1, periodStart: 1 }, { unique: true });

const simpleContentFields = {
  slug: { type: String, trim: true, lowercase: true, index: true },
  title: { type: String, trim: true },
  body: { type: String, trim: true },
  published: { type: Boolean, default: false, index: true },
} as const;

export interface Invoice {
  userId: ObjectId;
  paymentId?: ObjectId;
  invoiceNumber: string;
  providerInvoiceId?: string;
  providerHostedUrl?: string;
  providerPdfUrl?: string;
  status: string;
  totalCents: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

const invoiceSchema = new Schema<Invoice>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
    invoiceNumber: { type: String, required: true, unique: true, trim: true },
    providerInvoiceId: { type: String, trim: true, index: true },
    providerHostedUrl: { type: String, trim: true },
    providerPdfUrl: { type: String, trim: true },
    status: {
      type: String,
      enum: Object.values(InvoiceStatus),
      default: InvoiceStatus.OPEN,
      required: true,
      index: true,
    },
    totalCents: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'AUD' },
    ...auditedSchemaFields,
  },
  { ...timestampedSchemaOptions, collection: 'invoices' },
);

export interface Coupon {
  code: string;
  percentOff?: number;
  amountOffCents?: number;
  stripeCouponId?: string;
  maxRedemptions?: number;
  redemptionCount: number;
  active: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

const couponSchema = new Schema<Coupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    percentOff: { type: Number, min: 0, max: 100 },
    amountOffCents: { type: Number, min: 0 },
    stripeCouponId: { type: String, trim: true, index: true },
    maxRedemptions: { type: Number, min: 1 },
    redemptionCount: { type: Number, default: 0, min: 0 },
    active: { type: Boolean, default: true, index: true },
    expiresAt: { type: Date },
    ...auditedSchemaFields,
  },
  { ...timestampedSchemaOptions, collection: 'coupons' },
);

export interface Refund {
  userId: ObjectId;
  paymentId: ObjectId;
  amountCents: number;
  currency: string;
  status: RefundStatusType;
  provider: string;
  providerRefundId?: string;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

const refundSchema = new Schema<Refund>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment', required: true, index: true },
    amountCents: { type: Number, required: true, min: 1 },
    currency: { type: String, default: 'AUD', uppercase: true, trim: true },
    status: {
      type: String,
      enum: Object.values(RefundStatus),
      default: RefundStatus.PENDING,
      required: true,
      index: true,
    },
    provider: { type: String, required: true, trim: true },
    providerRefundId: { type: String, trim: true, index: true },
    reason: { type: String, trim: true },
    ...auditedSchemaFields,
  },
  { ...timestampedSchemaOptions, collection: 'refunds' },
);

export interface ProfileBoost {
  userId: ObjectId;
  profileId: ObjectId;
  source: 'ENTITLEMENT' | 'PURCHASE' | 'ADMIN';
  startsAt: Date;
  endsAt: Date;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

const profileBoostSchema = new Schema<ProfileBoost>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    profileId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true, index: true },
    source: { type: String, enum: ['ENTITLEMENT', 'PURCHASE', 'ADMIN'], default: 'ENTITLEMENT' },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true, index: true },
    active: { type: Boolean, default: true, index: true },
    ...auditedSchemaFields,
  },
  { ...timestampedSchemaOptions, collection: 'profile_boosts' },
);

export interface Notification {
  userId: ObjectId;
  type: string;
  title: string;
  body?: string;
  data?: unknown;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

const notificationSchema = new Schema<Notification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true, trim: true, index: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, trim: true },
    data: { type: Schema.Types.Mixed },
    readAt: { type: Date },
    ...auditedSchemaFields,
  },
  { ...timestampedSchemaOptions, collection: 'notifications' },
);

export interface AuditLog {
  actorId?: ObjectId;
  actorRole?: string;
  action: string;
  targetType?: string;
  targetId?: ObjectId;
  targetUserId?: ObjectId;
  metadata?: unknown;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const auditLogSchema = new Schema<AuditLog>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    actorRole: { type: String, trim: true, index: true },
    action: { type: String, required: true, trim: true, index: true },
    targetType: { type: String, trim: true },
    targetId: { type: Schema.Types.ObjectId },
    targetUserId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    metadata: { type: Schema.Types.Mixed },
    ipAddress: { type: String, trim: true },
    userAgent: { type: String, trim: true },
  },
  { ...timestampedSchemaOptions, collection: 'audit_logs' },
);

auditLogSchema.index({ actorId: 1, createdAt: 1 });

export interface ActivityLog {
  actorId?: ObjectId;
  event: string;
  metadata?: unknown;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

const activityLogSchema = new Schema<ActivityLog>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    event: { type: String, required: true, trim: true, index: true },
    metadata: { type: Schema.Types.Mixed },
    ...auditedSchemaFields,
  },
  { ...timestampedSchemaOptions, collection: 'activity_logs' },
);

activityLogSchema.index({ actorId: 1, createdAt: 1 });

const cmsPageSchema = new Schema(
  { ...simpleContentFields, seoTitle: String, seoDescription: String, ...auditedSchemaFields },
  { ...timestampedSchemaOptions, collection: 'cms_pages' },
);

const blogPostSchema = new Schema(
  {
    ...simpleContentFields,
    authorId: { type: Schema.Types.ObjectId, ref: 'User' },
    ...auditedSchemaFields,
  },
  { ...timestampedSchemaOptions, collection: 'blog_posts' },
);

const testimonialSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    quote: { type: String, required: true, trim: true },
    published: { type: Boolean, default: false, index: true },
    ...auditedSchemaFields,
  },
  { ...timestampedSchemaOptions, collection: 'testimonials' },
);

const successStorySchema = new Schema(
  { ...simpleContentFields, coupleName: { type: String, trim: true }, ...auditedSchemaFields },
  { ...timestampedSchemaOptions, collection: 'success_stories' },
);

const bannerSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    title: { type: String, trim: true },
    imageUrl: { type: String, trim: true },
    active: { type: Boolean, default: true, index: true },
    ...auditedSchemaFields,
  },
  { ...timestampedSchemaOptions, collection: 'banners' },
);

const systemSettingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    value: { type: Schema.Types.Mixed },
    description: { type: String, trim: true },
    ...auditedSchemaFields,
  },
  { ...timestampedSchemaOptions, collection: 'system_settings' },
);

export interface AdminNote {
  userId: ObjectId;
  authorId: ObjectId;
  note: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

const adminNoteSchema = new Schema<AdminNote>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    note: { type: String, required: true, trim: true },
    ...auditedSchemaFields,
  },
  { ...timestampedSchemaOptions, collection: 'admin_notes' },
);

export interface ContactInquiry {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'NEW' | 'READ' | 'CLOSED';
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

const contactInquirySchema = new Schema<ContactInquiry>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: { type: String, enum: ['NEW', 'READ', 'CLOSED'], default: 'NEW', index: true },
    ...auditedSchemaFields,
  },
  { ...timestampedSchemaOptions, collection: 'contact_inquiries' },
);

export type PlanDocument = HydratedDocument<Plan>;
export type SubscriptionDocument = HydratedDocument<Subscription>;
export type PaymentDocument = HydratedDocument<Payment>;
export type CouponDocument = HydratedDocument<Coupon>;
export type ProfileMediaDocument = HydratedDocument<ProfileMedia>;
export type ConversationDocument = HydratedDocument<Conversation>;
export type MessageDocument = HydratedDocument<Message>;
export type VerificationRequestDocument = HydratedDocument<VerificationRequest>;

export const ProfileMediaModel = getOrCreateModel<ProfileMedia>('ProfileMedia', profileMediaSchema);
export const VerificationRequestModel = getOrCreateModel<VerificationRequest>(
  'VerificationRequest',
  verificationRequestSchema,
);
export const VerificationDocumentModel = getOrCreateModel<VerificationDocument>(
  'VerificationDocument',
  verificationDocumentSchema,
);
export const InterestModel = getOrCreateModel<Interest>('Interest', interestSchema);
export const FavouriteModel = getOrCreateModel<UserPair>('Favourite', favouriteSchema);
export const BlockModel = getOrCreateModel<UserPair>('Block', blockSchema);
export const ReportModel = getOrCreateModel<Report>('Report', reportSchema);
export const ProfileViewModel = getOrCreateModel<ProfileView>('ProfileView', profileViewSchema);
export const SavedSearchModel = getOrCreateModel<SavedSearch>('SavedSearch', savedSearchSchema);
export const ConversationModel = getOrCreateModel<Conversation>('Conversation', conversationSchema);
export const MobileOtpModel = getOrCreateModel<MobileOtp>('MobileOtp', mobileOtpSchema);
export const PushSubscriptionModel = getOrCreateModel<PushSubscription>(
  'PushSubscription',
  pushSubscriptionSchema,
);
export const FraudEventModel = getOrCreateModel<FraudEvent>('FraudEvent', fraudEventSchema);
export const MessageAttachmentModel = getOrCreateModel<MessageAttachment>(
  'MessageAttachment',
  messageAttachmentSchema,
);
export const MessageModel = getOrCreateModel<Message>('Message', messageSchema);
export const CommunityRoomModel = getOrCreateModel<CommunityRoom>(
  'CommunityRoom',
  communityRoomSchema,
);
export const CommunityPostModel = getOrCreateModel<CommunityPost>(
  'CommunityPost',
  communityPostSchema,
);
export const CommunityCommentModel = getOrCreateModel<CommunityComment>(
  'CommunityComment',
  communityCommentSchema,
);
export const CommunityReactionModel = getOrCreateModel<CommunityReaction>(
  'CommunityReaction',
  communityReactionSchema,
);
export const PlanModel = getOrCreateModel<Plan>('Plan', planSchema);
export const SubscriptionModel = getOrCreateModel<Subscription>('Subscription', subscriptionSchema);
export const PaymentModel = getOrCreateModel<Payment>('Payment', paymentSchema);
export const UsageCounterModel = getOrCreateModel<UsageCounter>('UsageCounter', usageCounterSchema);
export const InvoiceModel = getOrCreateModel<Invoice>('Invoice', invoiceSchema);
export const CouponModel = getOrCreateModel<Coupon>('Coupon', couponSchema);
export const RefundModel = getOrCreateModel<Refund>('Refund', refundSchema);
export const ProfileBoostModel = getOrCreateModel<ProfileBoost>('ProfileBoost', profileBoostSchema);
export const NotificationModel = getOrCreateModel<Notification>('Notification', notificationSchema);
export const AuditLogModel = getOrCreateModel<AuditLog>('AuditLog', auditLogSchema);
export const ActivityLogModel = getOrCreateModel<ActivityLog>('ActivityLog', activityLogSchema);
export const CmsPageModel = getOrCreateModel('CmsPage', cmsPageSchema);
export const BlogPostModel = getOrCreateModel('BlogPost', blogPostSchema);
export const TestimonialModel = getOrCreateModel('Testimonial', testimonialSchema);
export const SuccessStoryModel = getOrCreateModel('SuccessStory', successStorySchema);
export const BannerModel = getOrCreateModel('Banner', bannerSchema);
export const SystemSettingModel = getOrCreateModel('SystemSetting', systemSettingSchema);
export const AdminNoteModel = getOrCreateModel<AdminNote>('AdminNote', adminNoteSchema);
export const ContactInquiryModel = getOrCreateModel<ContactInquiry>(
  'ContactInquiry',
  contactInquirySchema,
);

export const phaseOneSchemas = {
  profileMediaSchema,
  verificationRequestSchema,
  verificationDocumentSchema,
  interestSchema,
  favouriteSchema,
  blockSchema,
  reportSchema,
  profileViewSchema,
  savedSearchSchema,
  conversationSchema,
  mobileOtpSchema,
  pushSubscriptionSchema,
  fraudEventSchema,
  messageAttachmentSchema,
  messageSchema,
  communityRoomSchema,
  communityPostSchema,
  communityCommentSchema,
  communityReactionSchema,
  planSchema,
  subscriptionSchema,
  paymentSchema,
  usageCounterSchema,
  invoiceSchema,
  couponSchema,
  refundSchema,
  profileBoostSchema,
  notificationSchema,
  auditLogSchema,
  activityLogSchema,
  cmsPageSchema,
  blogPostSchema,
  testimonialSchema,
  successStorySchema,
  bannerSchema,
  systemSettingSchema,
  adminNoteSchema,
  contactInquirySchema,
} as const;

export const phaseOneModels = [
  ProfileMediaModel,
  VerificationRequestModel,
  VerificationDocumentModel,
  InterestModel,
  FavouriteModel,
  BlockModel,
  ReportModel,
  ProfileViewModel,
  SavedSearchModel,
  ConversationModel,
  MobileOtpModel,
  PushSubscriptionModel,
  FraudEventModel,
  MessageAttachmentModel,
  MessageModel,
  CommunityRoomModel,
  CommunityPostModel,
  CommunityCommentModel,
  CommunityReactionModel,
  PlanModel,
  SubscriptionModel,
  PaymentModel,
  UsageCounterModel,
  InvoiceModel,
  CouponModel,
  RefundModel,
  ProfileBoostModel,
  NotificationModel,
  AuditLogModel,
  ActivityLogModel,
  CmsPageModel,
  BlogPostModel,
  TestimonialModel,
  SuccessStoryModel,
  BannerModel,
  SystemSettingModel,
  AdminNoteModel,
  ContactInquiryModel,
] as const;
