import type { Types } from 'mongoose';
import { ActivityLogModel, AuditLogModel } from '../models/index.js';

export async function logAudit(input: {
  actorId?: Types.ObjectId;
  actorRole?: string;
  action: string;
  targetType?: string;
  targetId?: Types.ObjectId;
  targetUserId?: Types.ObjectId;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}) {
  await AuditLogModel.create(input);
}

export async function logActivity(input: {
  actorId?: Types.ObjectId;
  event: string;
  metadata?: Record<string, unknown>;
}) {
  await ActivityLogModel.create(input);
}
