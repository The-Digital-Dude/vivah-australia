# Vivah Australia — CMS Gap Analysis & Implementation Plan

## Executive Summary & Target Vision
The target CMS vision for Vivah Australia is a secure, dynamic operations and marketing engine. Rather than a static or hardcoded site, the platform must allow administrators to modify homepage messaging, build regional and religious landing pages, manage FAQs, schedule blog guides, customize transaction notifications, and control global system settings without redeploying code.

This audit assesses the gap between the current hybrid implementation and a launch-ready, growth-optimized CMS platform.

---

## 1. CMS Gap Analysis Matrix

| Feature | Current State | Needed State | Gap | Priority |
| :--- | :--- | :--- | :--- | :--- |
| **Homepage Builder** | Partially dynamic (uses a single JSON key `homepageContent` in `SystemSettingModel` containing hero text, list of how it works steps, safety, contact details). FAQ list inside is parsed manually. | Admin-friendly homepage control room with preview, visual editor, visibility toggles, and section ordering. | No visual layout or ordering builder. Direct JSON editing or text-parsing required. No preview capability. | **P0** |
| **Pages Manager** | Structurally complete. `CmsPageModel` stores slug, title, body, and SEO headers. Frontend `/pages/[slug]` renders the content. | Rich text editing for dynamic system pages (About, Privacy, Terms) with layout and status controls. | Generic page renderer works, but there is no custom styling/layout support per page (e.g., Contact page forms). | **P0** |
| **FAQ Manager** | Parsed from static page text. `faq/page.tsx` parses `page.body` by splitting lines on `|` separator. Falls back to static arrays. | A dedicated `FAQModel` with categories, active toggles, and drag-and-drop ordering. | Missing dedicated schema, category groups, custom sort orders, and independent admin controls. | **P0** |
| **Blog Manager** | Partial. `BlogPostModel` holds slug, title, body, author, and published status. Blog list page fetches posts. | Full blogging suite with author management, scheduling/publish dates, cover images, and tags. | Blog list page links to `/pages/${blog.slug}`, which fails with 404 because `/public/pages/:slug` only queries `CmsPageModel`. Detail routing is broken. | **P0** |
| **Template Manager** | Completely hardcoded. Welcome emails, password resets, verification, and moderation warnings are defined in code. | Dynamic templates stored in database, using handlebar-style placeholders, variable auto-insertion, and live previews. | No database models or admin editors exist for transactional emails, notifications, or SMS templates. | **P0** |
| **Global Settings** | Highly limited. `SystemSettingModel` stores key/value pairs, but it is only used for `homepageContent`. | Comprehensive portal for general metadata, announcements, contact details, and feature toggles. | No dedicated interface. Missing toggles for system features (e.g., toggle registrations, maintenance mode). | **P0** |
| **Landing Pages** | Completely missing. | Ability to generate programmatic matching pages for target keywords (e.g., `/matrimony/sydney-matrimony`). | No model or routing exists for dynamic regional/religious pages. | **P1** |
| **Promotions & Offers** | Completely missing. | Campaign dashboard to define timed membership discounts, promo banners, and coupon codes. | No promotion model, date-bound validity rules, or checkout integration for promotional items. | **P1** |
| **Referrals** | Completely missing. | Dashboard to configure referral incentive parameters (e.g., reward copy, free Premium days credit). | No logic or campaign templates for referral acquisition programs. | **P1** |
| **Marketing Campaigns** | Partial. `BannerModel` is defined but only used to map blog cover placeholders. | Dynamic top-header announcement banners and matching-carousel overlays managed by admins. | No target redirection, visibility duration, or segment rules exist for campaign banners. | **P1** |

---

## 2. Inventory of Existing Implementation

### A. Existing & Working CMS Features
*   **Database Models**:
    *   `CmsPageModel` (slug, title, body, published, seoTitle, seoDescription)
    *   `BlogPostModel` (slug, title, body, published, authorId)
    *   `TestimonialModel` (name, quote, published)
    *   `SuccessStoryModel` (slug, title, body, published, coupleName)
    *   `BannerModel` (key, title, imageUrl, active)
    *   `SystemSettingModel` (key, value, description)
*   **Admin UI Panel**:
    *   Located at `apps/web/app/admin/cms/page.tsx` — a single, fully functional Tabbed interface with forms for editing homepage JSON strings, managing CMS Pages, Blog list, Success Stories, Testimonials, and Banners. Includes form validation using Zod schemas from `@vivah/shared`.
*   **Public API Endpoints**:
    *   `GET /api/public/home` (returns homepage setting)
    *   `GET /api/public/pages/:slug` (retrieves static pages)
    *   `GET /api/public/blogs` (gets published posts)
    *   `GET /api/public/success-stories` (gets success cases)
    *   `GET /api/public/testimonials` (gets quotes)

