# Vivah Australia — Admin Panel Reshape with shadcn/ui

## Context

The current admin area exists and includes routes such as:

- `/admin/dashboard`
- `/admin/users`
- `/admin/profiles`
- `/admin/verifications`
- `/admin/media`
- `/admin/reports`
- `/admin/moderation`
- `/admin/community`
- `/admin/cms`
- `/admin/payments`
- `/admin/analytics`
- `/admin/fraud`
- `/admin/audit-logs`

The current `AdminShell` uses a simple left sidebar and a large content card. It works, but it feels basic and CRM-like. The goal is to reshape it into a professional operations console for moderation, trust, safety, billing, CMS, and analytics.

Use:
- shadcn/ui
- Radix UI
- Tailwind CSS
- Lucide React icons
- Existing Vivah brand tokens

Do not use:
- Material UI
- Ant Design
- Bootstrap

Brand:
- Burgundy: `#7A1F2B`
- Gold: `#D4AF37`
- Ivory: `#FCFAF7`
- White: `#FFFFFF`
- Text: `#1A1A1A`
- Muted: `#6B7280`
- Soft Blush: `#F8E8E8`

Global implementation rules:
1. Inspect files before editing.
2. Preserve all existing admin routes.
3. Do not change public/member UX unless required by shared component safety.
4. Do not change backend business logic unless a small frontend integration fix is required.
5. Use shadcn components consistently.
6. Keep admin UX dense enough for operations, but not visually congested.
7. Add loading, empty, and error states.
8. Keep tables keyboard-accessible and screen-reader friendly.
9. After every task, run:
   ```bash
   pnpm lint
   pnpm typecheck
   pnpm build
   ```
10. Commit and push after every task:
   ```bash
   git status
   git add .
   git commit -m "<clear task message>"
   git push
   ```

---

## Target Admin UX

The admin panel should feel like:

- Trust & Safety command center
- Moderation operations dashboard
- Billing and subscription control room
- CMS management workspace
- Audit-ready admin console

It should not feel like:

- A public marketing page
- A member dashboard
- A cramped CRM
- A random list of admin links

---

## Prompt 1 — Admin UX Audit + Redesign Plan

Audit the current admin panel implementation.

Inspect:
- `apps/web/app/admin/admin-shell.tsx`
- `apps/web/app/admin/admin-guard.tsx`
- `apps/web/app/admin/dashboard/page.tsx`
- all `/admin/*/page.tsx` files
- admin-specific components such as:
  - media review
  - reports review
  - moderation views
  - audit logs
  - payments
  - users
  - profiles
  - verifications
  - CMS
  - fraud

Create:

`docs/admin-panel-redesign-plan.md`

Include:
1. Current admin routes and purpose
2. Current UX problems
3. Recommended information architecture
4. shadcn component map
5. Admin dashboard redesign plan
6. Data table strategy
7. Queue/review workflow strategy
8. Mobile/tablet admin strategy
9. Accessibility requirements
10. Implementation checklist

Do not change app code in this task except adding the markdown file.

Commit:
```bash
git add docs/admin-panel-redesign-plan.md
git commit -m "docs: add admin panel redesign plan"
git push
```

---

## Prompt 2 — Install / Configure shadcn Admin Components

Set up shadcn/ui components needed for the admin panel.

Use or add the following shadcn components:
- Button
- Card
- Badge
- Avatar
- Separator
- Sheet
- DropdownMenu
- Tabs
- Table
- Checkbox
- Input
- Select
- Dialog
- AlertDialog
- Tooltip
- Skeleton
- Toast/Sonner if already supported
- Command if useful for admin search
- Breadcrumb if available

Requirements:
- Do not break existing Tailwind config.
- Keep Vivah brand tokens.
- Create reusable admin primitives if useful:
  - `AdminPageHeader`
  - `AdminMetricCard`
  - `AdminDataTable`
  - `AdminStatusBadge`
  - `AdminQueueCard`
  - `AdminEmptyState`
  - `AdminLoadingState`
  - `AdminActionMenu`

Commit:
```bash
git add .
git commit -m "feat(admin): add shadcn admin ui primitives"
git push
```

---

## Prompt 3 — Redesign Admin Shell

Redesign `apps/web/app/admin/admin-shell.tsx`.

Requirements:
- Professional admin layout.
- Desktop:
  - Left sidebar with grouped navigation:
    - Overview
      - Dashboard
      - Analytics
    - People
      - Users
      - Profiles
    - Trust & Safety
      - Verifications
      - Media Review
      - Reports
      - Moderation
      - Fraud
    - Business
      - Payments
      - CMS
      - Community
    - System
      - Audit Logs
  - Top header with:
    - current page title
    - global search placeholder
    - notifications/queue indicator
    - admin avatar menu
