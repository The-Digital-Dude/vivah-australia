# Vivah Australia — Strategic Gap Analysis vs Industry Leaders

> Compared against: **Shaadi.com**, **eHarmony**, **BharatMatrimony**, **Hinge**
> Codebase audit: 2026-06-02 | ~78% of Phase 1 tasks complete

---

## 📍 Where You Are Right Now

You have a **solid, working MVP** — far more complete than most startups at this stage:

| Layer | Status | Assessment |
|-------|--------|------------|
| Backend API | ~85% complete | Production-ready core: auth, profiles, search, messaging, billing, admin |
| Frontend (public) | ~90% complete | Premium design, all static/auth/profile pages done |
| Frontend (member portal) | ~80% complete | Dashboard, onboarding, matches, chat, community all work |
| Admin CRM | ~85% complete | Moderation, CMS, payments, analytics all functional |
| DevOps/Infra | ~10% complete | No CI/CD, no production deployment, no monitoring |
| Mobile | 0% | Web only — no native app |

**The honest summary:** You have the _skeleton_ of a Shaadi.com competitor. The core workflows exist and are well-engineered. But the product is missing the **features that retain users and convert free→paid**.

---

## 🔍 Competitor Feature Gap Analysis

### 1. Shaadi.com — What They Do That You Don't

| Shaadi Feature | Vivah Australia Status | Gap Severity |
|----------------|----------------------|--------------|
| **AI/ML-powered match recommendations** | Rule-based scoring (0-100 score) | 🔴 HIGH — Shaadi uses behavioral signals, yours is static |
| **"Blue Tick" verified badge prominently visible on cards** | Badge exists but not visually prominent in card grid | 🟡 MEDIUM |
| **Nearby Match** (geo-proximity discovery) | Not implemented | 🟡 MEDIUM |
| **HD Video Calling** within platform | Not built | 🔴 HIGH — big trust/safety feature |
| **Voice/Video Intro on profile** | Not built | 🟡 MEDIUM |
| **Screenshot protection on photos** | Not implemented | 🟡 MEDIUM |
| **"Profile Spotlight" / bold listing** boost | Boost model exists, but not wired to search ranking or visible in cards | 🔴 HIGH — revenue driver |
| **Marriage Biodata PDF generator** | Not built | 🟢 LOW — nice to have |
| **VIP/Elite concierge matchmaking tier** | Not built | 🟢 LOW — premium upsell |
| **Dedicated relationship managers** | Not built | 🟢 LOW |
| **Astrology compatibility tools** | Not built (Phase 2) | 🟢 LOW |
| **Interest/shortlist + ignore workflow** | Interest ✅, Favourites ✅, Block ✅ — but no "ignore/hide from search" | 🟡 MEDIUM |
| **"Who viewed my profile" section** | Recently viewed only shows who _you_ viewed, not who viewed you | 🔴 HIGH — engagement driver |

---

### 2. eHarmony — What They Do That You Don't

| eHarmony Feature | Vivah Australia Status | Gap Severity |
|------------------|----------------------|--------------|
| **Deep compatibility quiz (80+ questions)** | Onboarding form is detailed but not framed as a "compatibility quiz" | 🔴 HIGH — eHarmony's core differentiator |
| **Compatibility Score displayed on every match (60–140 scale)** | Match score exists (0-100) but not as prominently designed | 🟡 MEDIUM |
| **"32 Dimensions of Compatibility" personality report** | No personality profiling or report | 🔴 HIGH — premium upsell |
| **Guided first-contact "Icebreakers"** | No structured first-message prompts | 🟡 MEDIUM |
| **Daily match limit (curated, not firehose)** | Unlimited browsing — no curation limit | 🟡 MEDIUM |
| **"What we'd like to know about you" prompted questions** | Not implemented | 🟢 LOW |
| **Profile sections for "things I can't live without"** | Not implemented | 🟢 LOW |

---

### 3. BharatMatrimony — What They Do That You Don't

| BharatMatrimony Feature | Vivah Australia Status | Gap Severity |
|------------------------|----------------------|--------------|
| **Who viewed your profile** (reverse recently viewed) | ❌ Not built | 🔴 HIGH |
| **"Profile shortlisted by" notification** | Not built | 🟡 MEDIUM |
| **Horoscope matching** | Not built (deferred) | 🟢 LOW |
| **Photo request system** (ask to see private photos) | Not built — private gallery just shows "locked" | 🔴 HIGH |
| **Trust score / Safety score displayed** | Not shown to users | 🟡 MEDIUM |
| **"Response rate" badge on profile** (shows how responsive someone is) | Not built | 🟡 MEDIUM |
| **Family member can search on behalf** (Family Connect) | Not built | 🟢 LOW |
| **SMS alerts for new matches** | OTP SMS done, but not match/activity SMS alerts | 🟡 MEDIUM |
| **Profile completion coaching ("Complete X to get 3x more views")** | Profile strength checklist exists but not tied to engagement coaching | 🟡 MEDIUM |

