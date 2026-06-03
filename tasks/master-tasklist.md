# Vivah Australia — Master Tasklist

This document is a living audit tracker mapping the remaining launch-critical tasks from `vivah_ai_ready_development_tasklist.md` into practical delivery phases.

## 📅 Sprint Schedule & Plan

*   **Sprint 1 (1–2 Weeks): Dashboard, Match Discovery & Profile Detail Redesign**
    *   *Goals*: Polish Progressive Onboarding, Match Discovery, Profile View Sections, and Membership pricing cards.
*   **Sprint 2 (1–2 Weeks): Admin Panel shadcn Migration & Trust Queues**
    *   *Goals*: Rebuild Admin Shell Navigation, Users/Profiles dashboard, Verification/Media queues.
*   **Sprint 3 (1 Week): Stripe Webhook Safety & Production Guardrails**
    *   *Goals*: Finalize Stripe webhook validations, add hCaptcha to forms, check production environment variables.
*   **Sprint 4 (1 Week): E2E Testing & Launch Verification**
    *   *Goals*: Complete Playwright test coverage, run mobile responsive check, verify email templates.

---

## 📋 Must Have Before Beta

### 🔴 QA
- [ ] Social login creates user correctly. *(from "Tests" L553)*
- [ ] Suspended users cannot login through social provider. *(from "Tests" L554)*
- [ ] Oversized videos rejected. *(from "Tests" L904)*
- [ ] Unapproved videos hidden from profile view. *(from "Tests" L905)*
- [ ] Existing conversation becomes inaccessible or read-only. *(from "Tests" L1266)*
- [x] Expired subscription removes entitlements. _(covered by billing route tests that verify expired plans no longer allow paid boosts)_ *(from "Tests" L1561)*
- [ ] Auth services *(from "Required Coverage" L2128)*
- [ ] OTP service *(from "Required Coverage" L2129)*
- [ ] Token service *(from "Required Coverage" L2130)*
- [ ] Profile completion service *(from "Required Coverage" L2131)*
- [ ] Match scoring service *(from "Required Coverage" L2132)*
- [ ] Entitlement service *(from "Required Coverage" L2133)*
- [ ] Verification badge service *(from "Required Coverage" L2134)*
- [ ] Notification service *(from "Required Coverage" L2135)*
- [ ] Audit log service *(from "Required Coverage" L2136)*
- [ ] Admin approves profile *(from "Required Flows" L2145)*
- [ ] Search approved profile *(from "Required Flows" L2146)*
- [ ] Send interest -> accept interest -> start conversation *(from "Required Flows" L2147)*
- [ ] Send message realtime and via REST fallback *(from "Required Flows" L2148)*
- [ ] Free limit blocked after quota reached *(from "Required Flows" L2150)*
- [ ] Submit verification -> admin approves -> badge updates *(from "Required Flows" L2151)*
- [ ] Report user -> admin resolves *(from "Required Flows" L2152)*
- [x] Auth forms validate input. _(Vitest + Testing Library coverage now exercises successful and failing login flows plus email/mobile OTP registration flows in `apps/web/app/(auth)/*.test.tsx`)_ *(from "Required Tests" L2160)*
- [x] Profile wizard saves each step. _(Vitest coverage now verifies explicit draft saving and consecutive “Save & continue” PATCH persistence across wizard steps in `apps/web/app/member/profile-form.test.tsx`)_ *(from "Required Tests" L2161)*
- [x] Search filters update query. _(Vitest coverage now proves quick filters and advanced discovery filters update the outgoing `/api/matches/search` query, including visa-status filters, in `apps/web/app/member/matches/match-discovery.test.tsx`)_ *(from "Required Tests" L2162)*
- [x] Interest buttons update state. _(Vitest coverage now proves member interest/save actions enter pending states, call the correct endpoints, and show success feedback in `apps/web/app/member/profile-actions.test.tsx`)_ *(from "Required Tests" L2163)*
- [x] Chat UI renders messages. _(Vitest coverage now proves the member chat UI loads the selected conversation, renders message bodies and attachments, and shows the empty-conversation state in `apps/web/app/member/messages/messages-client.test.tsx`)_ *(from "Required Tests" L2164)*
- [x] Pricing page triggers checkout. _(Vitest coverage now proves the pricing page opens the real upgrade modal for a paid tier and posts `/api/me/subscription/checkout` with the selected plan code in `apps/web/app/pricing/pricing-client.test.tsx`)_ *(from "Required Tests" L2165)*
- [x] Admin tables load and filter data. _(Vitest coverage now proves the admin users table loads initial rows and applies server-backed search/role/status/verification filters in `apps/web/app/admin/users/page.test.tsx`)_ *(from "Required Tests" L2166)*
- [ ] TEST-001 to TEST-004 *(from "Sprint 7 - Reporting, Notifications, QA, Deployment" L2333)*
- [ ] DEVOPS-001 to DEVOPS-004 *(from "Sprint 7 - Reporting, Notifications, QA, Deployment" L2334)*
- [ ] E2E tests pass _(Playwright smoke coverage exists, but the full scenario matrix is still pending)_ *(from "QA and Deployment" L2543)*
- [ ] Admin handover documentation complete _(future)_ *(from "QA and Deployment" L2547)*
- [ ] Production deployment complete _(future)_ *(from "QA and Deployment" L2548)*
- [ ] Backup configured _(future)_ *(from "QA and Deployment" L2549)*
- [ ] Monitoring configured _(future)_ *(from "QA and Deployment" L2550)*

