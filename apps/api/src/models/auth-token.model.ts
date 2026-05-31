import { Schema, type HydratedDocument, type Types } from 'mongoose';
import { getOrCreateModel, timestampedSchemaOptions } from './common.js';

export const AuthTokenPurpose = {
  EMAIL_VERIFICATION: 'EMAIL_VERIFICATION',
  PASSWORD_RESET: 'PASSWORD_RESET',
} as const;

export type AuthTokenPurpose = (typeof AuthTokenPurpose)[keyof typeof AuthTokenPurpose];

export interface AuthToken {
  userId: Types.ObjectId;
  purpose: AuthTokenPurpose;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type AuthTokenDocument = HydratedDocument<AuthToken>;

const authTokenSchema = new Schema<AuthToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    purpose: { type: String, enum: Object.values(AuthTokenPurpose), required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    usedAt: { type: Date },
  },
  { ...timestampedSchemaOptions, collection: 'auth_tokens' },
);

authTokenSchema.index({ userId: 1, purpose: 1, usedAt: 1 });

export const AuthTokenModel = getOrCreateModel<AuthToken>('AuthToken', authTokenSchema);
export { authTokenSchema };
