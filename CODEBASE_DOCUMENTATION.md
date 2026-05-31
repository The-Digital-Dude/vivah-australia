# Vivah Australia - Complete Codebase Documentation

**Date:** June 1, 2026  
**Project Status:** Phase 1 MVP - Active Development  
**Last Verified:** All checks passing (`lint`, `typecheck`, `test`, `build`)

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Workspace & Monorepo Structure](#workspace--monorepo-structure)
3. [Technology Stack](#technology-stack)
4. [Root-Level Configuration](#root-level-configuration)
5. [Apps/API - Backend](#appsapi---backend)
6. [Apps/Web - Frontend](#appsweb---frontend)
7. [Packages - Shared Code](#packages---shared-code)
8. [Key Systems](#key-systems)
9. [Database Models](#database-models)
10. [API Endpoints](#api-endpoints)
11. [Frontend Pages & Routes](#frontend-pages--routes)
12. [Current Implementation Status](#current-implementation-status)
13. [Known Gaps & Constraints](#known-gaps--constraints)
14. [Development Workflow](#development-workflow)

---

## Project Overview

**Vivah Australia** is a premium, trust-first matrimonial and matchmaking platform designed for serious relationship seekers in Australia, particularly targeting the Indian/South Asian community.

### Brand Direction

- **Visual Identity:** Warm ivory/burgundy/gold color scheme, modern cards, premium feel
- **User Experience:** Mobile-first, culturally aware, conversion-focused, safety-first
- **Target Market:** Australian singles and families from Indian/South Asian backgrounds
- **Platform Type:** Monorepo with Express API backend + Next.js web frontend

### Core Principles

1. Follow `vivah_australia_ui_ux_planning.md` for all frontend and product work
2. Prioritize trust-building and verification throughout the platform
3. Maintain strict TypeScript and validation standards
4. Every completed task must update `PROJECT_PROGRESS.md` and be committed to Git

---

## Workspace & Monorepo Structure

### Layout

```
vivah-australia/
├── apps/                      # Application packages
│   ├── api/                   # Express.js backend server
│   └── web/                   # Next.js 16 web frontend
├── packages/                  # Shared code & utilities
│   ├── shared/                # Constants, validators, env schemas
│   ├── config/                # TypeScript configurations
│   └── ui/                    # Placeholder for shared UI components
├── docs/                      # Documentation (api/, architecture/, deployment/)
├── scripts/                   # Utility scripts
├── package.json               # Workspace root package.json
├── pnpm-workspace.yaml        # pnpm workspaces configuration
├── tsconfig.eslint.json       # ESLint TypeScript config
├── eslint.config.mjs          # ESLint rules for monorepo
├── .gitignore                 # Git ignore rules
├── README.md                  # Quick start guide
├── PROJECT_PROGRESS.md        # Track implementation status
├── vivah_ai_ready_development_tasklist.md  # Development backlog
└── vivah_australia_ui_ux_planning.md       # UI/UX design rules
```

### Monorepo Configuration

- **Package Manager:** pnpm 10.33.0+
- **Node.js:** 22.0.0+
- **Workspace Packages:**
  - `apps/*` - Application packages
  - `packages/*` - Shared utility packages
- **Configuration:** `pnpm-workspace.yaml`

---

## Technology Stack

### Core Technologies

| Layer                 | Technology            | Version              | Purpose                                |
| --------------------- | --------------------- | -------------------- | -------------------------------------- |
| **Frontend**          | Next.js               | 16.2.6               | React web framework with SSR/SSG       |
|                       | React                 | 19.2.6               | UI library                             |
|                       | TypeScript            | 5.7.2                | Type safety                            |
|                       | TailwindCSS           | 3.4.17               | Utility-first CSS framework            |
| **Backend**           | Express.js            | 4.21.1               | HTTP server framework                  |
|                       | TypeScript            | 5.7.2                | Type safety                            |
|                       | Node.js               | 22+                  | Runtime                                |
| **Database**          | MongoDB               | Latest               | NoSQL database                         |
|                       | Mongoose              | 9.6.3                | MongoDB ODM                            |
| **Authentication**    | JWT                   | `jsonwebtoken` 9.0.3 | Token-based auth                       |
|                       | bcryptjs              | 3.0.3                | Password hashing                       |
| **Validation**        | Zod                   | 3.24.1               | Schema validation (frontend & backend) |
| **Security**          | Helmet                | 8.0.0                | HTTP header security                   |
|                       | CORS                  | 2.8.5                | Cross-origin resource sharing          |
|                       | express-rate-limit    | 8.5.2                | Request rate limiting                  |
|                       | hCaptcha              | -                    | Bot/spam protection                    |
| **Testing**           | Vitest                | 2.1.8                | Fast unit testing framework            |
|                       | Supertest             | 7.0.0                | HTTP assertion library                 |
|                       | mongodb-memory-server | 11.2.0               | In-memory MongoDB for tests            |
| **Code Quality**      | ESLint                | 9.15.0               | Linting                                |
|                       | Prettier              | 3.4.2                | Code formatting                        |
| **Development Tools** | tsx                   | 4.19.2               | TypeScript runner                      |
|                       | concurrently          | 9.1.0                | Run multiple commands                  |

### Build Tools

- **TypeScript Compiler:** tsc
- **Next.js Build:** next build
- **Watch Mode:** tsx watch for backend development

---

## Root-Level Configuration

### package.json Scripts

```json
{
  "scripts": {
    "dev": "Build shared, run API + Web concurrently",
    "build": "Build all packages recursively",
    "lint": "Run ESLint on entire monorepo",
    "typecheck": "Build shared/ui, typecheck all apps",
    "test": "Run tests in all packages",
    "format": "Format code with Prettier",
    "format:check": "Check formatting with Prettier"
  }
}
```

### ESLint Configuration (eslint.config.mjs)

- **Base Config:** Strict TypeScript with recommended rules
- **Next.js Plugin:** Core Web Vitals + recommended rules
- **Prettier Integration:** eslint-config-prettier for no conflicts
- **Key Rules:**
  - `@typescript-eslint/consistent-type-imports` - Enforce type-only imports
  - `@typescript-eslint/no-floating-promises` - Prevent unhandled promises
  - `@typescript-eslint/no-unused-vars` - Detect unused variables
  - Next.js specific rules for web app

### TypeScript Configuration (tsconfig.eslint.json)

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "jsx": "preserve",
    "paths": {
      "@/*": ["apps/web/*"],
      "@vivah/shared": ["packages/shared/src/index.ts"],
      "@vivah/ui": ["packages/ui/src/index.ts"]
    }
  }
}
```

- **Import Path Aliases:** Support convenient `@/` and `@vivah/*` imports
- **Includes:** All app and package TypeScript files

### .gitignore

Standard ignore patterns:

- `node_modules/` - Dependencies
- `.next/` - Next.js build output
- `dist/` - Compiled TypeScript
- `.env*` (except `.env.example`) - Environment files
- Build artifacts, logs, debug files

---

## Apps/API - Backend

### Purpose

Express.js-based REST API that handles:

- User authentication (registration, login, email verification, password reset)
- Profile management (CRUD, completion tracking, moderation)
- Public content serving (CMS pages, blog posts, plans, testimonials)
- Contact inquiries and email notifications
- User data persistence to MongoDB

### Key Features

- **JWT-based authentication** with refresh token rotation
- **Rate limiting** on auth endpoints (15min window, 100 req/window)
- **Helmet security middleware** for HTTP header protection
- **CORS support** for configured frontend origins
- **Zod validation** on all request inputs
- **MongoDB integration** via Mongoose
- **Error handling** with custom HttpError class
- **Soft delete support** on all models with audit trails

### Entry Point (src/index.ts)

```typescript
- Loads environment configuration (env.ts)
- Initializes Express app (app.ts) with auth config
- Connects to MongoDB
- Starts server on env.API_PORT (default 4000)
```

### Environment Configuration (src/env.ts)

Parsed from `.env` using Zod schema (`apiEnvSchema`):

| Variable                 | Required        | Default     | Example                                       |
| ------------------------ | --------------- | ----------- | --------------------------------------------- |
| `NODE_ENV`               | Yes             | development | production, test                              |
| `API_PORT`               | No              | 4000        | 4000                                          |
| `API_BASE_URL`           | Yes             | -           | http://localhost:4000                         |
| `WEB_BASE_URL`           | Yes             | -           | http://localhost:3000                         |
| `MONGODB_URI`            | Yes             | -           | mongodb://localhost:27017/vivah_dev           |
| `JWT_ACCESS_SECRET`      | Yes (32+ chars) | -           | (random 32+ char string)                      |
| `JWT_REFRESH_SECRET`     | Yes (32+ chars) | -           | (random 32+ char string)                      |
| `JWT_ACCESS_EXPIRES_IN`  | No              | 15m         | 15m, 1h, etc.                                 |
| `JWT_REFRESH_EXPIRES_IN` | No              | 30d         | 7d, 30d, etc.                                 |
| `CORS_ORIGINS`           | Yes             | -           | http://localhost:3000,https://app.example.com |
| `ADMIN_SEED_EMAIL`       | No              | -           | admin@example.com                             |
| `ADMIN_SEED_PASSWORD`    | No              | -           | (12+ chars, mixed case, numbers, symbols)     |
| `HCAPTCHA_SECRET`        | No              | -           | (hCaptcha secret key for production)          |

### App Configuration (src/app.ts)

**Express app factory** that creates and configures the Express application:

```typescript
createApp(options: CreateAppOptions): Express
```

**Middleware Stack (in order):**

1. `helmet()` - Security headers
2. `cors()` - Cross-origin resource sharing
3. `express.json({ limit: '1mb' })` - JSON parser with 1MB limit

**Routes:**

- `GET /health` - Health check endpoint
- `POST /api/auth/*` - Authentication routes (register, login, verify, refresh, logout, etc.)
- `GET /api/*` - Public and profile routes (includes profile view, CMS pages, plans, etc.)
- `PATCH /api/me/*` - Authenticated member routes (profile, settings, privacy)

**Error Handling:**

- Catches `ZodError` → 400 Bad Request with validation issues
- Catches `HttpError` → Returns appropriate status + message
- Generic errors → 500 Internal Server Error
- Error details logged to console (except in test mode)

### Database Connection (src/db/connection.ts)

```typescript
- connectDatabase(uri: string): Connects to MongoDB with strict query mode
- disconnectDatabase(): Gracefully closes MongoDB connection
```

Used in `index.ts` for initialization and in tests for setup/teardown.

### Models (src/models/)

#### Model Registration Pattern

All models export:

- TypeScript interface (e.g., `User`, `Profile`)
- Mongoose schema
- `getOrCreateModel()` which prevents duplicate model registration in HMR scenarios

#### Key Models

**1. User Model (src/models/user.model.ts)**

Stores user account and authentication data:

```typescript
{
  email?: string
  mobile?: string
  passwordHash?: string
  authProviders: AuthProvider[]  // ['email', 'google', 'facebook', 'apple']
  googleId?, facebookId?, appleId?
  role: UserRole  // USER, PREMIUM_USER, MODERATOR, ADMIN, SUPER_ADMIN
  status: AccountStatus  // PENDING, ACTIVE, SUSPENDED, BANNED, DELETED
  emailVerified: boolean
  mobileVerified: boolean
  lastLoginAt?: Date
  passwordChangedAt?: Date
  failedLoginAttempts: number  // Resets on successful login
  lockUntil?: Date  // Account lock for failed attempts
  refreshTokenVersion: number  // For token invalidation
  termsAcceptedAt?: Date
  privacyAcceptedAt?: Date
  marketingConsent: boolean
  metadata: {
    signupIp?: string
    signupUserAgent?: string
    lastIp?: string
    lastUserAgent?: string
  }
  // Audit fields (createdAt, updatedAt, createdBy, updatedBy, isDeleted, deletedAt, deletedBy)
}
```

**Indexes:**

- `{ email: 1 }` - Unique sparse (allows null)
- `{ mobile: 1 }` - Unique sparse
- `{ googleId, facebookId, appleId }` - Unique sparse for social providers
- `{ status: 1, role: 1 }` - For role-based queries

**2. Profile Model (src/models/profile.model.ts)**

Stores detailed user profile information:

```typescript
{
  userId: ObjectId  // Reference to User
  displayId: string  // Public-facing ID (e.g., "VA100001")
  slug?: string  // URL-friendly identifier
  completionPercentage: number  // 0-100
  personal: {
    firstName?, lastName?
    gender?: FEMALE | MALE | NON_BINARY | PREFER_NOT_TO_SAY
    dateOfBirth?, age?
    heightCm?, weightKg?
    maritalStatus: NEVER_MARRIED | DIVORCED | WIDOWED | SEPARATED | ANNULLED
    numberOfChildren?
    disabilityStatus?
  }
  religion: {
    religion?, community?, caste?, subCaste?
    motherTongue?
    languagesSpoken: string[]
  }
  location: {
    country?, state?, city?, suburb?
    citizenshipStatus?, visaStatus?
  }
  education: {
    highestQualification?, institutionName?, graduationYear?
    additionalCertifications?: string[]
  }
  employment: {
    occupation?, industry?, employmentStatus?
    employerName?, annualIncome?, annualIncomeVisibility
  }
  family: {
    fatherDetails?, motherDetails?, siblingDetails?
    familyValues?, familyType?
  }
  lifestyle: {
    smokingHabits?, drinkingHabits?
    dietaryPreferences?, fitnessInterests?
    religiousPractices?
  }
  about: {
    aboutMe?, hobbies?, interests?
    personalGoals?, partnerExpectations?
  }
  partnerPreference: {
    ageMin?, ageMax?
    heightMinCm?, heightMaxCm?
    religions?, communities?, castes?, motherTongues?
    countries?, states?, cities?
    educationLevels?, occupations?
    incomeMin?, incomeMax?
    maritalStatuses?
  }
  verification: {
    level: NONE | BASIC | SILVER | GOLD | PLATINUM | FULLY_VERIFIED
    emailVerified, mobileVerified, identityVerified, addressVerified
    employmentVerified, visaVerified, policeClearanceVerified, facialVerified
  }
  visibility: {
    status: PUBLIC | MEMBERS_ONLY | MATCHES_ONLY | HIDDEN
    showPhoto, showIncome, showEmployer, showLastName: boolean
  }
  stats: {
    profileViews, interestsReceived, interestsSent, favouritesCount
    lastActiveAt?
  }
  moderation: {
    approvalStatus: PENDING | APPROVED | REJECTED | NEEDS_CHANGES
    reviewedBy?, reviewedAt?, rejectionReason?
  }
  // Audit fields
}
```

**Indexes:**

- `{ userId: 1 }`, `{ displayId: 1 }`, `{ slug: 1 }` - Lookups
- `{ "verification.level": 1 }`, `{ "moderation.approvalStatus": 1 }` - Filtering
- `{ "location.city": 1 }`, `{ "religion.community": 1 }` - Discovery

**3. Auth Token Model (src/models/auth-token.model.ts)**

Stores email verification and password reset tokens:

```typescript
{
  userId: ObjectId;
  purpose: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET';
  tokenHash: string; // Hash of opaque token (never store plain tokens)
  expiresAt: Date;
  createdAt: Date;
  // Soft delete support
}
```

**4. Phase 1 Models (src/models/phase-one.models.ts)**

Foundation models for planned features:

- `ProfileMediaModel` - Photo/video storage with visibility and approval status
- `BlockModel` - User blocking relationships
- `InterestModel` - Interest expressions (sent/received/accepted/rejected)
- `AuthTokenModel` - Email verification and password reset tokens
- `CmsPageModel` - Static pages (about, privacy, terms, etc.)
- `ContactInquiryModel` - Contact form submissions
- `PlanModel` - Membership plans with features
- `SuccessStoryModel` - Success stories for homepage
- `TestimonialModel` - User testimonials
- `BlogPostModel` - Blog content
- Additional models for future phases (messages, rooms, reports, etc.)

### Common Model Utilities (src/models/common.ts)

```typescript
auditedSchemaFields: {
  createdBy, updatedBy, isDeleted, deletedAt, deletedBy
}

timestampedSchemaOptions: {
  timestamps: true  // Auto createdAt, updatedAt
  versionKey: false  // No __v field
}

getOrCreateModel<T>(modelName, schema): Model<T>
  // Prevents duplicate model registration during HMR
```

### Authentication System

#### Auth Service (src/auth/auth.service.ts)

**Main Functions:**

1. **`registerWithEmail(input, config): RegisterResult`**
   - Validates email uniqueness
   - Hashes password (12 rounds bcrypt)
   - Creates user in PENDING status
   - Generates email verification token (24hr TTL)
   - Sends verification email to console (dev) or provider (prod)
   - Returns user + optional verification token

2. **`verifyEmail(token): void`**
   - Hashes provided token, looks up in AuthTokenModel
   - Validates expiration
   - Sets user.emailVerified = true, status = ACTIVE
   - Deletes token record

3. **`loginWithEmail(input, config): AuthResult`**
   - Looks up user by email
   - Validates password with bcrypt
   - Checks account status (ACTIVE required)
   - Increments failedLoginAttempts if wrong password
   - Locks account after 5 failed attempts (15min lockout)
   - Returns JWT access token + refresh token

4. **`refreshSession(refreshToken, config): AuthResult`**
   - Verifies refresh token signature
   - Checks refresh token version hasn't been invalidated
   - Issues new access token + refresh token
   - Increments refreshTokenVersion for old refresh token

5. **`logout(refreshToken, config): void`**
   - Increments user.refreshTokenVersion
   - Invalidates all existing refresh tokens for that user

6. **`requestPasswordReset(email): void`**
   - Sends password reset email with token (1hr TTL)
   - Token stored hashed in database

7. **`resetPassword(token, newPassword): void`**
   - Verifies reset token
   - Validates new password complexity
   - Updates user.passwordHash
   - Deletes token record

8. **`changePassword(userId, currentPassword, newPassword): void`**
   - Authenticates user with current password
   - Validates new password complexity
   - Updates passwordHash
   - Sets passwordChangedAt = now

#### Auth Middleware (src/auth/auth.middleware.ts)

**`requireAuth(config): Middleware`**

- Extracts JWT from `Authorization: Bearer {token}` header
- Verifies token signature and expiration
- Looks up user in database
- Validates user.status === ACTIVE
- Throws 401/403 errors if any check fails
- Attaches `request.auth = { userId, role }` for route handlers

#### Token Service (src/auth/token.service.ts)

**JWT Token Generation:**

```typescript
createTokenPair(config, userId, role): TokenPair
  // Returns { accessToken, refreshToken }
  // accessToken: expires in JWT_ACCESS_EXPIRES_IN (default 15m)
  // refreshToken: expires in JWT_REFRESH_EXPIRES_IN (default 30d)

verifyAccessToken(config, token): Payload
  // Throws if invalid/expired, returns { sub: userId, role }

verifyRefreshToken(config, token): Payload
  // Similar to access token verification
```

**Opaque Token Generation (for email verification, password reset):**

```typescript
createOpaqueToken(): string  // Cryptographically random 32-byte token
hashToken(token: string): string  // SHA256 hash for database storage
```

#### Auth Types & Errors (src/auth/auth-types.ts, auth-errors.ts)

```typescript
interface AuthConfig {
  accessSecret: string; // 32+ characters
  refreshSecret: string; // 32+ characters
  accessExpiresIn: string; // e.g., "15m"
  refreshExpiresIn: string; // e.g., "30d"
  exposeSensitiveTokens?: boolean; // Dev mode: expose tokens in response
}

interface AuthenticatedRequest extends Request {
  auth?: { userId: ObjectId; role: UserRole };
}

class HttpError extends Error {
  constructor(statusCode: number, message: string);
  // Custom error for API responses
}
```

### Routes

#### Authentication Routes (src/auth/auth.routes.ts)

**Endpoints:**

```
POST /api/auth/register/email
  - Input: { email, password, firstName, lastName, termsAccepted, marketingConsent }
  - Output: { user, verificationToken? }
  - Rate limit: 100 req/15min

POST /api/auth/verify-email
  - Input: { token }
  - Output: { message: "Email verified" }

POST /api/auth/login
  - Input: { email, password }
  - Output: { accessToken, refreshToken, user }
  - Rate limit: 100 req/15min

POST /api/auth/refresh
  - Input: { refreshToken }
  - Output: { accessToken, refreshToken, user }

POST /api/auth/logout
  - Input: { refreshToken }
  - Output: (204 No Content)

POST /api/auth/forgot-password
  - Input: { email }
  - Output: { message: "Password reset email sent" }

POST /api/auth/reset-password
  - Input: { token, password }
  - Output: { message: "Password reset successful" }

PATCH /api/auth/change-password (requires auth)
  - Input: { currentPassword, newPassword }
  - Output: { message: "Password changed" }
```

**Rate Limiting:** 100 requests per 15-minute window for most endpoints, 20 for password reset endpoints

#### Profile Routes (src/profile/profile.routes.ts)

```
GET /api/me/profile (requires auth)
  - Returns user's own profile (including draft state)

PATCH /api/me/profile (requires auth)
  - Input: Partial profile update
  - Triggers re-moderation if approved profile has sensitive changes

POST /api/me/profile/submit (requires auth)
  - Validates profile completeness
  - Changes status to PENDING for moderation

PATCH /api/me/privacy (requires auth)
  - Update visibility settings (showPhoto, showIncome, etc.)

PATCH /api/me/notification-preferences (requires auth)
  - Update notification delivery preferences

PATCH /api/me/account (requires auth)
  - Update account settings (marketingConsent)
```

#### Public Routes (src/public/public.routes.ts)

```
GET /api/profiles/featured
  - Returns featured approved profiles for homepage

GET /api/profiles/:id
  - Get public profile view (respects visibility + blocks)
  - Query params: viewerId (optional, for block checking)

GET /api/pages/:slug
  - Render CMS pages (about, privacy, terms, etc.)

GET /api/plans/active
  - List active membership plans

GET /api/content/blog
GET /api/content/success-stories
GET /api/content/testimonials
  - Public content for homepage

POST /api/contact
  - Submit contact inquiry
  - hCaptcha verification (if configured)
  - Rate limit: 5 req/15min
  - Email notification (stored locally in dev)

POST /api/cms-pages (requires ADMIN role)
  - Create/update static pages

GET /api/cms-pages (requires ADMIN role)
  - List all CMS pages
```

### Services

#### Profile Service (src/profile/profile.service.ts)

**Profile Completion Tracking:**

```typescript
calculateProfileCompletion(profile): number
  // Checks 13 mandatory fields: firstName, lastName, gender, DOB, maritalStatus,
  // country, city, religion, community, education, occupation, aboutMe, partnerExpectations
  // Returns 0-100 percentage

assertAdultDateOfBirth(dob): void
  // Throws 400 if person under 18

calculateAge(dob): number
  // Calculates current age from birth date
```

**Profile Operations:**

```typescript
getOwnProfile(userId): Profile
  // Get own profile, throw 404 if not found

updateOwnProfile(userId, input): Profile
  // Partial update of profile
  // If APPROVED profile changes sensitive fields, re-triggers moderation

submitOwnProfile(userId): Profile
  // Validate completeness, change status to PENDING

getVisibleProfile(profileId, viewerId?): Profile | null
  // Check moderation status, visibility settings, blocks
  // Return only visible fields

updateAccountSettings(userId, marketingConsent): User
  // Update user account-level settings
```

#### Email Service (src/common/email.service.ts)

**Provider Pattern:**

```typescript
interface EmailProvider {
  sendEmail(email: Email): Promise<void>
}

class ConsoleEmailProvider implements EmailProvider {
  // Logs email to console for development
}

// Future providers: SendGrid, Mailgun, etc.

sendEmail(email): Promise<void>
  // Uses current provider (console for dev, production provider for prod)
```

---

## Apps/Web - Frontend

### Purpose

Next.js 16 web application providing:

- Public homepage with trust-building, featured profiles, plans, stories
- Authentication flows (register, login, password reset)
- Member portal (profile creation, editing, settings)
- Public profile viewing
- Admin placeholder pages
- Static pages (CMS-rendered)
- Contact form

### Key Features

- **Next.js 16:** Latest React framework with SSR/SSG, App Router
- **TypeScript:** Full type safety
- **TailwindCSS:** Utility-first styling
- **Responsive Design:** Mobile-first approach
- **Form Handling:** Zod validation on client
- **API Integration:** Centralized API client libs
- **Premium UI:** Brand-aligned design with warm ivory/burgundy/gold palette

### Entry Point & Layout (app/layout.tsx)

```typescript
RootLayout
  - Sets HTML lang="en-AU" for Australian English
  - Metadata: title, description for SEO
  - Renders global CSS
  - {children} renders page content
```

### Environment Configuration (env.ts)

Parsed from `.env.local` using Zod schema (`webEnvSchema`):

| Variable                       | Required | Type                          | Default                            |
| ------------------------------ | -------- | ----------------------------- | ---------------------------------- |
| `NODE_ENV`                     | No       | development, production, test | development                        |
| `NEXT_PUBLIC_API_BASE_URL`     | Yes      | URL                           | http://localhost:4000              |
| `NEXT_PUBLIC_HCAPTCHA_SITEKEY` | No       | String                        | (hCaptcha site key for production) |

### Next.js Configuration (next.config.ts)

```typescript
{
  reactStrictMode: true,  // Strict mode for development
  transpilePackages: ['@vivah/shared', '@vivah/ui']  // Transpile shared packages
}
```

### TailwindCSS Configuration (tailwind.config.ts)

- **Content:** Scans `./app/**/*.{ts,tsx}` and `../../packages/ui/src/**/*.{ts,tsx}`
- **Theme:** Default Tailwind colors (can be customized with brand palette)
- **Plugins:** None configured yet

### Global Styles (app/globals.css)

- Tailwind directives: `@tailwind base; @tailwind components; @tailwind utilities;`
- Custom CSS for brand colors and typography

### Page & Component Structure

#### Root Page (app/page.tsx)

**Homepage - Premium Matrimonial Landing Page**

**Components:**

- Sticky navigation with logo, links, signup/login buttons
- Hero section with emotional headline and CTA buttons
- Featured approved profiles carousel (6 profiles)
- Trust bar highlighting verification, safety, Australian community
- "How It Works" section (4 steps)
- Verification levels progression display
- Success stories section
- Testimonials carousel
- Browse by community links (cities, religions, languages)
- FAQ section
- Blog/news section
- Final conversion CTA
- Footer with legal links

**API Integration:**

```typescript
getFeaturedProfiles(); // GET /api/profiles/featured
getPlans(); // GET /api/plans/active
getSuccessStories(); // GET /api/content/success-stories
getTestimonials(); // GET /api/content/testimonials
getBlogs(); // GET /api/content/blog
```

**Fallback Content:** Static fallback data if API calls fail

#### Auth Routes (app/(auth)/)

**Layout: app/(auth)/auth-shell.tsx**

Shared auth UI shell with styling, brand colors, form container

**Components:**

- `form-field.tsx` - Reusable form input wrapper
- `submit-button.tsx` - Submit button with loading state

**Pages:**

1. **Register: app/(auth)/register/page.tsx**
   - Email registration form
   - Password complexity requirements displayed
   - Terms acceptance checkbox
   - Marketing consent checkbox
   - Form validation using `registerEmailSchema`
   - API call to `POST /api/auth/register/email`
   - Success → Email verification prompt
   - Error handling with user-friendly messages

2. **Login: app/(auth)/login/page.tsx**
   - Email + password login form
   - Remember me (browser-stored)
   - Forgot password link
   - Form validation
   - API call to `POST /api/auth/login`
   - Success → Redirect to `/member/onboarding` or dashboard
   - Error handling (3 failed attempts warning, account lockout)

3. **Forgot Password: app/(auth)/forgot-password/page.tsx**
   - Email input
   - API call to `POST /api/auth/forgot-password`
   - Success → Email sent confirmation

4. **Reset Password: app/(auth)/reset-password/page.tsx**
   - Token from URL query params
   - New password + confirm password
   - API call to `POST /api/auth/reset-password`
   - Success → Redirect to login with confirmation

#### Member Routes (app/member/)

**Protected routes** - Requires authentication (will be implemented with middleware)

**Layout: app/member/member-shell.tsx**

Shared member portal UI shell:

- Sidebar navigation
- Profile summary
- Member dashboard layout

**Pages & Components:**

1. **Onboarding: app/member/onboarding/page.tsx**
   - Multi-step profile creation wizard
   - Partial profile saves
   - Completion percentage tracker
   - Shows required vs. optional fields
   - Submit for moderation CTA
   - Uses `profileDraftSchema` for validation
   - API: `PATCH /api/me/profile`, `POST /api/me/profile/submit`

2. **Profile Edit: app/member/profile/edit/page.tsx**
   - Edit all profile sections
   - Auto-save draft functionality
   - Triggers re-moderation warning if approved profile
   - Similar schema validation as onboarding

3. **Settings: app/member/settings/page.tsx**
   - Account settings (marketing consent, notifications)
   - Privacy controls (photo visibility, income visibility, etc.)
   - Account deactivation (placeholder for phase 2)
   - Delete account request (placeholder for phase 2)

4. **Component: profile-form.tsx**
   - Reusable profile form for create/edit flows

#### Public Profile View (app/profiles/[id]/page.tsx)

- Dynamic route with profile ID
- Calls `GET /api/profiles/:id`
- Respects visibility settings
- Shows verification badges
- Displays allowed profile sections
- Block detection (if user blocked, show limited view or error)

#### Static Pages (app/pages/[slug]/page.tsx)

- Dynamic route with page slug
- Calls `GET /api/pages/:slug` to fetch CMS content
- Renders HTML content from backend
- SEO metadata from CMS page record

#### Contact Form (app/contact/contact-form.tsx)

- Reusable contact form component
- Input validation
- hCaptcha integration (if `NEXT_PUBLIC_HCAPTCHA_SITEKEY` set)
- Validation using `contactInquirySchema`
- API: `POST /api/contact`
- Success → Thank you message
- Error handling with user feedback

#### Contact Page (app/contact/page.tsx)

- Page wrapper for contact form
- Company contact info
- Support email display

### API Client Libraries

#### src/lib/auth-api.ts

Client for authentication endpoints:

```typescript
interface AuthApiResult {
  ok: boolean
  message: string
  data?: unknown
}

postAuth(path: string, body: Record<string, unknown>): Promise<AuthApiResult>
  // Makes POST request to /api/auth/{path}
  // Used for register, login, verify-email, refresh, logout, etc.
```

#### src/lib/public-api.ts

Client for public data endpoints:

```typescript
getBlogs(): Promise<BlogPost[]>
getFeaturedProfiles(): Promise<FeaturedProfile[]>
getPlans(): Promise<Plan[]>
getSuccessStories(): Promise<SuccessStory[]>
getTestimonials(): Promise<Testimonial[]>
// Plus additional public data fetching functions
```

#### src/lib/member-api.ts

Client for authenticated member endpoints:

```typescript
// Profile, settings, account management endpoints
```

### TypeScript Configuration (tsconfig.json)

```json
{
  "extends": "@vivah/config/tsconfig/next.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"] // Import @/app, @/lib, etc.
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

---

## Packages - Shared Code

### Purpose

Shared utilities used by both API and Web:

- Type definitions
- Validation schemas
- Constants and enums
- Environment configuration schemas

### packages/shared

**Purpose:** Centralized TypeScript validation schemas, constants, and types

**Files:**

#### src/constants.ts

Enums and constant values for the entire platform:

```typescript
// User & Auth
UserRole = { USER, PREMIUM_USER, MODERATOR, ADMIN, SUPER_ADMIN };
AccountStatus = { PENDING, ACTIVE, SUSPENDED, BANNED, DELETED };

// Profile
Gender = { FEMALE, MALE, NON_BINARY, PREFER_NOT_TO_SAY };
MaritalStatus = { NEVER_MARRIED, DIVORCED, WIDOWED, SEPARATED, ANNULLED };
VerificationLevel = { NONE, BASIC, SILVER, GOLD, PLATINUM, FULLY_VERIFIED };
ProfileVisibility = { PUBLIC, MEMBERS_ONLY, MATCHES_ONLY, HIDDEN };
VerificationStatus = { NOT_SUBMITTED, PENDING, APPROVED, REJECTED, NEEDS_RESUBMISSION };

// Media
MediaVisibility = { PUBLIC, PRIVATE, MATCHES_ONLY };

// Features (Phase 1+)
InterestStatus = { PENDING, ACCEPTED, REJECTED, WITHDRAWN };
SubscriptionStatus = { TRIALING, ACTIVE, PAST_DUE, CANCELED, EXPIRED };
PaymentStatus = { PENDING, SUCCEEDED, FAILED };
ReportStatus = { PENDING, INVESTIGATING, RESOLVED, DISMISSED };
CommunityPostStatus = { PUBLISHED, DRAFT, ARCHIVED, DELETED };

// Special values
INCOME_VISIBILITY_VALUES = ['HIDDEN', 'MEMBERS_ONLY', 'ALL'];
```

#### src/validators.ts

Zod schemas for request/response validation:

```typescript
// Email & Password
emailSchema  // Valid email, max 254 chars
passwordSchema  // Min 12, max 128, must include lowercase, uppercase, number, symbol

// Auth
registerEmailSchema  // { email, password, firstName, lastName, termsAccepted, marketingConsent? }
loginSchema  // { email, password }
refreshTokenSchema  // { refreshToken }
changePasswordSchema  // { currentPassword, newPassword }
forgotPasswordSchema, resetPasswordSchema  // Password recovery

// Profile
profileDraftSchema  // Partial profile update
profileSubmitSchema  // Profile submission for moderation
accountSettingsSchema  // Account-level settings
notificationPreferencesSchema  // Notification delivery preferences

// CMS & Public
cmsPageInputSchema  // { slug, title, body, seoTitle?, seoDescription?, published? }
contactInquirySchema  // { name, email, phone?, subject, message, captchaToken? }

// Enum schemas
userRoleSchema, accountStatusSchema, genderSchema, maritalStatusSchema, etc.
```

#### src/env.ts

Environment schema parsers:

```typescript
apiEnvSchema;
// Validates API environment variables
// Used in apps/api/src/env.ts

webEnvSchema;
// Validates Web environment variables
// Used in apps/web/env.ts

parseEnv<TSchema>(schema, env);
// Generic Zod parser with error handling
```

#### src/index.ts

Barrel export file:

```typescript
export * from './constants.js';
export * from './env.js';
export * from './validators.js';
```

**Usage in API & Web:**

```typescript
import {
  UserRole,
  AccountStatus,
  Gender,
  registerEmailSchema,
  parseEnv,
  apiEnvSchema,
} from '@vivah/shared';
```

**Build Configuration:**

```json
{
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  }
}
```

Must be built before running API/Web (shared dependency)

### packages/config

**Purpose:** Reusable TypeScript configurations for all packages

**Files:**

```
tsconfig/
  ├── base.json     # Strict TypeScript settings for all targets
  ├── node.json     # API backend configuration
  └── next.json     # Web frontend configuration
```

#### tsconfig/base.json

Strict TypeScript settings applied to all packages:

```json
{
  "compilerOptions": {
    "target": "ES2022", // Modern JavaScript
    "lib": ["ES2022"],
    "module": "NodeNext", // ESM
    "moduleResolution": "NodeNext",
    "strict": true, // All strict checks
    "noUncheckedIndexedAccess": true, // Safer array access
    "exactOptionalPropertyTypes": true, // Strict optional fields
    "noImplicitOverride": true, // Explicit override keyword
    "noFallthroughCasesInSwitch": true, // Switch must have returns
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true, // Each file is independent
    "esModuleInterop": true, // CommonJS compatibility
    "skipLibCheck": true, // Skip type checking of libs
    "resolveJsonModule": true // Can import JSON
  }
}
```

#### tsconfig/node.json

API-specific TypeScript configuration:

```json
{
  "extends": "./base.json",
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "types": ["node"],
    "declaration": true, // Generate .d.ts
    "sourceMap": true // Debug support
  }
}
```

#### tsconfig/next.json

Web-specific TypeScript configuration (extends base, inherits in apps/web/tsconfig.json)

### packages/ui

**Purpose:** Placeholder for future shared React UI components

Currently empty but structured for:

- Reusable form components
- Modal/dialog components
- Profile card components
- Navigation components
- Button/input systems

**Structure:**

```typescript
src/
  └── index.ts  // Barrel export
```

---

## Key Systems

### Authentication & Authorization

#### Flow Diagram

```
User Registration
↓
- Email validation
- Password hashing (bcrypt, 12 rounds)
- User created in PENDING status
- Email verification token generated (24hr TTL)
- Verification email sent
↓
User clicks email link
↓
- Token verified
- User status → ACTIVE
- Token deleted
- Ready to login

User Login
↓
- Email lookup
- Password verification (bcrypt)
- Failed attempt tracking (max 5, 15min lockout)
- JWT access token (15m)
- JWT refresh token (30d)

Token Refresh
↓
- Refresh token verified
- Refresh token version checked
- New access token issued
- New refresh token issued
- Old refresh token invalidated (version bump)

Password Reset
↓
- Email submitted
- Reset token generated (1hr TTL)
- Reset email sent
- User clicks link, verifies token
- New password set
- Token deleted
```

#### Token Security

- **Access Tokens:** Short-lived (15 min), contain userId + role
- **Refresh Tokens:** Long-lived (30 days), rotated on use
- **Opaque Tokens:** Email verification, password reset tokens stored as SHA256 hashes
- **Secrets:** 32+ character random strings, environment-specific
- **Storage:** Client uses localStorage (browser default behavior)

### Validation Pipeline

#### Request Validation (Both API & Web)

All input validated with Zod schemas:

```typescript
// API Routes
router.post('/api/auth/login', (req, res) => {
  const input = loginSchema.parse(req.body); // Throws on invalid
  // ... handler
});

// Web Forms
const input = await registerEmailSchema.parseAsync(formData);
// If validation fails, Zod error is caught and displayed to user
```

#### Response Consistency

```typescript
API Success: { message?, data?, profile?, user?, ... }
API Error: { message, issues? }  // 400/401/403/500

Web Client Result:
{
  ok: boolean
  message: string
  data?: unknown
}
```

### Error Handling

#### API Errors

```typescript
class HttpError extends Error {
  statusCode: number;
  message: string;
}

// Examples
throw new HttpError(400, 'Email is already registered');
throw new HttpError(401, 'Authentication required');
throw new HttpError(403, 'Account is not active');
throw new HttpError(404, 'Profile not found');
```

#### Middleware Error Handler (app.ts)

```typescript
- ZodError → 400 with validation issues
- HttpError → Appropriate status code + message
- Unknown error → 500 (logged to console, not in test)
```

### Profile Moderation System

#### Status Transitions

```
New Profile
↓
PENDING (awaiting admin review)
↓
├→ APPROVED (matches all policies)
│  └→ PENDING again if user edits sensitive fields
│
├→ REJECTED (violates policies)
│  └→ User cannot be viewed until resubmits
│
└→ NEEDS_CHANGES (admin feedback)
   └→ User must edit before visibility restored
```

#### Sensitive Field Changes

Changes to personal, religion, location, education, employment trigger re-moderation:

```typescript
SENSITIVE_UPDATE_PREFIXES = ['personal.', 'religion.', 'location.', 'education.', 'employment.'];

if (profile.approvalStatus === 'APPROVED' && sensitivePath) {
  profile.approvalStatus = 'PENDING'; // Require re-review
}
```

### Soft Delete Strategy

All models support soft delete:

```typescript
// Physical data never deleted
{
  isDeleted: boolean
  deletedAt?: Date
  deletedBy?: ObjectId  // Who deleted it
}

// Queries default filter: { isDeleted: false }
// Restore: set isDeleted = false, delete deletedAt/deletedBy
```

---

## Database Models

### Complete Model List

| Model          | Status         | Purpose                                    |
| -------------- | -------------- | ------------------------------------------ |
| User           | ✅ Implemented | User accounts & authentication             |
| Profile        | ✅ Implemented | Detailed user profile data                 |
| AuthToken      | ✅ Implemented | Email verification & password reset tokens |
| ProfileMedia   | ✅ Schema      | Photo/video uploads with approval          |
| Block          | ✅ Schema      | User blocking relationships                |
| Interest       | 🔲 Schema      | Interest expressions (pending phase)       |
| CmsPage        | ✅ Schema      | Static pages (about, privacy, etc.)        |
| ContactInquiry | ✅ Schema      | Contact form submissions                   |
| Plan           | ✅ Schema      | Membership plans                           |
| SuccessStory   | ✅ Schema      | Homepage success stories                   |
| Testimonial    | ✅ Schema      | User testimonials                          |
| BlogPost       | ✅ Schema      | Blog/news content                          |
| Message        | 🔲 Schema      | Direct messages (phase 2)                  |
| Room           | 🔲 Schema      | Community rooms (phase 2)                  |
| Report         | 🔲 Schema      | User/content reports (phase 2)             |
| Subscription   | 🔲 Schema      | Active user subscriptions (phase 2)        |
| Payment        | 🔲 Schema      | Payment records (phase 2)                  |
| Boost          | 🔲 Schema      | Profile boost purchases (phase 2)          |

### Indexes Strategy

**Fast Lookups:**

- User: email, mobile, social IDs
- Profile: userId, displayId, slug

**Filtering/Discovery:**

- Profile: verification level, approval status, location, religion, community
- User: role, status

**Time-Based:**

- AuthToken: expiresAt
- Messages: createdAt

**Audit:**

- All: isDeleted (soft delete filtering)

---

## API Endpoints

### Authentication Endpoints

| Method | Path                        | Auth | Rate Limit | Purpose                      |
| ------ | --------------------------- | ---- | ---------- | ---------------------------- |
| POST   | `/api/auth/register/email`  | No   | 100/15m    | Register new user            |
| POST   | `/api/auth/verify-email`    | No   | 100/15m    | Verify email address         |
| POST   | `/api/auth/login`           | No   | 100/15m    | Login with credentials       |
| POST   | `/api/auth/refresh`         | No   | 100/15m    | Refresh token pair           |
| POST   | `/api/auth/logout`          | No   | 100/15m    | Invalidate refresh token     |
| POST   | `/api/auth/forgot-password` | No   | 100/15m    | Request password reset email |
| POST   | `/api/auth/reset-password`  | No   | 20/15m     | Reset password with token    |
| PATCH  | `/api/auth/change-password` | Yes  | N/A        | Change password (logged in)  |

### Profile Endpoints

| Method | Path                               | Auth | Purpose                        |
| ------ | ---------------------------------- | ---- | ------------------------------ |
| GET    | `/api/me/profile`                  | Yes  | Get own profile                |
| PATCH  | `/api/me/profile`                  | Yes  | Update own profile (draft)     |
| POST   | `/api/me/profile/submit`           | Yes  | Submit for moderation          |
| PATCH  | `/api/me/privacy`                  | Yes  | Update visibility settings     |
| PATCH  | `/api/me/notification-preferences` | Yes  | Update notification prefs      |
| PATCH  | `/api/me/account`                  | Yes  | Update account settings        |
| GET    | `/api/profiles/:id`                | No   | View public profile            |
| GET    | `/api/profiles/featured`           | No   | Featured profiles for homepage |

### Public Content Endpoints

| Method | Path                           | Auth | Purpose                |
| ------ | ------------------------------ | ---- | ---------------------- |
| GET    | `/api/pages/:slug`             | No   | Render CMS page        |
| GET    | `/api/plans/active`            | No   | List active plans      |
| GET    | `/api/content/blog`            | No   | Blog posts             |
| GET    | `/api/content/success-stories` | No   | Success stories        |
| GET    | `/api/content/testimonials`    | No   | Testimonials           |
| POST   | `/api/contact`                 | No   | Submit contact inquiry |

### Admin Endpoints

| Method | Path                 | Auth  | Purpose            |
| ------ | -------------------- | ----- | ------------------ |
| POST   | `/api/cms-pages`     | Admin | Create CMS page    |
| GET    | `/api/cms-pages`     | Admin | List all CMS pages |
| PATCH  | `/api/cms-pages/:id` | Admin | Edit CMS page      |
| DELETE | `/api/cms-pages/:id` | Admin | Delete CMS page    |

### System Endpoints

| Method | Path      | Auth | Purpose      |
| ------ | --------- | ---- | ------------ |
| GET    | `/health` | No   | Health check |

---

## Frontend Pages & Routes

### Public Routes

| Path            | Purpose             | Components                                   | Data Fetching           |
| --------------- | ------------------- | -------------------------------------------- | ----------------------- |
| `/`             | Homepage            | Hero, featured profiles, plans, stories, FAQ | Public APIs             |
| `/pages/:slug`  | Static pages        | CMS page renderer                            | `GET /api/pages/:slug`  |
| `/profiles/:id` | Public profile view | Profile card, verification badges            | `GET /api/profiles/:id` |
| `/contact`      | Contact page        | Contact form                                 | `POST /api/contact`     |

### Auth Routes

| Path                      | Purpose           | Components           | Auth Required |
| ------------------------- | ----------------- | -------------------- | ------------- |
| `/(auth)/register`        | User registration | Register form        | No            |
| `/(auth)/login`           | Login             | Login form           | No            |
| `/(auth)/forgot-password` | Forgot password   | Forgot password form | No            |
| `/(auth)/reset-password`  | Reset password    | Reset form           | No            |

### Member Routes

| Path                   | Purpose                 | Protected | Components      |
| ---------------------- | ----------------------- | --------- | --------------- |
| `/member/onboarding`   | Profile creation wizard | Yes       | Multi-step form |
| `/member/profile/edit` | Edit profile            | Yes       | Profile editor  |
| `/member/settings`     | Account settings        | Yes       | Settings forms  |

---

## Current Implementation Status

### Completed Features

✅ **Core Infrastructure:**

- Monorepo setup (pnpm workspaces)
- TypeScript strict mode throughout
- ESLint + Prettier configuration
- Test setup (Vitest + Supertest)

✅ **Authentication:**

- Email registration with password hashing
- Email verification flow
- Login with JWT + refresh token rotation
- Token refresh mechanism
- Logout with token invalidation
- Forgot/reset password flow
- Change password endpoint
- Rate limiting on auth endpoints

✅ **User & Profile:**

- User model with auth fields
- Profile model with comprehensive sections
- Profile completion tracking
- Profile moderation workflow
- Profile submission for review

✅ **Frontend Pages:**

- Homepage (premium design following UI/UX plan)
- Auth pages (register, login, forgot password, reset password)
- Member portal (onboarding, profile edit, settings)
- Public profile viewing
- Static page rendering
- Contact form

✅ **Public Content:**

- Featured profiles API
- Plans listing
- Success stories & testimonials
- Blog posts
- CMS page management (backend API, no admin UI)

✅ **Testing:**

- Validator tests
- Auth route tests
- Public route tests
- Profile route tests
- Model tests

### Partially Completed

⚠️ **Contact Form:**

- Backend API complete
- hCaptcha verification implemented
- Email storage working
- Missing: Production email provider integration

⚠️ **Profile Media:**

- Schema defined
- Model exists
- Missing: Upload endpoints, storage integration

⚠️ **Admin Features:**

- CMS page CRUD API exists
- Missing: Admin UI for content management

⚠️ **Block Users:**

- Model exists
- Profile view respects blocks
- Missing: Member UI to block/unblock

### Not Started (Phase 2+)

❌ Mobile OTP registration  
❌ Social login (Google, Facebook, Apple)  
❌ Media uploads (photos, videos)  
❌ Verification system (ID, address, employment)  
❌ Search & discovery  
❌ Interests system  
❌ Favorites  
❌ Messaging system  
❌ Community/rooms  
❌ Payment & subscriptions  
❌ Email notifications  
❌ SMS/OTP  
❌ Admin moderation dashboard  
❌ Reporting system  
❌ Analytics dashboard  
❌ Frontend/E2E tests  
❌ CI/CD pipeline

---

## Known Gaps & Constraints

### Email Sending

**Current:** Console logging (development)
**Needed:** Production email provider (SendGrid, Mailgun, etc.)
**Impact:** Auth emails, contact form notifications not sent to real addresses
**Action:** Set up email provider integration

### CAPTCHA Verification

**Current:** hCaptcha integration with fallback (skips if secret not set)
**Needed:** Stronger verification in production
**Impact:** Contact form vulnerable to spam without HCAPTCHA_SECRET
**Action:** Configure hCaptcha keys for production

### Admin UI

**Current:** API endpoints exist for CMS, no UI
**Needed:** Admin panel for managing static pages, plans, content
**Impact:** Content must be managed via API, not user-friendly
**Action:** Build admin dashboard

### Profile Media Storage

**Current:** Schema defined, no implementation
**Needed:** File upload endpoints, cloud storage (Cloudinary, S3, etc.)
**Impact:** Users cannot upload photos/videos
**Action:** Implement media upload and approval system

### Real-Time Messaging

**Current:** Not implemented
**Needed:** Socket.IO setup for real-time notifications
**Impact:** Chat, notifications are not real-time
**Action:** Integrate Socket.IO on API server

### Payment Integration

**Current:** Plan model exists, no Stripe integration
**Needed:** Stripe payment processing, subscription management
**Impact:** Premium memberships cannot be purchased
**Action:** Integrate Stripe API

### Frontend Authentication Persistence

**Current:** Basic localStorage for tokens
**Needed:** Token refresh middleware, logout on expiry
**Impact:** Users may experience unexpected logouts
**Action:** Add auth context/middleware to frontend

### End-to-End Tests

**Current:** Backend tests only
**Needed:** E2E tests with Playwright or Cypress
**Impact:** UI changes not tested against real flow
**Action:** Set up E2E test suite

### CI/CD Pipeline

**Current:** None
**Needed:** GitHub Actions or similar
**Impact:** Manual testing and deployment required
**Action:** Configure automated testing and deployment

---

## Development Workflow

### Local Setup

```bash
# Prerequisites
node --version  # Should be 22+
pnpm --version  # Should be 10.33.0+

# Clone and install
git clone <repo>
cd vivah-australia
pnpm install

# Environment setup
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Update .env files with your values:
# API: MONGODB_URI, JWT secrets, CORS_ORIGINS
# Web: NEXT_PUBLIC_API_BASE_URL
```

### Development Commands

```bash
# Start dev servers (API + Web concurrently)
pnpm dev
# → API: http://localhost:4000
# → Web: http://localhost:3000

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Format code
pnpm format
pnpm format:check

# Run tests
pnpm test

# Build for production
pnpm build

# Seed database (optional)
pnpm --filter @vivah/api seed
```

### Project Rules

1. **Follow UI/UX Planning:** Refer to `vivah_australia_ui_ux_planning.md` for all design decisions
2. **Update Progress:** After completing any task, update `PROJECT_PROGRESS.md`
3. **Commit & Push:** Commit completed work and push to `origin/main` before handing off
4. **Validation:** All inputs must use Zod schemas from `@vivah/shared`
5. **Type Safety:** No `any`, use strict TypeScript
6. **Error Handling:** Use `HttpError` for API errors, meaningful messages for users
7. **Testing:** Add tests for new features
8. **Soft Deletes:** Never permanently delete data, use isDeleted flag

### File Organization

**API:**

```
apps/api/src/
├── index.ts              # Entry point
├── app.ts                # Express app factory
├── env.ts                # Environment config
├── auth/                 # Authentication system
├── models/               # Database models
├── profile/              # Profile routes & services
├── public/               # Public API routes
├── common/               # Shared services (email, etc.)
└── db/                   # Database setup
```

**Web:**

```
apps/web/
├── env.ts                # Environment config
├── next.config.ts        # Next.js config
├── tailwind.config.ts    # TailwindCSS config
├── app/                  # Next.js app directory
│   ├── layout.tsx
│   ├── page.tsx          # Homepage
│   ├── (auth)/           # Auth group
│   ├── member/           # Member group
│   ├── contact/
│   ├── pages/
│   ├── profiles/
│   └── globals.css
└── lib/                  # API clients
    ├── auth-api.ts
    ├── public-api.ts
    └── member-api.ts
```

**Shared:**

```
packages/shared/src/
├── constants.ts          # Enums and constants
├── validators.ts         # Zod schemas
├── env.ts                # Environment schemas
└── index.ts              # Barrel export
```

### Common Tasks

#### Add a New API Endpoint

1. Update/create validator in `@vivah/shared` validators
2. Add route handler to appropriate routes file
3. Add service function if needed
4. Add tests
5. Update API documentation
6. Test locally: `curl http://localhost:4000/api/...`

#### Add a New Frontend Page

1. Create `.tsx` file in `apps/web/app/` following route structure
2. Add any API client functions to `apps/web/lib/`
3. Add Zod validation if needed
4. Test locally: `http://localhost:3000/new-route`

#### Update Shared Constants

1. Edit `packages/shared/src/constants.ts`
2. Run `pnpm --filter @vivah/shared build`
3. Changes automatically available in API and Web

#### Write Tests

```typescript
// Backend: src/*.test.ts
describe('Feature', () => {
  it('should do something', () => {
    // test code
  });
});

// Run: pnpm --filter @vivah/api test
```

---

## Dependencies Between Modules

### Direct Dependencies

```
apps/web
├── @vivah/shared          # Constants, validators
├── @vivah/ui              # UI components (future)
├── @vivah/config          # TypeScript config
└── External: next, react, tailwindcss, zod, hcaptcha

apps/api
├── @vivah/shared          # Constants, validators
├── @vivah/config          # TypeScript config
└── External: express, mongoose, jsonwebtoken, bcryptjs, cors, helmet, zod

packages/shared
├── @vivah/config          # TypeScript config
└── External: zod

packages/ui
├── @vivah/config          # TypeScript config
└── External: react (peer)

packages/config
└── (No dependencies)
```

### Build Order

1. Build `@vivah/config` (no dependencies)
2. Build `@vivah/shared` (depends on config)
3. Build `@vivah/ui` (depends on config)
4. Build `@vivah/api` (depends on shared, config)
5. Build `@vivah/web` (depends on shared, ui, config)

---

## Recommended Next Steps

Based on `PROJECT_PROGRESS.md`:

### Short Term (1-2 weeks)

1. **Complete WEB-003 (Contact Form):**
   - Integrate real email provider (SendGrid)
   - Strengthen hCaptcha verification

2. **Build ADMIN-001 & ADMIN-006 UI:**
   - Admin authentication
   - CMS content management UI
   - Allows non-technical team to manage pages

3. **Add Frontend Tests:**
   - Unit tests for components
   - Integration tests for forms

### Medium Term (2-4 weeks)

4. **Build MEDIA-001 (Photo Uploads):**
   - Photo upload endpoint
   - Storage integration (Cloudinary/S3)
   - Admin review queue

5. **Build MATCH-001 (Search Profiles):**
   - Advanced search filters
   - Profile discovery
   - Recommended matches algorithm

6. **Complete INTEREST System:**
   - Send/accept/reject/withdraw interests
   - Interest matching workflow
   - UI for interest management

### Long Term (Next Sprint)

7. **Setup CI/CD Pipeline:**
   - GitHub Actions for automated testing
   - Automated deployments to staging/production

8. **Implement Messaging System:**
   - Direct messaging API
   - Socket.IO for real-time chat
   - Message history

9. **Payment Integration:**
   - Stripe subscription setup
   - Plan entitlement checking
   - Invoice management

10. **User Verification:**
    - Verification request system
    - Badge logic
    - Moderation workflow UI

---

## Contact & Support

For questions about the codebase:

1. Check `PROJECT_PROGRESS.md` for current status
2. Refer to `vivah_australia_ui_ux_planning.md` for UI decisions
3. Review test files for usage examples
4. Check git history for recent changes

---

**Document Version:** 1.0  
**Last Updated:** June 1, 2026  
**Status:** Complete - All core systems documented
