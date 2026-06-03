# UI Migration - Onboarding and Profile Creation

## Goal

Restyle the profile onboarding journey into a premium matrimonial multi-step wizard while preserving the existing draft-save, photo upload, verification, and submit behavior.

## What changed

- Reframed the onboarding shell into a richer premium journey:
  - luxury onboarding header card
  - larger progress bar
  - screenshot-style step cards
  - right-side trust and guidance rail on desktop
- Added stronger narrative context per step:
  - step heading
  - description
  - highlight guidance
- Preserved the existing 10-step flow and all current step handlers:
  - basic details
  - location
  - religion and community
  - education and career
  - family
  - lifestyle
  - about
  - photos
  - partner preferences
  - verification and submit
- Kept existing operational behavior unchanged:
  - profile draft PATCH saves
  - photo sign-upload and complete flow
  - review and submit action
  - preview-profile link
  - verification-centre handoff

## Visual direction

- Softer ivory onboarding canvas
- More ceremonial top-step treatment with premium progress language
- Better step clarity and reduced “application form” feel
- Desktop split between content form and support / trust rail

## Notes

- This phase is intentionally visual-only and reuses the current form fields and tested save logic.
- The review and verification handoff remain connected to the same existing routes and APIs.
