# Vivah Australia - Security & Architecture Audit Report

> [!WARNING]
> This codebase contains several critical launch-blocking vulnerabilities spanning broken authorization models, mocked verification services, token management bugs, and disjointed backend-frontend API contracts. Do not deploy to production until Phase 1 fixes are completed.

## A. Executive Summary

- **Production-Ready:** No.
- **Biggest Launch Blockers:** `requireAdmin` logic is fundamentally broken in key billing routes, and `userRole` persistence fails on page reloads causing broken frontend routing.
- **Biggest Security Risks:** Admin permission checks bypasses, and incomplete mock KYC verification meaning anyone can bypass verification.
- **Biggest User Trust Risks:** Mock services used for KYC verify any user automatically, breaking trust.
- **What will break first:** Any admin modifying billing/plans will likely break if they rely on `requireAdmin()` correctly. Also, standard users will be kicked out of authenticated routes if they refresh because the cookie-based token parser fails.
- **Overall Risk Rating:** **CRITICAL**

---

## B. Critical Issues Table

| Priority | Severity | Area | File/Route | Issue | Why It Matters | Fix Summary |
|----------|----------|------|------------|-------|----------------|-------------|
| 1 | CRITICAL | Auth/Authz | `apps/api/src/billing/billing.routes.ts` | `requireAdmin(request)` called as a bare function without next(). | Bypasses admin checks completely or crashes the node process. | Use `requireAdmin` as middleware in the route definition, not inside the handler. |
| 1 | CRITICAL | Verification | `apps/api/src/verification/kyc.service.ts` | KYC and Liveness checks are entirely mocked. | Users can verify accounts instantly without actual documents, undermining the entire platform trust model. | Implement a real provider (SumSub/Onfido) and verify webhooks securely. |
| 2 | HIGH | Frontend | `apps/web/app/auth-context.tsx` | `roleFromToken` fails when parsing the string `'cookie-based'`. | Refreshing the page wipes the user's role from context, kicking them out of role-protected pages. | Persist the user's role independently in localStorage or fetch from `/api/auth/me`. |
| 2 | HIGH | Media/Uploads | `apps/api/src/media/media.service.ts` | Mock Cloudinary provider implemented if keys are missing. | If Cloudinary keys are missing in prod, uploads fail silently into mock endpoints. | Add strict startup environment validation for Cloudinary credentials. |

---

## C. Detailed Audit

### 1. Architecture
- **Monorepo Structure:** The pnpm setup is standard. Shared packages (`@vivah/shared`) are well-used. 
- **Separation of Concerns:** `public.routes.ts` contains administrative CMS routes (`/admin/cms/pages`, etc.), violating basic separation of concerns. CMS routes should be isolated in `cms.routes.ts`.
- **Repeated Logic:** `requireAdminRole` is duplicated across `public.routes.ts` and `media.routes.ts` instead of importing `requireAdmin` from `auth.middleware.ts`.

### 2. Frontend (apps/web)
- **Role Persistence:** `auth-context.tsx` sets the token to `'cookie-based'` when `refreshToken` is used. However, `useEffect` attempts to run `JSON.parse(atob(token.split('.')[1]))` on `'cookie-based'`, which fails. The `userRole` reverts to `null` on refresh.
- **Route Protection:** Next.js lacks `middleware.ts`. All route protection depends on `auth-context.tsx` rendering checks. This risks momentary flashes of protected content or API calls firing before redirect.

### 3. Backend/API (apps/api)
- **Broken Middleware Execution:** In `billing.routes.ts`, `requireAdmin(request)` is executed inside the route handler. `requireAdmin` from `auth.middleware.ts` returns a middleware function `(req, res, next) => void`. By passing only `request` (because the local function shadows it), it bypasses unified role management.
- **Silent Catch:** `auth.middleware.ts` catches `verifyAccessToken` errors but `next(error)` can sometimes mask exact token issues.

### 4. Database/Mongoose
- **Soft Delete Logic:** Handled correctly via `isDeleted: boolean`. However, uniqueness constraints (e.g. unique emails) need to account for soft deletes (e.g. compound index `{ email: 1, isDeleted: 1 }`), which requires further verification in `user.model.ts`.

### 5. Authentication & Authorization
- **Role Creep:** Admin routes are littered with manually duplicated `if (role !== UserRole.ADMIN) throw...` instead of unified middleware.