- Mobile/tablet:
  - Use shadcn Sheet for navigation.
- Add icons from Lucide.
- Add active route states.
- Add breadcrumbs or section label.
- Keep `AdminGuard`.
- Preserve existing route URLs.
- Avoid public/member navigation bleed.

Use shadcn:
- Sheet
- DropdownMenu
- Button
- Separator
- Badge
- Avatar
- Tooltip

Commit:
```bash
git add apps/web/app/admin/admin-shell.tsx
git commit -m "feat(admin): redesign admin shell navigation"
git push
```

---

## Prompt 4 — Redesign Admin Dashboard

Redesign `/admin/dashboard`.

Goal:
Make it a Trust & Operations command center.

Sections:
1. Hero / operational summary
   - “Admin Command Center”
   - Date/time context
   - quick status line

2. KPI metric cards:
   - Total members
   - Active members
   - Pending profiles
   - Pending verifications
   - Open reports
   - Pending media reviews
   - Active subscriptions
   - Monthly revenue

3. Priority queues:
   - Profiles awaiting review
   - Verification documents
   - Reported profiles/messages
   - Media requiring moderation
   - Refund/payment issues

4. Recent activity:
   - Recent registrations
   - Recent reports
   - Recent admin actions if available

5. Quick actions:
   - Review profiles
   - Review documents
   - Resolve reports
   - Manage payments
   - Edit CMS

Requirements:
- Use shadcn Card, Badge, Button, Skeleton.
- Add loading states while summary fetches.
- Add empty states if lists are empty.
- Do not invent live data if API does not provide it; gracefully fallback to zeros/placeholders.

Commit:
```bash
git add apps/web/app/admin/dashboard/page.tsx
git commit -m "feat(admin): redesign command center dashboard"
git push
```

---

## Prompt 5 — Standardize Admin Data Tables

Create a reusable admin data table pattern.

Target:
- Users
- Profiles
- Verifications
- Media
- Reports
- Payments
- Audit logs
- CMS
- Fraud

Requirements:
- Use shadcn Table or TanStack Table if already available.
- Standard features:
  - Search input
  - Status filter
  - Sortable columns where easy
  - Row action menu
  - Pagination controls
  - Empty state
  - Loading skeleton
  - Status badge
- Row actions should use DropdownMenu.
- Destructive actions should use AlertDialog.
- Keep API integrations intact.

Create shared components if useful:
- `apps/web/app/admin/components/admin-data-table.tsx`
- `apps/web/app/admin/components/admin-status-badge.tsx`
- `apps/web/app/admin/components/admin-table-toolbar.tsx`

Commit:
```bash
git add apps/web/app/admin
git commit -m "feat/admin): standardize admin data tables"
git push
```

---

## Prompt 6 — Improve Verification Review UX

Redesign `/admin/verifications`.

Requirements:
- Make it a review queue, not just a table.
- Show:
  - member identity
  - verification type
  - submitted date
  - current status
  - document preview/download action if available
  - approve/reject actions
  - admin note/rejection reason dialog
- Use shadcn:
  - Card
  - Table
  - Badge
  - Dialog
  - AlertDialog
  - Textarea if available
  - Button
- Add clear decision states:
  - Pending
  - Approved
  - Rejected
  - Needs more info
- Confirm approve/reject actions.
- Show audit/accountability copy near actions.

Commit:
```bash
git add apps/web/app/admin/verifications
git commit -m "feat(admin): improve verification review ux"
git push
```

---

## Prompt 7 — Improve Media Review UX

Redesign `/admin/media`.

Requirements:
- Media review should be visual.
- Use a grid/list hybrid:
  - image/document preview
  - uploader/member
  - visibility type
  - moderation status
  - uploaded date
  - approve/reject buttons
- Add filters:
  - pending
  - approved
  - rejected
  - private/public
- Reject flow should ask for reason.
- Use shadcn:
  - Card
  - Dialog
  - Badge
  - Tabs
  - Button
  - AlertDialog
  - Skeleton

Commit:
```bash
git add apps/web/app/admin/media
git commit -m "feat(admin): improve media review workflow"
git push
```

---

## Prompt 8 — Improve Reports & Safety Queue

Redesign `/admin/reports` and reports review components.

Requirements:
- Make reports feel like a safety triage queue.
- Show:
  - severity
  - report reason
  - reporter
  - reported user/profile/message
  - created date
  - status
  - assigned/reviewed by if available
