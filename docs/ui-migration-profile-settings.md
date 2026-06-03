# UI Migration - Own Profile Management

## Goal

Turn the member-facing profile management area into a more premium, wedding-focused workspace while preserving every existing edit, photo, privacy, notification, and verification action.

## What changed

- Added a shared profile management workspace shell for:
  - edit profile
  - photo manager
  - privacy and settings
- Introduced a dedicated left-side management rail so profile tasks feel like one connected studio rather than scattered utility pages.
- Added a premium right-side utility rail with:
  - trust and clarity messaging
  - quick links to verification, membership, public preview, and related tasks
- Reframed the edit page as the center of the profile management experience while reusing the existing premium form flow from the onboarding migration.
- Restyled the settings page into clearer premium sections for:
  - visibility controls
  - notification preferences
  - mobile OTP trust checks
  - push placeholder setup
- Restyled the media manager into a more polished gallery workspace with:
  - stronger upload guidance
  - clearer visibility messaging
  - more premium photo cards and action controls

## Logic preserved

- Profile editing still uses the existing draft/save/submit form behavior.
- Photo upload, moderation, privacy toggles, primary image actions, and signed access remain unchanged.
- Settings still submit to the existing privacy, notification, OTP, and push endpoints.
- Verification continues to live in the existing verification centre route and flow.

## Design intent

This phase makes own-profile management feel more like a premium matrimonial “profile studio” and less like a set of disconnected account tools, without changing any business logic underneath.
