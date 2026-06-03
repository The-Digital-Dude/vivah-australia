# Vivah Australia Project Progress

Last audited: 2026-06-03

This file tracks what is implemented in the current codebase against `vivah_ai_ready_development_tasklist.md`.

## Current Codebase Summary

- Monorepo exists with `apps/api`, `apps/web`, `packages/shared`, `packages/ui`, and `packages/config`.
- API is Express + MongoDB/Mongoose with shared validation from `@vivah/shared`.
- Web app is Next.js 16.2.6 with public, auth, and member profile pages.
- Public/member frontend alignment sprint FE-001 audit, FE-002 shared design system, FE-003 shared public/member layout, FE-004 clickable profile cards, FE-005 premium public profile detail page, FE-006 static pages alignment, and FE-007 auth pages alignment are complete in `FRONTEND_PROGRESS.md` and `UI_UX_TASKLIST.md`; FE-005 profile detail links now resolve by ObjectId, slug, or display ID, signed-in members can view member-only profile URLs with client auth, unauthenticated member-only profiles show a sign-in-required state, FE-006 root-level static public pages pull from CMS APIs with clean Ivory layouts, burgundy typography, and gold accenting, FE-007 authentication pages feature a dynamic desktop split-screen layout with an emotional brand panel and clean secure verification routes, and remaining public/member page redesign work continues from FE-008.
- Realistic demo database seeding now creates deterministic admin/member accounts, 40 detailed matrimonial profiles, media, interactions, conversations, verification requests, notifications, billing records, CMS/blog/community content, reports, audit/activity logs, and fraud/risk examples; `seed`, `seed:demo`, and guarded `seed:reset` are documented in `SEEDING_GUIDE.md`.
- Tests currently cover shared validators, database model/index registration, auth routes, public/CMS/contact routes, profile routes, admin/RBAC, media, match, interactions, messaging, billing, community moderation, and API health routes.
- `pnpm route:qa` provides repeatable local route checks for public, auth, admin, member, API, CMS, and seeded dynamic profile routes.
- Scheduled uptime monitoring is wired through `.github/workflows/uptime-monitor.yml` and `scripts/uptime-check.mjs`, using configured public health-check URLs for the API and web app.
- Optional webhook-based error tracking is wired for API startup failures, unexpected Express 500s, and uncaught/unhandled process errors, with env-controlled activation and service-level tests.
- Stripe webhook verification/processing failures now trigger explicit error-tracking alerts, so payment webhook breakages surface even when they resolve into handled HTTP responses.
- Scheduled uptime monitoring failures now trigger background-job webhook alerts through the GitHub Actions workflow path, covering the repo's current background-job surface.
- Deployment and disaster-recovery guidance now exists in `docs/deployment/operations-runbook.md`, including backup expectations, storage lifecycle guidance, CDN caching rules, and current signed-access evidence for private media and verification previews.
- Verification requests now persist `provider` and `providerReferenceId`, and a default manual-review provider assignment layer exists for identity, facial, police-clearance, and visa verification extension points.
- `.env.example` files exist for API and web.
- Real environment files, build outputs, logs, and dependencies are ignored by git.
- `vivah_australia_ui_ux_planning.md` is now the standing UI/UX source of truth for all frontend and product work.
- Every completed task should update this progress file, then be committed and pushed to GitHub.

## Standing Implementation Rules

- Follow `vivah_australia_ui_ux_planning.md` for all UI, UX, layout, interaction, accessibility, mobile, and design-system choices.
- Keep future UI work aligned with the premium trust-first matrimonial direction: warm ivory/burgundy/gold visual language, modern cards, guided onboarding, strong safety/verification cues, and mobile-first flows.
- After completing any future module or task, update this file with the new status, commit the change, and push to `origin/main`.

## Completed Modules

