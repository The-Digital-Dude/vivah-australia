# Vivah Australia - Homepage Cleanup Audit
Generated: 2026-06-16

## Source of Truth
The permanent homepage is `apps/web/app/final-homepage/client.tsx`.
It is rendered at the root route via `apps/web/app/page.tsx`.
Brand colours: Maroon #A10E4D · Gold #D4A04C · Rose #E74C7C · Ivory #FFF9F5 · Charcoal #2F2F2F

## Audit Confirmation
`apps/web/app/page.tsx` imports `FinalHomepageClient` from `./final-homepage/client` and renders it.
`apps/web/app/final-homepage/client.tsx` is 710 lines and remains the source of truth.
`apps/web/app/final-homepage/page.tsx` is 10 lines and currently duplicates `/`; it will be converted to a redirect.
`apps/web/app/final-homepage-dark/client.tsx` is 716 lines and `apps/web/app/final-homepage-dark/page.tsx` is 10 lines.

`rg -n "final-homepage-dark" apps/web/app -g "*.tsx" -g "*.ts"` returned zero matches outside of the dark homepage files themselves.
`rg -n "homeMenuLinks" apps/web/app/components/premium-design-system.tsx` returned only the definition at line 615.
`rg -n "bump_fonts" package.json apps/web/package.json .github/workflows` returned zero matches.

The old `apps/web/app/homepage` variant route directory does not exist in this checkout. The stale `homeMenuLinks` routes point at non-existent paths.

## Audit Discrepancies
Several light component files export the same component name as their non-light counterpart instead of a distinct `...Light` name:

| File | Expected in request | Actual export |
|------|---------------------|---------------|
| apps/web/app/components/bento-success-stories-light.tsx | BentoSuccessStoriesLight | BentoSuccessStories |
| apps/web/app/components/premium-floating-elements-light.tsx | PremiumFloatingElementsLight | PremiumFloatingElements |
| apps/web/app/components/home/community-stats-strip-light.tsx | CommunityStatsStripLight | CommunityStatsStrip |
| apps/web/app/components/home/how-it-works-section-light.tsx | HowItWorksSectionLight | HowItWorksSection |
| apps/web/app/components/home/trust-verification-strip-light.tsx | TrustVerificationStripLight | TrustVerificationStrip |

No live imports were found for any of these files, so the discrepancy is documentation-only and does not block deletion.

## Import Search Results
The orphaned component search returned only self-definition matches, plus expected substring noise where `faq-section` appears inside `redesigned-faq-section`.

| Search | Results |
|--------|---------|
| `BentoSuccessStories\|from.*bento-success-stories\|bento-success-stories` | `apps/web/app/components/bento-success-stories.tsx:29`, `apps/web/app/components/bento-success-stories-light.tsx:29` |
| `PremiumFloatingElements\|from.*premium-floating-elements\|premium-floating-elements` | `apps/web/app/components/premium-floating-elements.tsx:7`, `apps/web/app/components/premium-floating-elements-light.tsx:7` |
| `RedesignedFaqSection\|from.*redesigned-faq\|redesigned-faq` | `apps/web/app/components/redesigned-faq.tsx:30`, `apps/web/app/components/redesigned-faq-light.tsx:30` |
| `RevampedMembershipCards\|from.*revamped-membership-cards\|revamped-membership-cards` | `apps/web/app/components/revamped-membership-cards.tsx:43`, `apps/web/app/components/revamped-membership-cards-light.tsx:43` |
| `CommunityStatsStrip\|from.*community-stats-strip\|community-stats-strip` | `apps/web/app/components/home/community-stats-strip.tsx:14`, `apps/web/app/components/home/community-stats-strip-light.tsx:14` |
| `HowItWorksSection\|from.*how-it-works-section\|how-it-works-section` | `apps/web/app/components/home/how-it-works-section.tsx:80`, `apps/web/app/components/home/how-it-works-section-light.tsx:80` |
| `MinimalPricingSection\|from.*minimal-pricing-section\|minimal-pricing-section` | `apps/web/app/components/home/minimal-pricing-section.tsx:102` |
| `TrustVerificationStrip\|from.*trust-verification-strip\|trust-verification-strip` | `apps/web/app/components/home/trust-verification-strip.tsx:29`, `apps/web/app/components/home/trust-verification-strip-light.tsx:29` |
| `FaqSection\|from.*faq-section\|faq-section` | `apps/web/app/components/home/faq-section.tsx:31`; substring matches in `redesigned-faq*.tsx` |

## Files Deleted

