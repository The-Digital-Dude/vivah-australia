# Vivah Australia — Master Tasklist

This master tasklist consolidates all tasks across the project workspace and classifies them into clear, actionable phases to align with the roadmap: **Must Have Before Beta**, **Nice To Have**, and **Post Launch**.

---

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

These tasks represent the critical path for launch readiness: Core backend engines, security, Stripe compliance, responsive branding, QA/Playwright coverage, and production safety.

| ID | Feature / Task | Type | Owner | Status | Priority | Dependencies | Notes / Source File |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BRD-001** | Create design token constants | Brand | Design | **Completed** | P0 | None | `apps/web/styles/brand-tokens.ts` |
| **BRD-002** | Create brand migration document | Brand | Design | **Completed** | P0 | None | `docs/brand-system-migration.md` |
| **BRD-003** | Update Tailwind config extensions | Brand | Design | **Completed** | P0 | BRD-001 | `apps/web/tailwind.config.ts` |
| **BRD-004** | Import Google Fonts & style body | Brand | Design | **Completed** | P0 | BRD-003 | `apps/web/app/globals.css` |
| **BRD-005** | Refactor design system primitives | Brand | Design | **Completed** | P0 | BRD-004 | `apps/web/app/components/premium-design-system.tsx` |
| **FE-001** | Apply shared premium layouts to pages | Frontend | Dev | **Completed** | P0 | BRD-005 | `UI_UX_TASKLIST.md` |
| **FE-002** | Homepage styling migration | Frontend | Dev | **Completed** | P1 | FE-001 | `home-client.tsx` / `UI_UX_TASKLIST.md` |
| **FE-003** | Public Static & CMS pages migration | Frontend | Dev | **Completed** | P1 | FE-001 | `apps/web/app/about` / `UI_UX_TASKLIST.md` |
| **FE-004** | Auth split-pane responsive redesign | Frontend | Dev | **Completed** | P0 | FE-001 | `apps/web/app/(auth)/login` |
| **FE-005** | Member shell & sidebar navigation | Frontend | Dev | **Completed** | P0 | FE-001 | `member-shell.tsx` |
| **FE-006** | Onboarding progressive stepper flow | Frontend | Dev | **Completed** | P1 | FE-005 | `profile-form.tsx` / `UI_UX_TASKLIST.md` |
| **FE-007** | Match discovery filter-sheet | Frontend | Dev | **Completed** | P1 | FE-005 | `match-discovery.tsx` / `UI_UX_TASKLIST.md` |
| **FE-008** | Verification portal & document uploads | Frontend | Dev | **Completed** | P1 | FE-005 | `verification/page.tsx` |
| **FE-009** | Inbox system & chat window polish | Frontend | Dev | **Completed** | P1 | FE-005 | `member/messages` |
| **FE-010** | Pricing details & subscription cards | Frontend | Dev | **Completed** | P0 | FE-001 | `pricing-client.tsx` |
| **FE-011** | Mobile menu & responsive wrappers | Frontend | Dev | **Completed** | P1 | FE-001 | `premium-design-system.tsx` |
| **CORE-001**| Monorepo and build pipeline foundation | Backend | Dev | **Completed** | P0 | None | `vivah_ai_ready_development_tasklist.md` |
| **CORE-002**| Shared constants and schema validators | Backend | Dev | **Completed** | P0 | CORE-001 | `packages/shared/src` |
| **DB-001**  | Define Phase 1 Mongoose Collections | Backend | Dev | **Completed** | P0 | CORE-002 | `phase-one.models.ts` |
| **DB-002**  | User authorization attributes schema | Backend | Dev | **Completed** | P0 | DB-001 | `phase-one.models.ts` |
| **DB-003**  | Profile matching attributes schema | Backend | Dev | **Completed** | P0 | DB-001 | `phase-one.models.ts` |
| **AUTH-001**| Email and Password Signup endpoint | Backend | Dev | **Completed** | P0 | DB-002 | `apps/api/src/auth` |
| **AUTH-002**| OTP SMS sending & verification gates | Backend | Dev | **Completed** | P0 | DB-002 | `apps/api/src/auth/otp` |
| **AUTH-004**| Refresh token rotation & logout route | Backend | Dev | **Completed** | P0 | AUTH-001 | `apps/api/src/auth` |
| **AUTH-005**| Forgot password token flow & reset | Backend | Dev | **Completed** | P1 | AUTH-001 | `apps/api/src/auth` |
| **WEB-101** | CMS static pages content fetch API | Backend | Dev | **Completed** | P1 | DB-001 | `apps/api/src/public` |
| **WEB-102** | Contact Inquiry storage & Admin email | Backend | Dev | **Completed** | P1 | DB-001 | `apps/api/src/public` |
| **WEB-103** | hCaptcha spam enforcement on public forms | Backend | Dev | **Pending** | P1 | WEB-102 | Production Safety / `vivah_ai_ready_development_tasklist.md` |
| **PROF-001**| Profile step updates & completion calc | Backend | Dev | **Completed** | P0 | DB-003 | `apps/api/src/profile` |
| **PROF-002**| Profile detail visibility & privacy checks | Backend | Dev | **Completed** | P0 | DB-003 | `apps/api/src/profile` |
| **MATCH-101**| Multi-attribute search & visa filtering | Backend | Dev | **Completed** | P0 | DB-003 | `apps/api/src/match` |
| **MSG-101** | Chat conversation lists & inbox | Backend | Dev | **Completed** | P0 | DB-001 | `apps/api/src/messages` |
| **PAY-101** | Stripe product pricing checkouts | Backend | Dev | **Completed** | P0 | DB-001 | `apps/api/src/billing` |
| **PAY-102** | Stripe webhook handlers & plan sync | Backend | Dev | **Completed** | P0 | PAY-101 | Stripe Validation / `apps/api/src/billing/billing.service.ts` |
| **ADM-101** | Admin dashboard statistics compilation | Backend | Dev | **Completed** | P1 | DB-001 | `apps/api/src/admin` |
| **ADM-102** | Verification and Media Review Queues | Backend | Dev | **Completed** | P0 | DB-001 | `apps/api/src/admin` |
| **ADM-103** | Abuse report logs and profiles banning | Backend | Dev | **Completed** | P0 | DB-001 | `apps/api/src/admin` |
| **SYS-101** | In-app notification triggers & status | Backend | Dev | **Completed** | P1 | DB-001 | `apps/api/src/notifications` |
| **SYS-102** | Actionable transaction emails & alerts | Backend | Dev | **Completed** | P1 | None | `apps/api/src/common/email.service.ts` |
| **TST-001** | Core API Controller unit testing | QA | Tester | **Completed** | P0 | CORE-001 | QA / Vitest Suite |
| **TST-002** | Route-level integration test cases | QA | Tester | **Completed** | P0 | TST-001 | QA / Vitest Suite |
| **TST-003** | Playwright frontend browser smoke tests | QA | Tester | **In Progress** | P1 | FE-001 | QA / Playwright E2E |
| **TST-004** | Accessibility contrast & audit verification | QA | Tester | **Completed** | P1 | BRD-002 | Accessibility / `docs/brand-system-migration.md` |
| **DEV-001** | GitHub Actions Automated CI quality gate | DevOps | Dev | **Completed** | P0 | CORE-001 | QA / `.github/workflows/ci.yml` |
| **DEV-004** | MongoDB backup and restore cron | DevOps | Dev | **Pending** | P2 | None | Production Safety / `vivah_ai_ready_development_tasklist.md` |

