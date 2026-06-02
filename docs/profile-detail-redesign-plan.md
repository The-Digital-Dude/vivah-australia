# Profile Detail Redesign Plan

## Current Strengths

- The current profile detail page already loads real profile, compatibility, and photo-request data.
- Core trust signals already exist:
  - verification badge
  - match score
  - profile completion
  - last active proxy via `updatedAt`
- Desktop sticky actions and mobile action bar already support the main member actions.
- The page already separates key biodata areas such as family, lifestyle, religion, and partner expectations.
- Restricted, not-found, and loading states are already handled cleanly.

## Current UX Weaknesses

- The page still reads like an upgraded biodata sheet instead of a matchmaking surface.
- Compatibility is present, but it feels like a utility block rather than the emotional entry point.
- The hero does not create attraction or curiosity quickly enough.
- Detailed biodata starts too early and forces users into a scanning pattern instead of a connection pattern.
- Photos are too low in the information hierarchy for a modern matchmaking flow.
- The page does not guide conversation or tell the viewer what makes this person interesting.

## Competitor Observations

- `Shaadi` and `Jeevansathi` surface trust, family fit, and structured biodata well, but often feel dense.
- `Dil Mil`, `Hinge`, and `Bumble` create stronger emotional momentum by prioritizing attraction, personality, and conversation cues.
- The strongest shared pattern is:
  - immediate visual hook
  - clear trust signals
  - compatibility framing
  - guided interaction
  - only then deeper profile detail

## Long-Scroll Fatigue Areas

- The current page stacks many similarly styled information sections with limited hierarchy changes.
- Photos arrive after textual sections, so the user scrolls before the page becomes visually rewarding.
- Partner expectations and detailed biodata are presented as text-heavy blocks rather than visually chunked content.

## Information Overload Problems

- Too many sections carry equal visual weight, so nothing feels especially important.
- Important user questions are not answered in the best order:
  - Can I trust this person?
  - Why might we connect?
  - What should I say?
- Several detail areas repeat the same interaction pattern of label/value cards, which increases cognitive fatigue.

## Trust Gaps

- Verification exists, but the hero does not turn it into a stronger trust story.
- Activity and freshness signals are weakly expressed.
- The current page does not make premium status, completion strength, and gallery access feel like a coherent trust system.

## Interaction Gaps

- The page gives actions, but not much conversational guidance.
- There is no compatibility dashboard that helps a user understand the match beyond a single score.
- There are no “why connect” insights or conversation starters to turn passive browsing into action.

## Proposed Redesign Architecture

1. Premium hero
   - large primary visual
   - identity, profession, location
   - verification, membership, completion, activity, match score
   - sticky desktop action card and sticky mobile action bar
2. Compatibility overview
   - category-based compatibility bars
   - compact insight chips
3. Gallery experience
   - move above biodata
   - public photos first when available
   - private gallery access embedded elegantly
4. Why you may connect
   - positive compatibility cards grounded in real data
5. Conversation starters
   - contextual prompts based on profile details
6. Partner expectations redesign
   - visual preference chips and grouped cards
7. Activity timeline
   - joined, verified, updated, photos, active
8. Biodata sections
   - cleaner, grouped detail cards lower on the page

## Mobile Strategy

- Add a sticky mobile section tab bar for fast jumps:
  - Overview
  - Photos
  - Compatibility
  - About
  - Family
  - Lifestyle
- Keep the mobile action bar fixed and safe-area aware.
- Use tighter content groupings and stronger visual changes between sections to reduce scroll fatigue.
- Make tabs scroll smoothly to real sections instead of hiding content behind accordions.

## Component Strategy

- Reuse existing Vivah premium components where they already fit:
  - `PremiumCard`
  - `PremiumButton`
  - `VerificationBadge`
  - `MatchScoreBadge`
  - `ProfileDetailSection`
- Add lightweight Radix-based UI primitives for:
  - tabs
  - dialog
  - progress
  - separator
- Use subtle `framer-motion` transitions for hero, insight cards, and section entrances.
- Keep backend logic honest:
  - use real profile data where available
  - derive safe compatibility heuristics only when needed
  - do not fabricate hidden member data
