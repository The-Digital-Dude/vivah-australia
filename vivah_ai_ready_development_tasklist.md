# Vivah Australia - AI-Ready Development Task List

> Purpose: This Markdown file is a development-only, module-by-module task list for building **Vivah Australia**, a premium matrimonial and matchmaking platform for the Australian market.
>
> It is optimized for AI-assisted development with Codex or similar coding agents. Each module is broken into implementation-ready tasks with backend, frontend, database, API, validation, security, and test requirements.

---

## 0. Codex Usage Instructions

Use this file as the master development backlog.

Recommended AI workflow:

1. Give Codex only one module at a time.
2. Ask Codex to first inspect the existing repository structure.
3. Ask Codex to generate schema/models, services, controllers/routes, frontend pages/components, and tests in small batches.
4. Do not allow Codex to skip tests or validation.
5. After each module, run linting, type-checking, unit tests, and integration tests.
6. Keep Phase 2 features as placeholders only unless explicitly requested.

Suggested Codex prompt format:

```text
You are building the Vivah Australia matrimonial platform.
Follow the project conventions already present in the repo.
Implement Module [MODULE_ID] from the attached AI-ready task list.
Start by reading the current folder structure and existing code.
Then implement backend, frontend, database, validation, security, and tests.
Do not implement Phase 2 features unless the task explicitly says so.
Return a summary of changed files, created routes, tests added, and any required env vars.
```

---

## 1. Project Assumptions

### 1.1 Primary Scope

Build a responsive web platform with:

- Public website
- Member portal
- Admin CRM
- Matchmaking/search system
- Profile verification system
- Internal messaging system
- Community rooms
- Membership/subscription system
- Payment system
- Notification system
- Reporting and analytics
- Mobile responsive UI

### 1.2 MVP Delivery Scope

The proposal document describes a lean MVP with:

- Responsive web application
- Admin dashboard
- Real-time chat system
- Subscription and payment integration
- Matchmaking and search engine
- User verification and moderation system

### 1.3 Recommended Stack

Use the proposal stack unless the repository already has a different stack:

- Frontend: Next.js, React, TypeScript, TailwindCSS
- Backend: Node.js, Express.js, TypeScript
- Database: MongoDB with Mongoose
- Auth: JWT + refresh tokens
- Realtime: Socket.IO
- Payments: Stripe first, PayPal later if required
- Media: Cloudinary or S3-compatible storage
- Emails: SendGrid or Mailgun
- SMS/OTP: Twilio, MessageBird, or Australian SMS provider
- Hosting: Vercel for frontend, DigitalOcean/AWS/Render for backend
- CDN/Security: Cloudflare

### 1.4 Phase 2 Exclusions

Do not build these in Phase 1 unless explicitly requested:

- Native iOS app
- Native Android app
- Video calling
- Voice calling
- Scheduled video meetings
- Biometric login
- AI matchmaking engine
- Astrology matching
- Family accounts
- Wedding marketplace
- Franchise portal
- Multi-language translation
- Deep government API integrations

However, create clean extension points where helpful.

---

## 2. Repository Foundation

### MODULE CORE-001 - Monorepo / Project Setup

#### Goal
Create a clean, scalable project foundation that supports frontend, backend, shared types, testing, and deployment.

#### Tasks

- [ ] Create monorepo structure:

```text
/apps
  /web                 # Next.js frontend
  /api                 # Express API backend
/packages
  /shared              # shared TypeScript types, constants, validators
  /config              # shared eslint, tsconfig, prettier config
  /ui                  # optional reusable UI components
/docs
  /api
  /architecture
  /deployment
/scripts
```

- [ ] Configure TypeScript strict mode across all apps.
- [ ] Add ESLint and Prettier.
- [ ] Add environment config validation.
- [ ] Add `.env.example` files for frontend and backend.
- [ ] Add GitHub Actions or equivalent CI pipeline.
- [ ] Add base README with setup instructions.

#### Acceptance Criteria

- `npm install` or `pnpm install` works from root.
- `npm run dev` starts both frontend and backend.
- `npm run lint`, `npm run typecheck`, and `npm test` run successfully.
- Environment variables are documented.

---

### MODULE CORE-002 - Shared Constants, Enums, and Validation

#### Goal
Create shared definitions to prevent inconsistent values across frontend and backend.

#### Tasks

- [ ] Create enums/constants for:
  - User roles: `USER`, `PREMIUM_USER`, `MODERATOR`, `ADMIN`, `SUPER_ADMIN`
  - Account status: `PENDING`, `ACTIVE`, `SUSPENDED`, `BANNED`, `DELETED`
  - Gender
  - Marital status
  - Verification status
  - Verification levels
  - Profile visibility
  - Media visibility
  - Interest status
  - Subscription status
  - Payment status
  - Report status
  - Community post status
- [ ] Create reusable validation schemas using Zod or Joi.
- [ ] Share validation between frontend forms and backend APIs where possible.

#### Acceptance Criteria

- Shared package exports types, constants, and validators.
- Backend routes use shared validators.
- Frontend forms use shared validators or matching schemas.

---

## 3. Database Architecture

### MODULE DB-001 - Base MongoDB Models

#### Goal
Create all core MongoDB/Mongoose models required for Phase 1.

#### Core Collections

Create models for:

1. `users`
2. `profiles`
3. `profile_media`
4. `verification_requests`
5. `verification_documents`
6. `interests`
7. `favourites`
8. `blocks`
9. `reports`
10. `conversations`
11. `messages`
12. `community_rooms`
13. `community_posts`
14. `community_comments`
15. `community_reactions`
16. `plans`
17. `subscriptions`
18. `payments`
19. `invoices`
20. `coupons`
21. `profile_boosts`
22. `notifications`
23. `audit_logs`
24. `activity_logs`
25. `cms_pages`
26. `blog_posts`
27. `testimonials`
28. `success_stories`
29. `banners`
30. `system_settings`
31. `admin_notes`

#### General Model Rules

Every model should include:

```ts
createdAt: Date;
updatedAt: Date;
createdBy?: ObjectId;
updatedBy?: ObjectId;
isDeleted?: boolean;
deletedAt?: Date;
deletedBy?: ObjectId;
```

#### Required Indexes

- `users.email` unique sparse
- `users.mobile` unique sparse
- `profiles.userId` unique
- `profiles.gender`
- `profiles.dateOfBirth`
- `profiles.religion`
- `profiles.community`
- `profiles.caste`
- `profiles.motherTongue`
- `profiles.country`
- `profiles.state`
- `profiles.city`
- `profiles.suburb`
- `profiles.occupation`
- `profiles.education.highestQualification`
- `profiles.verification.level`
- `profiles.visibility.status`
- compound index for matchmaking search
- `messages.conversationId + createdAt`
- `interests.senderId + receiverId` unique
- `blocks.blockerId + blockedId` unique
- `subscriptions.userId + status`
- `payments.userId + createdAt`
- `audit_logs.actorId + createdAt`

#### Acceptance Criteria

- Mongoose models compile with TypeScript.
- Required indexes are defined.
- Seed script can create test users, profiles, plans, and admin user.

---

### MODULE DB-002 - Main User Model

#### Suggested Fields

```ts
User {
  _id: ObjectId;
  email?: string;
  mobile?: string;
  passwordHash?: string;
  authProviders: Array<'email' | 'mobile' | 'google' | 'facebook' | 'apple'>;
  googleId?: string;
  facebookId?: string;
  appleId?: string;
  role: 'USER' | 'PREMIUM_USER' | 'MODERATOR' | 'ADMIN' | 'SUPER_ADMIN';
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'DELETED';
  emailVerified: boolean;
  mobileVerified: boolean;
  lastLoginAt?: Date;
  passwordChangedAt?: Date;
  failedLoginAttempts: number;
  lockUntil?: Date;
  refreshTokenVersion: number;
  termsAcceptedAt?: Date;
  privacyAcceptedAt?: Date;
  marketingConsent: boolean;
  metadata: {
    signupIp?: string;
    signupUserAgent?: string;
    lastIp?: string;
    lastUserAgent?: string;
  };
}
```

