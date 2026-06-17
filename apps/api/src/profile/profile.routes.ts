import { Router, type NextFunction, type Request, type Response } from 'express';
import {
  accountSettingsSchema,
  notificationPreferencesSchema,
  profileDraftSchema,
  profileSubmitSchema,
} from '@vivah/shared';
import { requireAuth } from '../auth/auth.middleware.js';
import type { AuthConfig, AuthenticatedRequest } from '../auth/auth-types.js';
import { HttpError } from '../auth/auth-errors.js';
import {
  getOwnProfile,
  deactivateOwnAccount,
  listRecentlyViewedProfiles,
  listProfileViewersReceived,
  getVisibleProfile,
  requestAccountDeletion,
  submitOwnProfile,
  updateAccountSettings,
  updateNotificationPreferences,
  updateOwnProfile,
  serializeOwnProfile,
} from './profile.service.js';
import { generateBiodataPdf, type BiodataProfileInput } from './biodata.service.js';
import { ProfileModel } from '../models/index.js';
import { isPaidMember } from '../billing/billing.service.js';
import { calculateMatchScore } from '../match/match.service.js';

function asyncHandler(
  handler: (request: Request, response: Response, next: NextFunction) => Promise<void>,
) {
  return (request: Request, response: Response, next: NextFunction) => {
    void handler(request, response, next).catch(next);
  };
}

function requireRequestAuth(request: AuthenticatedRequest) {
  if (!request.auth) {
    throw new HttpError(401, 'Authentication required');
  }

  return request.auth;
}

