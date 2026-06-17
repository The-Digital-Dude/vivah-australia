# Vivah Australia Admin Handover Guide

## Purpose

This guide is for the operator taking over day-to-day admin use of Vivah Australia after launch. It covers what the admin surface does today, what depends on external configuration, and the routine checks that keep the system healthy.

## Environments and Access

- Web admin lives under `/admin` and is protected by admin role checks.
- API admin routes live under `/api/admin/*`.
- Seeded/demo access should be managed through the documented seed flow and never by hardcoding credentials into the repo.
- Admin and super-admin users can access CMS, analytics, moderation, verification review, and user management. Moderators have narrower moderation-focused access.

## Core Admin Areas

### User management

- Search supports email, display ID, and profile name matching.
- Filters currently include role, status, verification level, subscription tier, and joined date.
- User detail includes profile summary plus internal notes.
- Status/role changes write audit records and can revoke access where required.

### Moderation and verification

- Profile moderation queue supports approve, reject, and needs-changes flows.
- Verification review supports preview access to identity documents through signed preview URLs.
- Moderation actions on reports are auditable and should be used instead of direct database edits.

### CMS

- CMS admin APIs live under `/api/admin/cms/*`.
- Public content still resolves through public endpoints or public pages, but authoring belongs to the admin route set.
- Homepage content, pages, blogs, testimonials, success stories, banners, templates, promotions, and landing pages are all managed from admin-owned APIs.

### Analytics

- Summary charts and CSV export use the same date-range inputs.
- Admin analytics cover user/status breakdowns, verification, reports, payments, subscriptions, match-interest activity, messaging activity, and community activity.

### Billing and notifications

- Billing state should be treated as source-of-truth plus provider reconciliation; do not “fix” payment rows manually without checking Stripe state.
- Notification delivery is DB-first, with email/SMS/push layered on top through queue-backed send helpers.

## Operational Dependencies

- MongoDB must be healthy and writable.
- Redis is required for queues and scheduled jobs; when Redis is unavailable, some background automation is intentionally disabled.
- Cloudinary or configured storage is required for signed media/document upload flows.
- Email and SMS providers must be configured in production if those channels are expected to send.

## Routine Admin Checks

- Review profile moderation and verification queues daily.
- Check reports/moderation dashboard for unresolved safety items.
- Confirm analytics, CMS pages, and public homepage content render as expected after content changes.
- Review failed queue jobs and provider outages before retrying high-volume sends.

## Known Caution Areas

- Signed private media and verification previews are time-limited by design; expired links should be regenerated through the product flow, not bypassed.
- Marketing-style email sends must respect marketing consent and marketing notification preferences.
- Account suspension/deletion changes can affect messaging, moderation history, and subscriptions; use the product flows rather than direct collection edits.