#### Acceptance Criteria

- Supports email, mobile, Google, Facebook, and Apple login.
- Supports account activation workflow.
- Supports secure role-based access.

---

### MODULE DB-003 - Profile Model

#### Suggested Fields

```ts
Profile {
  userId: ObjectId;
  displayId: string;
  slug?: string;
  completionPercentage: number;
  personal: {
    firstName: string;
    lastName: string;
    gender: string;
    dateOfBirth: Date;
    age: number;
    heightCm?: number;
    weightKg?: number;
    maritalStatus: string;
    numberOfChildren?: number;
    disabilityStatus?: string;
  };
  religion: {
    religion?: string;
    community?: string;
    caste?: string;
    subCaste?: string;
    motherTongue?: string;
    languagesSpoken: string[];
  };
  location: {
    country: string;
    state?: string;
    city?: string;
    suburb?: string;
    citizenshipStatus?: string;
    visaStatus?: string;
  };
  education: {
    highestQualification?: string;
    institutionName?: string;
    graduationYear?: number;
    additionalCertifications?: string[];
  };
  employment: {
    occupation?: string;
    industry?: string;
    employmentStatus?: string;
    employerName?: string;
    annualIncome?: number;
    annualIncomeVisibility: 'PUBLIC' | 'MATCHES_ONLY' | 'PRIVATE';
  };
  family: {
    fatherDetails?: string;
    motherDetails?: string;
    siblingDetails?: string;
    familyValues?: string;
    familyType?: string;
  };
  lifestyle: {
    smokingHabits?: string;
    drinkingHabits?: string;
    dietaryPreferences?: string;
    fitnessInterests?: string[];
    religiousPractices?: string;
  };
  about: {
    aboutMe?: string;
    hobbies?: string[];
    interests?: string[];
    personalGoals?: string;
    partnerExpectations?: string;
  };
  partnerPreference: {
    ageMin?: number;
    ageMax?: number;
    heightMinCm?: number;
    heightMaxCm?: number;
    religions?: string[];
    communities?: string[];
    castes?: string[];
    motherTongues?: string[];
    countries?: string[];
    states?: string[];
    cities?: string[];
    educationLevels?: string[];
    occupations?: string[];
    incomeMin?: number;
    incomeMax?: number;
    maritalStatuses?: string[];
  };
  verification: {
    level: 'NONE' | 'BASIC' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'FULLY_VERIFIED';
    emailVerified: boolean;
    mobileVerified: boolean;
    identityVerified: boolean;
    addressVerified: boolean;
    employmentVerified: boolean;
    visaVerified: boolean;
    policeClearanceVerified: boolean;
    facialVerified: boolean;
  };
  visibility: {
    status: 'PUBLIC' | 'MEMBERS_ONLY' | 'MATCHES_ONLY' | 'HIDDEN';
    showPhoto: boolean;
    showIncome: boolean;
    showEmployer: boolean;
    showLastName: boolean;
  };
  stats: {
    profileViews: number;
    interestsReceived: number;
    interestsSent: number;
    favouritesCount: number;
    lastActiveAt?: Date;
  };
  moderation: {
    approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_CHANGES';
    reviewedBy?: ObjectId;
    reviewedAt?: Date;
    rejectionReason?: string;
  };
}
```

#### Acceptance Criteria

- Profile can be created and edited incrementally.
- Completion percentage updates after profile changes.
- Search indexes support advanced filtering.

---

## 4. Authentication & Account Management

### MODULE AUTH-001 - Email and Password Registration

#### Backend Tasks

- [ ] Create `POST /api/auth/register/email`.
- [ ] Validate email, password, first name, last name, terms acceptance.
- [ ] Hash password using bcrypt or argon2.
- [ ] Create user with `PENDING` status.
- [ ] Generate email OTP or verification token.
- [ ] Send verification email.
- [ ] Create initial empty profile draft.
- [ ] Log activity: `USER_REGISTERED_EMAIL`.

#### Frontend Tasks

- [ ] Build registration page.
- [ ] Add client-side validation.
- [ ] Add terms/privacy checkbox.
- [ ] Add success screen instructing user to verify email.

#### API Contract

```http
POST /api/auth/register/email
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "StrongPassword123!",
  "firstName": "Amit",
  "lastName": "Sharma",
  "termsAccepted": true,
  "marketingConsent": false
}
```

#### Tests

- [ ] Reject duplicate email.
- [ ] Reject weak password.
- [ ] Reject missing terms acceptance.
- [ ] Create user and profile successfully.

---

### MODULE AUTH-002 - Mobile Registration and OTP

#### Backend Tasks

- [ ] Create `POST /api/auth/register/mobile`.
- [ ] Create `POST /api/auth/otp/send`.
- [ ] Create `POST /api/auth/otp/verify`.
- [ ] Rate-limit OTP sending.
- [ ] Store hashed OTP with expiry.
- [ ] Mark mobile as verified after successful verification.

#### Frontend Tasks

- [ ] Build mobile signup flow.
- [ ] Build OTP input component.
- [ ] Add resend countdown.

#### Security

- OTP expiry: 5-10 minutes.
- Limit attempts per OTP.
- Limit sends per phone/IP.

#### Tests

- [ ] OTP cannot be reused.
- [ ] OTP expires correctly.
- [ ] Rate limit blocks abuse.

---

### MODULE AUTH-003 - Social Login

#### Backend Tasks

- [ ] Add Google OAuth.
- [ ] Add Facebook OAuth.
- [ ] Add Apple OAuth.
- [ ] Link social identity to existing email account if safe.
- [ ] Create account if no existing user.
- [ ] Require terms acceptance after first social login.

#### Frontend Tasks

- [ ] Add social login buttons.
- [ ] Add first-time social login onboarding page.

#### Tests

- [ ] Existing email account links correctly.
- [ ] Social login creates user correctly.
- [ ] Suspended users cannot login through social provider.

---

### MODULE AUTH-004 - Login, Logout, Refresh Tokens, Session Management

#### Backend Tasks

- [ ] Create `POST /api/auth/login`.
- [ ] Create `POST /api/auth/refresh`.
- [ ] Create `POST /api/auth/logout`.
- [ ] Use short-lived access tokens.
- [ ] Use refresh token rotation.
- [ ] Store refresh token version on user.
- [ ] Revoke all sessions on password change.

#### Frontend Tasks

- [ ] Build login page.
- [ ] Implement auth state management.
- [ ] Protect private routes.
- [ ] Auto-refresh access tokens.

#### Tests

- [ ] Valid login returns tokens.
- [ ] Invalid login increments failed attempts.
- [ ] Locked user cannot login.
- [ ] Logout invalidates refresh token.

---

### MODULE AUTH-005 - Password Recovery and Change Password

#### Backend Tasks

- [ ] Create `POST /api/auth/forgot-password`.
- [ ] Create `POST /api/auth/reset-password`.
- [ ] Create `POST /api/auth/change-password`.
- [ ] Send reset email.
- [ ] Invalidate previous tokens after reset.

#### Frontend Tasks

- [ ] Forgot password page.
- [ ] Reset password page.
- [ ] Change password page inside account settings.

#### Tests

- [ ] Reset token expires.
- [ ] Old password required for change password.
- [ ] Refresh tokens are revoked after password change.

---

## 5. Public Website & CMS

### MODULE WEB-001 - Public Homepage

#### Frontend Tasks

Build responsive homepage sections:

- [ ] Hero banner
- [ ] Featured profiles
- [ ] Success stories
- [ ] Membership plans
- [ ] How it works
- [ ] Safety and verification section
- [ ] Testimonials
- [ ] Blog highlights
- [ ] FAQ preview
- [ ] Contact information

#### Backend Tasks

- [ ] Create public CMS APIs for homepage content.
- [ ] Create API for featured approved profiles.
- [ ] Create API for active plans.

#### API Endpoints

```http
GET /api/public/home
GET /api/public/featured-profiles
GET /api/public/plans
GET /api/public/success-stories
GET /api/public/testimonials
GET /api/public/blogs?limit=3
```