---

### 4. Hinge / Modern Dating UX — What They Do That You Don't

| Hinge Feature | Vivah Australia Status | Gap Severity |
|---------------|----------------------|--------------|
| **Prompt-based profile sections** ("My love language is…") | Not built | 🟡 MEDIUM |
| **Voice note on profile** | Not built | 🟢 LOW |
| **"Your Turn" nudge** (follow up on unanswered messages) | Not built | 🟡 MEDIUM |
| **Daily Like limit** (creates scarcity, drives upgrades) | Not implemented | 🟡 MEDIUM |
| **"Roses"/Super Like equivalent** | Not built | 🟡 MEDIUM |

---

## 🎯 What You Do Well vs Competitors

| Your Strength | Why It Matters |
|---------------|---------------|
| **Australian-specific verification** (ABN, VEVO, AFP police check, PR docs) | No competitor covers this. Massive trust differentiator for NRI market |
| **Multi-tier verification badge system** (NONE → FULLY_VERIFIED) | More granular than Shaadi's "Blue Tick" |
| **Full admin CRM with moderation** | Most SaaS matrimonial tools outsource this |
| **Real-time Socket.IO messaging** | Shaadi's messaging is not realtime on web |
| **Community rooms** | No major competitor has this |
| **Subscription entitlement middleware** | Correctly enforced server-side, not just UI |
| **Fraud detection rules** | Most platforms lack this at launch |
| **Privacy-first design** (private gallery lock, block enforcement) | Well implemented |

---

## 🚀 Prioritized Roadmap — What To Build Next

### 🔴 TIER 1 — High Impact, Do These First (Core Engagement Drivers)

These are features that directly affect **DAU, retention, and conversion to paid**:

---

#### 1. "Who Viewed My Profile" (Reverse Recently Viewed)
**Why:** Every major matrimonial platform has this. It's the #1 reason users log in daily.
- Add `profileViews` tracking so the _viewed_ person can see who visited their profile
- Premium members see full list + names; free members see blurred/count only
- Backend: already stores views; just need a `/api/me/profile-views/received` endpoint
- Frontend: New section on dashboard + notifications

**Effort:** 1-2 days | **Revenue impact:** HIGH (free→paid conversion)

---

#### 2. Photo Request System
**Why:** Private gallery "locked" message with no action = dead end.
- "Request to View Private Photos" button on profile
- Sends notification to profile owner to accept/reject
- When accepted, viewer gets temporary access to private gallery
- Backend: New `photo_requests` model or reuse interest model with type
- Frontend: Request button on profile detail, manage requests in settings

**Effort:** 2-3 days | **Retention impact:** HIGH

---

#### 3. Wire Boost to Search Ranking + Visible Badge
**Why:** You have the boost model, purchase flow, and entitlement — but it doesn't actually do anything visible. This is a direct **revenue item**.
- Boosted profiles rank first in search results for 24h
- Show a subtle "✨ Boosted" badge on profile cards
- Homepage "Featured Today" section from active boosts

**Effort:** 2 days | **Revenue impact:** DIRECT (monetizes boosts)

---

#### 4. Compatibility Score UI Upgrade
**Why:** Your match score (0-100) exists but is not presented as a premium feature.
- Show score prominently: `🔥 87% Match` on every match card
- On profile detail page: expand to show the top 5 match reasons as a visual breakdown
- Free users: See score but blurred match reasons → upgrade to see why
- Makes the algorithm _feel_ smart and premium

**Effort:** 1-2 days (UI only) | **Retention impact:** HIGH

---

#### 5. "Ignore / Hide Profile" Action
**Why:** Without this, rejected profiles keep appearing in search.
- Shaadi calls it "Ignore", Hinge calls it "Pass"
- Adds profile ID to a hidden list; excluded from future search/recommendations
- Backend: Add `HiddenProfileModel` or a field to `blocks` with type `HIDDEN`
- Frontend: Small "×" button on match cards and profile detail

**Effort:** 1 day | **UX impact:** HIGH (reduces frustration)

---

### 🟡 TIER 2 — Medium Impact, Build After Tier 1

#### 6. Profile Prompts / Conversation Starters
**Why:** eHarmony and Hinge both use this. Reduces cold-message anxiety.
- Add 3–5 optional "profile prompts" to the profile (e.g., "The way to my heart is…", "My ideal Sunday…", "What I'm looking for…")
- Show prompts on profile detail with a "Reply to this" button that pre-fills the message
- Backend: Add `prompts` array to profile model
- Effort: 2-3 days

#### 7. "Profile Viewed By You" Notification Trigger
**Why:** When you view someone's profile, they get notified — this creates a feedback loop of engagement.
- Already storing view events; just add a notification trigger
- "Priya viewed your profile" → they check who you are → they send interest

#### 8. Response Rate Badge
**Why:** Reduces frustration; sets expectations. "Responds quickly" is a trust signal.
- Calculate % of received interests responded to within 48h
- Show a badge: 🟢 "Very Responsive" / 🟡 "Moderately Responsive" / 🔴 "Rarely Responds"
- Effort: 1-2 days

