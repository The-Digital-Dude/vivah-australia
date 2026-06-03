# UI/UX Tasklist

Last updated: 2026-06-03

## Sprint Scope

Public-facing and member-facing frontend only. Admin panel UI, admin routes, and backend business logic are out of scope unless a later frontend navigation task requires a narrow integration change.

## Design System Baseline

- Primary Burgundy: `#7A1F2B`
- Gold Accent: `#D4AF37`
- Ivory Background: `#FCFAF7`
- Surface White: `#FFFFFF`
- Text: `#1A1A1A`
- Muted Text: `#6B7280`
- Soft Blush: `#F8E8E8`

## FE-001 Audit Findings

### Current File Map

- Homepage: `apps/web/app/page.tsx`, `apps/web/app/home-client.tsx`
- Static/CMS pages: `apps/web/app/pages/[slug]/page.tsx`
- Contact page: `apps/web/app/contact/page.tsx`, `apps/web/app/contact/contact-form.tsx`
- Pricing page: `apps/web/app/pricing/page.tsx`, `apps/web/app/pricing/pricing-client.tsx`
- Public profile detail: `apps/web/app/profiles/[id]/page.tsx`
- Auth pages: `apps/web/app/(auth)/login/page.tsx`, `apps/web/app/(auth)/register/page.tsx`, `apps/web/app/(auth)/forgot-password/page.tsx`, `apps/web/app/(auth)/reset-password/page.tsx`
- Auth shared files: `apps/web/app/(auth)/auth-shell.tsx`, `apps/web/app/(auth)/form-field.tsx`, `apps/web/app/(auth)/submit-button.tsx`
- Member layout: `apps/web/app/member/member-shell.tsx`
- Member matches: `apps/web/app/member/matches/page.tsx`, `apps/web/app/member/matches/match-discovery.tsx`
- Member onboarding/edit: `apps/web/app/member/onboarding/page.tsx`, `apps/web/app/member/profile/edit/page.tsx`, `apps/web/app/member/profile-form.tsx`
- Member verification: `apps/web/app/member/verification/page.tsx`
- Member notifications: `apps/web/app/member/notifications/page.tsx`
- Member saved/social workflows: `apps/web/app/member/interests`, `apps/web/app/member/favourites`, `apps/web/app/member/recently-viewed`, `apps/web/app/member/messages`, `apps/web/app/member/community`, `apps/web/app/member/media`, `apps/web/app/member/safety`
- Shared UI package: `packages/ui/src/index.tsx`

### Existing Reusable Components

- Shared UI primitives exist in `packages/ui/src/index.tsx`: buttons, inputs, select, checkbox, badge, modal, drawer, tabs, skeleton, pagination, avatar, empty state, data table, page header, metric card, and token helpers.
- Auth flow has local `AuthShell`, `FormField`, and `SubmitButton`.
- Member flow has local `MemberShell`, `ProfileActions`, and `UpgradeModal`.
- Profile cards are duplicated/page-local in homepage and match discovery.

### Pages Needing Redesign

Historical FE-001 audit note: several items below have since been completed and are tracked in the Task Status table.

- Static/CMS and contact pages need the ivory/burgundy/gold premium layout.
- Auth pages need one split premium layout and consistent form controls.
- Public profile detail needs full section coverage, media treatment, verification state, and action layout.
- Match discovery needs shared clickable profile cards, tabbed discovery, and mobile filter drawer.
- Member onboarding/edit needs step-by-step workflow.
- Verification and notifications need premium status cards, empty states, and loading states.
- Member dashboard route was missing during the initial audit and has since been redesigned for FE-008.
- `/verify-email` was missing during the initial audit and has since been implemented for FE-007.

### Missing Components

Historical FE-001 audit note: the component inventory below has since been implemented in the web-local premium design system.

- `PremiumButton`, `PremiumCard`, `PageHero`, `SectionHeader`
- `ProfileMatchCard`, `ProfileDetailSection`, `VerificationBadge`, `MatchScoreBadge`
- `EmptyState`, `LoadingState`, `FormField`, `SelectField`, `FilterDrawer`
- `StaticPageLayout`, `MemberPageLayout`, `PublicHeader`, `PublicFooter`
- Static helpers: `StaticPageHero`, `StaticPageContainer`, `PolicyContentCard`, `FAQAccordion`, `ContactCard`, `HelpCategoryCard`

## Task Status

