# Homepage Builder Documentation

The Homepage Builder is a structured content control panel that allows administrators to show/hide, reorder, and configure specific sections of the Vivah Australia consumer homepage without writing code or editing raw JSON.

## Administrative Route
Access the Homepage Builder at:
`/admin/cms/homepage` (requires Admin privileges).

## Key Features
- **Toggle Visibility**: Instantly hide/show specific blocks on the live homepage by clicking the Eye icon.
- **Drag-and-Drop / Button Reordering**: Reorder sections using the Up/Down keys on the Map list, which dynamically recalculates and swaps their `sortOrder`.
- **Live-Synced Fields**: Configure title, subtitle, custom body content, button CTA action paths, and asset URLs.
- **Publish Status**: Save changes as a `DRAFT` (visible only to admins in local staging environments) or `PUBLISHED` (live to all consumers).

## Managed Sections
1. **Hero**: Headline, description, background graphic, and main registration link.
2. **Trust Strip**: Highlight security points (Verified Profiles, Privacy Controls).
3. **Stats**: Displays counter metrics (e.g. `10k+ | Verified Profiles`).
4. **Why Vivah**: Highlights cultural compatibility indicators.
5. **How It Works**: Steps (guided profile configuration, ID checks, matching).
6. **Testimonials**: Pulls published quotes from the Testimonials model.
7. **Success Stories**: Highlights couple profiles and happy matches.
8. **Membership CTA**: Plan pricing summaries and upgrades prompts.
9. **FAQ**: Dynamic accordion list fetching general support questions.