#### 9. Structured Onboarding as "Compatibility Quiz" 
**Why:** eHarmony's core brand is built on this. Rename and reframe the onboarding to feel scientific.
- Rename the onboarding wizard to "Find Your Match — Compatibility Profile"
- Add personality-style questions: "Do you prefer…" image-based questions
- Generate a "Personality Summary" that shows on your profile
- This is a marketing + UX change, not a full rebuild

#### 10. Email Production Templates + Drip Campaign
**Why:** You have the email service wired but using console mode. This is **critical for activation**.
- Welcome email (Day 0)
- "Complete your profile" email (Day 1)
- "X people viewed your profile this week" (Day 7)
- "Your matches are waiting" (Day 14 if not logged in)
- Effort: 2-3 days (HTML templates + SendGrid)

---

### 🟢 TIER 3 — Nice to Have / Future Sprints

| Feature | Why |
|---------|-----|
| **Video intro on profile** | Differentiator for NRI market; high trust signal |
| **In-app video calling** | Keeps users on platform; prevents sharing numbers early |
| **Astrology compatibility** | Cultural fit for Indian diaspora; easy third-party API |
| **Marriage biodata PDF generator** | Common in Indian matrimonial; easy to build |
| **Family member access** | BharatMatrimony's "Family Connect" — common request |
| **"Super Interest" / Roses equivalent** | Premium feature, drives upgrades |
| **Push notifications (web)** | Re-engagement; PWA service worker needed |
| **Mobile app (React Native)** | ~60% of matrimonial traffic is mobile |
| **CI/CD pipeline** | DevOps hygiene |
| **E2E tests** | Quality assurance |

---

## 📊 Current Position vs Competitors

```
Feature Completeness (estimated):

Shaadi.com        ████████████████████  100% (23 years old)
BharatMatrimony   ██████████████████    90%
eHarmony          ████████████████      80%
──────────────────────────────────────────────────
Vivah Australia   ████████████          62% (feature parity)
After Tier 1      ███████████████       75%
After Tier 2      █████████████████     85%
```

> Note: Vivah Australia has **several features competitors don't** (AU-specific verification, fraud detection, community rooms, realtime chat). So "62%" isn't the full story — you have unique differentiators.

---

## 🇦🇺 Australian NRI Market Specific Advice

The **Australian Indian diaspora** is your unique angle — no competitor has built specifically for this:

1. **Australian visa/citizenship filters** — You have this in search. **Market it hard.** "Find someone already settled in Australia" is a huge selling point.
2. **AFP Police Check verification** — No other matrimonial platform verifies this. This is your #1 trust differentiator. Make it a **hero feature** on the homepage.
3. **Suburb-level search** (Sydney → Parramatta, Melbourne → Glen Waverley) — Indian diaspora clusters in specific suburbs. Add this to filters.
4. **Success story structure** — Format success stories around "Both settled in Australia", "Met in Melbourne", "He was on a 482 visa, she was a citizen" — these are **NRI-specific narratives**.
5. **Community-specific landing pages** — `/matches/punjabi-sydney`, `/matches/tamil-melbourne` — SEO goldmine.

---

## ⚡ Recommended 2-Week Sprint Plan

### Week 1: Engagement Features
- Day 1-2: "Who viewed my profile" endpoint + dashboard section
- Day 3-4: Photo request system (model + API + UI)
- Day 5: Wire boost to search ranking + boost badge on cards

### Week 2: Conversion Features  
- Day 6-7: Compatibility score UI upgrade (prominent display + breakdown)
- Day 8: Ignore/hide profile action
- Day 9-10: Email templates (SendGrid) + 4-email drip sequence
- Day 10: Deploy to production (Vercel + Render/Railway)

**After this sprint, Vivah Australia would be genuinely competitive with BharatMatrimony for the Australian market.**

---

## ✅ Summary Table

| Priority | Feature | Days | Impact |
|----------|---------|------|--------|
| 🔴 1 | Who Viewed My Profile | 2 | Retention ⬆️⬆️⬆️ |
| 🔴 2 | Photo Request System | 3 | Engagement ⬆️⬆️⬆️ |
| 🔴 3 | Boost Search Ranking | 2 | Revenue ⬆️⬆️⬆️ |
| 🔴 4 | Compatibility Score UI | 1 | Conversion ⬆️⬆️ |
| 🔴 5 | Ignore Profile | 1 | UX ⬆️⬆️ |
| 🟡 6 | Profile Prompts | 3 | Engagement ⬆️⬆️ |
| 🟡 7 | Response Rate Badge | 2 | Trust ⬆️⬆️ |
| 🟡 8 | Email Drip Campaign | 3 | Activation ⬆️⬆️⬆️ |
| 🟡 9 | Push Notifications | 3 | Re-engagement ⬆️⬆️ |
| 🟢 10 | Production Deployment | 3 | Launch ⬆️⬆️⬆️ |