---

## 📋 Nice To Have

These tasks provide supplementary features, payment flexibility, deployment automation, and additional analytics that are highly beneficial but not strictly blockings for a pilot/beta launch.

| ID | Feature / Task | Type | Owner | Status | Priority | Dependencies | Notes / Source File |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **AUTH-003**| Social login integration (Google/Apple) | Backend | Dev | **Pending** | P2 | DB-002 | Nice To Have / Phase 2 Exclusion |
| **PAY-103** | PayPal payment checks | Backend | Dev | **Pending** | P3 | PAY-101 | Nice To Have / Phase 2 Exclusion |
| **DEV-002** | CD deployment workflow pipelines | DevOps | Dev | **Pending** | P2 | DEV-001 | Nice To Have / Pipeline automation |
| **DEV-003** | Health endpoints & uptime monitoring | DevOps | Dev | **Completed** | P1 | None | Nice To Have / `/health` |

---

## 📋 Post Launch

Advanced matching algorithms, AI features, concierge services, and post-beta scaling optimizations.

| ID | Feature / Task | Type | Owner | Status | Priority | Dependencies | Notes / Source File |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **MATCH-102**| Rules-based Match Score calculation | Backend | Dev | **Completed** | P1 | MATCH-101 | Post Launch / Advanced Matching |
| **MATCH-103**| Profile search ranking boost logic | Backend | Dev | **Completed** | P1 | MATCH-101 | Post Launch / Advanced Matching |
| **MSG-102** | Socket.IO real-time message delivery | Backend | Dev | **Completed** | P1 | MSG-101 | Post Launch / Live Chat Optimization |
| **MSG-103** | Private gallery access unlock check | Backend | Dev | **Completed** | P1 | MSG-101 | Post Launch / Advanced Security |

---

## 📈 Categorized Progress Tracking

*   **Must Have Before Beta**: 40 / 42 Tasks Completed (95.2%)
*   **Nice To Have**: 1 / 4 Tasks Completed (25%)
*   **Post Launch**: 4 / 4 Tasks Completed (100%)
