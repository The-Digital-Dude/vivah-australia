# UI Migration - Verification Centre

## Goal

Evolve the verification area into a clearer premium trust centre while preserving all existing OTP, document submission, moderation, and badge logic.

## What changed

- Added a stronger premium hero section with:
  - trust score summary
  - completed checkpoint count
  - pending review count
  - progress bar framing
- Reworked the page to feel more like a dedicated verification centre instead of a single document form.
- Added a right-side trust rail that surfaces:
  - trust score
  - verification checkpoint status
  - badge ladder
  - help/support guidance
- Kept the main submission and history flows intact while improving hierarchy and readability.
- Preserved the existing pending moderation banner and trust-focused document messaging.

## Logic preserved

- Mobile OTP request and verification behavior remain unchanged.
- Verification request submission still uses the existing endpoint and payload shape.
- Request history and moderation states are still loaded from the same existing member endpoints.
- Badge levels and approval flow remain tied to the current backend moderation logic.

## Design intent

This phase makes verification feel like a premium trust-building journey that supports serious matchmaking, rather than a utility page for document uploads alone.
