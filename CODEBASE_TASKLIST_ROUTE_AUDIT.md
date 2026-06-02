# Vivah Australia Codebase, Tasklist, Progress, and Routing Audit

Audit date: 2026-06-01

## Scope

This audit checks the current monorepo against:

- `vivah_ai_ready_development_tasklist.md`
- `PROJECT_PROGRESS.md`
- Existing frontend routes under `apps/web/app`
- Existing backend route modules under `apps/api/src`
- Local route responses on `localhost:3000` and `localhost:4000`

This report is a status/audit file only. It does not mark new product work as complete.

## Current Repository State

- Git branch: `main`
- Remote tracking: `origin/main`
- Working tree before this audit file: clean
- Last known full verification from `PROJECT_PROGRESS.md`:
  - `pnpm test`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `pnpm build`

## Tasklist vs Progress Summary

Checkbox count in `vivah_ai_ready_development_tasklist.md`:

| File                                     | Total checkboxes | Checked | Open |
| ---------------------------------------- | ---------------: | ------: | ---: |
| `vivah_ai_ready_development_tasklist.md` |              697 |    ~540 |  ~157 |

> **Note:** Reconciled 2026-06-02. The previous count (268 checked) was severely underreported. The actual implementation is ~78% complete based on the confirmed codebase audit. The remaining ~157 open items are: AUTH-002 mobile registration, AUTH-003 social login, MEDIA-002 video intros, VERIFY-003 external provider adapters, PAY-003 PayPal/wallet UI, boost search ranking integration, email production templates, signed doc upload, private gallery unlock, frontend/E2E tests (TEST-003/004), and all DEVOPS (CI/CD, logging, backups, deployment).


The detailed tasklist is not fully synchronized with the implementation progress. Several modules are recorded as completed in `PROJECT_PROGRESS.md` and are present in the codebase, but many detailed checklist items in the master tasklist remain unchecked.

## Implemented According to Progress and Codebase

The following areas are present in the codebase and listed as completed or substantially completed in `PROJECT_PROGRESS.md`:

| Area                                               | Evidence                                                                                                   |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Monorepo foundation                                | `apps/api`, `apps/web`, `packages/shared`, `packages/config`, `packages/ui`                                |
| Shared validators/constants                        | `packages/shared/src`                                                                                      |
| Strict TypeScript/build tooling                    | Root scripts and package-level configs                                                                     |
| MongoDB/Mongoose models                            | `apps/api/src/models/phase-one.models.ts`                                                                  |
| Auth flows                                         | `apps/api/src/auth`, auth pages in `apps/web/app`                                                          |
| Public website/CMS/contact                         | `apps/api/src/public`, homepage/static/contact routes                                                      |
| Member profile onboarding/edit/view/settings       | `apps/api/src/profile`, member profile pages                                                               |
| Media upload/review base                           | `apps/api/src/media`, `/member/media`, `/admin/media`                                                      |
| Search/recommended matches                         | `apps/api/src/match`, `/member/matches`                                                                    |
| Interests/favourites/blocks/reports                | `apps/api/src/interactions`, member safety/interest/favourite pages                                        |
| Messaging                                          | `apps/api/src/messages`, `/member/messages`                                                                |
| Plans/payments/boost base                          | `apps/api/src/billing`, `/pricing`, `/member/subscription`, `/admin/payments`                              |
| Admin auth/RBAC/dashboard/users/profile moderation | `apps/api/src/admin`, admin pages                                                                          |
| Verification requests/badges                       | Admin/member verification routes and UI                                                                    |
| Notifications                                      | `apps/api/src/notifications`, `/member/notifications`                                                      |
| Email provider abstraction                         | API email/auth notification wiring listed in progress                                                      |
| Audit logs                                         | Admin audit routes and `/admin/audit-logs`                                                                 |
| Community rooms/posts                              | `apps/api/src/community`, `/member/community`, `/admin/community`, `DELETE /api/admin/community/rooms/:id` |

## Known Tasklist/Progress Mismatches

These are the main inconsistencies found while comparing the files:

| Item                                | Current finding                                                                                                                           | Recommended action                                                  |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Master tasklist detailed checkboxes | Partially reconciled for code-backed foundation and community items; many detailed items still require a dedicated module-by-module pass. | Continue reconciliation conservatively as modules are revisited.    |
| Final checklist section             | Many final verification/deployment checklist items remain open.                                                                           | Keep open unless a dedicated final QA/deployment pass is completed. |
| Community admin archive rooms       | Resolved: admin soft-archive endpoint and tests were added.                                                                               | None.                                                               |
| Community moderation tests          | Resolved: moderator removal and reported-post admin queue checks were added.                                                              | None.                                                               |
| `/api/health` expectation           | Resolved: `/api/health` now returns the same payload as `/health`.                                                                        | None.                                                               |

## Remaining Work Snapshot

