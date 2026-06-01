import { VerificationLevel } from '@vivah/shared';

type VerificationFlags = {
  emailVerified?: boolean;
  mobileVerified?: boolean;
  identityVerified?: boolean;
  addressVerified?: boolean;
  employmentVerified?: boolean;
  visaVerified?: boolean;
  policeClearanceVerified?: boolean;
  facialVerified?: boolean;
  verification?: VerificationFlags;
};

export function calculateVerificationBadge(profileOrUser: VerificationFlags) {
  const flags = profileOrUser.verification ?? profileOrUser;
  const basic = Boolean(flags.emailVerified && flags.mobileVerified);
  const silver = basic && Boolean(flags.identityVerified);
  const gold =
    silver && Boolean(flags.addressVerified || flags.employmentVerified || flags.visaVerified);
  const advancedCount = [
    flags.addressVerified,
    flags.employmentVerified,
    flags.visaVerified,
    flags.policeClearanceVerified,
    flags.facialVerified,
  ].filter(Boolean).length;
  const fullyVerified = Boolean(
    flags.identityVerified &&
    flags.addressVerified &&
    (flags.employmentVerified || flags.visaVerified) &&
    (flags.policeClearanceVerified || flags.facialVerified),
  );

  if (fullyVerified) return VerificationLevel.FULLY_VERIFIED;
  if (gold && advancedCount >= 2) return VerificationLevel.PLATINUM;
  if (gold) return VerificationLevel.GOLD;
  if (silver) return VerificationLevel.SILVER;
  if (basic) return VerificationLevel.BASIC;
  return VerificationLevel.NONE;
}
