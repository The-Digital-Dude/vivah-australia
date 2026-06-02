# Vivah Australia Full Codebase Audit — Uploaded Zip 5

Audit target: `vivah-australia-main (5).zip`

Date: 2026-06-03

## Verification Scope

This audit inspected the uploaded codebase directly from the zip.

Static checks performed:
- Unzipped and inspected repository structure.
- Reviewed root/package/workspace configuration.
- Reviewed frontend app structure.
- Reviewed backend API structure.
- Reviewed shared package structure.
- Reviewed authentication, billing, public CMS, admin, member dashboard, match discovery, models, and docs.
- Counted files/routes/tests.
- Searched for security-sensitive patterns such as localStorage token storage, console email provider, mock storage/payment paths, disabled image lint, and TODO/FIXME patterns.
- Attempted to run pnpm through Corepack.

Could not run:
- `pnpm install`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

Reason:
The sandbox could not reach `registry.npmjs.org`, so Corepack could not download `pnpm@10.33.0`.

Error:
`getaddrinfo EAI_AGAIN registry.npmjs.org`

## Repository Snapshot

Observed:
- 204 total files
- 193 source/config/docs files
- 48k+ source/docs/config lines
- 58 backend TypeScript files under `apps/api/src`
- 86 frontend TypeScript/TSX files under `apps/web/app`
- 54 Next.js `page.tsx` route pages
- 14 test files
- 12 backend route modules
- Existing docs for admin redesign, member dashboard redesign, profile detail redesign, and UI/UX tasklist

The project is now a substantial full-stack MVP, not just a scaffold.

## Executive Verdict

Vivah Australia is a strong development-stage monorepo with real product depth:
- Auth
- Member profiles
- Matching
- Interests
- Messaging
- Media upload
- Verification
- Membership/billing
- CMS/public content
- Admin operations
- Community
- Notifications
- Fraud/audit primitives

However, it is not production-verified yet because the build/test suite could not be run here, and several production-readiness risks remain.

Current maturity estimate:
- Architecture: 8/10
- Backend feature coverage: 8/10
- Frontend feature coverage: 8/10
- Admin UX direction: 7/10
- Member UX direction: 8/10
- Security baseline: 6.5/10
- Production readiness: 5.5/10 until CI/build/security checks pass

## High-Level Strengths

1. Clean monorepo foundation
   - `apps/web`
   - `apps/api`
   - `packages/shared`
   - `packages/ui`
   - `packages/config`

2. Strong domain modeling
   - User
   - Profile
   - ProfileMedia
   - VerificationRequest
   - Interest
   - Block
   - Favourite
   - PhotoRequest
   - Conversation
   - Message
   - Plan
   - Subscription
   - Payment
   - Refund
   - CMS
   - Audit/Fraud logs

3. Good backend modularity
   API is separated into modules:
   - auth
   - profile
   - media
   - match
   - interactions
   - photo requests
   - messages
   - community
   - billing
   - admin
   - notifications
   - public CMS

4. Good validation pattern
   - Zod validators in shared package
   - Environment schema validation
   - Route-level request parsing

5. Useful security foundations
   - Helmet
   - CORS allowlist
   - bcrypt password hashing
   - JWT access/refresh token split
   - Refresh token version rotation
   - Account lockout
   - hCaptcha for contact form
   - Stripe webhook route mounted before JSON parser
   - Admin RBAC
   - Audit/fraud primitives

6. Frontend UX has improved substantially
   - Public pages are premium-branded
   - Auth pages have a strong premium layout
   - Profile detail page is much richer
   - Member dashboard/matches redesign work appears mostly implemented
   - Admin panel has begun moving toward an operations console

## Critical / High Priority Issues

### 1. Cannot confirm build, lint, typecheck, or tests

Because dependencies could not be installed, the repo is not independently build-verified in this audit.

Required local/CI command:

