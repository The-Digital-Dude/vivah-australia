Add under a ## Build & Type Checking section\n\nAlways run `tsc --noEmit` (TypeScript type check) after editing any .ts/.tsx files and before committing.
Add under a ## Project Conventions / Framework section\n\nThis project uses Next.js 16 with the proxy.ts convention — do NOT create middleware.ts, as it conflicts and causes 404s.
Add under a ## Workflow section\n\nAfter fixing bugs, verify locally (preview deploy or visual check) before considering the task complete, then commit and push.
Add under a ## UI / Styling section\n\nUse only standard Tailwind utility classes; avoid non-standard opacity classes that render broken layouts.