#### Acceptance Criteria

- Homepage is SEO-friendly.
- All public content loads without authentication.
- Only approved visible profiles appear publicly.

---

### MODULE WEB-002 - Static Pages

#### Pages to Build

- [ ] About Us
- [ ] Contact Us
- [ ] Privacy Policy
- [ ] Terms & Conditions
- [ ] Refund Policy
- [ ] Safety Guidelines
- [ ] Community Guidelines
- [ ] Verification Policy
- [ ] Help Centre
- [ ] FAQ Page

#### Backend Tasks

- [ ] Create `cms_pages` model.
- [ ] Create admin CRUD for pages.
- [ ] Create public page fetch endpoint by slug.

#### API Endpoints

```http
GET /api/public/pages/:slug
POST /api/admin/cms/pages
PATCH /api/admin/cms/pages/:id
DELETE /api/admin/cms/pages/:id
```

#### Acceptance Criteria

- Admin can update static content without deployment.
- Public pages render SEO metadata.

---

### MODULE WEB-003 - Contact Form

#### Backend Tasks

- [ ] Create contact inquiry model.
- [ ] Create `POST /api/public/contact`.
- [ ] Send admin email notification.
- [ ] Add spam protection using rate limit and CAPTCHA.

#### Frontend Tasks

- [ ] Build contact form.
- [ ] Add validation and success/error states.

#### Tests

- [ ] Reject invalid email.
- [ ] Rate limit repeated submissions.
- [ ] Contact inquiry saved and email sent.

---

## 6. Member Profile Module

### MODULE PROFILE-001 - Profile Onboarding Wizard

#### Goal
Create multi-step onboarding after registration.

#### Steps

1. Basic personal details
2. Religious/community details
3. Location and visa/citizenship details
4. Education and employment
5. Family details
6. Lifestyle
7. About me and partner expectations
8. Partner preferences
9. Photo upload
10. Profile preview and submit for approval

#### Backend Tasks

- [ ] Create profile draft update endpoint.
- [ ] Allow partial saves.
- [ ] Track onboarding step.
- [ ] Calculate profile completion percentage.
- [ ] Submit profile for moderation.

#### Frontend Tasks

- [ ] Build stepper layout.
- [ ] Add progress indicator.
- [ ] Add auto-save or save-and-continue.
- [ ] Add review screen.

#### API Endpoints

```http
GET /api/me/profile
PATCH /api/me/profile
POST /api/me/profile/submit
```

#### Validation Rules

- Date of birth must indicate legal adult age.
- Height and weight must be reasonable numeric values.
- Required fields: first name, last name, gender, date of birth, marital status, country, state/city, religion/community where applicable.
- About text must enforce min/max length.
- Annual income cannot be negative.

#### Tests

- [ ] Partial profile save works.
- [ ] Invalid DOB rejected.
- [ ] Completion percentage updates.
- [ ] Profile submit changes moderation status to pending.

---

### MODULE PROFILE-002 - Profile View Page

#### Backend Tasks

- [ ] Create `GET /api/profiles/:id`.
- [ ] Apply privacy rules.
- [ ] Apply subscription-based field visibility.
- [ ] Increment profile view count.
- [ ] Do not expose blocked/private/deleted users.

#### Frontend Tasks

- [ ] Build public/member profile view.
- [ ] Show verification badges.
- [ ] Show interest, favourite, block, report actions.
- [ ] Show locked sections for free users where applicable.

#### Privacy Rules

- Hidden profiles cannot appear in search.
- Private photos require permission.
- Income/employer visibility must be respected.
- Blocked users cannot view each other.

#### Tests

- [ ] Blocked user cannot view profile.
- [ ] Private fields hidden from unauthorized users.
- [ ] View count increments once per viewer/session window.

---

### MODULE PROFILE-003 - Profile Edit and Account Settings

#### Backend Tasks

- [ ] Create profile edit endpoint.
- [ ] Create account settings endpoint.
- [ ] Create privacy settings endpoint.
- [ ] Create notification preferences endpoint.
- [ ] Re-send profile to approval if sensitive fields change.

#### Frontend Tasks

- [ ] Build edit profile pages.
- [ ] Build privacy settings page.
- [ ] Build account settings page.
- [ ] Build deactivate/delete request UI.

#### API Endpoints

```http
PATCH /api/me/profile
PATCH /api/me/privacy
PATCH /api/me/notification-preferences
POST /api/me/deactivate
POST /api/me/delete-request
```

#### Tests

- [ ] User can only edit own profile.
- [ ] Sensitive field changes trigger moderation.
- [ ] Visibility changes apply in search immediately.

---

## 7. Profile Media Management

### MODULE MEDIA-001 - Photo Uploads

#### Backend Tasks

- [ ] Create signed upload flow for Cloudinary/S3.
- [ ] Create media record after upload.
- [ ] Support profile photo and multiple photos.
- [ ] Support public gallery and private gallery.
- [ ] Add approval workflow status.
- [ ] Generate thumbnails.

#### Frontend Tasks

- [ ] Build drag-and-drop uploader.
- [ ] Build crop/preview UI for profile photo.
- [ ] Build gallery manager.
- [ ] Add visibility controls.
- [ ] Show approval status.

#### API Endpoints

```http
POST /api/me/media/upload-url
POST /api/me/media
GET /api/me/media
PATCH /api/me/media/:id
DELETE /api/me/media/:id
POST /api/me/media/:id/set-profile-photo
```

#### Validation Rules

- Only allow jpg, png, webp.
- Max image size configurable.
- Scan file type and reject suspicious files.
- Do not trust client MIME type only.

#### Tests

- [ ] Upload URL only works for authenticated users.
- [ ] Unsupported file type rejected.
- [ ] Private photos not returned to unauthorized users.

---

### MODULE MEDIA-002 - Video Introduction Upload

#### Backend Tasks

- [ ] Support video upload records.
- [ ] Add video approval workflow.
- [ ] Add visibility settings.
- [ ] Add file size and duration limits.

#### Frontend Tasks

- [ ] Build video uploader.
- [ ] Show processing/approval state.
- [ ] Render video intro on profile if approved and visible.

#### Tests

- [ ] Oversized videos rejected.
- [ ] Unapproved videos hidden from profile view.

---

### MODULE MEDIA-003 - Admin Media Review

#### Backend Tasks

- [ ] Create admin queue endpoint for pending media.
- [ ] Create approve/reject endpoints.
- [ ] Store rejection reason.
- [ ] Log admin action.

#### Frontend Tasks

- [ ] Build admin media review page.
- [ ] Add bulk approve/reject if safe.
- [ ] Add media preview modal.

#### API Endpoints

```http
GET /api/admin/media?status=PENDING
POST /api/admin/media/:id/approve
POST /api/admin/media/:id/reject
```

---

## 8. Verification Module

### MODULE VERIFY-001 - Verification Request System

#### Goal
Allow users to submit verification documents and allow moderators/admins to review them.

#### Verification Types

- Basic verification
  - Email verified
  - Mobile verified
- Identity verification
  - Driver licence
  - Passport
  - Government-issued ID
- Address verification
  - Utility bill
  - Rental agreement
  - Bank statement
- Employment verification
  - Payslip
  - Employment letter
  - ABN registration document
- Visa verification
  - Visa grant letter
  - VEVO report
  - Permanent residency document
- Police clearance
  - AFP police check
  - National police check
  - NZ police check
- Facial verification
  - Selfie
  - Face matching
  - Liveness detection

#### Backend Tasks

- [ ] Create verification request model.
- [ ] Create verification document model.
- [ ] Create secure upload flow.
- [ ] Encrypt sensitive document metadata.
- [ ] Restrict document access to owner and authorized staff.
- [ ] Add admin review workflow.
- [ ] Auto-update verification badge after approval.

#### Frontend Tasks

- [ ] Build verification dashboard for members.
- [ ] Build submit document forms by verification type.
- [ ] Show current verification level and pending/rejected items.
- [ ] Show resubmission instructions.

#### API Endpoints