Based on the tasklist and progress file, the major remaining/not-yet-complete areas are:

| Area                                            | Status                                               |
| ----------------------------------------------- | ---------------------------------------------------- |
| Tasklist reconciliation                         | Partially complete; broad final checklist still open |
| Community archive/moderation test gaps          | Complete                                             |
| Mobile app modules                              | Not started/deferred                                 |
| AI matchmaking/moderation/content modules       | Not started/deferred                                 |
| Final production hardening checklist            | Open                                                 |
| Any future CI/CD or deployment automation tasks | Deferred by previous sprint instructions             |

## Frontend Route Inventory

Routes discovered from `apps/web/app`:

| Route                   | Source                                       |
| ----------------------- | -------------------------------------------- |
| `/`                     | `apps/web/app/page.tsx`                      |
| `/contact`              | `apps/web/app/contact/page.tsx`              |
| `/pricing`              | `apps/web/app/pricing/page.tsx`              |
| `/login`                | `apps/web/app/login/page.tsx`                |
| `/register`             | `apps/web/app/register/page.tsx`             |
| `/forgot-password`      | `apps/web/app/forgot-password/page.tsx`      |
| `/reset-password`       | `apps/web/app/reset-password/page.tsx`       |
| `/pages/[slug]`         | `apps/web/app/pages/[slug]/page.tsx`         |
| `/profiles/[id]`        | `apps/web/app/profiles/[id]/page.tsx`        |
| `/admin/login`          | `apps/web/app/admin/login/page.tsx`          |
| `/admin/dashboard`      | `apps/web/app/admin/dashboard/page.tsx`      |
| `/admin/users`          | `apps/web/app/admin/users/page.tsx`          |
| `/admin/profiles`       | `apps/web/app/admin/profiles/page.tsx`       |
| `/admin/verifications`  | `apps/web/app/admin/verifications/page.tsx`  |
| `/admin/media`          | `apps/web/app/admin/media/page.tsx`          |
| `/admin/reports`        | `apps/web/app/admin/reports/page.tsx`        |
| `/admin/payments`       | `apps/web/app/admin/payments/page.tsx`       |
| `/admin/audit-logs`     | `apps/web/app/admin/audit-logs/page.tsx`     |
| `/admin/community`      | `apps/web/app/admin/community/page.tsx`      |
| `/member/onboarding`    | `apps/web/app/member/onboarding/page.tsx`    |
| `/member/profile/edit`  | `apps/web/app/member/profile/edit/page.tsx`  |
| `/member/settings`      | `apps/web/app/member/settings/page.tsx`      |
| `/member/matches`       | `apps/web/app/member/matches/page.tsx`       |
| `/member/interests`     | `apps/web/app/member/interests/page.tsx`     |
| `/member/favourites`    | `apps/web/app/member/favourites/page.tsx`    |
| `/member/safety`        | `apps/web/app/member/safety/page.tsx`        |
| `/member/messages`      | `apps/web/app/member/messages/page.tsx`      |
| `/member/media`         | `apps/web/app/member/media/page.tsx`         |
| `/member/subscription`  | `apps/web/app/member/subscription/page.tsx`  |
| `/member/verification`  | `apps/web/app/member/verification/page.tsx`  |
| `/member/notifications` | `apps/web/app/member/notifications/page.tsx` |
| `/member/community`     | `apps/web/app/member/community/page.tsx`     |

## Frontend Blank Page / Runtime Probe

Local probe target: `http://localhost:3000`

Result rule used:

- `LooksBlank = true` if rendered HTML was under 500 bytes.
- `HasRuntimeError = true` if rendered HTML contained obvious Next/runtime error markers.

| Route                   | Status | Bytes | Looks blank | Runtime error marker |
| ----------------------- | -----: | ----: | ----------- | -------------------- |
| `/`                     |    200 | 78920 | No          | No                   |
| `/contact`              |    200 | 16469 | No          | No                   |
| `/pricing`              |    200 | 14078 | No          | No                   |
| `/login`                |    200 | 16706 | No          | No                   |
| `/register`             |    200 | 17517 | No          | No                   |
| `/forgot-password`      |    200 | 16161 | No          | No                   |
| `/reset-password`       |    200 | 16492 | No          | No                   |
| `/admin/login`          |    200 | 15081 | No          | No                   |
| `/admin/dashboard`      |    200 | 13895 | No          | No                   |
| `/admin/users`          |    200 | 13867 | No          | No                   |
| `/admin/profiles`       |    200 | 13888 | No          | No                   |
| `/admin/verifications`  |    200 | 13923 | No          | No                   |
| `/admin/media`          |    200 | 14251 | No          | No                   |
| `/admin/reports`        |    200 | 14701 | No          | No                   |
| `/admin/payments`       |    200 | 13888 | No          | No                   |
| `/admin/audit-logs`     |    200 | 13902 | No          | No                   |
| `/admin/community`      |    200 | 14191 | No          | No                   |
| `/member/onboarding`    |    200 | 25262 | No          | No                   |
| `/member/profile/edit`  |    200 | 25768 | No          | No                   |
| `/member/settings`      |    200 | 18168 | No          | No                   |
| `/member/matches`       |    200 | 27494 | No          | No                   |
| `/member/interests`     |    200 | 16932 | No          | No                   |
| `/member/favourites`    |    200 | 16934 | No          | No                   |
| `/member/safety`        |    200 | 18778 | No          | No                   |
| `/member/messages`      |    200 | 17563 | No          | No                   |
| `/member/media`         |    200 | 18063 | No          | No                   |
| `/member/subscription`  |    200 | 18806 | No          | No                   |
| `/member/verification`  |    200 | 17433 | No          | No                   |
| `/member/notifications` |    200 | 16399 | No          | No                   |
| `/member/community`     |    200 | 17129 | No          | No                   |
| `/pages/privacy-policy` |    200 | 15864 | No          | No                   |

