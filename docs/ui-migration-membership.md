# UI Migration - Membership Conversion

## Goal

Bring the pricing and membership experience closer to the premium matrimonial references while preserving all billing logic, plan selection rules, checkout flow, and existing route structure.

## What changed

- Strengthened the hero area with:
  - a more aspirational premium couple visual
  - richer trust framing
  - stronger membership-upgrade positioning
- Kept the existing billing toggle, recommendation widget, comparison matrix, and sticky CTA, while improving the emotional hierarchy around them.
- Added a dedicated secure-payments trust section that surfaces:
  - payment method reassurance
  - encrypted checkout messaging
  - refund-policy confidence framing
  - Australian support positioning
- Kept the page focused on outcomes, trust, and serious introductions rather than feature-heavy SaaS-style pricing language.

## Logic preserved

- Plan data still comes from the existing plans API.
- Billing selection and unavailable-duration handling remain unchanged.
- Checkout still runs through the existing member subscription checkout flow and Stripe redirect.
- Recommendation behavior, comparison data, and modal upgrade flow are unchanged.

## Design intent

This phase makes membership feel closer to a high-end matrimonial conversion funnel: more trust-first, more aspirational, and more emotionally aligned with serious matchmaking rather than generic software pricing.