```http
GET /api/me/verification
POST /api/me/verification/:type/request
POST /api/me/verification/:requestId/documents
POST /api/me/verification/:requestId/submit
GET /api/admin/verifications?status=PENDING
GET /api/admin/verifications/:id
POST /api/admin/verifications/:id/approve
POST /api/admin/verifications/:id/reject
POST /api/admin/verifications/:id/request-resubmission
```

#### Security Rules

- Never expose document URLs publicly.
- Use signed temporary URLs for viewing.
- Log every document access.
- Redact/avoid showing sensitive document data in normal admin lists.
- Require elevated role for police/identity document review.

#### Tests

- [ ] User cannot access another user's documents.
- [ ] Moderator can review only allowed verification types.
- [ ] Approval updates profile verification fields.
- [ ] Rejection stores reason and notifies user.

---

### MODULE VERIFY-002 - Verification Badge Logic

#### Backend Tasks

- [ ] Implement badge calculation service.
- [ ] Define exact rules:
  - Basic Verified: email + mobile
  - Silver Verified: basic + identity
  - Gold Verified: silver + address or employment
  - Platinum Verified: gold + visa or police clearance
  - Fully Verified: all required configured verification types
- [ ] Make rules configurable in system settings.

#### Tests

- [ ] Badge updates after each verification approval.
- [ ] Badge downgrades if verification is revoked.
- [ ] Config changes recalculate correctly.

---

### MODULE VERIFY-003 - External Provider Extension Points

#### Goal
Do not build full integrations immediately unless required, but create clean adapter interfaces.

#### Tasks

- [ ] Create `IdentityVerificationProvider` interface.
- [ ] Create `FacialVerificationProvider` interface.
- [ ] Create `PoliceCheckProvider` interface.
- [ ] Create `VisaVerificationProvider` interface.
- [ ] Implement manual-review provider as default.
- [ ] Store provider reference IDs for future integrations.

#### Acceptance Criteria

- Manual verification works now.
- Future external providers can be added without rewriting verification workflow.

---

## 9. Matchmaking, Search & Discovery

### MODULE MATCH-001 - Search Profiles

#### Backend Tasks

- [ ] Create search endpoint with filters.
- [ ] Enforce profile approval and visibility.
- [ ] Exclude blocked users.
- [ ] Exclude self.
- [ ] Support pagination and sorting.
- [ ] Apply subscription limits for free users.

#### Supported Filters

- Age
- Gender
- Religion
- Community
- Caste
- Mother tongue
- Country
- State
- City
- Education
- Occupation
- Income range
- Marital status
- Height
- Verification status

#### API Contract

```http
GET /api/matches/search?ageMin=25&ageMax=35&religion=Hindu&state=NSW&page=1&limit=20
```

#### Frontend Tasks

- [ ] Build search page.
- [ ] Build filter sidebar/drawer.
- [ ] Build profile result cards.
- [ ] Build locked advanced filters for free users if applicable.

#### Tests

- [ ] Search excludes hidden profiles.
- [ ] Search excludes blocked profiles.
- [ ] Free user search limits apply.
- [ ] Pagination metadata is correct.

---

### MODULE MATCH-002 - Recommended Matches

#### Backend Tasks

- [ ] Build rule-based recommendation service.
- [ ] Score profiles using partner preferences.
- [ ] Boost verified and recently active users.
- [ ] Penalize incomplete profiles.
- [ ] Exclude rejected/blocked profiles.
- [ ] Store optional recommendation snapshots.

#### Initial Scoring Formula

```text
score =
  ageMatch * 20 +
  locationMatch * 15 +
  religionCommunityMatch * 20 +
  educationMatch * 10 +
  occupationMatch * 10 +
  lifestyleMatch * 10 +
  verificationBoost * 10 +
  recentActivityBoost * 5
```

#### API Endpoints

```http
GET /api/matches/recommended
GET /api/matches/newly-joined
GET /api/matches/recently-active
GET /api/matches/highly-compatible
```

#### Frontend Tasks

- [ ] Build recommended match carousel/list.
- [ ] Show compatibility indicator.
- [ ] Explain match reason in simple text.

#### Tests

- [ ] Recommendations exclude self/blocked/rejected users.
- [ ] Recently active sort works.
- [ ] Highly compatible profiles score above threshold.

---

### MODULE MATCH-003 - Recently Viewed Profiles

#### Backend Tasks

- [ ] Create profile views collection or embedded view history.
- [ ] Store viewer, viewed profile, timestamp.
- [ ] Prevent excessive duplicate views.
- [ ] Create recently viewed endpoint.

#### Frontend Tasks

- [ ] Show recently viewed page/section.

#### API Endpoints

```http
GET /api/me/recently-viewed
```

---

## 10. Interest, Favourite, Block & Report System

### MODULE INTEREST-001 - Send/Accept/Reject/Withdraw Interest

#### Backend Tasks

- [ ] Create interest model.
- [ ] Create send interest endpoint.
- [ ] Create accept/reject endpoint.
- [ ] Create withdraw endpoint.
- [ ] Prevent duplicate interests.
- [ ] Prevent sending to blocked users.
- [ ] Apply free membership interest limits.
- [ ] Create conversation after interest is accepted if messaging requires acceptance.

#### API Endpoints

```http
POST /api/interests
GET /api/me/interests/sent
GET /api/me/interests/received
POST /api/interests/:id/accept
POST /api/interests/:id/reject
POST /api/interests/:id/withdraw
```

#### Frontend Tasks

- [ ] Add interest buttons on profile cards and detail pages.
- [ ] Build sent interests page.
- [ ] Build received interests page.

#### Tests

- [ ] Duplicate interest rejected.
- [ ] Blocked users cannot send interest.
- [ ] Accepted interest enables messaging.
- [ ] Free limits enforced.

---

### MODULE INTEREST-002 - Favourite Profiles

#### Backend Tasks

- [ ] Create favourite model.
- [ ] Add favourite/unfavourite endpoints.
- [ ] Create favourites list endpoint.

#### API Endpoints

```http
POST /api/favourites/:profileId
DELETE /api/favourites/:profileId
GET /api/me/favourites
```

#### Frontend Tasks

- [ ] Add favourite action on cards/details.
- [ ] Build favourites page.

---

### MODULE SAFETY-001 - Block Users

#### Backend Tasks

- [ ] Create block model.
- [ ] Create block/unblock endpoints.
- [ ] Enforce block rules in search, profile view, interests, messaging, community interactions.

#### API Endpoints

```http
POST /api/blocks/:userId
DELETE /api/blocks/:userId
GET /api/me/blocks
```

#### Tests

- [ ] Blocked users cannot message each other.
- [ ] Blocked users do not appear in search.
- [ ] Existing conversation becomes inaccessible or read-only.

---

### MODULE SAFETY-002 - Report Users and Content

#### Backend Tasks

- [ ] Create report model.
- [ ] Support reporting users, profiles, messages, posts, comments, and media.
- [ ] Add reason, description, screenshots/attachments optional.
- [ ] Add admin review workflow.
- [ ] Add auto-risk counter per reported user.

#### API Endpoints

```http
POST /api/reports
GET /api/admin/reports?status=OPEN
POST /api/admin/reports/:id/assign
POST /api/admin/reports/:id/resolve
POST /api/admin/reports/:id/dismiss
```

#### Frontend Tasks

- [ ] Build report modal.
- [ ] Build admin report queue.
- [ ] Add moderation action buttons.

#### Tests

- [ ] Report creates admin queue item.
- [ ] Reported user is not automatically banned unless configured.
- [ ] Admin resolution logs action.

---

## 11. Internal Messaging System

### MODULE MSG-001 - Conversations

#### Backend Tasks

- [ ] Create conversation model.
- [ ] Create message model.
- [ ] Allow one-to-one conversations only.
- [ ] Enforce messaging rules:
  - Only after accepted interest if configured.
  - Only active users.
  - Not blocked.
  - Subscription restrictions apply.
- [ ] Add conversation history endpoint.

#### API Endpoints