| Module                                                     | Status                    | Evidence                                                                                                                                                                                                                                                                                                                                           |
| ---------------------------------------------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CORE-001 Monorepo / Project Setup                          | Complete                  | Workspace packages, app structure, strict TypeScript configs, ESLint, Prettier, README setup steps.                                                                                                                                                                                                                                                |
| CORE-002 Shared Constants, Enums, and Validation           | Complete                  | `packages/shared/src/constants.ts`, `packages/shared/src/validators.ts`, env schemas, validator tests.                                                                                                                                                                                                                                             |
| DB-001 Base MongoDB Models                                 | Complete                  | Phase 1 model definitions in `apps/api/src/models/phase-one.models.ts`, common timestamps/audit/soft-delete fields.                                                                                                                                                                                                                                |
| DB-002 Main User Model                                     | Complete                  | Detailed user model in `apps/api/src/models/user.model.ts` with auth fields, status, roles, indexes, timestamps, soft delete.                                                                                                                                                                                                                      |
| DB-003 Profile Model                                       | Complete                  | Detailed profile model in `apps/api/src/models/profile.model.ts` with nested profile sections, indexes, moderation, visibility, stats.                                                                                                                                                                                                             |
| SEED-001 Realistic Demo Database Seed                      | Complete                  | `apps/api/src/db/seed.ts` now creates an idempotent matrimonial demo dataset with 3 admin accounts, 40 member profiles, interactions, messages, verification, notifications, billing, CMS/blog/community content, reports, logs, and guarded reset scripts documented in `SEEDING_GUIDE.md`.                                                       |
| AUTH-001 Email and Password Registration                   | Complete                  | Register endpoint, password hashing, email verification token flow, frontend register page, tests.                                                                                                                                                                                                                                                 |
| AUTH-002 Mobile Registration and OTP                      | Complete                  | Mobile registration endpoints, hashed OTP storage with 10-minute expiry, OTP resend and verification flow, mobile-aware login validation, public mobile signup + OTP UI with resend countdown, and auth route tests for verification, expiry, reuse, and rate limiting.                                                                            |
| AUTH-004 Login, Logout, Refresh Tokens, Session Management | Complete                  | Login, refresh rotation, logout, JWT middleware, rate limiting, stored refresh token version, password-change session revocation, frontend login/admin login session storage, protected member/admin shells, auto-refreshing authenticated requests, and tests for valid login, invalid attempts, lockout, logout, and password-change revocation. |
| AUTH-005 Password Recovery and Change Password             | Complete                  | Forgot/reset/change password endpoints, frontend forgot/reset pages, tests.                                                                                                                                                                                                                                                                        |
| WEB-001 Public Homepage                                    | Complete                  | Homepage refreshed to follow `vivah_australia_ui_ux_planning.md`, with a Framer Motion/Lucide interactive experience, sticky nav, animated premium hero, quick signup/search card, trust stats, featured approved profiles API, active plans API, safety, stories, blog, FAQ accordion, community links, and final CTA.                            |
| WEB-002 Static Pages                                       | Complete                  | `cms_pages` model, admin CMS page CRUD/list API, `/admin/cms` editor, publish/unpublish workflow, public slug page rendering with SEO metadata, and preview links.                                                                                                                                                                                 |
| PROFILE-001 Profile Onboarding Wizard                      | Complete                  | Member onboarding page, partial saves, completion percentage, submit for approval, shared validators, backend tests.                                                                                                                                                                                                                               |
| PROFILE-002 Profile View Page                              | Complete                  | Public/member profile route and page, approved/visible filtering, privacy controls, block checks, tests.                                                                                                                                                                                                                                           |
| PROFILE-003 Profile Edit and Account Settings              | Mostly complete           | Edit page, settings page, privacy update, persisted notification preferences including email/SMS/push/marketing toggles, account marketing preference update, tests for profile/privacy.                                                                                                                                                           |
| MEDIA-001 Photo Uploads                                    | Complete                  | Secure signed Cloudinary-compatible upload flow, mock local signing fallback, file type/size validation, member media page, profile photo/public/private gallery categories, visibility controls, signed private access, and backend tests.                                                                                                        |
| MEDIA-003 Admin Media Review                               | Complete                  | Admin media review queue API and page, approve/reject/resubmission workflow, review metadata, moderation reason support, and backend tests.                                                                                                                                                                                                        |
| MATCH-001 Search Profiles                                  | Complete                  | Authenticated `/api/matches/search`, shared validators, approval/visibility enforcement, self and blocked-user exclusion, pagination/sorting, subscription-gated advanced filters, capped free/paid page sizes, member search UI, and backend tests.                                                                                               |
| MATCH-002 Recommended Matches                              | Complete                  | Rule-based `/api/matches/recommended`, compatibility score and match reasons, preference/location/religion/education/occupation/interest/verification scoring, blocked/hidden/unapproved exclusions, member recommended matches UI, and backend tests.                                                                                             |
| MATCH-003 Recently Viewed Profiles                         | Complete                  | `profile_views` collection, duplicate-safe upsert on profile view, `/api/me/recently-viewed`, member recently viewed page, saved search model/API/UI in match discovery, route QA entry, and tests for storage plus privacy-filtered response and saved search CRUD.                                                                               |
| INTEREST-001 Interest Workflow                             | Complete                  | Send/list/respond interest APIs, accept/reject/withdraw workflow, duplicate prevention, blocked-user enforcement, monthly membership limits, notification records, conversation unlock on accept, match-card actions, interests page, and backend tests.                                                                                           |
| INTEREST-002 Favourite Profiles                            | Complete                  | Favourite/unfavourite/list APIs, duplicate prevention, blocked-user enforcement, favourites page, match-card save action, and backend tests.                                                                                                                                                                                                       |
| SAFETY-001 Block Users                                     | Complete                  | Block/unblock/list APIs, search/profile/interest enforcement, pending interest withdrawal on block, safety page, block modal/actions, and backend tests.                                                                                                                                                                                           |
| SAFETY-002 Report Users and Content                        | Complete for sprint scope | Member report API for profiles/users/media/messages/posts/comments, report modal, safety page report form, notification record, admin report queue/API/page with assign/resolve/dismiss actions, reported-user risk counter syncing via fraud events, and backend tests.                                                                        |
| MSG-001 Conversations                                      | Complete                  | One-to-one conversation APIs, accepted-interest gate, participant access checks, blocked-user enforcement, history endpoint, read receipts, delete conversation/message for current user, member inbox UI, chat safety actions, and backend tests.                                                                                                 |
| MSG-002 Real-Time Socket.IO Messaging                      | Complete                  | Socket.IO server attached to API HTTP server, JWT socket authentication, conversation room join, realtime message send, typing indicators, read receipt events, frontend socket client, REST fallback fetch, and socket tests.                                                                                                                     |
| MSG-003 Message Attachments                                | Complete for sprint scope | Message attachments now use signed upload preparation, secure completion, ownership-checked attachment references in message sends, signed private access URLs in message reads, chat UI upload actions, and backend realtime/route coverage.                                                                                                   |
| COMMUNITY-001 Rooms                                        | Complete                  | Community room model, default room provisioning, public room list/detail endpoints, admin room create/update/archive endpoints, member community room UI, admin community room UI, audit logs, and tests.                                                                                                                                          |
| COMMUNITY-002 Posts, Comments, Reactions                   | Complete for sprint scope | Post/comment/reaction models, post feed/create/edit/delete APIs, comment/reaction/report endpoints, moderator post removal/status control, reported content in admin report queue, member community composer/feed/actions, admin moderation integration, and tests. Dedicated comment thread UI and bulk moderation remain.                        |
| PLAN-001 Membership Plan System                            | Complete                  | Configurable plan model fields, active/inactive plans, seeded examples, public plans endpoint, admin create/update plan APIs, pricing page, and tests.                                                                                                                                                                                             |
| PLAN-002 Entitlement Middleware                            | Mostly complete           | Subscription resolver, entitlement checker, monthly usage counters, boost entitlement enforcement, plan badges/remaining limits in subscription UI, and tests including expired-subscription entitlement removal. Dedicated frontend entitlement hook and broader expired-subscription edge coverage remain.                                      |
| PAY-001 Stripe Subscription Integration                    | Mostly complete           | Stripe checkout session endpoint, member billing portal session endpoint, mock local checkout/billing fallback, raw webhook endpoint, checkout completion subscription sync, invoice paid payment sync, subscription delete cancellation handling, subscription page, and webhook tests. Failed-payment handling beyond current invoice sync still remains. |
| PAY-002 Invoices, Coupons, Refund Records                  | Complete                  | Invoice metadata sync, payment history endpoint, coupon model/admin create API, refund record model/admin refund API, member payment history, admin payments screen, and tests.                                                                                                                                                                    |
| PAY-003 Wallet/Provider Placeholders                       | Partial                   | Payments persist provider fields and Stripe checkout supports wallet-capable checkout. PayPal adapter and custom Stripe Payment Element UI are not implemented yet.                                                                                                                                                                                |
| BOOST-001 Boost Products and Active Boosts                 | Mostly complete           | Profile boost model, fixed-duration boosts, entitlement-backed activation, usage counter enforcement, subscription UI boost action, active boost listing, and tests. Search ranking/homepage featured placement and visible boosted badges remain.                                                                                                 |
| ADMIN-001 Admin Authentication and RBAC                    | Complete                  | `/admin/login`, admin client guard, admin dashboard shell, reusable API role middleware, protected admin routes, and RBAC tests.                                                                                                                                                                                                                   |
| ADMIN-002 User Management                                  | Complete for sprint scope | Admin user list/detail APIs, search by email/name/display ID, role/status/verification filters, pagination, status/role/notes endpoints, soft-delete status handling, hierarchy protections, user detail panel, audit logging, and tests. Dedicated full-page detail/modal polish remains.                                                         |
| ADMIN-003 Profile Moderation                               | Complete for sprint scope | Profile queue/detail API/UI, approve/reject/needs-changes workflow, member reason/internal note storage, reviewer metadata, notification/email trigger, audit log, and tests. Edited-profile diff review remains.                                                                                                                                  |
| ADMIN-004 Verification Management                          | Complete for sprint scope | Admin verification queue/detail/review API/UI, approve/reject/resubmission workflow, manual document URL visibility, badge updates, notifications, and tests. Signed document preview remains.                                                                                                                                                     |
| ADMIN-005 Membership and Payment Monitoring                | Complete for sprint scope | Admin subscription list API, payments/invoices monitoring, refund list/create APIs, coupon list/create APIs, combined `/admin/payments` monitoring console, revenue metrics, coupon form, and billing route tests. Dedicated payment detail route and deeper failed-payment workflows remain.                                                      |
| ADMIN-007 Moderation Dashboard                             | Complete for sprint scope | `/api/admin/moderation/dashboard` aggregates pending profile, verification, report, and media queues; `/admin/moderation` shows combined moderation cards and links into existing review queues. Warn/suspend/ban/remove bulk actions remain future work.                                                                                          |
| ADMIN-008 Reporting and Analytics                          | Partial                   | `/api/admin/analytics/summary` and `/admin/analytics` provide user, profile, verification, report, subscription, payment, and monthly revenue aggregates. Date filters, CSV export, chart library visuals, match/interest, messaging, and community analytics remain.                                                                              |
| VERIFY-001 Verification Request System                     | Complete for sprint scope | Member verification dashboard, request API, verification request/document models, manual document URL submission, admin review workflow, owner/admin detail endpoints, notification/email outcomes, and tests. Signed upload/viewing remains.                                                                                                      |
| VERIFY-002 Verification Badge Logic                        | Complete for sprint scope | Shared badge helper calculates BASIC/SILVER/GOLD/PLATINUM/FULLY_VERIFIED-style levels from email/mobile and approved verification flags, recalculates on review approval, profile cards/search filters expose badge, and tests cover approval updates. Configurable system-setting rules remain.                                                   |
| VERIFY-003 External Provider Extension Points              | Complete                  | `apps/api/src/admin/verification-providers.ts` defines identity/facial/police/visa provider interfaces, manual-review is the default provider, verification requests persist `provider` and `providerReferenceId`, and admin verification route tests cover the stored assignment.                                                               |
| NOTIF-001 In-App Notifications                             | Complete for sprint scope | Typed notification model with data payloads, notification service, member list/read/read-all/delete APIs, unread count, member bell, notifications page, triggers for profile/verification/report/interest flows, and tests.                                                                                                                       |
| NOTIF-002 Email Notifications                              | Complete for sprint scope | Email provider abstraction supports console local delivery and configurable SendGrid/Mailgun providers, env validation/examples, auth/contact/moderation/verification notification wiring. Template library and preference-gated queueing remain.                                                                                                  |
| NOTIF-003 SMS Notifications and OTP                        | Complete for sprint scope | SMS provider abstraction supports console and Twilio configuration, mobile OTP request/verify endpoints, settings UI for sending/verifying OTP, mobile verification flag updates, and backend tests. Dedicated SMS rate limiter and cost dashboard remain.                                                                                         |
| NOTIF-004 Push Notification Placeholder                    | Complete for sprint scope | Push subscription model, placeholder console/webpush provider abstraction, preference-gated push dispatch, member push subscription/test endpoints, settings UI action, and tests. Full browser service worker registration and native push delivery remain future work.                                                                           |
| SEC-002 RBAC and Permission Middleware                     | Mostly complete           | Reusable auth/role/admin/super-admin middleware, admin endpoint enforcement, ownership checks in member APIs, and RBAC tests. Fine-grained permission matrix middleware remains.                                                                                                                                                                   |
| SEC-003 Audit Logs and Activity Logs                       | Complete for sprint scope | Audit/activity log services, actor role/target metadata fields, admin user/profile/verification audit records, verification request activity records, admin audit-log browsing endpoint/page with filters, and tests. Sensitive document-view logs remain.                                                                                         |
| SEC-004 Fraud Prevention Rules                             | Complete for sprint scope | Fraud event model, high-velocity profile-view rule, repeated report rule, duplicate contact attempt rule, repeated OTP failure rule, unusual message volume rule, admin fraud queue/review actions, audit logging for review, and targeted tests. Policy tuning can continue as operational data grows.                                            |
| ADMIN-006 CMS Management                                   | Complete for sprint scope | Admin CMS console manages homepage/FAQ content, static pages, blogs, success stories, testimonials, and banners; includes list/detail editors, rich text controls with preview, publish/unpublish or active state, public preview links, admin nav/route QA integration, public homepage CMS API, and API tests.                                   |
| UI-001 Responsive Layout System                            | Complete for sprint scope | Shared UI tokens, responsive public/member/admin/auth layouts, admin/member mobile drawers, and route QA coverage for core pages. Systematic viewport visual regression coverage remains future QA hardening.                                                                                                                                      |
| UI-002 Core Component Library                              | Mostly complete           | `@vivah/ui` now exports typed tokens, class merge helper, page header, metric card, button, text/select inputs, checkbox, modal, drawer, tabs, badge, avatar, loading skeleton, pagination, empty state, and data table primitives. Date picker, toast, profile card, plan card, and file uploader remain.                                         |

