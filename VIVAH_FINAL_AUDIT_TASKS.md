# Vivah Australia: Final Completion Tracker

This document contains the step-by-step AI prompts to audit each module, along with a master checklist of known remaining tasks extracted from the project's progress tracking. 

## How to Complete the Project
1. Copy the prompt for a Phase and paste it into the AI chat.
2. Work with the AI to complete the missing code for that phase.
3. Check off the items in the Master Checklist below as you finish them.
4. Move to the next Phase.

---

## The AI Audit Prompts

### Phase 1: Authentication & Onboarding
**Prompt:**
> "Please audit the Authentication and Onboarding module (AUTH-001, AUTH-002, AUTH-003). Look closely at the registration flows, the OTP SMS integration, social logins (Google/Apple), and password recovery. Identify any missing elements, incomplete integrations (like mock providers), or UX gaps between the frontend UI and the backend API. Provide a checklist of what is missing, and let's fix them one by one."

### Phase 2: Profile Management & Media
**Prompt:**
> "Please audit the Profile Management and Media module (PROFILE-001 to 003, MEDIA-001 to 003). Check the onboarding wizard, profile editing, privacy settings, and Cloudinary image upload workflows. Are there any edge cases missing for private galleries, video uploads, or profile visibility toggles? List the gaps and let's implement the missing code."

### Phase 3: Matchmaking & Search
**Prompt:**
> "Please audit the Matchmaking and Search module (MATCH-001 to 003). Review the compatibility scoring algorithm, the search filters, blocked-user enforcement, and pagination limits for free vs. paid users. Are there any gaps in how recommendations are cached or calculated? Identify what is missing to make the matching production-ready."

### Phase 4: Interactions & Real-time Chat
**Prompt:**
> "Please audit the Interactions and Messaging module (INTEREST-001 to 002, MSG-001 to 003). Review the flow of sending interests, accepting/rejecting, and unlocking Socket.IO real-time chat. Check the message read receipts, chat attachments, and real-time typing indicators. List any missing functionality or bugs in the real-time syncing."

### Phase 5: Billing & Memberships
**Prompt:**
> "Please audit the Billing and Memberships module (PLAN-001 to 002, PAY-001 to 003). Check the Stripe integration, webhook handlers, and entitlement middleware. Focus specifically on edge cases: what happens when a subscription expires or a payment fails? Are there missing webhooks or gaps in the wallet/PayPal implementation? Let's fix them."

### Phase 6: Admin Dashboard & Moderation
**Prompt:**
> "Please audit the Admin and Moderation module (ADMIN-001 to 008). Review the user management, profile moderation queues, verification approvals, and CMS page editors. Is the visual diff tool for profile updates missing? Are there gaps in the bulk moderation actions or analytics dashboard? Give me a list of the missing admin features."

### Phase 7: Security, Trust & Verification
**Prompt:**
> "Please audit the Security and Verification module (VERIFY-001 to 003, SAFETY-001 to 002, SEC-001 to 004). Check the ID/facial verification extension points, fraud prevention rules (velocity checks), reporting system, and audit logs. Are we missing real integration with identity providers? Are the WebPush notifications incomplete? Let's close these security gaps."

### Phase 8: DevOps & Production Readiness
**Prompt:**
> "Please audit the DevOps and Production Readiness module. Review the current `.env.example` configurations, the email/SMS mock providers, and the deployment requirements for Railway/Vercel/MongoDB. What exact scripts, CI/CD pipelines, or configuration changes are missing to push this codebase live to real users today?"

---

## Master Checklist of Known Missing Tasks

Based on the latest project audit, here are the exact features you need to finish. 

### Authentication & Account
- [ ] **Social Login (AUTH-003):** Replace mock social login tokens with real Google Identity Services and Apple Sign-In SDKs.
- [ ] **Admin Authentication:** Move admin auth tokens from `localStorage` to `httpOnly` cookies so Next.js server-routes can protect pages securely.
- [ ] **Account Deletion:** Implement the backend workflows to actually delete/deactivate an account when requested (currently just returns a 200 without deleting).

### Media & Profiles
- [ ] **Video Introductions (MEDIA-002):** Implement video upload logic using Cloudinary video transformations.
- [ ] **Private Galleries:** Wire up the logic so that accepting an Interest request automatically unlocks the user's private media gallery.
- [ ] **Boosted Profiles:** Integrate active profile boosts so they actually rank higher on the search page and display a "Boosted" badge.

### Communications (Email & SMS)
- [ ] **Production Email Integrations:** Replace the "console" mock email with real SendGrid or Mailgun API calls for templates and async queueing.
- [ ] **Production SMS Integrations:** Replace the "console" mock SMS with real Twilio API calls for OTP phone verification.
- [ ] **Push Notifications:** Finish the web-push integration by adding browser Service Workers to receive notifications.

### Billing & Payments
- [ ] **Payment Edge Cases:** Build webhook handlers for failed recurring Stripe payments (what to do when a subscription renewal fails).
- [ ] **Alternative Wallets (PAY-003):** Add PayPal adapter or custom Stripe Payment Element wallet UI.

### Admin & Moderation
- [ ] **Profile Diff Tool:** Add a visual "Diff" UI in the Admin Moderation queue so admins can easily see exactly what a user changed on their profile.
- [ ] **Verification Uploads:** Finish the secure member-side upload flow for submitting ID/Visa verification documents.
- [ ] **Identity Providers (VERIFY-003):** Hook up a real ID verification provider (e.g., Stripe Identity or Veriff) instead of relying solely on manual admin review.

### DevOps & Testing
- [ ] **DevOps (DEVOPS-001 to 004):** Set up automated CI/CD pipelines (GitHub Actions deployment), database automated backups, and production logging.
- [ ] **E2E Testing (TEST-004):** Expand the Playwright testing matrix to cover complex end-to-end user journeys.