```http
GET /api/conversations
GET /api/conversations/:id
POST /api/conversations/:id/messages
DELETE /api/conversations/:id
```

#### Frontend Tasks

- [ ] Build inbox page.
- [ ] Build conversation detail page.
- [ ] Build message composer.
- [ ] Add empty states and locked states.

#### Tests

- [ ] User cannot access conversation they do not belong to.
- [ ] Free user restrictions apply.
- [ ] Blocked conversation cannot send new messages.

---

### MODULE MSG-002 - Real-Time Socket.IO Messaging

#### Backend Tasks

- [ ] Configure Socket.IO server.
- [ ] Authenticate socket connections with JWT.
- [ ] Join user-specific room.
- [ ] Join conversation-specific rooms.
- [ ] Emit new message events.
- [ ] Emit typing indicators.
- [ ] Emit read receipt updates.
- [ ] Handle reconnect safely.

#### Frontend Tasks

- [ ] Create socket client service.
- [ ] Show real-time new messages.
- [ ] Show typing state.
- [ ] Show read receipts.
- [ ] Fallback to REST fetch if socket disconnects.

#### Events

```text
client: conversation:join
client: message:send
client: typing:start
client: typing:stop
client: message:read

server: message:new
server: typing:update
server: message:read
server: conversation:updated
server: error
```

#### Tests

- [ ] Socket rejects unauthenticated connection.
- [ ] Message is persisted before event emitted.
- [ ] Only conversation members receive events.

---

### MODULE MSG-003 - Message Attachments

#### Backend Tasks

- [ ] Allow image sharing.
- [ ] Allow document sharing if enabled.
- [ ] Use secure upload flow.
- [ ] Scan file type and size.
- [ ] Store attachment metadata.

#### Frontend Tasks

- [ ] Add attachment upload button.
- [ ] Show image previews.
- [ ] Show document links with signed access.

#### Security

- No public permanent file URLs for private attachments.
- Block executable files.
- Limit file size.

---

## 12. Community Chat Rooms

### MODULE COMMUNITY-001 - Rooms

#### Backend Tasks

- [ ] Create community room model.
- [ ] Seed default categories:
  - General Discussions
  - New Members
  - Success Stories
  - Community Support
  - Cultural Discussions
  - Platform Announcements
- [ ] Create room list endpoint.
- [ ] Admin can create/edit/archive rooms.

#### Frontend Tasks

- [ ] Build community landing page.
- [ ] Build room list UI.
- [ ] Build room detail page.

#### API Endpoints

```http
GET /api/community/rooms
GET /api/community/rooms/:slug
POST /api/admin/community/rooms
PATCH /api/admin/community/rooms/:id
```

---

### MODULE COMMUNITY-002 - Posts, Comments, Reactions

#### Backend Tasks

- [ ] Create post model.
- [ ] Create comment model.
- [ ] Create reaction model.
- [ ] Add create/edit/delete post.
- [ ] Add comments.
- [ ] Add likes/reactions.
- [ ] Add report content.
- [ ] Add moderator controls.

#### API Endpoints

```http
GET /api/community/rooms/:roomId/posts
POST /api/community/rooms/:roomId/posts
PATCH /api/community/posts/:id
DELETE /api/community/posts/:id
POST /api/community/posts/:id/comments
POST /api/community/posts/:id/reactions
POST /api/community/posts/:id/report
```

#### Frontend Tasks

- [ ] Build post composer.
- [ ] Build post feed.
- [ ] Build comments UI.
- [ ] Build reaction buttons.
- [ ] Add report post/comment modal.

#### Tests

- [ ] Banned users cannot post.
- [ ] Moderator can remove content.
- [ ] Reported content appears in admin moderation queue.

---

## 13. Membership, Subscriptions & Access Control

### MODULE PLAN-001 - Membership Plan System

#### Backend Tasks

- [ ] Create plan model.
- [ ] Seed initial example plans:
  - Free
  - Premium
  - Gold
  - Platinum
- [ ] Make plan features configurable.
- [ ] Support plan duration and price.
- [ ] Support active/inactive plans.

#### Suggested Plan Feature Keys

```ts
features: {
  searchLimitPerDay?: number;
  interestLimitPerMonth?: number;
  canUseAdvancedSearch: boolean;
  canSendMessages: boolean;
  canViewFullProfile: boolean;
  canViewPrivateGalleryRequest: boolean;
  profileVisibilityBoostLevel: number;
  verificationPriority: boolean;
  featuredPlacement: boolean;
}
```

#### Admin Tasks

- [ ] Create admin CRUD for plans.
- [ ] Add plan preview table.

#### API Endpoints

```http
GET /api/public/plans
GET /api/admin/plans
POST /api/admin/plans
PATCH /api/admin/plans/:id
DELETE /api/admin/plans/:id
```

---

### MODULE PLAN-002 - Entitlement Middleware

#### Goal
Create central logic for feature access.

#### Backend Tasks

- [ ] Create subscription resolver service.
- [ ] Create entitlement checker.
- [ ] Add middleware for premium-only APIs.
- [ ] Add usage counters for limited features.
- [ ] Add plan limits for search, interest, and messaging.

#### Frontend Tasks

- [ ] Create entitlement hook.
- [ ] Show upgrade modals when restricted.
- [ ] Show plan badges and remaining limits.

#### Tests

- [ ] Free user cannot exceed limit.
- [ ] Premium user has correct access.
- [ ] Expired subscription removes entitlements.

---

## 14. Payment System

### MODULE PAY-001 - Stripe Subscription Integration

#### Backend Tasks

- [ ] Create Stripe customer on first paid subscription.
- [ ] Create checkout session endpoint.
- [ ] Create billing portal endpoint.
- [ ] Create Stripe webhook endpoint.
- [ ] Handle subscription created/updated/deleted events.
- [ ] Handle payment succeeded/failed events.
- [ ] Sync subscription state locally.

#### API Endpoints

```http
POST /api/payments/stripe/create-checkout-session
POST /api/payments/stripe/create-billing-portal-session
POST /api/webhooks/stripe
GET /api/me/subscription
GET /api/me/payments
```

#### Frontend Tasks

- [ ] Build pricing page.
- [ ] Build checkout redirect flow.
- [ ] Build subscription management page.
- [ ] Build payment history page.

#### Security

- Verify Stripe webhook signatures.
- Never trust frontend payment success alone.
- Store Stripe customer/subscription IDs.

#### Tests

- [ ] Checkout session created for valid plan.
- [ ] Webhook activates subscription.
- [ ] Failed payment marks subscription past due.
- [ ] Cancelled subscription removes premium access at correct time.

---

### MODULE PAY-002 - Invoices, Coupons, Refund Records

#### Backend Tasks

- [ ] Create invoice model or sync Stripe invoice metadata.
- [ ] Create payment history endpoint.
- [ ] Create coupon model for local promotional codes if not using Stripe coupons only.
- [ ] Add refund record model.
- [ ] Add admin refund tracking.

#### Admin Tasks

- [ ] View payments.
- [ ] View subscription status.
- [ ] View invoice records.
- [ ] Create/manage coupon codes.
- [ ] Record refund status.

#### API Endpoints

```http
GET /api/admin/payments
GET /api/admin/subscriptions
GET /api/admin/invoices
POST /api/admin/coupons
PATCH /api/admin/coupons/:id
POST /api/admin/refunds
```

---

### MODULE PAY-003 - PayPal / Apple Pay / Google Pay Placeholders

#### Tasks

- [ ] Use Stripe Payment Element where possible for card, Apple Pay, and Google Pay.
- [ ] Add PayPal provider abstraction but keep disabled unless required.
- [ ] Keep payment provider field in `payments` model.

#### Acceptance Criteria

- Payment system is not hardcoded only to Stripe business logic.
- PayPal can be added later through a provider adapter.

---

## 15. Profile Boost System

### MODULE BOOST-001 - Boost Products and Active Boosts

#### Backend Tasks

- [ ] Create profile boost model.
- [ ] Support fixed duration boost.
- [ ] Support featured member listing.
- [ ] Support homepage featured placement.
- [ ] Support search priority placement.
- [ ] Expire boosts automatically.