---

### B. Partially Implemented Features
*   **Dynamic FAQ Page**:
    *   `apps/web/app/faq/page.tsx` fetches the page by slug `'faq'`. If `page.body` exists, it attempts to parse it using line breaks and `|` splits (e.g. `Question | Answer`). While functional, it is prone to syntax breaks and offers no categorical sorting.
*   **Homepage Customization**:
    *   `apps/web/app/home-client.tsx` checks if fields in `home.hero` or `home.safety` exist before rendering them. However, if any key is missing, it falls back to hardcoded text, and does not support structural editing or reordering.
*   **Blog Page Details**:
    *   `apps/web/app/blog/page.tsx` compiles a high-fidelity list of articles, but clicking "Read Article" routes to `/pages/${blog.slug}`, which fails with a **404** because the generic static page endpoint does not check the `BlogPostModel`.

---

### C. Hardcoded Content Inventory

Below is an inventory of files containing hardcoded content that should be dynamic:

1.  **Homepage Content**
    *   [home-client.tsx](file:///d:/AI/Vivah%20Australia/apps/web/app/home-client.tsx): Hero copy, "How it works" steps description, safety values details, core community testimonials, community trust statistics, and general marketing prompts.
2.  **Membership Plans & Outcomes**
    *   [pricing-client.tsx](file:///d:/AI/Vivah%20Australia/apps/web/app/pricing/pricing-client.tsx): Rebuilt conversion-focused text, outcome cards, plan benefits descriptions, success stories carousel text, loss aversion promotion tickers, and membership FAQ items.
3.  **Onboarding & Prompts**
    *   [login/page.tsx](file:///d:/AI/Vivah%20Australia/apps/web/app/(auth)/login/page.tsx) & [register/page.tsx](file:///d:/AI/Vivah%20Australia/apps/web/app/(auth)/register/page.tsx): Authentication layout subtext, onboarding guide bullet points, and verification badge benefits explanations.
4.  **Matrimonial Verification Instructions**
    *   [verify-email/page.tsx](file:///d:/AI/Vivah%20Australia/apps/web/app/verify-email/page.tsx): Instructions regarding email validation, trust level advancement rules, and help options.
5.  **Email & SMS Templates**
    *   [auth.service.ts](file:///d:/AI/Vivah%20Australia/apps/api/src/auth/auth.service.ts): Email subject and raw HTML content for "Verify your email address" and "Reset your password".
    *   [admin.service.ts](file:///d:/AI/Vivah%20Australia/apps/api/src/admin/admin.service.ts): Subject lines and html bodies for "Profile approved/rejected" notifications and verification status updates.
    *   [notifications.service.ts](file:///d:/AI/Vivah%20Australia/apps/api/src/notifications/notifications.service.ts): OTP verification SMS text ("Your Vivah Australia verification code is {code}").

---

### D. Missing CMS Features
*   **Homepage Layout Builder**: No drag-and-drop tool or sorting list to reorder sections (e.g. success stories before pricing).
*   **Dynamic Landing Pages**: No system to programmatically spawn routes like `/matrimony/sikh-matrimony-melbourne` without hardcoding files.
*   **Promotion Toggles**: No capability to run checkout promotions or coupon applications from an admin panel.
*   **Template Manager**: No dynamic template engines (e.g. Handlebars) or visual placeholders for transactional triggers.

---

## 3. Phase A — Must Have CMS (Launch-Ready)

This roadmap outlines the changes required to establish a secure, launch-ready CMS.

### A1 — Homepage Builder
*   **Database Schema**: Define a dedicated structure inside `SystemSettingModel` or create a `HomepageConfigModel` to store section configurations, ordering indexes, active states, and copy.
*   **Admin UI**: Introduce draggable reorder components (using Radix or lightweight HTML5 drag-and-drop) to adjust homepage components (Hero, Features, Stats, Testimonials, Pricing, Blog).
*   **Frontend**: Rebuild `app/page.tsx` to read the layout index and map render components in sequence.

### A2 — Dynamic Pages
*   **Database Schema**: Retain `CmsPageModel` but add a `status` field (`'DRAFT' | 'PUBLISHED'`) and an array of dynamic layout sections (rich text, card grid, FAQs).
*   **Admin UI**: Integrate a robust markdown editor with a split-screen side preview.
*   **Frontend**: Resolve route mismatches. Add a dedicated layout renderer for custom system routes.

### A3 — FAQ Manager
*   **Database Schema**: Create `FaqModel` (question, answer, category, displayOrder, active).
*   **Admin UI**: Tabbed view by categories (Registration, Privacy, Verification, Payments). Drag-and-drop ordering within categories.
*   **API**: `GET /api/public/faqs` returns all active FAQs grouped by category.

### A4 — Blog Manager
*   **Database Schema**: Update `BlogPostModel` to include: `readTimeMinutes`, `coverImage`, `tags`, and `status`.
*   **API / Routing**: 
    *   Create a dedicated detail endpoint: `GET /api/public/blogs/:slug`.
    *   Introduce a new frontend route: `/blog/[slug]/page.tsx` to display full article content dynamically.

### A5 — Template Manager
*   **Database Schema**: Introduce `TemplateModel` (key, type `'EMAIL' | 'SMS' | 'PUSH'`, subject, bodyTemplate, variables).
*   **Admin UI**: Live variable preview panel. Admins can select keys like `{{firstName}}`, `{{verificationLink}}` or `{{rejectionReason}}` and see them render into sample text fields on keyup.
*   **Service Integration**: Rewrite `email.service.ts` and `sms.service.ts` to parse templated text using a engine like Handlebars before sending.

### A6 — Global Settings
*   **Admin UI**: Dedicated Settings panel in the admin console to update social media links, support contacts, emergency announcement headers, and system flags (e.g. registration disabled).

---

## 4. Phase B — Growth CMS (Acquisition-Ready)

### B1 — Landing Page Builder
*   **Database Schema**: Introduce `LandingPageModel` (slug, keyword, title, metaDescription, categoryFilter, stateFilter, heroImage, customBody).
*   **Engine Integration**: Page routes matching `/matrimony/[slug]` automatically query this model. If a category filter is defined (e.g. `religion: 'Sikh', state: 'VIC'`), the page will load matching matches dynamically to maximize local SEO conversion.

### B2 — Promotions & Campaigns
*   **Database Schema**: Define `PromotionModel` (code, discountPercent, expiresAt, active, targetPlans).
*   **Checkout Integration**: Checkout routes apply discounts on Stripe integrations when a valid code is passed.

### B3 — Referral Engine
*   **Database Schema**: Define `ReferralCampaignModel` (campaignName, rewardDays, inviteText, active).
*   **Logic**: Tracks referral tokens on register, automatically updates member membership duration, and triggers templates when goals are met.

---

## 5. Recommended Technical Specifications

### A. Database Models

```typescript
// Faq Schema
const faqSchema = new Schema(
  {
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
    category: { type: String, required: true, enum: ['GENERAL', 'SAFETY', 'VERIFICATION', 'BILLING'], index: true },
    displayOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true, index: true },
    ...auditedSchemaFields
  },
  { ...timestampedSchemaOptions, collection: 'faqs' }
);

// Template Schema
const templateSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    type: { type: String, required: true, enum: ['EMAIL', 'SMS', 'PUSH'] },
    subject: { type: String, trim: true },
    body: { type: String, required: true },
    variables: [{ type: String }],
    ...auditedSchemaFields
  },
  { ...timestampedSchemaOptions, collection: 'templates' }
);

// Landing Page Schema (Phase B)
const landingPageSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    metaDescription: { type: String },
    city: { type: String },
    religion: { type: String },
    customTitle: { type: String },
    customBody: { type: String },
    active: { type: Boolean, default: true },
    ...auditedSchemaFields
  },
  { ...timestampedSchemaOptions, collection: 'landing_pages' }
);
```

### B. API Routing Structure

```markdown
# Public API Routes
- GET /api/public/blogs/:slug         -> Returns detailed blog details + author metadata
- GET /api/public/faqs                -> Returns active FAQs grouped by category
- GET /api/public/matrimony/:slug     -> Retrieves dynamic landing page content & matches

# Admin CMS API Routes
- GET/POST/PUT /api/admin/cms/faqs    -> CRUD for FAQ items
- GET/POST/PUT /api/admin/cms/templates -> CRUD for Email/SMS notification templates
- GET/POST/PUT /api/admin/cms/settings  -> Manage global settings & toggles
```

### C. Recommended Admin UX Layout
We recommend a cohesive, sidebar-navigated **CMS Command Center** within the admin workspace:
1.  **Sidebar Tabs**: Homepage Builder | Page Manager | FAQ Manager | Blog & Guides | Notification Templates | Global Toggles.
2.  **Interactive Previews**:
    *   Homepage Builder features a vertical list of cards representing sections. Dragging to reorder updates a JSON index. A "Live Preview" window loads the public site inside an iframe with draft settings mapped.
    *   Notification Templates display a split layout: code editor on the left (Markdown/Handlebars) and a simulated device/email window on the right showing parsed outputs with mock user variables.