| Task   | Status   | Notes                                                                                                                                                                  |
| ------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FE-001 | Complete | Frontend route/component audit completed; no UI changed.                                                                                                               |
| FE-002 | Complete | Added web-local reusable public/member premium component module.                                                                                                       |
| FE-003 | Complete | Shared public/member header, footer, container spacing, ivory background, and mobile drawer applied to non-admin layout surfaces.                                      |
| FE-004 | Complete | Homepage, match discovery, favourites, interests, and recently viewed profile cards now navigate to profile detail pages with action buttons kept separate.            |
| FE-005 | Complete | Premium public profile detail page now includes hero, sticky/mobile actions, full profile sections, verification state, and locked private gallery messaging.          |
| FE-006 | Complete | Aligned static public pages using the premium brand layout and reusable components (StaticPageHero, FAQAccordion, ContactCard, etc.) with dynamic CMS API integration. |
| FE-007 | Complete | Aligned authentication and password recovery pages under the premium dynamic split-screen layout, and created a dedicated auto-verifying /verify-email route.          |
| FE-008 | Complete | Member dashboard shell, command-center layout, activity hub, and mobile navigation polish have been implemented.                                                     |
| FE-009 | Complete | Onboarding/profile editing now uses a lighter progressive-disclosure flow with optional-detail sections and stronger save feedback.                                  |
| FE-010 | Complete | Match discovery now uses top-level quick filters, visa filtering, better empty states, shared trust-rich cards, and responsive filter-sheet behavior.               |
| FE-011 | Complete | Verification page now uses premium trust cards, OTP/document flows, clearer status treatment, and stronger empty/loading states.                                     |
| FE-012 | Complete | Notifications page now uses premium inbox tabs, clearer status/action treatment, and improved empty states.                                                          |
| FE-013 | Complete | Membership/pricing page now includes the redesigned premium funnel, billing toggle, comparison table, trust/social proof/FAQ, and sticky mobile CTA.                |
| FE-014 | Complete | Route QA and Playwright smoke checks were run across the redesigned public/member flows, and a login redirect regression found during QA was fixed.                  |

## Implementation Order

1. Apply shared layout to non-admin public/member routes.
2. Replace duplicated profile card implementations.
3. Build profile detail sections.
4. Align public static/auth/pricing pages.
5. Align member dashboard and workflow pages.
6. Complete final route/mobile QA.

## FE-002 Component Inventory

- Created `apps/web/app/components/premium-design-system.tsx`.
- Created `apps/web/app/components/index.ts`.
- Included reusable buttons, cards, page heroes, section headers, profile cards, detail sections, badges, empty/loading states, fields, filter drawer, static/member layouts, public header, and public footer.
- Admin panel components and admin route files were not changed.

## FE-003 Layout Migration

- Homepage, static CMS pages, contact, pricing, profile detail, auth shell, login, and member shell now use shared public/member chrome.
- Member pages inherit the premium member shell with a desktop side navigation and mobile drawer.
- A minimal `/member` dashboard route now exists to support the authenticated header Dashboard link.
- `/admin/*` routes were not modified.

## FE-004 Profile Card Navigation

- Homepage featured profiles use shared clickable `ProfileMatchCard`.
- Match discovery and recommended cards use shared clickable `ProfileMatchCard`.
- Favourites use shared clickable `ProfileMatchCard` with remove/action controls outside the link.
- Interests link the profile identity/body to profile detail while response controls remain separate.
- Recently viewed cards use shared clickable `ProfileMatchCard`.
- Admin profile cards and admin moderation views were not modified.

## FE-005 Public Profile Detail Page

- Upgraded `apps/web/app/profiles/[id]/page.tsx` into a premium profile detail experience.
- Profile hero now shows identity, age, city, profession, verification, match/completion score, last active, and membership status.
- Detail content now covers About Me, Basic Details, Religion & Community, Education & Career, Location, Lifestyle, Family Details, Partner Expectations, Photos / Gallery, and Verification Status.
- Desktop visitors get a sticky action card; mobile visitors get a bottom action bar.
- Existing profile actions remain functional for Send Interest, Save, Report, and Block.
- Private gallery content remains locked with the message: "Private photos visible after interest acceptance."
- Profile detail links now resolve by Mongo ObjectId, slug, or display ID; seeded URLs like `/profiles/amit-sharma-va100001` no longer 404.
- Unauthenticated member-only profile views now show a premium sign-in-required screen rather than the default 404 page.
- Signed-in member profile views now fetch profile detail data with the active client auth token.
- Admin profile/detail surfaces were not modified.

## FE-006 Static Pages Alignment

- Created root public routes: `/about`, `/contact`, `/privacy`, `/terms`, `/refund-policy`, `/safety`, `/community-guidelines`, `/verification-policy`, `/help`, `/faq`, `/blog`, and `/membership` (pricing).
- Implemented and exported reusable UI helper components: `StaticPageHero`, `StaticPageContainer`, `PolicyContentCard`, `FAQAccordion`, `ContactCard`, and `HelpCategoryCard`.
- Redesigned existing `/contact` and `/pricing` with matching brand layouts.
- Updated all site header and footer paths to link directly to clean root paths.
- Configured dynamic CMS fetching with robust offline-safe local fallback structures.
- Verified route structures, accessibility, responsive flows, linting, formatting, and build status.

## FE-007 Auth Pages Alignment

- Redesigned `AuthShell` into a premium full-screen dynamic split-pane grid layout.
- Implemented left-hand emotional brand pane with deep burgundy-to-blush gradient, decorative lighting, gold checkmarked value propositions, and success testimonial block.
- Standardized inputs and form button elements using brand design tokens (`h-12 rounded-2xl` focus rings and primary burgundy background).
- Refactored `/login`, `/register`, `/forgot-password`, and `/reset-password` routes to inherit the new premium shell.
- Created `/verify-email` dynamic route that reads query string tokens, automatically POSTs to the backend verification endpoint, and displays loading/success/error statuses.
- Verified type safety, formatting guidelines, clean linting, and complete build status.
