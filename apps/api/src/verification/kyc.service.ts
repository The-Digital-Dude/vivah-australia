import { Types } from 'mongoose';
import { VerificationStatus } from '@vivah/shared';
import { ProfileModel, UserModel } from '../models/index.js';
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

  // Generate a mock verification session URL
  const mockSessionId = `kyc_sess_${Math.random().toString(36).substring(7)}`;
  const verificationUrl = `https://mock-kyc-provider.com/verify/${mockSessionId}?userId=${userId}`;

  return {
    sessionId: mockSessionId,
    url: verificationUrl,
  };
}

export async function processKycWebhook(payload: any) {
  // Mock webhook processor
  // In reality, verify the webhook signature here using provider secrets
  
  const { userId, status, providerId } = payload;
  
  if (!userId || !status) {
    throw new HttpError(400, 'Invalid payload');
  }

  if (status === 'APPROVED') {
    const profile = await ProfileModel.findOne({ userId, isDeleted: false });
    if (profile) {
      profile.verification.level = 'FULLY_VERIFIED';
      await profile.save();
    }
  } else if (status === 'REJECTED') {
    // Handle rejection logic, maybe send email
  }

  return { success: true };
}
