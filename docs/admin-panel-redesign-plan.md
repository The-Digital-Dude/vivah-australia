# Vivah Australia — Admin Panel Redesign Plan

This document outlines the audit of the current admin panel and the redesign strategy to transition it from a basic CRM-like tool into a high-density, professional operations console utilizing **shadcn/ui**, **Radix UI**, **Tailwind CSS**, and **Lucide React**.

---

## 1. Current Admin Routes and Purpose

The admin area contains the following routes:

- `/admin/dashboard`: Operational snapshot for moderation, safety, and revenue.
- `/admin/users`: Listing and account status control of members.
- `/admin/profiles`: Moderation queue for user profiles.
- `/admin/verifications`: Identity, address, and document verification queue.
- `/admin/media`: Photos and gallery items moderation.
- `/admin/reports`: Triage and management of member abuse reports.
- `/admin/moderation`: Admin actions log and bulk actions control.
- `/admin/community`: Events, community notices, and forum moderation.
- `/admin/cms`: Content Management System for static pages, blogs, and testimonials.
- `/admin/payments`: Transaction history, active subscriptions list, and refund management.
- `/admin/analytics`: Performance metrics, signup rates, and revenue trends.
- `/admin/fraud`: Risk engine flags, IP blacklists, and anomaly detection.
- `/admin/audit-logs`: System accountability and activity logging.

---

## 2. Current UX Problems

- **Basic Sidebar Navigation**: The left sidebar in `admin-shell.tsx` is an unstructured vertical list of 13 routes without visual hierarchy or categorization.
- **Visual Congestion & styling inconsistencies**: Plain borders and simple styling feel like a basic utility rather than a premium operational portal.
- **No Metrics on Sub-pages**: Operations pages lack sub-headers containing key performance indicators (KPIs) to show the queue length or daily processed items.
- **Primitive Data Tables**: Lacks standardized toolbars, column sorting, batch actions, search/filter criteria, pagination, loading states, and custom action menus.
- **Unrefined Queue Workflows**: Action flows like approving or rejecting verifications/media do not prompt for audit notes or confirmation dialogs, leading to accidental changes.
- **Poor Mobile Responsiveness**: Simple flex/grid layouts wrap poorly, tables overflow, and sidebars take up critical space on tablet/mobile screens.

---

## 3. Recommended Information Architecture

The navigation sidebar will be reorganized into logical, collapsible groups:

- **Overview**
  - Dashboard (`/admin/dashboard`)
  - Analytics (`/admin/analytics`)
- **People**
  - Users (`/admin/users`)
  - Profiles (`/admin/profiles`)
- **Trust & Safety**
  - Verifications (`/admin/verifications`)
  - Media Review (`/admin/media`)
  - Reports (`/admin/reports`)
  - Moderation (`/admin/moderation`)
  - Fraud (`/admin/fraud`)
- **Business**
  - Payments (`/admin/payments`)
  - CMS (`/admin/cms`)
  - Community (`/admin/community`)
- **System**
  - Audit Logs (`/admin/audit-logs`)

---

## 4. shadcn Component Map

We will utilize the following shadcn components:

- **Nav & Layout**: `Sheet` (for mobile drawer), `Breadcrumb` (for context), `Separator`
- **Data Display**: `Card`, `Badge` (for status), `Table`, `Avatar`, `Tooltip`
- **Inputs & Controls**: `Button`, `Checkbox` (for bulk select), `Input`, `Select`, `Textarea`
- **Feedback & Overlays**: `Dialog` (for audit notes), `AlertDialog` (for destructive actions), `Skeleton` (for loading states)

---

## 5. Admin Dashboard Redesign Plan

- **Hero Header**: Welcome message with live status (e.g., "All systems operational. 34 items in pending queue").
- **KPI Grid**: 8 responsive metric cards with icons, change percentages, and sparkline indicators.
- **Priority Queues**: Visual highlight sections showing the top 3-5 pending profiles, unmoderated photos, and critical reports.
- **Recent Activities & Quick Actions**: Fast shortcuts to common tasks (e.g., "Review Documents", "Issue Refund").

---

## 6. Data Table Strategy

We will standardize all tables using a reusable layout:
- **Toolbar**: Search box on the left, multi-select category filter in the center, "Export" or "Actions" button on the right.
- **Row Details**: Styled rows with badge indicators for statuses (e.g., Active, Suspended, Pending).
- **Row Action Menu**: Three-dots dropdown menu providing actions relative to the row entity.
- **Pagination**: "Showing X of Y rows" indicator with Previous/Next buttons.

---

## 7. Queue/Review Workflow Strategy

- **Interactive Side Drawer/Dialog**: Clicking an item opens a side pane showing original details alongside moderation history.
- **Rejection/Approval Dialog**: Any reject action requires typing a short moderation note explaining why (e.g., "Incorrect ID document type").
- **Double-Confirmations**: Destructive actions (like suspending a user or deleting media) require typing the reason in an `AlertDialog` before taking effect.

---

## 8. Mobile/Tablet Admin Strategy

- **Responsive Viewports**: Hidden sidebar on viewports `< 1024px`, replaced by a hamburger menu opening a `Sheet` with sidebar links.
- **Grid Conversions**: Table rows collapse into visual card blocks on small screen dimensions.

---

## 9. Accessibility Requirements

- **Semantic HTML**: Use proper tags (`<main>`, `<nav>`, `<aside>`, `<th>`, `<td>`).
- **Keyboard Navigation**: Tooltips, dialogs, and dropdowns focusable with Tab/Enter/Esc.
- **Screen Reader Attributes**: `aria-label` for icons and buttons, and visual checkmark state announcements.

---

## 10. Implementation Checklist

- [ ] **Phase 1: Installation & Setup**
  - Install shadcn/ui components (`Button`, `Card`, `Table`, etc.)
  - Set up brand theme variables in CSS.
- [ ] **Phase 2: Shell Layout**
  - Replace `admin-shell.tsx` with a modern sidebar layout.
  - Implement Sheet-based mobile navigation drawer.
- [ ] **Phase 3: Dashboard Command Center**
  - Design metric cards with mock sparkline visual enhancers.
  - Add quick action shortcuts and loading skeletons.
- [ ] **Phase 4: Table and Filter Standardization**
  - Implement standardized table search, filter, and action menus.
- [ ] **Phase 5: Queue/Moderation Redesigns**
  - Apply the new UX to `/admin/verifications`, `/admin/media`, `/admin/reports`.
- [ ] **Phase 6: QA & Build Verification**
  - Run linting, type checks, tests, and verify overall responsive states.
