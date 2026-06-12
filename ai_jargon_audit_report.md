# AI Jargon & UX Audit Report

This report identifies instances of robotic, overly enthusiastic, and stereotypical "AI-ish" language across the Vivah Australia platform. The goal is to replace these with warm, human, and culturally nuanced copy that resonates with the Australian Indian and South Asian community.

## Frontend Audit (`apps/web`)

### 1. Pricing Client
**Location:** `apps/web/app/pricing/pricing-client.tsx` (Lines 143, 179, 337)
- **The "AI" Text:** 
  - "Start your journey"
  - "Unlock Premium"
  - "Your membership tools unlock immediately after payment is confirmed. That means messaging access, advanced filtering, and visibility upgrades are available straight away — no waiting period."
- **The Problem:** "Journey" and "Unlock" are classic AI buzzwords that sound unnatural and gamified, rather than focusing on real human connections.
- **The "Humanized" Suggestion:** 
  - Change "Start your journey" to "Begin your search" or "Find your match".
  - Change "Unlock Premium" to "Upgrade to Premium" or "Become a Premium Member".
  - Change "unlock immediately" to "become available instantly".

### 2. Home Client
**Location:** `apps/web/app/home-client.tsx` (Lines 108, 123, 135, 986, 1118, 1190)
- **The "AI" Text:** 
  - "...begin your journey before upgrading..."
  - "Messaging is unlocked when..."
  - "We found each other on Vivah Australia and today we are starting our beautiful journey together. Thank you Vivah Australia!"
  - "Unlock direct messaging, advanced filters, and trust-building features designed for serious matrimonial journeys."
- **The Problem:** The success story sounds incredibly generic and fabricated ("starting our beautiful journey together"). The repeated use of "unlock" and "journey" feels transactional and robotic.
- **The "Humanized" Suggestion:** 
  - Success story: *"We met on Vivah Australia and just clicked. The focus on family and shared values made all the difference. We’re getting married next spring!"*
  - Replace "begin your journey" with "start meeting people" or "build your profile".
  - Replace "Messaging is unlocked" with "You can start messaging".
  - Replace "Unlock direct messaging..." with "Get full access to direct messaging, advanced filters, and features built for serious relationships."

### 3. Verification Page
**Location:** `apps/web/app/member/verification/page.tsx` (Lines 65, 239, 356, 692, 702, 713, 724, 735)
- **The "AI" Text:** 
  - "Build immediate trust and unlock onboarding access."
  - "...unlock higher trust badges and premium matching tiers."
  - "Excellent! Your basic level trust verification is now unlocked."
- **The Problem:** "Unlock" is heavily overused here. It sounds like a video game achievement system rather than a serious, trust-based verification process for a matrimonial site.
- **The "Humanized" Suggestion:** 
  - Use terms like "Gain access to", "Achieve", "Complete", or "Verify".
  - Example: "Complete your basic verification to continue." instead of "Your basic level trust verification is now unlocked."

### 4. Public Matches Client
**Location:** `apps/web/app/matches/public-matches-client.tsx` (Lines 102, 189, 237, 278, 303, 306)
- **The "AI" Text:** 
  - "...then unlock full details and direct actions..."
  - "Unlock the full flow"
  - "Joining unlocks richer search..."
- **The Problem:** Again, "unlock" gamifies the experience.
- **The "Humanized" Suggestion:** "Sign up to see full profiles", "Get full access", "Join to discover more".

### 5. Profile Detail Client
**Location:** `apps/web/app/profiles/[id]/profile-detail-client.tsx` (Line 628)
- **The "AI" Text:** "Ask about their career journey in [Occupation] and what they find most meaningful about it."
- **The Problem:** Nobody uses the phrase "career journey" in casual, initial dating conversations. It sounds like a LinkedIn post.
- **The "Humanized" Suggestion:** "Ask them what they enjoy most about working as a [Occupation]."

### 6. Safety Manager
**Location:** `apps/web/app/member/safety/safety-manager.tsx` (Line 191)
- **The "AI" Text:** Usage of `<Unlock className="size-3.5" />` icon in context of safety.
- **The Problem:** The concept of "Unlocking" a safety feature feels mismatched.
- **The "Humanized" Suggestion:** If this refers to unblocking a user, change the terminology strictly to "Unblock" and use a more appropriate icon (like a shield or user check).

---

## Backend Audit (`apps/api`)

### 1. Email Templates
**Location:** `apps/api/src/common/email.service.ts` (Lines 212-232)
- **The "AI" Text:** 
  - "We are thrilled to have you join our community."
- **The Problem:** "Thrilled" is a classic, slightly overly enthusiastic AI word that lacks personal warmth. The templates are functional but devoid of any Australian or culturally relevant matrimonial charm.
- **The "Humanized" Suggestion:** 
  - Welcome Email: *"Welcome to Vivah Australia, {{ firstName }}! We're so glad you're here. Take a few minutes to complete your profile and start connecting with genuine people looking for a serious relationship."*

---

## Brand Guidelines & Documentation
**Location:** `BRAND_GUIDELINES.md` (Lines 38, 106)
- **The "AI" Text:** "The beginning of a beautiful journey", "Inclusive of family involvement in the matchmaking journey"
- **The Problem:** Brand guidelines enforce the use of "journey".
- **The "Humanized" Suggestion:** Update brand voice guidelines to avoid "journey" and instead focus on "relationship", "future", "search", or "experience".

---

## Task List for Implementation

- [ ] **UI Copy Refactor:** Search the frontend (`apps/web`) for the word "unlock" and replace it with human-centric phrases (e.g., "get access", "upgrade", "view").
- [ ] **Marketing Copy Update:** Replace all instances of "journey" in `home-client.tsx`, `pricing-client.tsx`, and `member/page.tsx` with "search", "experience", or "relationship".
- [ ] **Success Stories Overhaul:** Rewrite the placeholder success stories in `home-client.tsx` to sound like real Australian-Indian couples with specific, relatable details.
- [ ] **Conversation Starters:** Update `profile-detail-client.tsx` to provide natural, casual icebreakers instead of formal interview-style questions ("career journey").
- [ ] **Email Templates:** Update `email.service.ts` DEFAULT_HTML_TEMPLATES to be warmer and more conversational.
- [ ] **Brand Guidelines:** Update `BRAND_GUIDELINES.md` to formally deprecate terms like "journey", "unlock", and "seamless" from the brand vocabulary.
