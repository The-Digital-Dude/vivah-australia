import mongoose, { Schema, type Model, type Types } from 'mongoose';

export interface AuditedDocumentFields {
  createdAt: Date;
  updatedAt: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
}

export const auditedSchemaFields = {
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date },
  deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
} as const;

export const timestampedSchemaOptions = {
  timestamps: true,
  versionKey: false,
} as const;

export function getOrCreateModel<TDocument>(
  modelName: string,
  schema: Schema<TDocument>,
): Model<TDocument> {
  return (
    (mongoose.models[modelName] as Model<TDocument> | undefined) ??
    mongoose.model<TDocument>(modelName, schema)
  );
}