## Partially Completed / Infrastructure Present

| Module / Area                             | Current State                                                                                                                                                   | Still Needed                                                                                                  |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| WEB-003 Contact Form                      | Contact inquiry model, public POST endpoint, frontend contact form, validation, rate limiting, hCaptcha verification, console email notification, storage test. | Real production email provider integration and stronger CAPTCHA test coverage.                                |
| SEC-001 Core Security Middleware          | Helmet, CORS, JSON limit, route rate limits, password hashing are in place.                                                                                     | Full security middleware checklist, centralized abuse controls, security tests beyond current route coverage. |
| TEST-001 / TEST-002 Backend and API Tests | Meaningful backend/API tests exist for implemented modules.                                                                                                     | Coverage for future modules and deeper negative/security cases.                                               |

## Incomplete Modules

The following modules do not yet have full business-feature implementations in the codebase:

- AUTH-003 Social Login
- MEDIA-002 Video Introduction Upload
- TEST-004 Broader E2E Matrix
- DEVOPS-001 Environment Setup beyond local examples
- DEVOPS-002 Full CI/CD Deployment Pipeline
- DEVOPS-003 Logging and Monitoring
- DEVOPS-004 Backups and File Storage Safety

## Recently Completed Modules

- TEST-003 Frontend Tests: Vitest + Testing Library are now set up in `apps/web`, with verified coverage for auth forms, profile wizard saves, discovery filters, membership checkout trigger, member action states, chat rendering, and admin user table loading/filtering.