```bash
corepack enable
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Priority: P0

Fix:
Run these in a connected environment and do not deploy until all pass.

---

### 2. Web app still uses `file:` dependency for shared package

Current:

```json
"@vivah/shared": "file:../../packages/shared"
```

Recommended:

```json
"@vivah/shared": "workspace:*"
```

Why:
All monorepo package links should be consistent. `file:` can cause workspace install/build oddities in CI, Vercel, Docker, and local symlink environments.

Priority: P1

---

### 3. Client-side auth tokens are stored in localStorage

Observed:
- `auth_token`
- `refresh_token`

This is common for MVPs but risky for a platform handling identity, matrimonial privacy, verification, messages, and payments.

Risk:
If XSS happens, both access and refresh tokens may be stolen.

Priority: P1

Recommended next stage:
Move auth to:
- httpOnly secure cookies
- SameSite=Lax/Strict
- refresh token in cookie
- CSRF protection for cookie-auth writes
- short-lived access token
- server-side session revocation

---

### 4. Console email provider logs full emails and links

Observed:
`apps/api/src/common/email.service.ts` logs recipient, subject, HTML body, and text body.

Risk:
Verification links and reset links can appear in logs. In production this is dangerous.

Priority: P1

Fix:
- Keep console email only in development/test.
- In production, require SendGrid/Mailgun or equivalent.
- Never log full tokens or reset URLs in production.

---

### 5. hCaptcha is skipped if secret is not set

Current behavior:
If `HCAPTCHA_SECRET` is missing, verification is skipped outside tests too.

Risk:
A misconfigured production deployment silently disables CAPTCHA.

Priority: P1

Fix:
In production, fail startup or reject contact submissions if CAPTCHA secret is missing.

Suggested behavior:
- development/test: allow skip
- production: require `HCAPTCHA_SECRET`

---

### 6. Mock payment fallback exists when Stripe is not configured

`createCheckoutSession` creates a mock pending payment and returns a mock checkout URL if Stripe is missing or plan has no Stripe price ID.

Risk:
Production misconfiguration could create fake payment flows.

Priority: P1

Fix:
In production:
- require `STRIPE_SECRET_KEY`
- require `STRIPE_WEBHOOK_SECRET`
- require valid `stripePriceId` for paid plans
- disable mock checkout fallback

---

### 7. Stripe webhook verification is bypassed if Stripe config is missing

`constructStripeEvent` JSON parses the event if Stripe or webhook secret is not configured.

Risk:
In production, an attacker could forge webhook-like requests if configuration is incomplete.

Priority: P1

Fix:
In production, reject webhook requests unless Stripe and webhook secret are configured.

---

### 8. Contact inquiry email HTML interpolates user input

In public contact route, the email HTML includes values such as name, phone, subject, and message directly.

Risk:
HTML injection into admin email clients.

Priority: P2

Fix:
Escape HTML in emails or use a templating helper that escapes by default.

---

### 9. Admin actions need stronger audit consistency

Admin review flows exist, and audit services exist, but UI and service-level guarantees should be checked route by route.

Risk:
Some approve/reject/delete/refund actions may not create complete audit trails.

Priority: P1/P2 depending on route

Fix:
Require audit logging in every admin mutation:
- actor
- action
- entity type
- entity ID
- before state
- after state
- reason/note
- timestamp
- IP/user agent if possible

---

## Backend Audit

### Architecture

Good:
- Modular Express API
- Centralized app creation
- Stripe webhook router mounted before `express.json`
- Shared validators
- Test files per module
- Mongoose indexes in several important areas

Concerns:
- No global API version prefix such as `/api/v1`
- Admin CMS routes live in public router file, though they are protected
- Some admin role checks are duplicated instead of using a single middleware helper
- No obvious structured logger
- No centralized request ID/correlation ID
- No production-grade error monitoring integration

Recommended:
- Introduce `/api/v1` later before mobile app/API consumers depend on current paths.
- Split admin CMS routes into a dedicated `cms.admin.routes.ts`.
- Add request ID middleware.
- Add structured logger such as pino/winston.
- Add Sentry or equivalent for API/frontend.

### Auth

Good:
- bcrypt with 12 rounds
- email verification
- refresh token version rotation
- logout invalidates refresh version
- password reset invalidates refresh version
- account lockout after failed attempts
- role-based admin middleware

Concerns:
- localStorage token storage on frontend
- no MFA for admin users
- no device/session management UI
- no refresh token persistence/allowlist, only versioning
- no password reset throttling by user/email beyond route limiter
- no obvious IP/user-agent capture on login/register

Recommended:
- Add MFA/TOTP for admins first.
- Add session/device list and revoke sessions.
- Store refresh token family/session record if production security needs increase.
- Capture login IP/user agent and show last login for admin/member.

### Billing

Good:
- Plan/subscription/payment/refund primitives
- Stripe checkout support
- Stripe webhook route order is correct
- Refund service prevents over-refund
- Subscription overview and usage counters exist

Concerns:
- Mock checkout fallback must be production-blocked.
- Webhook signature bypass must be production-blocked.
- Idempotency handling should be strengthened around Stripe events.
- Subscription period updates are basic.
- Cancellation/change plan lifecycle needs full edge-case testing.

Recommended:
- Store processed Stripe event IDs to prevent double-processing.
- Handle subscription updated, payment failed, invoice payment failed.
- Add cancellation endpoints and UI.
- Add plan upgrade/downgrade proration strategy.
- Add billing test matrix.

### Matching / Discovery

Good:
- Match routes and service exist.
- Saved search exists.
- Match discovery frontend has tabs, filters, saved searches, and drawer pattern.
- Block/hidden profile exclusions appear conceptually supported.

Concerns:
- Need verify scoring fairness and performance at scale.
- Filtering/ranking may become expensive without targeted indexes.
- Need explainability: why this profile appears.
- Need more personalization loop from views/interests/messages.

Recommended:
- Add indexed fields for common filters: approval status, visibility, age, gender, city/state/country, religion/community, marital status, verification level, active boost, last active.
- Store match score explanations.
- Add basic ranking phases:
  1. eligibility
  2. safety exclusions
  3. preference match
  4. boost/recency
  5. diversity/freshness

### Messaging

Good:
- Conversation/message routes
- Socket.IO server
- Read receipts / notification concepts
- Accepted interest can enable conversation

Concerns:
- Need confirm message authorization prevents non-participants.
- Need moderation/reporting hooks for messages.
- Need abuse controls: rate limits, block enforcement, attachment controls.

Recommended:
- Add per-user message rate limits.
- Enforce block status before send.
- Add report message flow.
- Add moderation/audit hooks for deleted messages.
- Add unread count endpoints optimized for member shell.

### Media / Verification

Good:
- Media model tracks visibility, approval status, review metadata.
- Verification request/document models exist.
- Private photo request flow exists.
- Admin media review UI exists.

Concerns:
- Mock storage paths remain in frontend.
- Document storage encryption is modeled but needs verification of actual encrypted storage.
- Signed media URLs/access control need security review.
- Media content scanning is not clear.

Recommended:
- Make production file storage mandatory.
- Use signed URLs with short TTL for private media/documents.
- Separate profile photos and verification docs storage buckets/folders.
- Add virus/content scanning before approval.
- Restrict admin document preview with time-bound token and audit logs.

## Frontend Audit

### Public Frontend

Good:
- Premium branding across public pages
- CMS fallback data
- Clean auth pages
- Clean root routes like `/about`, `/contact`, `/privacy`, etc.
- hCaptcha component in contact form

Concerns:
- Fallback CMS can hide backend/CMS failure.
- Public marketing claims should be data-backed or softened.
- Some pages may still use plain fallback content.

Recommended:
- Log CMS fallback usage to monitoring.
- Replace hard claims with verified dynamic stats or softer copy.
- Add skeleton/loading states for dynamic CMS where appropriate.

### Member Dashboard

Good:
- Redesign appears mostly implemented.
- `/member/activity` exists.
- Match discovery has tabs and drawer state.
- Profile cards are more reusable.
- Member shell likely improved from original sidebar-heavy layout.

Concerns:
- Need final UX QA/regression pass.
- Need ensure there is no double-sidebar feeling left.
- Need verify mobile bottom nav/safe-area behavior.
- Need route compatibility across old routes.
- Need reduce profile card density in all contexts.

Recommended:
- Complete final member UX QA.
- Run route QA with server running.
- Add mobile screenshots for key pages:
  - dashboard
  - discover
  - profile detail
  - messages
  - activity
  - subscription
  - settings

### Profile Detail Page

Good:
- Profile detail is comprehensive.
- Sticky actions and mobile action bar exist.
- Locked private gallery messaging exists.
- Supports ObjectId, slug, or display ID.

Concerns:
- It may still feel like a biodata page if compatibility/story elements are not fully implemented.
- Photos and compatibility should be prioritized above detailed biodata.
- Need conversation starters and trust indicators.

Recommended:
- Add Compatibility Overview.
- Add Why You May Connect.
- Move Gallery higher.
- Add Conversation Starters.
- Add mobile tabs or sticky section navigation.

### Membership / Pricing

Good:
- Pricing/membership routes exist.
- Billing endpoints exist.
- Subscription member route exists.

Concerns:
- Membership frontend likely still needs more conversion-focused interaction.
- Need plan comparison, trust strip, FAQ, dynamic billing toggle, and sticky mobile CTA.
- Need checkout failure/success states fully polished.

Recommended:
- Finish FE-013 membership polish.
- Add plan comparison table.
- Add billing duration toggle.
- Add secure checkout/refund/cancel FAQ.
- Add selected plan sticky mobile CTA.

### Admin Panel

Good:
- AdminShell has grouped IA:
  - Overview
  - People
  - Trust & Safety
  - Business
  - System
- Admin dashboard has command-center direction.
- Admin primitives exist:
  - AdminDataTable
  - AdminMetricCard
  - AdminStatusBadge
  - AdminActionMenu
  - empty/loading states
- Many admin pages exist.

Concerns:
- shadcn usage appears partial/custom rather than full shadcn primitives.
- Data table is homegrown and lacks mature sorting/column visibility/bulk actions.
- AdminActionMenu manually implements dropdown rather than Radix DropdownMenu.
- Mobile table/card behavior needs QA.
- Destructive actions need consistent AlertDialog confirmation.
- Admin pages may still rely on mock/static placeholders.

Recommended:
- Convert admin primitives to actual shadcn/Radix components.
- Consider TanStack Table for admin tables.
- Add review drawers/dialogs for verifications/media/reports.
- Add audit reason fields for reject/suspend/refund/delete actions.
- Add admin MFA before production.

## Database / Schema Audit

Good:
- Mongoose schemas are extensive.
- Important unique indexes exist for user identifiers.
- Profile model captures matrimonial domain well.
- Soft delete fields exist.

Concerns:
- Match/search scale may need more compound indexes.
- Some schemas use flexible strings for critical taxonomy fields.
- Need migrations/seed versioning strategy.
- Soft delete + unique indexes need careful handling if users re-register with deleted emails.

Recommended indexes:
- Profile:
  - `approvalStatus + visibility.status + isDeleted`
  - `personal.gender + personal.age`
  - `location.country + location.state + location.city`
  - `religion.religion + religion.community`
  - `verification.level`
  - `stats.lastActiveAt`
  - `stats.activeBoostEndsAt`
- Interactions:
  - interests receiver/status/createdAt
  - interests sender/status/createdAt
  - favourites user/profile
  - blocks blocker/blocked
- Messages:
  - conversationId/createdAt
  - participant lookup through conversation
- Payments:
  - providerPaymentId unique sparse
  - userId/createdAt
  - subscriptionId/createdAt
- Audit:
  - actor/action/createdAt
  - entityType/entityId/createdAt

## Testing Audit

Existing:
- 14 test files
- Backend route tests across major modules
- Shared validator tests
- Mongo memory server dev dependency

Gaps:
- No visible frontend component/e2e tests.
- No Playwright/Cypress tests.
- No accessibility tests.
- No visual regression tests.
- No CI workflow observed in the static file list.
- No route QA execution possible without running services.

Recommended:
1. Add GitHub Actions:
   - install
   - lint
   - typecheck
   - test
   - build
2. Add Playwright smoke tests:
   - homepage
   - register/login
   - member dashboard
   - discover matches
   - profile detail
   - admin login/dashboard
3. Add API security regression tests:
   - admin routes reject normal users
   - blocked users cannot message
   - private photos require approval
   - webhook rejects invalid signatures in production
   - mock checkout disabled in production

## DevOps / Deployment Audit

Good:
- Environment schemas
- Lockfile committed
- Workspace structure
- README and quick references

Gaps:
- No visible GitHub Actions workflow
- No Dockerfile/docker-compose found in inspected top-level tree
- No deployment runbook beyond docs placeholders
- No monitoring/logging setup
- No backup/restore plan
- No production readiness checklist

Recommended:
- Add `.github/workflows/ci.yml`
- Add deployment docs:
  - Vercel web
  - Render/Fly/Railway API or selected hosting
  - MongoDB Atlas
  - Stripe webhooks
  - Cloudinary/S3
  - SendGrid/Mailgun
- Add production readiness checklist:
  - secrets
  - allowed origins
  - webhook signature
  - admin MFA
  - backups
  - error monitoring
  - analytics
  - legal pages

## UX/Product Audit

The product has the right feature breadth, but the biggest product risk is still experience quality.

Priority UX goals:
1. Make the member dashboard feel like a matchmaking journey, not a SaaS dashboard.
2. Make Discover feel like curated profile discovery, not a filter-heavy directory.
3. Make profile detail compatibility-first, not biodata-first.
4. Make membership value outcome-led, not feature-list-led.
5. Make admin operations fast, accountable, and low-risk.

Immediate UX priorities:
- Final member dashboard/matches QA
- Profile detail 2.0
- Membership/pricing conversion polish
- Admin review queue workflows
- Mobile-first QA

## Prioritized Fix Roadmap

### Phase 0 — Verification Gate

Run:
```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Fix every failure.

