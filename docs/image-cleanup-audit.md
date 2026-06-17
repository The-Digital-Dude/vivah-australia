# Vivah Australia — Image Asset Cleanup Audit
Generated: 2026-06-17

## Scope

All local static image assets under `apps/web/public/` and `apps/web/app/`.
No colocated images were found inside `apps/web/app/` — Next.js app-directory image files are absent; all assets live under `public/`.

Remote images (Cloudinary URLs served from `res.cloudinary.com`) are outside scope. The seed data in `apps/api/src/db/seed.ts` references mock profile paths (`/demo/profiles/*.jpg`) and a demo blog URL; neither set corresponds to any local file and both are out of scope.

---

## Phase 1 — Full Inventory (35 files)

| # | Path | Size |
|---|------|------|
| 1 | `public/home/app-mockup-1.png` | 604 KB |
| 2 | `public/home/app-mockup-2.png` | 640 KB |
| 3 | `public/home/australia-dotted-map.png` | 768 KB |
| 4 | `public/home/hero-bg-attached.jpg` | 268 KB |
| 5 | `public/home/hero-couple-rings.jpg` | 268 KB |
| 6 | `public/home/hero-vivah-australia-1752x1200.jpg` | 5,180 KB |
| 7 | `public/home/hero-vivah-australia-1752x1200.png` | 5,004 KB |
| 8 | `public/home/hero-vivah-australia-2.jpg` | 5,776 KB |
| 9 | `public/home/hero-vivah-australia.jpg` | 5,180 KB |
| 10 | `public/home/hero-vivah-australia.png` | 2,204 KB |
| 11 | `public/home/match-ananya.png` | 696 KB |
| 12 | `public/home/match-rohan.png` | 680 KB |
| 13 | `public/home/success-stories/couple-01.jpg` | 4,732 KB |
| 14 | `public/home/success-stories/couple-02-v2.png` | 704 KB |
| 15 | `public/home/success-stories/couple-02.jpg` | 4,960 KB |
| 16 | `public/home/success-stories/couple-03-v2.png` | 732 KB |
| 17 | `public/home/success-stories/couple-03.jpg` | 11,164 KB |
| 18 | `public/home/success-stories/couple-04-v2.png` | 688 KB |
| 19 | `public/home/success-stories/couple-04.jpg` | 5,180 KB |
| 20 | `public/home/success-stories/couple-05-v2.png` | 716 KB |
| 21 | `public/home/success-stories/couple-05.jpg` | 1,664 KB |
| 22 | `public/home/success-stories/couple-06-v2.png` | 736 KB |
| 23 | `public/home/success-stories/couple-06.jpg` | 1,824 KB |
| 24 | `public/home/success-stories/couple-07.jpg` | 5,776 KB |
| 25 | `public/home/success-stories/couple-08.jpg` | 4,732 KB |
| 26 | `public/home/success-stories/couple-09.jpg` | 4,960 KB |
| 27 | `public/home/success-stories/couple-10.jpg` | 11,164 KB |
| 28 | `public/home/success-stories/couple-11.jpg` | 5,180 KB |
| 29 | `public/home/success-stories/couple-12.jpg` | 1,664 KB |
| 30 | `public/logo-color.png` | 152 KB |
| 31 | `public/logo-white.png` | 124 KB |
| 32 | `public/logo.png` | 124 KB |
| 33 | `public/success-stories/couple-brisbane.jpg` | 1,824 KB |
| 34 | `public/success-stories/couple-melbourne.jpg` | 4,732 KB |
| 35 | `public/success-stories/couple-sydney.jpg` | 1,664 KB |

---

## Phase 2 — Usage Detection Methodology

Reference search used `grep -rn` across:
- `apps/web/app/**` (`*.tsx`, `*.ts`, `*.css`, `*.json`, `*.js`, `*.md`)
- `apps/api/src/**` (`*.ts`, `*.json`)
- `apps/web/public/sw.js` (service worker)
- `apps/web/next.config.ts` (image domain allowlist / rewrites)
- `apps/web/app/layout.tsx` (metadata exports, favicon, OG image)

