# Member Dashboard Redesign Plan

## Current UX Problems

- The member area feels closer to an admin console than a matchmaking product.
- Navigation is overloaded with many first-level sidebar links that compete for attention.
- Match discovery creates a double-sidebar effect because the member shell already owns one sidebar and the matches page adds another persistent filter panel.
- The dashboard mixes too many widgets with uneven spacing, which makes the page feel crowded on desktop and heavy on mobile.
- Discovery cards surface too much biodata at once, reducing scan speed and emotional clarity.
- Important member actions like profile strength, verification, interests, and discovery are present, but the hierarchy is not strong enough to guide next steps.

## Competitor-Inspired UX Principles

- Treat the dashboard as a matchmaking command center rather than a settings index.
- Keep the highest-value actions visible first: discover matches, reply to interest, improve trust, and continue conversations.
- Reduce permanent navigation and move deeper or less frequent actions into overflow menus and grouped destinations.
- Use lightweight chips, tabs, sheets, and cards instead of dense stacked sidebars.
- Keep cards emotional and scannable: photo, identity, trust, compatibility, and a small number of highlights.
- Preserve a mobile-first interaction model with bottom navigation and safe-area-aware actions.

## New Information Architecture

- `Discover`
  - Matches
  - Recommended members
  - Saved searches
- `Messages`
  - Conversations
- `Activity`
  - Received interests
  - Sent interests
  - Favourites
  - Recently viewed
  - Viewed me
  - Notifications
- `Membership`
  - Subscription
  - Boosts
- `Profile`
  - Edit profile
  - Photos / media
  - Verification
  - Privacy / settings
  - Safety

## Proposed Desktop Layout

- Top member header inside the shell:
  - greeting / page title zone
  - simplified primary navigation
  - notifications entry
  - profile / overflow menu
- Optional slim contextual utility rail only if needed later, but no heavy always-on sidebar.
- Dashboard body:
  - welcome hero
  - summary metrics
  - journey / next action sections
  - discovery previews
- Match discovery:
  - top search and tab system
  - quick filters as chips
  - sort control
  - advanced filters in a right-side sheet instead of a permanent panel

## Proposed Mobile Layout

- Compact top bar with title and utility actions.
- Fixed bottom navigation:
  - Discover
  - Messages
  - Activity
  - Membership
  - Profile
- Secondary destinations live in a sheet instead of a long stacked menu.
- Match filters open in sheet form, never as a second sidebar.
- Sticky CTA patterns must respect safe-area inset and avoid covering footer content.

## Dashboard Redesign Plan

- Rebuild `/member` into a warmer command center with clearer hierarchy and more whitespace.
- Add a welcome hero with profile completion, verification, and membership status.
- Replace dense mixed widgets with a cleaner sequence:
  - key metrics
  - journey progress
  - recommended next actions
  - people to discover today
- Keep existing data integrations and only reframe the frontend presentation.

## Match Discovery Redesign Plan

- Remove the permanent filter sidebar.
- Use discovery tabs for recommended, active, verified, new, and nearby views where supported.
- Promote quick chips and sort controls above the grid.
- Move advanced filters into a sheet with grouped sections and progressive disclosure.
- Simplify profile cards to emphasize image, identity, trust, match score, and a few highlights.

## Sidebar / Filter Simplification Strategy

- Replace the large member sidebar with simplified primary navigation and grouped secondary links.
- Treat matches filters as contextual controls owned by the page, not by layout chrome.
- Keep advanced search available, but hidden behind an explicit `Advanced filters` action.
- Collapse less common member utilities into profile and overflow menus.

## shadcn/ui Components To Use

- `Sheet` for mobile navigation / advanced filters pattern
- `DropdownMenu` for overflow profile actions
- `Tabs` for discovery and activity grouping
- `Badge` for state, trust, and count indicators
- `Button` for consistent member CTA styling
- `Progress` for profile and journey progress
- `Card` for summary, recommendation, and social blocks
- `Separator` for lightweight grouping where needed
- `Accordion` for mobile filters or compact comparison content

## Implementation Checklist

- Create redesign docs and implementation checklist
- Redesign member shell navigation and mobile bottom nav
- Rebuild `/member` dashboard into a command-center layout
- Remove permanent matches filter sidebar
- Add advanced match filter sheet
- Simplify discovery profile cards
- Create Activity hub
- Polish mobile member experience
- Run final QA across desktop, tablet, and mobile