#### API Endpoints

```http
POST /api/me/boosts/purchase
GET /api/me/boosts
GET /api/admin/boosts
PATCH /api/admin/boosts/:id
```

#### Frontend Tasks

- [ ] Build boost purchase page/modal.
- [ ] Show active boost status.
- [ ] Show boosted badge where needed.

#### Search Integration

- [ ] Boosted profiles should rank higher but must not bypass filters.
- [ ] Expired boosts should not affect rankings.

#### Tests

- [ ] Boost expires correctly.
- [ ] Boosted profiles rank higher in eligible search.
- [ ] Hidden/suspended profiles are never boosted publicly.

---

## 16. Notification System

### MODULE NOTIF-001 - In-App Notifications

#### Backend Tasks

- [ ] Create notification model.
- [ ] Create notification service.
- [ ] Add notification triggers for:
  - New interest
  - Accepted interest
  - Rejected interest
  - New message
  - Verification update
  - Subscription update
  - Subscription reminder
  - Report/moderation outcome
- [ ] Add read/unread status.

#### API Endpoints

```http
GET /api/me/notifications
POST /api/me/notifications/:id/read
POST /api/me/notifications/read-all
```

#### Frontend Tasks

- [ ] Build notification dropdown.
- [ ] Build notifications page.
- [ ] Show unread count.

---

### MODULE NOTIF-002 - Email Notifications

#### Backend Tasks

- [ ] Configure email provider.
- [ ] Create email template system.
- [ ] Create templates:
  - Registration confirmation
  - Email verification
  - Password reset
  - Verification updates
  - Interest notifications
  - Message notifications
  - Subscription updates
- [ ] Respect notification preferences.

#### Tests

- [ ] Email jobs created for correct events.
- [ ] Unsubscribed marketing users do not receive marketing emails.
- [ ] Transactional emails still send when required.

---

### MODULE NOTIF-003 - SMS Notifications and OTP

#### Backend Tasks

- [ ] Configure SMS provider.
- [ ] Use SMS for mobile OTP.
- [ ] Use SMS for important account alerts only.
- [ ] Add provider failure handling.

#### Security

- Rate-limit SMS.
- Track cost-sensitive usage.
- Avoid sending sensitive information in SMS.

---

### MODULE NOTIF-004 - Push Notification Placeholder

#### Tasks

- [ ] Add notification channel enum: `IN_APP`, `EMAIL`, `SMS`, `PUSH`.
- [ ] Keep push disabled for Phase 1 web unless web push is explicitly requested.
- [ ] Prepare data model for future native apps.

---

## 17. Admin CRM

### MODULE ADMIN-001 - Admin Authentication and RBAC

#### Backend Tasks

- [ ] Add admin login using same auth system with role checks.
- [ ] Add admin route guard middleware.
- [ ] Add permission matrix.
- [ ] Add audit logs for every admin action.

#### Permission Matrix

- Super Admin: all permissions
- Admin: users, plans, payments, CMS, reports, settings
- Moderator: profile review, media review, verification review, reports, community moderation

#### Frontend Tasks

- [ ] Create admin layout.
- [ ] Create admin login.
- [ ] Create protected admin routes.
- [ ] Hide pages/actions based on permissions.

---

### MODULE ADMIN-002 - User Management

#### Backend Tasks

- [ ] Create admin user list endpoint.
- [ ] Add filters: role, status, verification level, subscription, date joined.
- [ ] Add user detail endpoint.
- [ ] Add edit member endpoint.
- [ ] Add suspend/ban/delete endpoints.
- [ ] Add admin notes.

#### API Endpoints

```http
GET /api/admin/users
GET /api/admin/users/:id
PATCH /api/admin/users/:id
POST /api/admin/users/:id/suspend
POST /api/admin/users/:id/ban
POST /api/admin/users/:id/activate
DELETE /api/admin/users/:id
POST /api/admin/users/:id/notes
```

#### Frontend Tasks

- [ ] Build user list table.
- [ ] Build filters/search.
- [ ] Build user detail page.
- [ ] Build suspend/ban modal.
- [ ] Build notes panel.

#### Tests

- [ ] Moderator cannot delete user.
- [ ] Admin actions are audit logged.
- [ ] Suspended user cannot login or interact.

---

### MODULE ADMIN-003 - Profile Moderation

#### Backend Tasks

- [ ] Create pending profile queue.
- [ ] Approve/reject/request changes.
- [ ] Store reason and reviewer.
- [ ] Notify user after decision.

#### Frontend Tasks

- [ ] Build moderation queue.
- [ ] Build profile review screen.
- [ ] Add comparison of old/new values for edited profiles.

#### API Endpoints

```http
GET /api/admin/profiles?approvalStatus=PENDING
GET /api/admin/profiles/:id
POST /api/admin/profiles/:id/approve
POST /api/admin/profiles/:id/reject
POST /api/admin/profiles/:id/request-changes
```

---

### MODULE ADMIN-004 - Verification Management

Use tasks from `VERIFY-001` and build admin UI.

#### Frontend Tasks

- [ ] Queue by verification type.
- [ ] Queue by priority.
- [ ] Secure document preview.
- [ ] Approve/reject/request resubmission.
- [ ] Display verification history.

---

### MODULE ADMIN-005 - Membership and Payment Monitoring

#### Backend Tasks

- [ ] Admin subscription list.
- [ ] Admin payment list.
- [ ] Refund record management.
- [ ] Coupon management.

#### Frontend Tasks

- [ ] Subscription dashboard.
- [ ] Revenue table.
- [ ] Payment detail page.
- [ ] Coupon CRUD pages.

---

### MODULE ADMIN-006 - CMS Management

#### Backend Tasks

- [ ] CRUD APIs for:
  - Homepage content
  - Banners
  - Blogs
  - Testimonials
  - FAQs
  - Static pages
  - Success stories

#### Frontend Tasks

- [ ] CMS list/detail editor pages.
- [ ] Rich text editor.
- [ ] Publish/unpublish workflow.
- [ ] Preview mode.

---

### MODULE ADMIN-007 - Moderation Dashboard

#### Backend Tasks

- [ ] Create combined moderation queue.
- [ ] Include user reports, content reports, chat reports, community reports.
- [ ] Add status workflow: open, assigned, resolved, dismissed.
- [ ] Add severity levels.

#### Frontend Tasks

- [ ] Build moderation dashboard.
- [ ] Add assignment and status filters.
- [ ] Add action buttons: warn, suspend, ban, remove content, dismiss.

---

### MODULE ADMIN-008 - Reporting and Analytics

#### Backend Tasks

Create reporting endpoints for:

- [ ] User statistics
- [ ] Verification statistics
- [ ] Revenue reports
- [ ] Subscription reports
- [ ] Platform activity reports
- [ ] Match/interest statistics
- [ ] Messaging activity
- [ ] Community activity

#### API Endpoints

```http
GET /api/admin/reports/overview
GET /api/admin/reports/users
GET /api/admin/reports/verifications
GET /api/admin/reports/revenue
GET /api/admin/reports/subscriptions
GET /api/admin/reports/activity
```

#### Frontend Tasks

- [ ] Build admin dashboard cards.
- [ ] Build charts.
- [ ] Build date range filters.
- [ ] Build export CSV buttons.

---

## 18. Security, Audit & Fraud Prevention

### MODULE SEC-001 - Core Security Middleware

#### Backend Tasks

- [ ] Add Helmet.
- [ ] Add CORS allowlist.
- [ ] Add rate limiting.
- [ ] Add request size limits.
- [ ] Add input sanitization.
- [ ] Add MongoDB injection protection.
- [ ] Add centralized error handler.
- [ ] Add secure cookie config if cookies used.

#### Tests

- [ ] Rate limiting works on auth and OTP endpoints.
- [ ] Invalid payloads return safe errors.
- [ ] CORS blocks unknown origins.

---

### MODULE SEC-002 - RBAC and Permission Middleware

#### Backend Tasks

