import { Types } from 'mongoose';
import { UserModel } from '../models/index.js';
import { HttpError } from '../auth/auth-errors.js';

/**
 * Mock KYC Service
 * In a real application, this would interface with SumSub, Onfido, AWS Rekognition, etc.
 */

export async function initiateLivenessCheck(userId: Types.ObjectId) {
  const user = await UserModel.findOne({ _id: userId, isDeleted: false });
  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  throw new HttpError(503, 'Liveness verification is not available yet');
}

export async function processKycWebhook() {
  throw new HttpError(503, 'KYC webhook is disabled until a real provider is configured');
}