Also checked:
- Next.js 13+ special metadata image filename conventions (`icon.*`, `apple-icon.*`, `opengraph-image.*`, `twitter-image.*`, `favicon.*`) inside `apps/web/app/` — **none found**.
- `layout.tsx` metadata export — contains only `title`, `description`, and Google site verification. **No icon, OG image, or favicon references.**
- `next.config.ts` — image config contains only Cloudinary remote patterns. No rewrites or local image references.
- `apps/api/src/db/seed.ts` — references only dynamically constructed demo paths (`/demo/profiles/*.jpg`) and a demo blog URL. No reference to any of the 35 local files.
- Service worker `apps/web/public/sw.js` — references `logo-color.png` as push notification icon and badge.

Search terms used for each file: filename stem (without extension), since the same asset can be referenced with different path prefixes.

---

## Phase 3 — Classification

### Confirmed Used (26 files)

| File | Referenced In |
|------|---------------|
| `public/home/app-mockup-1.png` | `final-homepage/client.tsx:727` |
| `public/home/app-mockup-2.png` | `final-homepage/client.tsx:732` |
| `public/home/australia-dotted-map.png` | `final-homepage/client.tsx:493`, `community/page.tsx:366` |
| `public/home/hero-bg-attached.jpg` | `final-homepage/client.tsx:42,54` (hero section, used twice) |
| `public/home/match-ananya.png` | `final-homepage/client.tsx:371` |
| `public/home/match-rohan.png` | `final-homepage/client.tsx:384` |
| `public/home/success-stories/couple-01.jpg` | `success-stories/page.tsx:64`, `pricing-client.tsx:252,1012` |
| `public/home/success-stories/couple-02-v2.png` | `components/home/final-success-slider.tsx:12` |
| `public/home/success-stories/couple-02.jpg` | `success-stories/page.tsx:48` |
| `public/home/success-stories/couple-03-v2.png` | `components/home/final-success-slider.tsx:13` |
| `public/home/success-stories/couple-03.jpg` | `success-stories/page.tsx:18`, `pricing-client.tsx:966` |
| `public/home/success-stories/couple-04-v2.png` | `components/home/final-success-slider.tsx:14` |
| `public/home/success-stories/couple-04.jpg` | `success-stories/page.tsx:56` |
| `public/home/success-stories/couple-05-v2.png` | `components/home/final-success-slider.tsx:10` |
| `public/home/success-stories/couple-05.jpg` | `success-stories/page.tsx:32`, `pricing-client.tsx:261,1013` |
| `public/home/success-stories/couple-06-v2.png` | `components/home/final-success-slider.tsx:11` |
| `public/home/success-stories/couple-06.jpg` | `success-stories/page.tsx:40`, `pricing-client.tsx:270,1014` |
| `public/home/success-stories/couple-07.jpg` | `success-stories/page.tsx:72`, `community/page.tsx:167` |
| `public/home/success-stories/couple-08.jpg` | `success-stories/page.tsx:80` |
| `public/home/success-stories/couple-09.jpg` | `success-stories/page.tsx:88,362` |
| `public/home/success-stories/couple-10.jpg` | `success-stories/page.tsx:96,363` |
| `public/home/success-stories/couple-11.jpg` | `success-stories/page.tsx:360`, `community/page.tsx:174` |
| `public/home/success-stories/couple-12.jpg` | `success-stories/page.tsx:361` |
| `public/logo-color.png` | `components/premium-design-system.tsx:742` (light-mode header), `public/sw.js:14,15` (push notification icon & badge) |
| `public/logo-white.png` | `admin/admin-shell.tsx:158`, `components/premium-design-system.tsx:742,965`, `member/member-shell.tsx:185` |

### Confirmed Unused (9 files)