- [ ] Create `requireAuth` middleware.
- [ ] Create `requireRole` middleware.
- [ ] Create `requirePermission` middleware.
- [ ] Apply to all admin APIs.
- [ ] Apply ownership checks to member APIs.

#### Tests

- [ ] Unauthenticated users rejected.
- [ ] User cannot access admin endpoint.
- [ ] Moderator cannot perform super admin action.

---

### MODULE SEC-003 - Audit Logs and Activity Logs

#### Backend Tasks

- [ ] Create audit log service.
- [ ] Log admin actions.
- [ ] Log verification document access.
- [ ] Log account status changes.
- [ ] Log payment/subscription changes.
- [ ] Log user activity events.

#### API Endpoints

```http
GET /api/admin/audit-logs
GET /api/admin/activity-logs
```

#### Tests

- [ ] Admin action creates audit log.
- [ ] Sensitive document view creates audit log.

---

### MODULE SEC-004 - Fraud Prevention Rules

#### Backend Tasks

- [ ] Add suspicious activity model or score field.
- [ ] Track repeated reports.
- [ ] Track duplicate phone/email attempts.
- [ ] Track repeated OTP failures.
- [ ] Track unusual message volume.
- [ ] Flag accounts for admin review.

#### Acceptance Criteria

- Suspicious users appear in admin risk queue.
- Fraud rules do not auto-ban unless explicitly configured.

---

## 19. Mobile Responsive Design

### MODULE UI-001 - Responsive Layout System

#### Frontend Tasks

- [ ] Create design tokens.
- [ ] Create layout components:
  - Public layout
  - Member dashboard layout
  - Admin layout
  - Auth layout
- [ ] Build responsive navigation.
- [ ] Build mobile drawers.
- [ ] Ensure all pages work on desktop, tablet, and mobile browsers.

#### Acceptance Criteria

- No horizontal overflow on 375px mobile width.
- Admin tables are usable on smaller screens.
- Profile cards and search filters adapt to mobile.

---

### MODULE UI-002 - Core Component Library

#### Components

- [ ] Button
- [ ] Input
- [ ] Select
- [ ] Date picker
- [ ] Checkbox/radio
- [ ] Modal
- [ ] Drawer
- [ ] Tabs
- [ ] Toast
- [ ] Badge
- [ ] Avatar
- [ ] Profile card
- [ ] Plan card
- [ ] Empty state
- [ ] Loading skeleton
- [ ] Pagination
- [ ] Data table
- [ ] File uploader

#### Acceptance Criteria

- Components are typed.
- Components support loading/disabled/error states.
- Components are reusable across public, member, and admin UI.

---

## 20. Testing Plan

### MODULE TEST-001 - Backend Unit Tests

#### Required Coverage

- [ ] Auth services
- [ ] OTP service
- [ ] Token service
- [ ] Profile completion service
- [ ] Match scoring service
- [ ] Entitlement service
- [ ] Verification badge service
- [ ] Notification service
- [ ] Audit log service

---

### MODULE TEST-002 - API Integration Tests

#### Required Flows

- [ ] Register -> verify email -> create profile -> submit profile
- [ ] Admin approves profile
- [ ] Search approved profile
- [ ] Send interest -> accept interest -> start conversation
- [ ] Send message realtime and via REST fallback
- [ ] Upgrade subscription via Stripe webhook
- [ ] Free limit blocked after quota reached
- [ ] Submit verification -> admin approves -> badge updates
- [ ] Report user -> admin resolves

---

### MODULE TEST-003 - Frontend Tests

#### Required Tests

- [ ] Auth forms validate input.
- [ ] Profile wizard saves each step.
- [ ] Search filters update query.
- [ ] Interest buttons update state.
- [ ] Chat UI renders messages.
- [ ] Pricing page triggers checkout.
- [ ] Admin tables load and filter data.

---

### MODULE TEST-004 - E2E Tests

Use Playwright or Cypress.

#### E2E Scenarios

- [ ] New user registration and onboarding.
- [ ] Admin approves profile.
- [ ] User searches and sends interest.
- [ ] Second user accepts interest.
- [ ] Both users chat.
- [ ] User upgrades to premium.
- [ ] User submits verification documents.
- [ ] Moderator reviews report.

---

## 21. DevOps, Deployment & Monitoring

### MODULE DEVOPS-001 - Environment Setup

#### Tasks

- [ ] Create development environment.
- [ ] Create staging environment.
- [ ] Create production environment.
- [ ] Use separate databases and storage buckets.
- [ ] Add environment variable validation.

#### Required Env Vars

```bash
NODE_ENV=
API_BASE_URL=
WEB_BASE_URL=
MONGODB_URI=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRES_IN=
JWT_REFRESH_EXPIRES_IN=
CORS_ORIGINS=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID_PREMIUM=
STRIPE_PRICE_ID_GOLD=
STRIPE_PRICE_ID_PLATINUM=
EMAIL_PROVIDER_API_KEY=
EMAIL_FROM=
SMS_PROVIDER_API_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
SOCKET_CORS_ORIGINS=
ADMIN_SEED_EMAIL=
ADMIN_SEED_PASSWORD=
```

---

### MODULE DEVOPS-002 - CI/CD Pipeline

#### Tasks

- [ ] Run lint on pull requests.
- [ ] Run typecheck.
- [ ] Run tests.
- [ ] Build frontend and backend.
- [ ] Deploy frontend to Vercel or selected host.
- [ ] Deploy backend to selected host.
- [ ] Run database migration/seed scripts safely.

---

### MODULE DEVOPS-003 - Logging and Monitoring

#### Tasks

- [ ] Add structured API logs.
- [ ] Add error tracking with Sentry or equivalent.
- [ ] Add uptime monitoring.
- [ ] Add payment webhook failure alerts.
- [ ] Add background job failure alerts.
- [ ] Add admin audit log view.

---

### MODULE DEVOPS-004 - Backups and File Storage Safety

#### Tasks

- [ ] Configure MongoDB backups.
- [ ] Configure file storage lifecycle policy.
- [ ] Configure CDN caching for public assets.
- [ ] Ensure private documents use signed URLs.
- [ ] Document disaster recovery steps.

---

## 22. Suggested Build Order

### Sprint 0 - Foundation

- [ ] CORE-001 Monorepo setup
- [ ] CORE-002 Shared constants/validators
- [ ] DB-001 Base models
- [ ] SEC-001 Security middleware

### Sprint 1 - Auth and Public Website

- [ ] AUTH-001 Email registration
- [ ] AUTH-004 Login/session management
- [ ] AUTH-005 Password recovery
- [ ] WEB-001 Homepage
- [ ] WEB-002 Static pages

### Sprint 2 - Member Profiles

- [ ] PROFILE-001 Profile onboarding wizard
- [ ] PROFILE-002 Profile view page
- [ ] PROFILE-003 Edit/settings
- [ ] MEDIA-001 Photo upload

### Sprint 3 - Search and Matchmaking

- [ ] MATCH-001 Search profiles
- [ ] MATCH-002 Recommended matches
- [ ] INTEREST-001 Interest workflow
- [ ] INTEREST-002 Favourites
- [ ] SAFETY-001 Block users
- [ ] SAFETY-002 Report users

### Sprint 4 - Messaging and Community

- [ ] MSG-001 Conversations
- [ ] MSG-002 Socket.IO realtime messaging
- [ ] MSG-003 Attachments
- [ ] COMMUNITY-001 Rooms
- [ ] COMMUNITY-002 Posts/comments/reactions

### Sprint 5 - Payments and Membership

- [ ] PLAN-001 Plans
- [ ] PLAN-002 Entitlement middleware
- [ ] PAY-001 Stripe subscriptions
- [ ] PAY-002 Invoices/coupons/refunds
- [ ] BOOST-001 Profile boosts

### Sprint 6 - Verification and Admin CRM

- [ ] VERIFY-001 Verification request system
- [ ] VERIFY-002 Badge logic
- [ ] ADMIN-001 Admin auth/RBAC
- [ ] ADMIN-002 User management
- [ ] ADMIN-003 Profile moderation
- [ ] ADMIN-004 Verification management
- [ ] ADMIN-007 Moderation dashboard