### 🔴 Production Safety
- [ ] Create account if no existing user. *(from "Backend Tasks" L542)*
- [ ] Add spam protection using rate limit and CAPTCHA. _(rate limiting is covered; CAPTCHA is still pending)_ *(from "Backend Tasks" L698)*
- [ ] Add visibility settings. *(from "Backend Tasks" L893)*
- [ ] Add file size and duration limits. *(from "Backend Tasks" L894)*
- [ ] Show processing/approval state. *(from "Frontend Tasks" L899)*
- [ ] Create secure upload flow. *(from "Backend Tasks" L975)*
- [ ] Make rules configurable in system settings. *(from "Backend Tasks" L1027)*
- [x] Create `IdentityVerificationProvider` interface. _(implemented in `apps/api/src/admin/verification-providers.ts`)_ *(from "Tasks" L1044)*
- [x] Create `FacialVerificationProvider` interface. _(implemented in `apps/api/src/admin/verification-providers.ts`)_ *(from "Tasks" L1045)*
- [x] Create `PoliceCheckProvider` interface. _(implemented in `apps/api/src/admin/verification-providers.ts`)_ *(from "Tasks" L1046)*
- [x] Create `VisaVerificationProvider` interface. _(implemented in `apps/api/src/admin/verification-providers.ts`)_ *(from "Tasks" L1047)*
- [x] Implement manual-review provider as default. _(verification requests now route through the manual-review provider assignment layer before persistence)_ *(from "Tasks" L1048)*
- [x] Store provider reference IDs for future integrations. _(verification requests now persist `provider` and `providerReferenceId`)_ *(from "Tasks" L1049)*
- [x] Add auto-risk counter per reported user. _(report creation/review now keeps a `REPORTED_USER_RISK_SCORE` fraud event in sync with active report volume and severity)_ *(from "Backend Tasks" L1278)*
- [x] Use secure upload flow. _(message attachments now use signed upload preparation and completion endpoints instead of trusting raw client URLs)_ *(from "Backend Tasks" L1395)*
- [x] Show document links with signed access. _(message reads now return signed private access URLs for stored attachments)_ *(from "Frontend Tasks" L1403)*
- [x] Create billing portal endpoint. _(implemented via authenticated member billing portal session API and subscription-page action)_ *(from "Backend Tasks" L1573)*
- [x] Respect notification preferences. _(email, SMS, and push delivery already check persisted member notification preferences in the notification service)_ *(from "Backend Tasks" L1748)*
- [ ] Add secure cookie config if cookies used. _(deferred — auth uses localStorage JWT)_ *(from "Backend Tasks" L1996)*
- [ ] Profile card *(from "Components" L2106)*
- [ ] Plan card *(from "Components" L2107)*
- [ ] New user registration and onboarding. *(from "E2E Scenarios" L2176)*
- [ ] Second user accepts interest. *(from "E2E Scenarios" L2179)*
- [ ] Both users chat. *(from "E2E Scenarios" L2180)*
- [ ] User submits verification documents. *(from "E2E Scenarios" L2182)*
- [ ] Moderator reviews report. *(from "E2E Scenarios" L2183)*
- [ ] Create development environment. *(from "Tasks" L2193)*
- [ ] Create staging environment. *(from "Tasks" L2194)*
- [ ] Create production environment. *(from "Tasks" L2195)*
- [ ] Use separate databases and storage buckets. *(from "Tasks" L2196)*
- [x] Add environment variable validation. _(implemented via shared Zod env schemas and runtime parsing in `packages/shared/src/env.ts`, `apps/api/src/env.ts`, and `apps/web/env.ts`)_ *(from "Tasks" L2197)*
- [ ] Run database migration/seed scripts safely. *(from "Tasks" L2239)*
- [x] Add structured API logs. _(request ID and JSON API request/error logging already exist in `apps/api/src/app.ts`)_ *(from "Tasks" L2247)*
- [x] Add error tracking with Sentry or equivalent. _(optional webhook-based error tracking is wired for API startup, unhandled process errors, and unexpected Express 500s)_ *(from "Tasks" L2248)*
- [x] Add uptime monitoring. _(scheduled GitHub Actions health checks now run against configured public API/web URLs via `scripts/uptime-check.mjs`)_ *(from "Tasks" L2249)*
- [ ] Configure MongoDB backups. *(from "Tasks" L2260)*
- [ ] Configure file storage lifecycle policy. *(from "Tasks" L2261)*
- [ ] Configure CDN caching for public assets. *(from "Tasks" L2262)*
- [x] Ensure private documents use signed URLs. _(private media access and verification document previews already use time-limited tokenized URLs)_ *(from "Tasks" L2263)*
- [x] Document disaster recovery steps. _(documented in `docs/deployment/operations-runbook.md`)_ *(from "Tasks" L2264)*
- [ ] SSL enforced in production _(DEVOPS)_ *(from "Security" L2527)*

