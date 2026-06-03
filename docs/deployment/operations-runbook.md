# Vivah Australia Operations Runbook

## Purpose

This runbook documents the current production-safety posture of the repository and the minimum operating procedures required before launch.

It is intended to close the documentation gap for:

- disaster recovery steps
- backup expectations
- storage lifecycle expectations
- CDN/public asset caching guidance
- private document access handling

It distinguishes between:

- controls already implemented in code
- infrastructure tasks that still need to be configured outside the repo

## Current Code-Level Safety Controls

### Health and Monitoring

- API health endpoints exist at `/health` and `/api/health`.
- Scheduled uptime monitoring exists in [uptime-monitor.yml](/d:/AI/Vivah%20Australia/.github/workflows/uptime-monitor.yml).
- Background job failure alerts for the scheduled uptime workflow exist through [background-job-alert.mjs](/d:/AI/Vivah%20Australia/scripts/background-job-alert.mjs).
- Optional webhook-based API error tracking exists through [error-tracking.service.ts](/d:/AI/Vivah%20Australia/apps/api/src/common/error-tracking.service.ts).

### Private Media and Verification Access

- Private profile media uses time-limited access tokens in [media.service.ts](/d:/AI/Vivah%20Australia/apps/api/src/media/media.service.ts).
- Verification document previews use short-lived tokenized preview URLs and create audit entries in [admin.service.ts](/d:/AI/Vivah%20Australia/apps/api/src/admin/admin.service.ts).
- Media upload signing supports Cloudinary signed uploads when configured in [media.service.ts](/d:/AI/Vivah%20Australia/apps/api/src/media/media.service.ts).

### Seed and Environment Safety

- Environment validation is enforced through [env.ts](/d:/AI/Vivah%20Australia/packages/shared/src/env.ts).
- Demo reseeding has a production guard in [SEEDING_GUIDE.md](/d:/AI/Vivah%20Australia/SEEDING_GUIDE.md).

## Required Infrastructure Configuration

These items still require external infrastructure work even though the repo now documents them.

### MongoDB Backups

Minimum recommendation:

- enable automated daily snapshots
- keep at least 7 daily backups, 4 weekly backups, and 3 monthly backups
- encrypt backups at rest
- restrict restore permissions to senior operators only

Required verification:

- perform one restore drill into a non-production database before launch
- confirm seeded app startup against the restored database

Suggested RPO / RTO:

- target RPO: 24 hours or better
- target RTO: 4 hours or better for MVP launch

### File Storage Lifecycle Policy

For Cloudinary or equivalent object storage:

- keep original verification documents private
- apply retention/lifecycle rules to abandoned uploads and rejected temporary assets
- prevent public indexing of private verification assets
- log and review storage growth monthly

Recommended lifecycle defaults:

- pending temp uploads: expire after 7 days if never completed
- rejected verification uploads: review then delete after 30 days unless compliance requires longer retention
- publicly approved profile photos: retain while active profile exists

### CDN Caching for Public Assets

Apply CDN caching only to public, non-sensitive assets such as:

- homepage images
- approved public profile thumbnails
- static marketing content

Do not cache:

- verification previews
- private gallery URLs
- tokenized media URLs
- authenticated API responses

Recommended headers:

- public static assets: long-lived immutable caching
- dynamic public API payloads: short caching or no-store depending on freshness requirements
- private/tokenized endpoints: `Cache-Control: no-store`

## Disaster Recovery Steps

### 1. Assess Incident Scope

Classify the failure:

- database corruption or outage
- storage outage or accidental deletion
- bad application deployment
- third-party outage such as Stripe, email, SMS, or push

Immediately capture:

- incident start time
- impacted services
- latest successful backup timestamp
- current deployment version / commit hash

### 2. Stabilize Customer Impact

- pause risky admin operations if data consistency is uncertain
- disable new writes if corruption is suspected
- keep `/health` and monitoring status under observation
- communicate operator-only status in internal channels

### 3. Recover by Incident Type

#### Bad Deployment

- roll back web and API to the previous known-good deployment
- re-run health checks
- confirm auth, profile view, billing, and admin moderation routes

#### Database Failure

- provision a clean database target
- restore from the latest valid snapshot
- point the API to the restored database
- run smoke checks:
  - auth login
  - public homepage API
  - member matches
  - billing overview
  - admin dashboard

#### Storage / Media Failure

- verify whether only public assets or private assets are impacted
- restore private verification/media objects from backup if available
- confirm signed/private asset access paths still validate correctly

#### Third-Party Provider Failure

- Stripe:
  - hold membership-support actions
  - review webhook backlog after provider recovery
- Email/SMS:
  - switch to console/no-op only in non-production
  - do not silently disable alerts in production without operator sign-off

### 4. Audit and Reconcile

After service recovery:

- compare subscription/payment records with Stripe state
- review verification queues for interrupted reviews
- inspect audit logs for admin actions during the incident window
- inspect fraud/risk signals for replay or duplicate operations

### 5. Post-Incident Review

Document:

- root cause
- time to detect
- time to recover
- data loss window if any
- permanent follow-up actions

## Pre-Launch Operator Checklist

- configure MongoDB automated backups
- document restore ownership and credentials storage
- configure storage retention/lifecycle rules
- configure CDN cache policy for public assets only
- configure production error-tracking webhook
- configure uptime monitor secrets:
  - `UPTIME_API_URL`
  - `UPTIME_WEB_URL`
  - `BACKGROUND_JOB_ALERT_WEBHOOK_URL`
- run one database restore drill
- run one scheduled-job alert drill

## Evidence Links

- [media.service.ts](/d:/AI/Vivah%20Australia/apps/api/src/media/media.service.ts)
- [admin.service.ts](/d:/AI/Vivah%20Australia/apps/api/src/admin/admin.service.ts)
- [uptime-monitor.yml](/d:/AI/Vivah%20Australia/.github/workflows/uptime-monitor.yml)
- [background-job-alert.mjs](/d:/AI/Vivah%20Australia/scripts/background-job-alert.mjs)
- [error-tracking.service.ts](/d:/AI/Vivah%20Australia/apps/api/src/common/error-tracking.service.ts)
- [SEEDING_GUIDE.md](/d:/AI/Vivah%20Australia/SEEDING_GUIDE.md)