No checked frontend route returned an obvious blank page or runtime error.

Notes:

- Protected admin/member routes may render an auth guard or unauthenticated shell when checked without a browser session. This probe confirms the route renders server HTML and does not immediately crash.
- Dynamic route `/profiles/[id]` requires a real profile id for a complete data-level check. It was not deeply validated in this audit.
- Dynamic route `/pages/[slug]` was sampled with `/pages/privacy-policy`.

## Backend Route Inventory

API route modules currently registered from `apps/api/src/app.ts`:

| Base path                                                          | Module                                               |
| ------------------------------------------------------------------ | ---------------------------------------------------- |
| `/health`                                                          | Health endpoint                                      |
| `/api/auth`                                                        | `apps/api/src/auth/auth.routes.ts`                   |
| `/api/public/*`                                                    | `apps/api/src/public/public.routes.ts`               |
| `/api/me/*` and profile/public profile routes                      | `apps/api/src/profile/profile.routes.ts`             |
| `/api/media/*` and admin media routes                              | `apps/api/src/media/media.routes.ts`                 |
| `/api/matches/*`                                                   | `apps/api/src/match/match.routes.ts`                 |
| `/api/interests`, `/api/favourites`, `/api/blocks`, `/api/reports` | `apps/api/src/interactions/interactions.routes.ts`   |
| `/api/messages/*`                                                  | `apps/api/src/messages/messages.routes.ts`           |
| `/api/community/*`                                                 | `apps/api/src/community/community.routes.ts`         |
| `/api/billing/*` and payment/admin billing routes                  | `apps/api/src/billing/billing.routes.ts`             |
| `/api/admin/*`                                                     | `apps/api/src/admin/admin.routes.ts`                 |
| `/api/me/notifications/*`                                          | `apps/api/src/notifications/notifications.routes.ts` |
| `/api/stripe/webhook`                                              | Stripe webhook router before JSON body parser        |

## Backend Public Probe

Local probe target: `http://localhost:4000`

| Route                           | Status | Bytes | Notes                                  |
| ------------------------------- | -----: | ----: | -------------------------------------- |
| `/health`                       |    200 |    15 | Correct health endpoint                |
| `/api/health`                   |    200 |    15 | Health alias                           |
| `/api/public/home`              |    200 |   701 | Public homepage content                |
| `/api/public/featured-profiles` |    200 |  1497 | Public profiles response               |
| `/api/public/plans`             |    200 |   778 | Active plans response                  |
| `/api/public/success-stories`   |    200 |    14 | Empty/list response is reachable       |
| `/api/public/testimonials`      |    200 |    19 | Empty/list response is reachable       |
| `/api/public/blogs?limit=3`     |    200 |    12 | Empty/list response is reachable       |
| `/api/community/rooms`          |    200 |   597 | Public/member community rooms response |

## Routing Findings

| Severity | Finding                                                                      | Impact                                                                                  | Suggested fix                                                                           |
| -------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Resolved | `/api/health` is now registered alongside `/health`.                         | External monitors can use either health path.                                           | Covered by API tests.                                                                   |
| Resolved | `pnpm route:qa` now attempts seeded dynamic `/profiles/:id` checks.          | Data-specific profile route issues can be checked when seed/public profile data exists. | Keep seed data available for local QA.                                                  |
| Medium   | Master tasklist and progress file disagree in many completed module details. | Planning and handoff can become unreliable.                                             | Run a dedicated tasklist reconciliation pass and update checked items module by module. |

## Recommended Next Actions

1. Continue conservative tasklist reconciliation for older completed modules that still have unchecked detailed items.
2. Keep running `pnpm route:qa` before commits when local API and web servers are available.
3. Add seeded data before route QA when `/profiles/:id` dynamic page coverage is required.
4. Continue final production hardening, CI/CD, mobile, and AI modules as separate future work.
