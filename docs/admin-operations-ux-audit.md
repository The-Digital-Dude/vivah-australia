# Vivah Australia — Admin Operations UX Overhaul Audit

This document is a comprehensive audit of the existing administrative dashboard and operations workflow in `apps/web/app/admin/**`. It identifies major gaps between the current simple CRUD layouts and a professional, secure Trust & Safety / Operations platform.

---

## 🔍 Current State Analysis

### 1. Navigation Problems
* **Lack of Spacing & Collapsible Sections**: The navigation sidebar list is long, flat, and doesn't support collapsible groups. It makes it hard to distinguish between standard analytics, user directories, safety queues, and billing data.
* **Non-Interactive Layout**: Sidebar actions are flat links without active indicators beyond simple background coloring.
* **Breadcrumbs**: No robust breadcrumb history navigation or direct shortcuts.

### 2. Table Usability Problems
* **Generic CRUD Layouts**: Tables display simple data points but lack standard pagination select widgets, column sort capabilities, status toolbars, and rich row actions.
* **Filtering Friction**: Filters are isolated inputs that trigger full-page requests instead of reactive, debounce-based real-time queries.
* **Row Actions**: Lacks standard inline operations or standard shadcn Action Menus.

### 3. Moderation Workflow Problems
* **Verification Flow**: Reviewing a verification document requires clicking multiple buttons without signed document preview cards inline. Rejection reasons are simple input dialog fields instead of a structured workflow.
* **Media review**: Simple image layout without grid pagination, quick tab filters (Pending vs. Approved), or batch-action states.
* **Safety & Reports Queue**: Reports are listed with generic titles and require confirmation buttons that reload the page, without details on severity metrics or reporter history.

### 4. Mobile Problems
* **Desktop-centric Layouts**: Sidebars hide off-screen with custom CSS wrappers, but lack clean Radix Sheet slide-outs.
* **Table Wrapping**: Large lists overflow horizontally on smaller viewports instead of responsive stackable cards.
* **Touch Target Sizing**: Critical moderation actions (Approve, Reject, Warn, Suspend) are packed tightly.

### 5. Accessibility Problems
* **Contrast**: Text/border ratios in tables and filters are low (neutral-400 text on neutral-50 background).
* **Keyboard Navigation**: Primitives are custom styled `div` blocks and custom buttons lacking focus visible outlines.
* **Semantic Outlines**: Missing screen reader labels for key operations.

---

## 🛠️ Prioritized Recommendations

### 🔴 High Impact (Sprint 1-2)
1. **Redesign Sidebar & Admin Shell**: Restructure navigation into collapsible groups (`Overview`, `People`, `Trust & Safety`, `Business`, `System`) using Radix Sheet for mobile.
2. **Standardize Table Queue UX**: Create reusable `<AdminDataTable />`, `<AdminStatusBadge />`, and `<AdminTableToolbar />` with shadcn styling.
3. **Overhaul Verification Workflows**: Display signed document previews, approval confirmation dialogs, and mandatory reject reason inputs.
4. **Refactor Media Visual Queue**: Support tab-filtered masonry grids for pending, approved, and rejected images.

### 🟡 Medium Impact (Sprint 3)
1. **Triage Safety Reports Console**: Group reports by severity and support quick warning, suspending, and dismissing actions.
2. **Standardize Loading/Empty States**: Build reusable skeleton boards (`AdminLoadingState`, `AdminEmptyState`, `AdminErrorState`).
3. **Audit details Drawer**: Improve audit logs readability with a sliding Drawer containing detailed JSON metadata diffs.

### 🟢 Low Impact (Sprint 4)
1. **Mobile touch target optimization**: Wrap action triggers in spaced, touch-friendly sheets on smaller viewports.
2. **Contrast and Focus Outlines**: Enforce strict focus rings and WCAG-compliant border contrasts.