## Known Gaps In Implemented Areas

- Email sending uses console locally and can use SendGrid or Mailgun when configured. Template library, async queueing, and preference-gated sends remain.
- Contact form uses hCaptcha when configured and skips server verification only when `HCAPTCHA_SECRET` is unset for local development.
- Profile notification preferences are persisted on the user document and currently gate email, SMS, and push delivery paths. Marketing-specific unsubscribe coverage is still incomplete.
- Account deactivate and delete-request endpoints currently return accepted responses but do not yet perform lifecycle workflows.
- Public homepage now supports CMS-managed hero, how-it-works, safety, FAQ, and contact copy through `/admin/cms`; deeper per-section visual layout controls remain future work.
- Media upload uses Cloudinary signed-upload parameters when `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` are configured; local development falls back to mock signed upload metadata.
- Private media access is app-signed for owner/admin flows; accepted-interest private gallery unlock still needs to be wired into media access rules.
- Match recommendations are calculated on demand; stored recommendation snapshots and dedicated newly joined/recently active/highly compatible endpoints are not implemented yet.
- Safety reports create moderation records and keep a reported-user risk counter in sync through `REPORTED_USER_RISK_SCORE` fraud events as reports open, assign, resolve, and dismiss.
- Chat attachments now reuse the same signed-upload trust model as media: the server mints uploads, message sends reference owned uploaded attachment IDs, and message reads return signed private access URLs.
- Billing uses Stripe when `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are configured; local development falls back to mock checkout records for plan checkout testing.
- Payment provider abstraction is limited to persisted provider fields; a PayPal adapter and custom Payment Element wallet UI remain future work.
- Profile boosts activate and expire by time window, but boosted ranking and public boosted badges still need search/homepage integration.
- Admin auth is guarded client-side because the current web auth token is stored in localStorage; moving auth to httpOnly cookies would allow server-side Next route protection.
- Verification documents are represented by encrypted storage metadata; signed admin preview URLs are in place, while secure member-side upload to the media storage flow still remains.
- Notification/email delivery now has member read/read-all/delete UI and configurable provider selection; production templates, preferences, and queueing remain future work.
- Audit/activity services record core admin and verification events and can be browsed in admin; sensitive document access logging remains future work.
- Playwright smoke coverage and route QA exist, but broader frontend component/integration coverage and a deeper E2E scenario matrix are still needed.
- CI runs typecheck, tests, build, and route QA in GitHub Actions; full deployment automation and environment promotion remain future work.

## Verification Status

Last successful verification for this audit:

- `pnpm test`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm format:check`
- `pnpm build`
- `pnpm route:qa`

