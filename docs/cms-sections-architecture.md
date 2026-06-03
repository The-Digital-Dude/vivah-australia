# CMS Section Foundation Architecture

The `CmsSection` architecture provides a highly reusable, structured component configuration platform for page headers, trust bands, CTA banners, and modular content blocks across Vivah Australia.

---

## 1. Mongoose Database Schema

```typescript
const cmsSectionSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, trim: true, index: true },
    pageKey: { type: String, required: true, trim: true, index: true },
    title: { type: String, trim: true },
    subtitle: { type: String, trim: true },
    body: { type: String, trim: true },
    imageUrl: { type: String, trim: true },
    ctaLabel: { type: String, trim: true },
    ctaHref: { type: String, trim: true },
    visible: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0, index: true },
    status: { type: String, enum: ['DRAFT', 'PUBLISHED'], default: 'DRAFT', index: true },
    metadata: { type: Schema.Types.Mixed },
    ...auditedSchemaFields,
  },
  { ...timestampedSchemaOptions, collection: 'cms_sections' },
);
```

---

## 2. API Specifications

### Public Endpoint
*   **`GET /api/public/sections/:pageKey`**
    *   Retrieves all published and visible sections configured for the given `pageKey` (e.g. `homepage`, `membership`), ordered by `sortOrder`.

### Admin Endpoints
*   **`GET /api/admin/cms/sections`** -> List all sections.
*   **`POST /api/admin/cms/sections`** -> Create a new section. Audits action `CMS_SECTION_CREATED`.
*   **`PUT /api/admin/cms/sections/:id`** -> Update an existing section. Audits action `CMS_SECTION_UPDATED`.
*   **`DELETE /api/admin/cms/sections/:id`** -> Mark section as deleted. Audits action `CMS_SECTION_DELETED`.

---

## 3. Usage Examples

### Hero Section Config
```json
{
  "key": "homepage-hero",
  "pageKey": "homepage",
  "title": "Find Your Life Partner Faster",
  "subtitle": "Premium Indian matrimonial matchmaker for serious Australian singles & families.",
  "ctaLabel": "Create Free Profile",
  "ctaHref": "/register",
  "sortOrder": 0,
  "status": "PUBLISHED",
  "visible": true
}
```

### Rendering in React
```typescript
const { data } = await fetch('/api/public/sections/homepage').then(r => r.json());
const hero = data.sections.find(s => s.key === 'homepage-hero');
```
