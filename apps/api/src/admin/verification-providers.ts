import { randomUUID } from 'node:crypto';
import type { VerificationRequestCreateInput } from '@vivah/shared';

export type VerificationProviderName = 'manual-review';

export type ProviderBackedVerificationType =
  | 'IDENTITY'
  | 'FACIAL'
  | 'POLICE_CLEARANCE'
  | 'VISA';

export interface VerificationProviderRequestContext {
  requestId: string;
  userId: string;
  profileId?: string;
  submittedAt: Date;
}

export interface VerificationProviderAssignment {
  provider: VerificationProviderName;
  providerReferenceId: string;
}

export interface IdentityVerificationProvider {
  beginIdentityVerification(
    context: VerificationProviderRequestContext,
  ): Promise<VerificationProviderAssignment>;
}

export interface FacialVerificationProvider {
  beginFacialVerification(
    context: VerificationProviderRequestContext,
  ): Promise<VerificationProviderAssignment>;
}

export interface PoliceCheckProvider {
  beginPoliceCheck(context: VerificationProviderRequestContext): Promise<VerificationProviderAssignment>;
}

export interface VisaVerificationProvider {
  beginVisaVerification(context: VerificationProviderRequestContext): Promise<VerificationProviderAssignment>;
}

function createManualReference(type: string, requestId: string) {
  return `manual-${type.toLowerCase()}-${requestId}-${randomUUID().slice(0, 8)}`;
}

const manualReviewProvider: IdentityVerificationProvider &
  FacialVerificationProvider &
  PoliceCheckProvider &
  VisaVerificationProvider = {
  async beginIdentityVerification(context) {
    return {
      provider: 'manual-review',
      providerReferenceId: createManualReference('IDENTITY', context.requestId),
    };
  },
  async beginFacialVerification(context) {
    return {
      provider: 'manual-review',
      providerReferenceId: createManualReference('FACIAL', context.requestId),
    };
  },
  async beginPoliceCheck(context) {
    return {
      provider: 'manual-review',
      providerReferenceId: createManualReference('POLICE_CLEARANCE', context.requestId),
    };
  },
  async beginVisaVerification(context) {
    return {
      provider: 'manual-review',
      providerReferenceId: createManualReference('VISA', context.requestId),
    };
  },
};

export async function assignVerificationProvider(
  type: VerificationRequestCreateInput['type'],
  context: VerificationProviderRequestContext,
): Promise<VerificationProviderAssignment> {
  switch (type) {
    case 'IDENTITY':
      return manualReviewProvider.beginIdentityVerification(context);
    case 'FACIAL':
      return manualReviewProvider.beginFacialVerification(context);
    case 'POLICE_CLEARANCE':
      return manualReviewProvider.beginPoliceCheck(context);
    case 'VISA':
      return manualReviewProvider.beginVisaVerification(context);
    default:
      return {
        provider: 'manual-review',
        providerReferenceId: createManualReference(type, context.requestId),
      };
  }
}