### Old Homepage Variant - Dark Version
| File | Lines | Reason |
|------|-------|--------|
| apps/web/app/final-homepage-dark/client.tsx | 716 | Dark homepage variant, never linked from root, superseded by final-homepage |
| apps/web/app/final-homepage-dark/page.tsx | 10 | Route wrapper for the above |

### Orphaned Section Components - Components Root
| File | Lines | Exported Name | Last Known Use |
|------|-------|---------------|----------------|
| apps/web/app/components/bento-success-stories.tsx | 136 | BentoSuccessStories | Old homepage iterations |
| apps/web/app/components/bento-success-stories-light.tsx | 136 | BentoSuccessStories | Old homepage iterations |
| apps/web/app/components/premium-floating-elements.tsx | 140 | PremiumFloatingElements | Old homepage iterations |
| apps/web/app/components/premium-floating-elements-light.tsx | 136 | PremiumFloatingElements | Old homepage iterations |
| apps/web/app/components/redesigned-faq.tsx | 105 | RedesignedFaqSection | Old homepage iterations |
| apps/web/app/components/redesigned-faq-light.tsx | 105 | RedesignedFaqSection | Old homepage iterations |
| apps/web/app/components/revamped-membership-cards.tsx | 111 | RevampedMembershipCards | Old homepage iterations |
| apps/web/app/components/revamped-membership-cards-light.tsx | 111 | RevampedMembershipCards | Old homepage iterations |

### Orphaned Section Components - Home Subdirectory
| File | Lines | Exported Name | Last Known Use |
|------|-------|---------------|----------------|
| apps/web/app/components/home/community-stats-strip.tsx | 46 | CommunityStatsStrip | Old dark homepage |
| apps/web/app/components/home/community-stats-strip-light.tsx | 42 | CommunityStatsStrip | Old homepage iterations |
| apps/web/app/components/home/how-it-works-section.tsx | 123 | HowItWorksSection | Old dark homepage |
| apps/web/app/components/home/how-it-works-section-light.tsx | 123 | HowItWorksSection | Old homepage iterations |
| apps/web/app/components/home/minimal-pricing-section.tsx | 197 | MinimalPricingSection | Old homepage iterations |
| apps/web/app/components/home/trust-verification-strip.tsx | 56 | TrustVerificationStrip | Old dark homepage |
| apps/web/app/components/home/trust-verification-strip-light.tsx | 56 | TrustVerificationStrip | Old homepage iterations |
| apps/web/app/components/home/faq-section.tsx | 54 | FaqSection | Old homepage iterations |

### Dead Code in premium-design-system.tsx
| Item | Location | Reason |
|------|----------|--------|
| const homeMenuLinks | line 615 | Defined but never used in render; references non-existent routes |

### Root Utility Script
| File | Reason |
|------|--------|
| bump_fonts.js | One-off font-size bumper for final-homepage-dark; no longer needed |

## Route Changes
| Route | Before | After |
|-------|--------|-------|
| / | Renders final-homepage/client.tsx | No change (already correct) |
| /final-homepage | Duplicate of / | Redirected to / |
| /final-homepage-dark | Rendered dark variant | Removed |
| /homepage/premium | Did not exist (dead nav link) | Never existed |
| /homepage/search | Did not exist (dead nav link) | Never existed |
| /homepage/story | Did not exist (dead nav link) | Never existed |
| /homepage/slider | Did not exist (dead nav link) | Never existed |
| /homepage/animated | Did not exist (dead nav link) | Never existed |
| /homepage/comprehensive | Did not exist (dead nav link) | Never existed |
| /homepage/comprehensive-light | Did not exist (dead nav link) | Never existed |

## Files Kept (Final Homepage Dependencies)
| File | Role |
|------|------|
| apps/web/app/page.tsx | Root route - renders final-homepage |
| apps/web/app/final-homepage/client.tsx | THE homepage - source of truth |
| apps/web/app/final-homepage/page.tsx | Will be converted to redirect -> / |
| apps/web/app/components/home/final-success-slider.tsx | Used by final-homepage AND success-stories page |
| apps/web/app/components/premium-design-system.tsx | PublicHeader, PublicFooter, FAQAccordion, and all shared UI |
| apps/web/app/components/campaign-banner-strip.tsx | Live in layout.tsx |
| apps/web/app/components/banner-strip-client.tsx | Used by campaign-banner-strip |
| apps/web/app/components/index.ts | Barrel export - kept |

## Total Lines Removed
Approximately 2,404 lines of dead component/page/script code plus the dead `homeMenuLinks` array.