### Sprint 7 - Reporting, Notifications, QA, Deployment

- [ ] NOTIF-001 In-app notifications
- [ ] NOTIF-002 Email notifications
- [ ] NOTIF-003 SMS notifications
- [ ] ADMIN-008 Reports/analytics
- [ ] TEST-001 to TEST-004
- [ ] DEVOPS-001 to DEVOPS-004

---

## 23. Codex-Ready Module Prompts

Use these prompts one by one.

### Prompt 1 - Project Foundation

```text
Implement CORE-001 and CORE-002 from the Vivah Australia AI-ready task list.
Create the monorepo structure, strict TypeScript config, shared constants, shared validation schemas, ESLint, Prettier, and environment validation.
Do not implement business features yet.
Add README setup steps and .env.example files.
Add tests where useful.
```

### Prompt 2 - Database Models

```text
Implement DB-001, DB-002, and DB-003.
Create MongoDB/Mongoose models for all Phase 1 collections.
Start with User and Profile models in full detail.
Add indexes, timestamps, soft delete fields, and TypeScript types.
Add seed script for admin user, sample plans, and test profiles.
```

### Prompt 3 - Authentication

```text
Implement AUTH-001, AUTH-004, and AUTH-005.
Build email/password registration, email verification token or OTP, login, refresh token rotation, logout, forgot password, reset password, and change password.
Add rate limiting, password hashing, validation, and tests.
Create frontend pages for register, login, forgot password, and reset password.
```

### Prompt 4 - Profile Onboarding

```text
Implement PROFILE-001, PROFILE-002, and PROFILE-003.
Build member profile onboarding wizard with partial saves, completion percentage, profile submission for approval, profile view page with privacy controls, and edit/settings pages.
Use shared validators.
Add backend tests and frontend form validation.
```

### Prompt 5 - Media Uploads

```text
Implement MEDIA-001 and MEDIA-003.
Create secure signed upload flow for Cloudinary or S3-compatible storage.
Support profile photo, public gallery, private gallery, approval workflow, visibility controls, and admin media review.
Add file type/size validation and signed access for private media.
```

### Prompt 6 - Search and Matchmaking

```text
Implement MATCH-001 and MATCH-002.
Create advanced profile search with filters, pagination, visibility rules, blocked-user exclusion, approval status enforcement, and subscription limits.
Create rule-based recommended matches with score calculation and match reasons.
Build frontend search page and recommended matches UI.
Add tests for search rules and scoring.
```

### Prompt 7 - Interest/Favourite/Block/Report

```text
Implement INTEREST-001, INTEREST-002, SAFETY-001, and SAFETY-002.
Create send/accept/reject/withdraw interest workflow, favourites, block/unblock, and report system.
Enforce duplicate prevention, blocked-user rules, membership limits, and notification triggers.
Build frontend pages and modals.
Add tests for all workflows.
```

### Prompt 8 - Messaging

```text
Implement MSG-001, MSG-002, and MSG-003.
Create one-to-one conversations, messages, Socket.IO realtime messaging, typing indicators, read receipts, image/document attachments, delete conversation, block/report from chat.
Enforce messaging only after accepted interest if configured.
Add socket authentication and tests.
```

### Prompt 9 - Community Rooms

```text
Implement COMMUNITY-001 and COMMUNITY-002.
Create default community rooms, posts, comments, reactions, reporting, moderator controls, and admin controls.
Build member community UI and admin moderation integration.
Add tests for banned users, reported content, and moderator actions.
```

### Prompt 10 - Membership and Payments

```text
Implement PLAN-001, PLAN-002, PAY-001, PAY-002, PAY-003, and BOOST-001.
Create configurable membership plans, entitlement middleware, usage counters, Stripe subscription checkout, Stripe webhook handling, payment history, invoices, coupons, refund records, and profile boosts.
Build pricing page, subscription page, upgrade modals, and admin payment screens.
Add webhook tests.
```

### Prompt 11 - Verification

```text
Implement VERIFY-001, VERIFY-002, and VERIFY-003.
Create document-based verification requests for identity, address, employment, visa, police clearance, and facial verification.
Use secure uploads, signed document access, admin review workflow, rejection/resubmission flow, verification badge calculation, and provider adapter interfaces.
Add audit logging for every document access.
```

### Prompt 12 - Admin CRM

```text
Implement ADMIN-001 to ADMIN-008.
Build admin authentication, RBAC, user management, profile moderation, verification review, media review, membership/payment monitoring, CMS management, moderation dashboard, and reports/analytics.
All admin actions must create audit logs.
Add permission-based UI and backend middleware.
```

### Prompt 13 - Notifications

```text
Implement NOTIF-001 to NOTIF-004.
Create in-app notifications, email notifications, SMS OTP/alerts, notification preferences, and push-notification placeholders.
Trigger notifications from registration, verification, interest, messages, subscriptions, and moderation events.
```

### Prompt 14 - Testing and Deployment

```text
Implement TEST-001 to TEST-004 and DEVOPS-001 to DEVOPS-004.
Add unit, integration, frontend, and E2E tests for core flows.
Set up CI/CD, staging/production environments, logging, monitoring, backups, and deployment documentation.
```

---

## 24. Final Phase 1 Completion Checklist

### Public Website

- [ ] Homepage complete
- [ ] Featured profiles visible
- [ ] Success stories complete
- [ ] Membership plans visible
- [ ] How it works complete
- [ ] Safety/verification section complete
- [ ] Testimonials complete
- [ ] Blog highlights complete
- [ ] FAQ complete
- [ ] Contact page complete
- [ ] Static pages complete

### Member Portal

- [ ] Registration complete
- [ ] Login/logout complete
- [ ] Forgot/reset/change password complete
- [ ] Email OTP/verification complete
- [ ] Mobile OTP complete
- [ ] Profile onboarding complete
- [ ] Profile edit complete
- [ ] Photo/video media complete
- [ ] Verification dashboard complete
- [ ] Search complete
- [ ] Recommended matches complete
- [ ] Interests complete
- [ ] Favourites complete
- [ ] Block/report complete
- [ ] Messaging complete
- [ ] Community rooms complete
- [ ] Subscription management complete
- [ ] Payment history complete
- [ ] Notifications complete

### Admin CRM

- [ ] Admin login complete
- [ ] RBAC complete
- [ ] User management complete
- [ ] Profile moderation complete
- [ ] Media moderation complete
- [ ] Verification management complete
- [ ] Subscription/payment monitoring complete
- [ ] Refund management complete
- [ ] CMS management complete
- [ ] Reports dashboard complete
- [ ] Audit logs complete
- [ ] Activity logs complete

### Security

- [ ] SSL enforced in production
- [ ] Password hashing complete
- [ ] JWT/refresh security complete
- [ ] RBAC complete
- [ ] Activity logs complete
- [ ] Audit logs complete
- [ ] Secure file storage complete
- [ ] Data encryption strategy complete
- [ ] Fraud prevention rules complete
- [ ] Rate limiting complete
- [ ] CORS/Helmet configured

### QA and Deployment

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Responsive QA complete
- [ ] Payment webhook QA complete
- [ ] Email/SMS QA complete
- [ ] Admin handover documentation complete
- [ ] Production deployment complete
- [ ] Backup configured
- [ ] Monitoring configured

---

## 25. Notes for Developer

- Build manual verification first; external verification APIs can be added later using provider adapters.
- Build rule-based matchmaking first; AI matchmaking is Phase 2.
- Build responsive web first; native mobile apps are Phase 2.
- Use Stripe first; keep PayPal abstraction ready but do not overbuild.
- Keep all plans and feature limits configurable from admin.
- Treat profile documents, police checks, identity files, and visa files as highly sensitive.
- Every admin/moderator action must be audit logged.
- Every user-facing limit should be enforced server-side, not only in the UI.
- Never expose private media/document URLs without signed, short-lived access.
- Make all critical user actions idempotent where possible.
- Prefer small, testable services over large controllers.

