# Vivah Australia Launch Checklist

## Environment and Secrets

- API and web production env vars are set and validated.
- MongoDB production URI is pointed at the correct deployment.
- Redis is configured so recurring jobs and queued sends are active.
- Cloudinary/storage credentials are configured for signed uploads.
- CAPTCHA secrets are configured for production contact/verification flows.
- Analytics/site verification tags are configured where expected.

## Providers and Integrations

- Stripe live keys and webhook signing secret are configured.
- Email provider credentials are configured and tested.
- SMS provider credentials are configured if activity/OTP SMS is expected.
- Push/webpush configuration is confirmed if push notifications are enabled.

## Crawl and Public-Site Checks

- `sitemap.xml` resolves successfully.
- `robots.txt` resolves successfully and blocks private/admin paths.
- public SEO landing pages resolve for seeded active slugs.
- homepage, pricing, contact, and at least one landing page pass a mobile smoke check.

## Admin and Moderation Checks

- an admin account can access `/admin`
- user filters, analytics, verification review, moderation dashboard, and CMS pages load correctly
- signed verification document preview works and expires as expected

## Member and Messaging Checks

- login, onboarding, profile edit, match discovery, interests, and messages load correctly
- profile viewers endpoint returns data for a known viewed profile
- private media and verification access rules behave correctly for authorized vs unauthorized viewers

## Background Jobs and Queues

- onboarding drip queue is scheduling
- profile completion nudge queue is scheduling
- weekly digest queue is scheduling
- subscription expiry queue is scheduling
- saved-search and match-caching queues are scheduling where configured

## Billing and Notifications

- checkout/verification flow can activate a subscription
- expired subscriptions are revoked by query-time checks and nightly safety worker
- in-app notifications persist and realtime delivery works when sockets are connected
- marketing unsubscribe stops marketing emails while transactional email still works

## Operational Readiness

- backups and restore ownership are documented
- uptime/error monitoring destinations are configured
- one rollback path is documented for both web and API deploys
- one smoke checklist is assigned to the launch operator for post-deploy verification

## Final Smoke Pass

- public homepage loads
- member dashboard loads
- admin dashboard loads
- one CMS edit round-trip succeeds
- one email queue test succeeds
- one protected route redirect/guard check succeeds
