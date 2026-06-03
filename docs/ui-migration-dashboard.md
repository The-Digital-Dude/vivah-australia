# UI Migration - Member Dashboard

## Goal

Move the member dashboard away from an analytics-heavy member shell and into a more relationship-focused premium dashboard inspired by the provided references.

## What changed

- Reworked the desktop member shell into a premium two-part frame:
  - left navigation rail
  - top utility bar for membership, notifications, and identity
- Preserved mobile behavior with the existing mobile-first drawer and bottom navigation pattern.
- Reframed the dashboard content around relationship momentum instead of raw metrics:
  - welcome banner
  - summary cards
  - recommended matches grid
  - recent activity feed
  - relationship progress card
  - membership spotlight
  - profile completion utility card
  - quick actions
  - recent visitors card

## Functional behavior preserved

- Existing member auth guard behavior stays intact.
- Dashboard data still comes from the same profile, matches, interests, subscription, boosts, conversations, and viewer APIs.
- Boost activation, profile edit, membership management, and navigation targets remain unchanged.

## Visual direction

- Desktop layout now follows a left-rail plus central workspace structure closer to the design references.
- Utility content is pushed into a right-side support rail on large screens.
- Cards use softer ivory surfaces, larger rounded corners, and lighter visual density than the prior dashboard treatment.