### Phase 1 — Production Safety Guardrails

1. Disable mock Stripe checkout in production.
2. Require Stripe webhook signature in production.
3. Require hCaptcha secret in production.
4. Stop logging email/reset/verification links in production.
5. Add CI.
6. Change `@vivah/shared` in web package from `file:` to `workspace:*`.

### Phase 2 — Admin Trust & Safety

1. Convert admin shell/primitives to shadcn/Radix properly.
2. Add review drawers for media/verifications/reports.
3. Require admin notes for reject/suspend/refund/delete.
4. Add audit logging for every admin mutation.
5. Add admin MFA.

### Phase 3 — Member UX

1. Final member dashboard/matches QA.
2. Ensure no double-sidebar layouts.
3. Improve mobile bottom nav.
4. Add compatibility-first profile detail.
5. Add membership conversion polish.

### Phase 4 — Scale & Reliability

1. Add indexes for discovery and queues.
2. Add request IDs and structured logs.
3. Add monitoring/error tracking.
4. Add backups and deployment docs.
5. Add Playwright end-to-end smoke tests.

## Recommended Codex Prompts

### Prompt 1 — Production Guardrails

Implement production safety guardrails.

Tasks:
- In billing service, disable mock checkout fallback when `NODE_ENV=production`.
- In Stripe webhook construction, reject requests without Stripe config/signature in production.
- In public contact CAPTCHA verification, require `HCAPTCHA_SECRET` in production.
- In email service, prevent console email provider from logging sensitive tokens/links in production.
- Add tests for these production behaviors.