Live local checks also passed for:

- `http://localhost:4000/health`
- `http://localhost:4000/api/health`
- `http://localhost:3000/member/onboarding`
- `http://localhost:3000/member/settings`
- `http://localhost:3000/member/matches`
- `http://localhost:3000/member/interests`
- `http://localhost:3000/member/favourites`
- `http://localhost:3000/member/safety`
- `http://localhost:3000/member/messages`
- `http://localhost:3000/pricing`
- `http://localhost:3000/member/subscription`
- `http://localhost:3000/admin/payments`
- `http://localhost:3000/admin/login`
- `http://localhost:3000/admin/dashboard`
- `http://localhost:3000/admin/users`
- `http://localhost:3000/admin/profiles`
- `http://localhost:3000/admin/verifications`
- `http://localhost:3000/admin/cms`
- `http://localhost:3000/admin/audit-logs`
- `http://localhost:3000/member/verification`
- `http://localhost:3000/member/notifications`
- `http://localhost:3000/admin/reports`

## Recommended Next Build Order

1. Finish WEB-003 gaps: stronger CAPTCHA tests and production email templates/preferences.
2. Expand broader frontend/component and deep E2E coverage.
3. Add frontend test coverage for the expanded `/admin/cms` editor and future visual CMS layout controls.
4. Add CI/CD and frontend/E2E tests once the next user-facing workflows are complete.