### 6. Security
- **API Rate Limiting:** Exists on `/public/contact` but not visibly standardized across login, signup, or password reset routes.
- **Mock Webhooks:** KYC webhooks (`processKycWebhook`) have no signature validation. An attacker can POST to this webhook and verify any `userId`.

### 7. Stripe / Billing
- **Mock Fallbacks:** Stripe mock checkout loops exist. If `STRIPE_SECRET_KEY` is missing in prod, the app silently falls back to generating mock sessions. 

### 8. Socket.IO / Realtime Messaging
- **Auth:** `socket.io` validates access tokens correctly.
- **Room Isolation:** `conversation:join` strictly validates via `getConversationForUser()` which checks `{ _id: conversationId, participantIds: userId }`. This is implemented securely.

### 9. Product Logic
- **Trust Breaking:** Because the KYC service is mocked, the entire "trusted platform" premise is vulnerable on day 1.

### 10. AI Code Smells
- `provider: 'mock'` in media, messages, KYC.
- `console.warn` inside error boundaries rather than proper APM logging.

---

## D. Frontend Route Map

| Frontend Route | Purpose | API Used | Protected? | Working? | Issues |
|----------------|---------|----------|------------|----------|--------|
| `/member` | Member dashboard | `/api/me` | Client-only | Unstable | Refreshes drop user role. |
| `/member/subscription` | Payments | `/api/billing/...` | Client-only | Yes | - |
| `/admin` | CMS/Dashboard | `/api/admin/...`| Client-only | Unstable | Dependent on `userRole` bug. |

---

## E. Backend Endpoint Map

| Endpoint | Method | Purpose | Auth | Authorization | Validation | Risks |
|----------|--------|---------|------|---------------|------------|-------|
| `/admin/plans` | POST | Create plan | Yes | **BROKEN** | Zod | `requireAdmin(req)` fails to halt execution. |
| `/admin/cms/pages` | POST | Create CMS | Yes | Manual | Zod | Duplicated auth logic. |
| `/public/contact` | POST | Inquiry | No | None | Zod | Safe (uses rate limiting & hCaptcha). |
| `/api/verification/webhook` | POST | KYC Status | No | **NONE** | None | Accepts any POST to verify a user. |

---

## F. Fix Roadmap

**Phase 1: Must fix before launch**
- Fix the `requireAdmin` middleware usage in `billing.routes.ts`.
- Fix the `auth-context.tsx` parsing bug for `'cookie-based'` strings to prevent role-dropping on refresh.
- Disable or secure the mock KYC webhooks to prevent forced account verifications.

**Phase 2: Should fix before beta**
- Move CMS admin endpoints out of `public.routes.ts` into an `admin.routes.ts`.
- Create a Next.js `middleware.ts` for strict server-side route protection.

---

## G. Codex-Friendly Fix Prompts

### 1. Fix requireAdmin Middleware Bug
**Goal:** Fix the broken admin authorization in `billing.routes.ts`.
**Files to inspect:** `apps/api/src/billing/billing.routes.ts`, `apps/api/src/auth/auth.middleware.ts`
**Exact Expected Behavior:** `requireAdmin` should be used as a standard Express middleware in the route definition chain (like `requireAuth(config)`), NOT invoked inside `asyncHandler`.
**Security Requirements:** The route MUST block non-admins before executing the handler.
**Warning:** Do not break the `requireAuth` execution order.

### 2. Fix Auth Context Role Bug
**Goal:** Prevent users from losing their role on page refresh.
**Files to inspect:** `apps/web/app/auth-context.tsx`
**Exact Expected Behavior:** If the `token` is `'cookie-based'`, do not attempt to `atob()` it. Instead, either hit a `/api/auth/me` endpoint to hydrate the context or persist the role explicitly in `localStorage` under `auth_role`.
**Warning:** Ensure that if `localStorage` role differs from the real role, the app corrects itself.

---

## H. Launch Checklist

- [ ] **Security:** Next.js route middleware implemented.
- [ ] **Auth:** `auth-context` refresh bug resolved.
- [ ] **Authorization:** `requireAdmin` middleware applied correctly to all admin routes.
- [ ] **Payments:** Stripe webhooks validated properly.
- [ ] **Verification:** Real SumSub/Onfido integration replacing mock services.
- [ ] **Deployment:** Enforce required environment variables (e.g. `CLOUDINARY_API_KEY`).
