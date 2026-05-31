import {
  CommunityPostStatus,
  InterestStatus,
  MediaVisibility,
  PaymentStatus,
  ReportStatus,
  SubscriptionStatus,
  VerificationStatus,
  type CommunityPostStatus as CommunityPostStatusType,
  type InterestStatus as InterestStatusType,
  type MediaVisibility as MediaVisibilityType,
  type PaymentStatus as PaymentStatusType,
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
  visibility: MediaVisibilityType;
  approvalStatus: VerificationStatusType;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

const profileMediaSchema = new Schema<ProfileMedia>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    profileId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true, index: true },
    assetUrl: { type: String, required: true },
    storageKey: { type: String },
    mediaType: { type: String, enum: ['PHOTO', 'VIDEO'], default: 'PHOTO', required: true },
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
    isPrimary: { type: Boolean, default: false },
    ...auditedSchemaFields,
  },
  { ...timestampedSchemaOptions, collection: 'profile_media' },
);

export interface VerificationRequest {
  userId: ObjectId;
  profileId?: ObjectId;
  type: string;
  status: VerificationStatusType;
  reviewedBy?: ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
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
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

const conversationSchema = new Schema<Conversation>(
  {
    participantIds: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    lastMessageAt: { type: Date, index: true },
    ...auditedSchemaFields,
  },
  { ...timestampedSchemaOptions, collection: 'conversations' },
);

conversationSchema.index({ participantIds: 1 });

export interface Message {
  conversationId: ObjectId;
  senderId: ObjectId;
  body?: string;
  attachmentIds?: ObjectId[];
  readBy: ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

const messageSchema = new Schema<Message>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    body: { type: String, trim: true, maxlength: 10000 },
    attachmentIds: [{ type: Schema.Types.ObjectId, ref: 'ProfileMedia' }],
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
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
  priceCents: number;
  currency: string;
  interval: 'MONTH' | 'YEAR';
  features: string[];
  limits: Record<string, number>;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

const planSchema = new Schema<Plan>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    priceCents: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'AUD', uppercase: true, trim: true },
    interval: { type: String, enum: ['MONTH', 'YEAR'], default: 'MONTH', required: true },
    features: { type: [String], default: [] },
    limits: { type: Map, of: Number, default: {} },
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
    providerPaymentId: { type: String, trim: true },
    ...auditedSchemaFields,
  },
  { ...timestampedSchemaOptions, collection: 'payments' },
);

paymentSchema.index({ userId: 1, createdAt: 1 });

const simpleContentFields = {
  slug: { type: String, trim: true, lowercase: true, index: true },
  title: { type: String, trim: true },
  body: { type: String, trim: true },
  published: { type: Boolean, default: false, index: true },
} as const;

const invoiceSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
    invoiceNumber: { type: String, required: true, unique: true, trim: true },
    totalCents: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'AUD' },
    ...auditedSchemaFields,
  },
  { ...timestampedSchemaOptions, collection: 'invoices' },
);

const couponSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    percentOff: { type: Number, min: 0, max: 100 },
    amountOffCents: { type: Number, min: 0 },
    active: { type: Boolean, default: true, index: true },
    expiresAt: { type: Date },
    ...auditedSchemaFields,
  },
  { ...timestampedSchemaOptions, collection: 'coupons' },
);

const profileBoostSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    profileId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true, index: true },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true, index: true },
    active: { type: Boolean, default: true, index: true },
    ...auditedSchemaFields,
  },
  { ...timestampedSchemaOptions, collection: 'profile_boosts' },
);

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true, trim: true, index: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, trim: true },
    readAt: { type: Date },
    ...auditedSchemaFields,
  },
  { ...timestampedSchemaOptions, collection: 'notifications' },
);

const auditLogSchema = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    action: { type: String, required: true, trim: true, index: true },
    targetType: { type: String, trim: true },
    targetId: { type: Schema.Types.ObjectId },
    metadata: { type: Schema.Types.Mixed },
  },
  { ...timestampedSchemaOptions, collection: 'audit_logs' },
);

auditLogSchema.index({ actorId: 1, createdAt: 1 });

const activityLogSchema = new Schema(
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

const adminNoteSchema = new Schema(
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
export type ProfileMediaDocument = HydratedDocument<ProfileMedia>;

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
export const ConversationModel = getOrCreateModel<Conversation>('Conversation', conversationSchema);
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
export const InvoiceModel = getOrCreateModel('Invoice', invoiceSchema);
export const CouponModel = getOrCreateModel('Coupon', couponSchema);
export const ProfileBoostModel = getOrCreateModel('ProfileBoost', profileBoostSchema);
export const NotificationModel = getOrCreateModel('Notification', notificationSchema);
export const AuditLogModel = getOrCreateModel('AuditLog', auditLogSchema);
export const ActivityLogModel = getOrCreateModel('ActivityLog', activityLogSchema);
export const CmsPageModel = getOrCreateModel('CmsPage', cmsPageSchema);
export const BlogPostModel = getOrCreateModel('BlogPost', blogPostSchema);
export const TestimonialModel = getOrCreateModel('Testimonial', testimonialSchema);
export const SuccessStoryModel = getOrCreateModel('SuccessStory', successStorySchema);
export const BannerModel = getOrCreateModel('Banner', bannerSchema);
export const SystemSettingModel = getOrCreateModel('SystemSetting', systemSettingSchema);
export const AdminNoteModel = getOrCreateModel('AdminNote', adminNoteSchema);
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
  conversationSchema,
  messageSchema,
  communityRoomSchema,
  communityPostSchema,
  communityCommentSchema,
  communityReactionSchema,
  planSchema,
  subscriptionSchema,
  paymentSchema,
  invoiceSchema,
  couponSchema,
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
  ConversationModel,
  MessageModel,
  CommunityRoomModel,
  CommunityPostModel,
  CommunityCommentModel,
  CommunityReactionModel,
  PlanModel,
  SubscriptionModel,
  PaymentModel,
  InvoiceModel,
  CouponModel,
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
