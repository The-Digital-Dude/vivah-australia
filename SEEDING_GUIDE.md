# Vivah Australia Seeding Guide

## Overview

The API seed command creates a deterministic, safe demo dataset for local development, UI/UX testing, admin testing, and client demos. It uses only fake member data, fake document metadata, fake payment provider IDs, and placeholder media paths.

The seed is idempotent. Re-running it updates deterministic records instead of creating duplicates.

## Commands

Run from the monorepo root:

```bash
pnpm --filter @vivah/api seed
pnpm --filter @vivah/api seed:demo
pnpm --filter @vivah/api seed:reset
```

`seed` and `seed:demo` create or update the demo dataset.

`seed:reset` deletes the deterministic demo seed records and recreates a clean dataset.

## Production Safety

`seed:reset` is blocked when `NODE_ENV=production` unless this explicit override is present:

```bash
ALLOW_PRODUCTION_SEED=true
```

Do not run demo seeding against production data.

## Demo Credentials

| Role        | Email                          | Password             |
| ----------- | ------------------------------ | -------------------- |
| Super Admin | `admin@vivahaustralia.com`     | `ChangeMeStrong123!` |
| Admin       | `manager@vivahaustralia.com`   | `ChangeMeStrong123!` |
| Moderator   | `moderator@vivahaustralia.com` | `ChangeMeStrong123!` |
| Demo Member | `priya.sharma@example.com`     | `TestUserStrong123!` |
| Demo Member | `arjun.patel@example.com`      | `TestUserStrong123!` |

All seeded demo members use:

```txt
TestUserStrong123!
```

## Dataset Created

- 3 admin accounts: super admin, admin, moderator.
- 40 member accounts with deterministic emails, statuses, display IDs, and slugs.
- 40 detailed matrimonial profiles with South Asian Australian diaspora data.
- Profile display IDs from `VA100001` through `VA100040`.
- Deterministic slugs such as `priya-sharma-va100001` and `arjun-patel-va100002`.
- Mixed account states: active, pending, suspended, banned.
- Mixed profile moderation states: approved, pending, needs changes, rejected.
- Mixed visibility states for public and members-only profile testing.
- Mixed verification badges: none, basic, silver, gold, platinum, fully verified.
- Profile media metadata with public, private, approved, pending, and rejected examples.
- Interests, favourites, blocks, reports, conversations, and messages.
- Verification requests and verification document metadata.
- Member notifications with read and unread examples.
- Plans, subscriptions, payments, invoices, coupons, refunds, and profile boosts.
- CMS pages, blog posts, homepage content, testimonial, success story, and banners.
- Community rooms, posts, comments, and reactions.
- Audit logs, activity logs, admin notes, contact inquiry, saved searches, profile views, push subscriptions, and fraud/risk events.

## Seeded Public/Member Coverage

The dataset supports:

- Public homepage profile cards.
- Public/member profile detail pages.
- Member dashboard data.
- Match discovery/search.
- Member verification and notifications pages.
- Favourites, interests, recently viewed, and messages.
- Membership/pricing views.

## Seeded Admin Coverage

The dataset supports:

- Admin dashboard.
- Admin user management.
- Profile moderation.
- Verification queue.
- Reports queue.
- Payments/subscriptions view.
- Audit/activity review.
- CMS/community demo views.

## Data Safety

The seed uses:

- Fake names and deterministic `example.com` emails.
- Fake Australian mobile numbers under `+6140000xxxx`.
- City/state/suburb only, no full street addresses.
- Fake document metadata and storage keys only.
- Fake payment provider IDs only.
- Placeholder media paths such as `/demo/profiles/female-1.jpg`.

The seed does not:

- Use real personal data.
- Upload real documents.
- Call Stripe.
- Send real email, SMS, or push notifications.
- Use real identity document numbers.

## Troubleshooting

If the seed cannot connect to MongoDB, check `apps/api/.env` and confirm `MONGODB_URI` points to a running local database.

If profile detail pages show member-only restrictions, log in with a seeded demo member before viewing members-only profile URLs.

If reset is blocked, check `NODE_ENV`. Production reset requires `ALLOW_PRODUCTION_SEED=true`.

If duplicate-key errors appear after manual database edits, run:

```bash
pnpm --filter @vivah/api seed:reset
```