export function createProfileRouter(config: AuthConfig): Router {
  const router = Router();

  router.get(
    '/me/profile',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const profile = await getOwnProfile(auth.userId);
      response.status(200).json({ profile: await serializeOwnProfile(profile) });
    }),
  );

  router.patch(
    '/me/profile',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const input = profileDraftSchema.parse(request.body);
      const profile = await updateOwnProfile(auth.userId, input);
      response.status(200).json({ profile: await serializeOwnProfile(profile) });
    }),
  );

  router.post(
    '/me/profile/submit',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      profileSubmitSchema.parse(request.body);
      const profile = await submitOwnProfile(auth.userId);
      response.status(200).json({ profile: await serializeOwnProfile(profile) });
    }),
  );

  router.patch(
    '/me/privacy',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const input = profileDraftSchema.pick({ visibility: true }).parse(request.body);
      const profile = await updateOwnProfile(auth.userId, input);
      response.status(200).json({ profile: await serializeOwnProfile(profile) });
    }),
  );

  router.patch(
    '/me/notification-preferences',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const preferences = notificationPreferencesSchema.parse(request.body);
      response
        .status(200)
        .json({ preferences: await updateNotificationPreferences(auth.userId, preferences) });
    }),
  );

  router.patch(
    '/me/account',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const input = accountSettingsSchema.parse(request.body);
      const user = await updateAccountSettings(auth.userId, input.marketingConsent);
      response.status(200).json({ user: { id: user.id, marketingConsent: user.marketingConsent } });
    }),
  );

  router.post(
    '/me/deactivate',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const result = await deactivateOwnAccount(auth.userId);
      response.status(200).json({
        message: 'Account deactivated.',
        accountStatus: result.user.status,
      });
    }),
  );

  router.post(
    '/me/delete-request',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const result = await requestAccountDeletion(auth.userId);
      response.status(200).json({
        message: 'Account deletion request completed.',
        accountStatus: result.user.status,
      });
    }),
  );

  /**
   * GET /me/compatibility-prompts
   *
   * Returns the 6 structured compatibility quiz prompts shown during onboarding.
   * The values align with the `profile.compatibility` subdocument fields used in
   * match scoring. This endpoint is intentionally static — no DB query needed.
   */
  router.get(
    '/me/compatibility-prompts',
    requireAuth(config),
    asyncHandler(async (_request: AuthenticatedRequest, response) => {
      const prompts = [
        {
          key: 'relationshipPace',
          label: 'Relationship pace',
          question: 'How do you prefer to approach a relationship?',
          options: [
            { value: 'SLOW_AND_STEADY', label: 'Slow & steady' },
            { value: 'MODERATE', label: 'Moderate' },
            { value: 'READY_WHEN_IT_FEELS_RIGHT', label: 'Ready when it feels right' },
          ],
        },
        {
          key: 'familyInvolvement',
          label: 'Family involvement',
          question: 'How involved would you like families to be in the relationship?',
          options: [
            { value: 'HEAVILY_INVOLVED', label: 'Heavily involved' },
            { value: 'MODERATELY_INVOLVED', label: 'Moderately involved' },
            { value: 'PRIVATE', label: 'Privately between partners' },
          ],
        },
        {
          key: 'relocationOpenness',
          label: 'Relocation openness',
          question: 'Are you open to relocating for the right match?',
          options: [
            { value: 'YES', label: 'Yes, open to relocating' },
            { value: 'OPEN_TO_DISCUSSION', label: 'Open to discussion' },
            { value: 'NO', label: 'Prefer to stay where I am' },
          ],
        },
        {
          key: 'communicationStyle',
          label: 'Communication style',
          question: 'How would you describe your communication style?',
          options: [
            { value: 'OPEN_AND_EXPRESSIVE', label: 'Open & expressive' },
            { value: 'CALM_AND_MEASURED', label: 'Calm & measured' },
            { value: 'RESERVED', label: 'Reserved — I open up over time' },
            { value: 'DIRECT', label: 'Direct & to the point' },
          ],
        },
        {
          key: 'qualityTimeStyle',
          label: 'Quality time style',
          question: 'How do you prefer to spend quality time together?',
          options: [
            { value: 'ADVENTURES_AND_ACTIVITIES', label: 'Adventures & activities' },
            { value: 'QUIET_TIME_AT_HOME', label: 'Quiet time at home' },
            { value: 'SOCIAL_GATHERINGS', label: 'Social gatherings' },
            { value: 'MIX_OF_EVERYTHING', label: 'Mix of everything' },
          ],
        },
        {
          key: 'conflictApproach',
          label: 'Conflict approach',
          question: 'How do you typically handle disagreements?',
          options: [
            { value: 'TALK_IT_OUT_IMMEDIATELY', label: 'Talk it out straight away' },
            { value: 'TAKE_SPACE_THEN_DISCUSS', label: 'Take space, then discuss' },
            { value: 'WRITTEN_COMMUNICATION', label: 'Prefer written communication' },
            { value: 'SEEK_MEDIATOR', label: 'Prefer to involve a trusted third party' },
          ],
        },
      ];
      response.status(200).json({ prompts });
    }),
  );

  router.get(
    '/me/recently-viewed',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      response.status(200).json({ items: await listRecentlyViewedProfiles(auth.userId) });
    }),
  );

  router.get(
    '/me/profile-viewers',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);

      const isPaid = await isPaidMember(auth.userId);
      const result = await listProfileViewersReceived(auth.userId, isPaid);
      response.status(200).json(result);
    }),
  );

  router.get(
    '/profiles/:id',
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      let viewerId = request.auth?.userId;

      if (!viewerId) {
        await new Promise<void>((resolve) => {
          requireAuth(config)(request, response, (error?: unknown) => {
            if (!error) {
              viewerId = request.auth?.userId;
            }
            resolve();
          });
        });
      }

      const profileId = request.params.id;

      if (!profileId) {
        throw new HttpError(404, 'Profile not found');
      }

      const profile = await getVisibleProfile(profileId, viewerId);
      
      let matchScore: number | undefined;
      let matchReasons: string[] | undefined;
      let isPaid = false;
      let isPremiumProfile = false;

      if (viewerId) {
        const [viewerProfile, rawCandidateProfile] = await Promise.all([
          ProfileModel.findOne({ userId: viewerId, isDeleted: false }),
          ProfileModel.findOne({ _id: profile._id, isDeleted: false }),
        ]);

        if (viewerProfile && rawCandidateProfile && String(viewerProfile._id) !== String(rawCandidateProfile._id)) {
          const scored = calculateMatchScore(viewerProfile, rawCandidateProfile);
          matchScore = scored.score;
          matchReasons = scored.reasons;
        }

        isPaid = await isPaidMember(viewerId);
        if (rawCandidateProfile) {
          isPremiumProfile = await isPaidMember(rawCandidateProfile.userId);
        }
      } else if (profile._id) {
        const rawCandidateProfile = await ProfileModel.findOne({ _id: profile._id, isDeleted: false });
        if (rawCandidateProfile) {
          isPremiumProfile = await isPaidMember(rawCandidateProfile.userId);
        }
      }

      response
        .status(200)
        .json({ profile, matchScore, matchReasons, isPaidMember: isPaid, isPremiumProfile });
    }),
  );

  router.get(
    '/profiles/:id/biodata.pdf',
    requireAuth(config),
    asyncHandler(async (request: AuthenticatedRequest, response) => {
      const auth = requireRequestAuth(request);
      const profileId = request.params.id;

      if (!profileId) {
        throw new HttpError(404, 'Profile not found');
      }

      // Fetch the public-visible profile (applies all privacy/visibility rules,
      // including photo gating — photoUrl is only set when visibility.showPhoto is true
      // and an approved public photo exists)
      const visibleProfile = await getVisibleProfile(profileId, auth.userId);

      const isPaid = await isPaidMember(auth.userId);

      // Build the input, omitting any keys whose value is undefined so that
      // exactOptionalPropertyTypes is satisfied (optional = absent, not explicitly undefined).
      const input = Object.fromEntries(
        Object.entries({
          displayId: visibleProfile.displayId,
          photoUrl: visibleProfile.photoUrl,
          personal: visibleProfile.personal,
          location: visibleProfile.location,
          religion: visibleProfile.religion,
          education: visibleProfile.education,
          employment: visibleProfile.employment,
          family: visibleProfile.family,
          lifestyle: visibleProfile.lifestyle,
          about: visibleProfile.about,
          partnerPreference: visibleProfile.partnerPreference,
          verification: visibleProfile.verification,
        }).filter(([, v]) => v !== undefined),
      ) as unknown as BiodataProfileInput;

      const pdfBuffer = await generateBiodataPdf(input, { isPaid });
      const firstName = (visibleProfile.personal as { firstName?: string } | undefined)?.firstName;
      const filename = `biodata-${firstName ? firstName.toLowerCase().replace(/\s+/g, '-') : visibleProfile.displayId as string}.pdf`;

      response
        .status(200)
        .set('Content-Type', 'application/pdf')
        .set('Content-Disposition', `attachment; filename="${filename}"`)
        .set('Content-Length', String(pdfBuffer.length))
        .end(pdfBuffer);
    }),
  );

  return router;
}
