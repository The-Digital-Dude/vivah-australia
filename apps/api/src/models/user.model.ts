import {
  AccountStatus,
  UserRole,
  type AccountStatus as AccountStatusType,
  type UserRole as UserRoleType,
} from '@vivah/shared';
import { Schema, type HydratedDocument, type Types } from 'mongoose';
import { auditedSchemaFields, getOrCreateModel, timestampedSchemaOptions } from './common.js';

export const AuthProvider = {
  EMAIL: 'email',
  MOBILE: 'mobile',
  GOOGLE: 'google',
  FACEBOOK: 'facebook',
  APPLE: 'apple',
} as const;

export type AuthProvider = (typeof AuthProvider)[keyof typeof AuthProvider];

export interface User {
  email?: string;
  mobile?: string;
  passwordHash?: string;
  authProviders: AuthProvider[];
  googleId?: string;
  facebookId?: string;
  appleId?: string;
  role: UserRoleType;
  status: AccountStatusType;
  emailVerified: boolean;
  mobileVerified: boolean;
  lastLoginAt?: Date;
  passwordChangedAt?: Date;
  failedLoginAttempts: number;
  lockUntil?: Date;
  refreshTokenVersion: number;
  termsAcceptedAt?: Date;
  privacyAcceptedAt?: Date;
  marketingConsent: boolean;
  notificationPreferences: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    marketingNotifications: boolean;
  };
  metadata: {
    signupIp?: string;
    signupUserAgent?: string;
    lastIp?: string;
    lastUserAgent?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
}

export type UserDocument = HydratedDocument<User>;

const userSchema = new Schema<User>(
  {
    email: { type: String, trim: true, lowercase: true },
    mobile: { type: String, trim: true },
    passwordHash: { type: String },
    authProviders: {
      type: [String],
      enum: Object.values(AuthProvider),
      default: [],
      required: true,
    },
    googleId: { type: String },
    facebookId: { type: String },
    appleId: { type: String },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(AccountStatus),
      default: AccountStatus.PENDING,
      required: true,
      index: true,
    },
    emailVerified: { type: Boolean, default: false, required: true },
    mobileVerified: { type: Boolean, default: false, required: true },
    lastLoginAt: { type: Date },
    passwordChangedAt: { type: Date },
    failedLoginAttempts: { type: Number, default: 0, min: 0, required: true },
    lockUntil: { type: Date },
    refreshTokenVersion: { type: Number, default: 0, min: 0, required: true },
    termsAcceptedAt: { type: Date },
    privacyAcceptedAt: { type: Date },
    marketingConsent: { type: Boolean, default: false, required: true },
    notificationPreferences: {
      emailNotifications: { type: Boolean, default: true },
      smsNotifications: { type: Boolean, default: false },
      pushNotifications: { type: Boolean, default: false },
      marketingNotifications: { type: Boolean, default: false },
    },
    metadata: {
      signupIp: { type: String },
      signupUserAgent: { type: String },
      lastIp: { type: String },
      lastUserAgent: { type: String },
    },
    ...auditedSchemaFields,
  },
  timestampedSchemaOptions,
);

userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ mobile: 1 }, { unique: true, sparse: true });
userSchema.index({ googleId: 1 }, { unique: true, sparse: true });
userSchema.index({ facebookId: 1 }, { unique: true, sparse: true });
userSchema.index({ appleId: 1 }, { unique: true, sparse: true });
userSchema.index({ status: 1, role: 1 });

userSchema.post('save', async function (doc) {
  if (doc) {
    const { ProfileModel } = await import('./profile.model.js');
    await ProfileModel.updateOne(
      { userId: doc._id },
      { $set: { userStatus: doc.status, userIsDeleted: doc.isDeleted } }
    );
  }
});

userSchema.post('findOneAndUpdate', async function (doc) {
  if (doc) {
    const { ProfileModel } = await import('./profile.model.js');
    await ProfileModel.updateOne(
      { userId: doc._id },
      { $set: { userStatus: doc.status, userIsDeleted: doc.isDeleted } }
    );
  }
});

userSchema.post('updateOne', async function () {
  const update = this.getUpdate() as Record<string, any>;
  if (update && update.$set && (update.$set.status !== undefined || update.$set.isDeleted !== undefined)) {
    const query = this.getQuery();
    if (query._id) {
      const { ProfileModel } = await import('./profile.model.js');
      await ProfileModel.updateOne(
        { userId: query._id },
        { $set: { 
           ...(update.$set.status !== undefined ? { userStatus: update.$set.status } : {}),
           ...(update.$set.isDeleted !== undefined ? { userIsDeleted: update.$set.isDeleted } : {})
        } }
      );
    }
  }
});

export const UserModel = getOrCreateModel<User>('User', userSchema);
export { userSchema };