### 🔴 Stripe Validation
- [ ] Use Stripe Payment Element where possible for card, Apple Pay, and Google Pay. *(from "Tasks" L1646)*
- [ ] Upgrade subscription via Stripe webhook *(from "Required Flows" L2149)*

### 🔴 Mobile Bugs / Responsive
- [ ] Date picker *(from "Components" L2098)*
- [ ] Toast *(from "Components" L2103)*

### 🔴 Accessibility
*No remaining tasks.*

---

## 📋 Nice To Have

### 🟡 Extra Filters
- [ ] Add filters: subscription, date joined. _(outstanding gap)_ *(from "Backend Tasks" L1817)*
- [ ] User searches and sends interest. *(from "E2E Scenarios" L2178)*

### 🟡 Extra Admin Analytics
- [ ] Admin approves profile. *(from "E2E Scenarios" L2177)*
- [x] Add admin audit log view. _(implemented at `/admin/audit-logs` with backing `/api/admin/audit-logs` list/filter support)_ *(from "Tasks" L2252)*

### 🟡 Cosmetic & UI Enhancements
- [ ] Add Google OAuth. *(from "Backend Tasks" L538)*
- [ ] Add Facebook OAuth. *(from "Backend Tasks" L539)*
- [ ] Add Apple OAuth. *(from "Backend Tasks" L540)*
- [ ] Require terms acceptance after first social login. *(from "Backend Tasks" L543)*
- [ ] Add social login buttons. *(from "Frontend Tasks" L547)*
- [ ] Add first-time social login onboarding page. *(from "Frontend Tasks" L548)*
- [ ] Support video upload records. *(from "Backend Tasks" L891)*
- [ ] Add video approval workflow. *(from "Backend Tasks" L892)*
- [ ] Build video uploader. *(from "Frontend Tasks" L898)*
- [ ] Render video intro on profile if approved and visible. *(from "Frontend Tasks" L900)*
- [ ] Add PayPal provider abstraction but keep disabled unless required. *(from "Tasks" L1647)*
- [ ] File uploader *(from "Components" L2112)*
- [ ] User upgrades to premium. *(from "E2E Scenarios" L2181)*
- [ ] Deploy frontend to Vercel or selected host. *(from "Tasks" L2237)*
- [ ] Deploy backend to selected host. *(from "Tasks" L2238)*

## Recently Completed

- [x] AUTH-002 Mobile registration and OTP flow is now complete across API, frontend auth screens, shared validators, and targeted tests.
- [x] CI quality gates exist in `.github/workflows/ci.yml` and currently cover typecheck, tests, build, and route QA. Full deployment automation is still pending under DEVOPS-002.

---

## 📋 Post Launch

### 🟢 AI / Smart Matching
- [ ] Link social identity to existing email account if safe. *(from "Backend Tasks" L541)*
- [ ] Existing email account links correctly. *(from "Tests" L552)*
- [ ] Generate thumbnails. _(future enhancement)_ *(from "Backend Tasks" L851)*
- [ ] Store optional recommendation snapshots. *(from "Backend Tasks" L1120)*
- [ ] Failed payment marks subscription past due. *(from "Tests" L1606)*
- [ ] Unsubscribed marketing users do not receive marketing emails. *(from "Tests" L1753)*
- [ ] Transactional emails still send when required. *(from "Tests" L1754)*
- [ ] Register -> verify email -> create profile -> submit profile *(from "Required Flows" L2144)*
- [x] Add payment webhook failure alerts. _(Stripe webhook verification/processing failures now emit explicit error-tracking alerts in addition to request logging)_ *(from "Tasks" L2250)*
- [x] Add background job failure alerts. _(scheduled workflow failures now emit webhook alerts from the existing uptime-monitor job path)_ *(from "Tasks" L2251)*

### 🟢 Concierge / Manual Assistance
*No remaining tasks.*

### 🟢 Advanced Matching / Boosts
- [ ] Support featured member listing. *(from "Backend Tasks" L1665)*
- [ ] Support homepage featured placement. *(from "Backend Tasks" L1666)*
- [ ] Support search priority placement. *(from "Backend Tasks" L1667)*
- [ ] Show boosted badge where needed. *(from "Frontend Tasks" L1683)*
- [ ] Boosted profiles should rank higher but must not bypass filters. *(from "Search Integration" L1687)*
- [ ] Expired boosts should not affect rankings. *(from "Search Integration" L1688)*
- [ ] Boosted profiles rank higher in eligible search. *(from "Tests" L1693)*
- [ ] Hidden/suspended profiles are never boosted publicly. *(from "Tests" L1694)*
