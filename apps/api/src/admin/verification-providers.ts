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
  beginIdentityVerification(context: VerificationProviderRequestContext): VerificationProviderAssignment;
}

export interface FacialVerificationProvider {
  beginFacialVerification(context: VerificationProviderRequestContext): VerificationProviderAssignment;
}

export interface PoliceCheckProvider {
  beginPoliceCheck(context: VerificationProviderRequestContext): VerificationProviderAssignment;
}

export interface VisaVerificationProvider {
  beginVisaVerification(context: VerificationProviderRequestContext): VerificationProviderAssignment;
}

function createManualReference(type: string, requestId: string) {
  return `manual-${type.toLowerCase()}-${requestId}-${randomUUID().slice(0, 8)}`;
}

const manualReviewProvider: IdentityVerificationProvider &
  FacialVerificationProvider &
  PoliceCheckProvider &
  VisaVerificationProvider = {
  beginIdentityVerification(context) {
    return {
      provider: 'manual-review',
      providerReferenceId: createManualReference('IDENTITY', context.requestId),
    };
  },
  beginFacialVerification(context) {
    return {
      provider: 'manual-review',
      providerReferenceId: createManualReference('FACIAL', context.requestId),
    };
  },
  beginPoliceCheck(context) {
    return {
      provider: 'manual-review',
      providerReferenceId: createManualReference('POLICE_CLEARANCE', context.requestId),
    };
  },
  beginVisaVerification(context) {
    return {
      provider: 'manual-review',
      providerReferenceId: createManualReference('VISA', context.requestId),
    };
  },
};

export function assignVerificationProvider(
  type: VerificationRequestCreateInput['type'],
  context: VerificationProviderRequestContext,
): Promise<VerificationProviderAssignment> {
  switch (type) {
    case 'IDENTITY':
      return Promise.resolve(manualReviewProvider.beginIdentityVerification(context));
    case 'FACIAL':
      return Promise.resolve(manualReviewProvider.beginFacialVerification(context));
    case 'POLICE_CLEARANCE':
      return Promise.resolve(manualReviewProvider.beginPoliceCheck(context));
    case 'VISA':
      return Promise.resolve(manualReviewProvider.beginVisaVerification(context));
    default:
      return Promise.resolve({
        provider: 'manual-review',
        providerReferenceId: createManualReference(type, context.requestId),
      });
  }
}