- Add queue tabs:
  - Open
  - Investigating
  - Resolved
  - Dismissed
- Add action workflow:
  - View context
  - Add admin note
  - Warn user
  - Suspend user
  - Remove content
  - Mark resolved
  - Dismiss report
- Use AlertDialog for serious actions.
- Include audit logging reminder in UI copy.

Commit:
```bash
git add apps/web/app/admin/reports
git commit -m "feat(admin): redesign reports safety queue"
git push
```

---

## Prompt 9 — Improve Users and Profiles Admin Pages

Redesign:
- `/admin/users`
- `/admin/profiles`

Requirements:
- Users page:
  - search by email/name/id
  - filter by role/status/verification
  - show account status, joined date, membership, risk flags if available
  - row actions: view, suspend, activate, reset verification if supported

- Profiles page:
  - search by name/display ID/location
  - filter by moderation status/completion/visibility
  - show profile completion, verification, media count if available
  - actions: view profile, approve/reject, add note

Use reusable admin table components.
Use shadcn badges and dropdown row actions.

Commit:
```bash
git add apps/web/app/admin/users apps/web/app/admin/profiles
git commit -m "feat(admin): improve users and profiles management"
git push
```

---

## Prompt 10 — Improve Payments Admin Page

Redesign `/admin/payments`.

Requirements:
- Show:
  - subscription status
  - plan
  - payment amount
  - payment status
  - invoice link if available
  - refund status
  - provider reference
- Add cards for:
  - monthly revenue
  - active subscriptions
  - failed payments
  - refund requests
- Add filters:
  - successful
  - failed
  - refunded
  - active subscriptions
- Refund actions must require confirmation.
- Do not change Stripe/backend logic.

Commit:
```bash
git add apps/web/app/admin/payments
git commit -m "feat(admin): improve payments management"
git push
```

---

## Prompt 11 — Improve CMS Admin Page

Redesign `/admin/cms`.

Requirements:
- Organize content into tabs:
  - Pages
  - Blog
  - Banners
  - Testimonials
  - Success Stories
- Show content status:
  - Draft
  - Published
  - Scheduled
  - Archived
- Add clear actions:
  - Create
  - Edit
  - Preview
  - Publish/unpublish
- Use shadcn Tabs, Table, Dialog, Badge, Button.
- Keep public CMS routes unaffected.

Commit:
```bash
git add apps/web/app/admin/cms
git commit -m "feat(admin): improve cms management ux"
git push
```

---

## Prompt 12 — Improve Audit Logs Page

Redesign `/admin/audit-logs`.

Requirements:
- Make audit logs easy to search and explain accountability.
- Show:
  - actor/admin
  - action
  - entity type
  - entity id
  - result/status
  - timestamp
  - IP/device if available
- Add filters:
  - actor
  - action type
  - entity type
  - date range if available
- Add detail drawer/dialog for metadata.
- Use monospace formatting for IDs and JSON metadata.
- Do not expose sensitive secrets.

Commit:
```bash
git add apps/web/app/admin/audit-logs
git commit -m "feat(admin): improve audit logs ux"
git push
```

---

## Prompt 13 — Add Admin Empty/Loading/Error States

Add consistent operational states across all admin pages.

Requirements:
- Loading:
  - Skeleton cards/tables
- Empty:
  - Helpful explanation
  - next best action
- Error:
  - non-scary message
  - retry button
  - avoid exposing sensitive backend errors
- Use reusable components:
  - `AdminLoadingState`
  - `AdminEmptyState`
  - `AdminErrorState`

Apply to:
- dashboard
- users
- profiles
- verifications
- media
- reports
- payments
- CMS
- audit logs
- fraud
- moderation
- analytics
- community

Commit:
```bash
git add apps/web/app/admin
git commit -m "feat(admin): add consistent admin states"
git push
```

---

## Prompt 14 — Final Admin QA

Run final QA for the admin panel.

Check:
- All `/admin/*` routes load.
- AdminGuard still protects all protected routes.
- Login route still works.
- Sidebar/topbar navigation works.
- Mobile Sheet navigation works.
- Tables are readable on tablet and mobile.
- No public/member route regressions.
- Destructive actions use confirmation.
- Loading/empty/error states exist.
- shadcn styling is consistent.
- Brand colors are consistent but not overused.
- Keyboard navigation works.
- Focus states are visible.
- No sensitive data is exposed.
- Build passes.

Run:
```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm test
```

Fix issues found.

Commit:
```bash
git add .
git commit -m "chore(admin): final admin panel qa"
git push
```
