# UI Migration - Admin Experience

## Goal

Upgrade the admin console into a clearer premium operations workspace while preserving all current routes, permissions, moderation flows, CMS behavior, billing actions, and audit access.

## What changed

- Kept the darker left-rail console shell and lighter workspace model already present in admin.
- Reworked the dashboard body into a more intentional operations command centre with:
  - a stronger top overview banner
  - premium metric cards with better hierarchy
  - clearer priority queues
  - trust and revenue overview panels
  - cleaner recent registrations and safety timeline sections
  - faster visual access to core admin tools
- Reduced the “stack of generic cards” feeling and moved the page closer to the screenshot’s calmer enterprise-operations layout.

## Logic preserved

- The dashboard still reads from the existing `/api/admin/dashboard/summary` endpoint.
- No admin route, permission, or workflow behavior changed.
- Moderation, verification, media, reports, payments, CMS, analytics, and audit links still route to the same existing pages.

## Design intent

This phase keeps admin functional and operations-focused, but makes it feel more premium, more scannable, and more aligned with Vivah’s high-trust brand rather than a generic internal console.
