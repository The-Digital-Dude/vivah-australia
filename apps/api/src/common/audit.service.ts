import type { Types } from 'mongoose';
import { ActivityLogModel, AuditLogModel } from '../models/index.js';

export async function logAudit(input: {
  actorId?: Types.ObjectId;
  action: string;
  targetType?: string;
  targetId?: Types.ObjectId;
  metadata?: Record<string, unknown>;
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
