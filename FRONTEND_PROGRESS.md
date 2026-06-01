# Frontend Progress

Last updated: 2026-06-02

## Public & Member Frontend Alignment Sprint

### FE-001 - Audit Current Frontend

Status: Complete

This audit covers non-admin frontend surfaces only. Admin routes and admin panel files were intentionally left out of scope.

## Current File Map

### Public routes

- Homepage: `apps/web/app/page.tsx`, `apps/web/app/home-client.tsx`
- Contact page: `apps/web/app/contact/page.tsx`, `apps/web/app/contact/contact-form.tsx`
- CMS/static fallback pages: `apps/web/app/pages/[slug]/page.tsx`
- Pricing page: `apps/web/app/pricing/page.tsx`, `apps/web/app/pricing/pricing-client.tsx`
- Public profile detail: `apps/web/app/profiles/[id]/page.tsx`
- Root layout/provider: `apps/web/app/layout.tsx`, `apps/web/app/auth-context.tsx`, `apps/web/app/globals.css`

### Auth routes

- Shared auth shell and controls: `apps/web/app/(auth)/auth-shell.tsx`, `apps/web/app/(auth)/form-field.tsx`, `apps/web/app/(auth)/submit-button.tsx`
- Login: `apps/web/app/(auth)/login/page.tsx`
- Register: `apps/web/app/(auth)/register/page.tsx`
- Forgot password: `apps/web/app/(auth)/forgot-password/page.tsx`
- Reset password: `apps/web/app/(auth)/reset-password/page.tsx`
- Missing route found during audit: `/verify-email`

### Member routes

- Member shell/layout: `apps/web/app/member/member-shell.tsx`
- Match discovery/search: `apps/web/app/member/matches/page.tsx`, `apps/web/app/member/matches/match-discovery.tsx`
- Onboarding/profile editing: `apps/web/app/member/onboarding/page.tsx`, `apps/web/app/member/profile/edit/page.tsx`, `apps/web/app/member/profile-form.tsx`
- Member profile actions: `apps/web/app/member/profile-actions.tsx`
- Verification: `apps/web/app/member/verification/page.tsx`
- Notifications: `apps/web/app/member/notifications/page.tsx`
- Interests: `apps/web/app/member/interests/page.tsx`, `apps/web/app/member/interests/interests-manager.tsx`
- Favourites: `apps/web/app/member/favourites/page.tsx`, `apps/web/app/member/favourites/favourites-manager.tsx`
- Recently viewed: `apps/web/app/member/recently-viewed/page.tsx`
- Messages: `apps/web/app/member/messages/page.tsx`, `apps/web/app/member/messages/messages-client.tsx`
- Media: `apps/web/app/member/media/page.tsx`, `apps/web/app/member/media/media-manager.tsx`
- Community: `apps/web/app/member/community/page.tsx`
- Subscription: `apps/web/app/member/subscription/page.tsx`
- Settings: `apps/web/app/member/settings/page.tsx`
- Safety: `apps/web/app/member/safety/page.tsx`, `apps/web/app/member/safety/safety-manager.tsx`
- Missing route found during audit: member dashboard at `/member`

### Shared components and APIs

- Shared UI package: `packages/ui/src/index.tsx`
- Public API helpers: `apps/web/lib/public-api.ts`
- Member API helpers: `apps/web/lib/member-api.ts`
- Auth API helpers: `apps/web/lib/auth-api.ts`

## Existing Reusable Components

- `@vivah/ui`: `cx`, `uiTokens`, `PageHeader`, `MetricCard`, `EmptyState`, `Button`, `TextInput`, `SelectInput`, `Checkbox`, `Badge`, `Modal`, `Drawer`, `Tabs`, `LoadingSkeleton`, `Pagination`, `Avatar`, `DataTable`
- Auth-local components: `AuthShell`, `FormField`, `SubmitButton`
- Member-local components: `MemberShell`, `ProfileActions`, `UpgradeModal`
- Page-local profile card implementations exist in homepage and match discovery, but they are not yet shared.

## Pages Needing Redesign Or Alignment

- Homepage already has a premium visual direction, but colors vary from the sprint palette and header/footer are page-local.
- Static/CMS pages and contact page are plain white/neutral layouts and need premium static page components.
- Public profile detail page is minimal, uses `/profiles/[id]`, and lacks the requested profile hero, sticky actions, gallery, and detailed sections.
- Auth pages are inconsistent: login uses a standalone custom card while register/forgot/reset use `AuthShell`.
- Member shell uses neutral dashboard styling and a sidebar-only structure rather than the requested public/member premium layout.
- Match discovery has useful filters and cards but needs a shared card, tabs, mobile drawer, and clickable-card navigation.
- Onboarding/profile edit uses a single long form instead of a stepper/progress workflow.
- Verification and notifications pages are functional but visually plain and missing richer empty/loading/status states.
- Membership/pricing exists but needs alignment with Free, Premium, Gold, and Platinum plan cards and current-plan states.

## Missing Components For Sprint

- `PremiumButton`
- `PremiumCard`
- `PageHero`
- `SectionHeader`
- `ProfileMatchCard`
- `ProfileDetailSection`
- `VerificationBadge`
- `MatchScoreBadge`
- `LoadingState`
- `FormField`
- `SelectField`
- `FilterDrawer`
- `StaticPageLayout`
- `MemberPageLayout`
- `PublicHeader`
- `PublicFooter`
- Static-page helpers: `StaticPageHero`, `StaticPageContainer`, `PolicyContentCard`, `FAQAccordion`, `ContactCard`, `HelpCategoryCard`

## Implementation Order

1. FE-002: Add the shared public/member design system components without touching admin UI.
2. FE-003: Replace page-local public/member shells with shared public/member layouts while keeping `/admin/*` separate.
3. FE-004: Consolidate profile cards into clickable shared `ProfileMatchCard`.
4. FE-005: Upgrade `/profiles/[slug]` or compatible profile detail routing and preserve `/profiles/[id]` fallback behavior.
5. FE-006 through FE-007: Align static and auth pages using the new layouts/components.
6. FE-008 through FE-012: Align member dashboard, onboarding, match discovery, verification, and notifications.
7. FE-013: Polish membership/pricing.
8. FE-014: Final QA across desktop/mobile routes.

## Verification

- FE-001 is documentation-only. No frontend UI or TypeScript source files were changed.