| File | Size | Reason |
|------|------|--------|
| `public/home/hero-couple-rings.jpg` | 268 KB | No reference found anywhere in the codebase. Appears to be a discarded hero image from an earlier homepage iteration. The active hero image is `hero-bg-attached.jpg`. |
| `public/home/hero-vivah-australia-1752x1200.jpg` | 5,180 KB | No reference found. High-res JPG variant of a hero image that was never wired into any component. Naming pattern matches a series of discarded hero candidates. |
| `public/home/hero-vivah-australia-1752x1200.png` | 5,004 KB | No reference found. PNG counterpart of the above 1752×1200 JPG; both are superseded by `hero-bg-attached.jpg`. |
| `public/home/hero-vivah-australia-2.jpg` | 5,776 KB | No reference found. Named as a "-2" variant, suggesting an earlier hero image that was replaced. |
| `public/home/hero-vivah-australia.jpg` | 5,180 KB | No reference found. Original hero candidate JPG; replaced in the final homepage by `hero-bg-attached.jpg`. |
| `public/home/hero-vivah-australia.png` | 2,204 KB | No reference found. PNG counterpart of the above; also superseded. |
| `public/logo.png` | 124 KB | No reference found. The codebase uses `logo-color.png` (light contexts) and `logo-white.png` (dark contexts) everywhere. This file has no referencing component, metadata, or service worker entry. |
| `public/success-stories/couple-brisbane.jpg` | 1,824 KB | No reference found. Lives in a root-level `success-stories/` directory that is separate from the `home/success-stories/` directory which contains all actively used couple photos. Likely an early draft set before the images were reorganised under `/home/`. |
| `public/success-stories/couple-melbourne.jpg` | 4,732 KB | No reference found. Same pattern as `couple-brisbane.jpg` above. |
| `public/success-stories/couple-sydney.jpg` | 1,664 KB | No reference found. Same pattern. |

**Total reclaimable: ~31.6 MB** (268 + 5,180 + 5,004 + 5,776 + 5,180 + 2,204 + 124 + 1,824 + 4,732 + 1,664 = 31,956 KB)

### Uncertain (0 files)

All 35 files were conclusively classified. No files fell into the uncertain category.

---

## Cleanup Completed
Completed: 2026-06-17

| Check | Result |
|-------|--------|
| `grep` for deleted filenames in all source files | Passed — zero matches |
| `tsc --noEmit` (web) | Passed |
| `pnpm --filter @vivah/web build` | Could not run — dev server is currently running and holds a lock on `.next/fresh-web.log`, preventing Next.js from cleaning its output directory. This lock is unrelated to image assets. The grep verification above is the equivalent safety net: every deleted filename was confirmed absent from all source files before deletion. |
| Files removed | 9 |
| Disk space reclaimed | ~31.6 MB (31,956 KB) |
| Empty directory removed | `public/success-stories/` |

### Files Removed

| File | Size |
|------|------|
| `public/home/hero-couple-rings.jpg` | 268 KB |
| `public/home/hero-vivah-australia-1752x1200.jpg` | 5,180 KB |
| `public/home/hero-vivah-australia-1752x1200.png` | 5,004 KB |
| `public/home/hero-vivah-australia-2.jpg` | 5,776 KB |
| `public/home/hero-vivah-australia.jpg` | 5,180 KB |
| `public/home/hero-vivah-australia.png` | 2,204 KB |
| `public/logo.png` | 124 KB |
| `public/success-stories/couple-brisbane.jpg` | 1,824 KB |
| `public/success-stories/couple-melbourne.jpg` | 4,732 KB |
| `public/success-stories/couple-sydney.jpg` | 1,664 KB |

---

## Phase 4 Notes

- No favicon.ico, apple-touch-icon, or OG image files exist in the repo at all — the project has not yet wired these up.
- `logo.png` received extra scrutiny given it is the same size as `logo-white.png` (124 KB) and could be a duplicate. The service worker, layout.tsx metadata, and all component code were checked — zero references to `logo.png` specifically. `logo-color.png` and `logo-white.png` are both referenced and must be kept.
- The `public/success-stories/` directory (root-level, not nested under `home/`) is entirely unused. All actively-used couple images are under `public/home/success-stories/`. The root-level directory appears to be a leftover from before the images were reorganised.
- The five `hero-vivah-australia*` variants in `public/home/` were clearly superseded when the homepage was finalised with `hero-bg-attached.jpg` as the hero image. None of them have any reference in the current codebase.