Run:
```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Commit:
```bash
git add .
git commit -m "fix(security): enforce production safety guardrails"
git push
```

### Prompt 2 — Workspace Dependency Cleanup

Update `apps/web/package.json` to use workspace linking consistently.

Change:
```json
"@vivah/shared": "file:../../packages/shared"
```

To:
```json
"@vivah/shared": "workspace:*"
```

Then run:
```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm build
```

Commit:
```bash
git add apps/web/package.json pnpm-lock.yaml
git commit -m "chore(web): use workspace shared package dependency"
git push
```

### Prompt 3 — Admin shadcn Completion

Finish reshaping the admin panel with real shadcn/Radix primitives.

Focus:
- AdminShell
- AdminDataTable
- AdminActionMenu
- Verifications
- Media
- Reports
- Payments
- Audit logs

Requirements:
- Use shadcn DropdownMenu, Dialog, AlertDialog, Sheet, Table, Badge, Card, Button.
- Add consistent loading/empty/error states.
- Add audit reason dialogs for destructive/review actions.
- Preserve all admin routes.
- Do not change public/member routes.

Commit:
```bash
git add apps/web/app/admin
git commit -m "feat(admin): complete shadcn operations console"
git push
```

### Prompt 4 — Member UX Regression QA

Run a full member UX regression pass.

Check:
- `/member`
- `/member/matches`
- `/member/activity`
- `/member/messages`
- `/member/profile`
- `/member/profile/edit`
- `/member/verification`
- `/member/subscription`
- `/profiles/[id]`

Fix:
- mobile overflow
- double sidebars
- broken actions
- missing loading states
- inaccessible buttons
- congested cards

Commit:
```bash
git add apps/web/app/member apps/web/app/profiles
git commit -m "fix(member): complete dashboard and discovery qa"
git push
```

### Prompt 5 — CI Workflow

Add GitHub Actions CI.

Workflow:
- checkout
- setup Node 22
- enable corepack
- pnpm install frozen lockfile
- pnpm lint
- pnpm typecheck
- pnpm test
- pnpm build

Commit:
```bash
git add .github/workflows/ci.yml
git commit -m "ci: add monorepo quality gate"
git push
```

## Final Verdict

Vivah Australia is now a serious MVP/full-stack platform with strong feature coverage and a much-improved UX direction.

It is close to demo/client-review ready.

It is not yet production-ready until:
1. build/test/lint/typecheck pass in CI
2. production safety guardrails are enforced
3. mock payment/storage behaviors are disabled in production
4. admin audit workflows are made consistent
5. member and admin UX receive final route/mobile QA

Best next move:
Run the verification gate, then fix the production guardrails before continuing UI polish.
