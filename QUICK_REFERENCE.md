# Vivah Australia - Quick Reference Guide

## Quick Links

- **Full Documentation:** [CODEBASE_DOCUMENTATION.md](CODEBASE_DOCUMENTATION.md)
- **Project Progress:** [PROJECT_PROGRESS.md](PROJECT_PROGRESS.md)
- **Development Tasks:** [vivah_ai_ready_development_tasklist.md](vivah_ai_ready_development_tasklist.md)
- **UI/UX Design Rules:** [vivah_australia_ui_ux_planning.md](vivah_australia_ui_ux_planning.md)

---

## Technology Stack At a Glance

| Component       | Technology                   | Version                 |
| --------------- | ---------------------------- | ----------------------- |
| Frontend        | Next.js + React + TypeScript | 16.2.6 + 19.2.6 + 5.7.2 |
| Backend         | Express.js + Node.js         | 4.21.1 + 22+            |
| Database        | MongoDB + Mongoose           | Latest + 9.6.3          |
| Styling         | TailwindCSS                  | 3.4.17                  |
| Auth            | JWT + bcryptjs               | 9.0.3 + 3.0.3           |
| Validation      | Zod                          | 3.24.1                  |
| Testing         | Vitest + Supertest           | 2.1.8 + 7.0.0           |
| Package Manager | pnpm                         | 10.33.0+                |

---

## Directory Structure

```
vivah-australia/
├── apps/
│   ├── api/              # Express backend (port 4000)
│   └── web/              # Next.js frontend (port 3000)
├── packages/
│   ├── shared/           # Validators, constants, enums
│   ├── config/           # TypeScript configs
│   └── ui/               # Shared UI components (placeholder)
├── docs/                 # Documentation directory
├── scripts/              # Utility scripts
├── PROJECT_PROGRESS.md   # Current implementation status
├── README.md             # Setup instructions
└── CODEBASE_DOCUMENTATION.md  # Complete codebase guide
```

---

## Environment Variables

### API (.env)

```bash
NODE_ENV=development
API_PORT=4000
API_BASE_URL=http://localhost:4000
WEB_BASE_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/vivah_dev
JWT_ACCESS_SECRET=your-32-character-random-secret
JWT_REFRESH_SECRET=your-32-character-random-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
CORS_ORIGINS=http://localhost:3000
HCAPTCHA_SECRET=optional-hcaptcha-secret
```

### Web (.env.local)

```bash
NODE_ENV=development
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
NEXT_PUBLIC_HCAPTCHA_SITEKEY=optional-hcaptcha-sitekey
```

---

## Essential Commands

### Setup

```bash
# Install dependencies
pnpm install

# Setup environment files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

### Development

```bash
# Start all dev servers
pnpm dev

# Start individual servers
pnpm --filter @vivah/api dev
pnpm --filter @vivah/web dev

# Lint code
pnpm lint

# Type check
pnpm typecheck

# Format code
pnpm format
pnpm format:check

# Run tests
pnpm test

# Build for production
pnpm build
```

---

## Key File Locations

### Authentication

- **User Model:** `apps/api/src/models/user.model.ts`
- **Auth Service:** `apps/api/src/auth/auth.service.ts`
- **Auth Routes:** `apps/api/src/auth/auth.routes.ts`
- **Auth Middleware:** `apps/api/src/auth/auth.middleware.ts`
- **Token Service:** `apps/api/src/auth/token.service.ts`

### Database

- **Database Connection:** `apps/api/src/db/connection.ts`
- **Models Index:** `apps/api/src/models/index.ts`
- **Common Fields:** `apps/api/src/models/common.ts`

### Frontend

- **Homepage:** `apps/web/app/page.tsx`
- **Auth Pages:** `apps/web/app/(auth)/`
- **Member Portal:** `apps/web/app/member/`
- **API Clients:** `apps/web/lib/`

### Shared

- **Constants & Enums:** `packages/shared/src/constants.ts`
- **Validators:** `packages/shared/src/validators.ts`
- **Environment Schemas:** `packages/shared/src/env.ts`

---

## Common Workflows

### Add a New API Endpoint

1. **Create validator** in `packages/shared/src/validators.ts`
2. **Add route** in appropriate routes file (auth, profile, public)
3. **Create service function** if needed
4. **Add tests** in `.test.ts` file
5. **Build shared:** `pnpm --filter @vivah/shared build`
6. **Test locally:** `curl http://localhost:4000/api/...`

### Add a Frontend Page

1. **Create file** in `apps/web/app/` following Next.js routing
2. **Add API client** to `apps/web/lib/` if needed
3. **Use validators** from `@vivah/shared`
4. **Follow UI/UX planning** from design rules
5. **Test locally:** `http://localhost:3000/new-route`

### Deploy Database Changes

1. **Update model** in `apps/api/src/models/`
2. **Add index** if needed for performance
3. **Test schema validation** in tests
4. **Migrate existing data** manually if needed
5. **Add migration comments** in model file

---

## API Endpoints Summary

### Auth

- `POST /api/auth/register/email` - Register
- `POST /api/auth/verify-email` - Verify email
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh tokens
- `POST /api/auth/logout` - Logout
- `POST /api/auth/forgot-password` - Request reset
- `POST /api/auth/reset-password` - Reset password

### Profile

- `GET /api/me/profile` - Get own profile
- `PATCH /api/me/profile` - Update profile
- `POST /api/me/profile/submit` - Submit for review
- `GET /api/profiles/:id` - View public profile

### Public

- `GET /api/pages/:slug` - CMS page
- `GET /api/plans/active` - Plans list
- `GET /api/profiles/featured` - Featured profiles
- `POST /api/contact` - Contact form

### System

- `GET /health` - Health check

---

## Validation Patterns

### Backend Validation

```typescript
import { loginSchema } from '@vivah/shared';

router.post('/api/auth/login', async (req, res) => {
  const input = loginSchema.parse(req.body); // Throws ZodError if invalid
  // ... handler logic
});
```

### Frontend Validation

```typescript
import { registerEmailSchema } from '@vivah/shared';

const result = await registerEmailSchema.parseAsync(formData);
if (result.success) {
  // Valid
} else {
  // Show errors
}
```

---

## Authentication Flow

### Registration → Login → Refresh

```
User fills register form
    ↓
POST /api/auth/register/email
    ↓
User gets verification email
    ↓
User clicks email link, calls verify-email endpoint
    ↓
User logs in with email + password
    ↓
GET access token (15m) + refresh token (30d)
    ↓
Access token expires, use refresh token
    ↓
POST /api/auth/refresh → new tokens issued
```

---

## Database Models

### Core Models (Implemented)

- **User** - Account & auth data
- **Profile** - Detailed user profile
- **AuthToken** - Email verification & password reset tokens

### Phase 1 Models (Schema Only)

- ProfileMedia, Block, Interest
- CmsPage, ContactInquiry, Plan
- SuccessStory, Testimonial, BlogPost

### Phase 2+ Models (Planned)

- Message, Room, Report
- Subscription, Payment, Boost

---

## Project Structure: What Goes Where

### Add to `@vivah/shared`

- Enums & constants
- Zod validation schemas
- Env variable schemas
- Types/interfaces shared by API & Web

### Add to `@vivah/api`

- Express routes
- MongoDB models
- Business logic services
- API-specific middleware

### Add to `@vivah/web`

- Next.js pages
- React components
- API client functions
- Form handling

### Add to `packages/ui`

- Reusable React components
- Design system components
- Shared form fields

---

## Testing

### Run All Tests

```bash
pnpm test
```

### Run Specific Package Tests

```bash
pnpm --filter @vivah/api test
pnpm --filter @vivah/shared test
```

### Test File Location

- Backend: `apps/api/src/*.test.ts`
- Shared: `packages/shared/src/*.test.ts`

### Test Utilities

- **Vitest** - Test runner
- **Supertest** - HTTP assertions
- **mongodb-memory-server** - In-memory MongoDB

---

## Error Handling

### API Errors

```typescript
import { HttpError } from './auth/auth-errors';

throw new HttpError(400, 'Email is already registered');
throw new HttpError(401, 'Authentication required');
throw new HttpError(403, 'Admin access required');
throw new HttpError(404, 'Profile not found');
throw new HttpError(500, 'Internal server error');
```

### Validation Errors

```typescript
// Automatically caught and returned as:
{
  message: 'Validation failed',
  issues: [/* Zod validation issues */]
}
```

### Web Form Errors

```typescript
try {
  const result = await schema.parseAsync(data);
} catch (error) {
  // Handle ZodError - show field-specific errors
}
```

---

## Security Reminders

✅ DO:

- Use HTTPS in production
- Store JWT secrets as env variables (32+ chars)
- Hash passwords with bcryptjs (12 rounds)
- Validate all input with Zod
- Use `HttpError` for API errors
- Implement rate limiting
- Use Helmet middleware
- Configure CORS properly

❌ DON'T:

- Store plain text passwords
- Commit `.env` files
- Use `any` in TypeScript
- Skip validation
- Expose error details in production
- Use predictable tokens
- Store sensitive data in localStorage
- Allow unauthorized profile modifications

---

## Deployment Checklist

- [ ] Set production env variables
- [ ] Configure database backups
- [ ] Setup error logging/monitoring
- [ ] Configure email provider
- [ ] Setup hCaptcha for production
- [ ] Run full test suite
- [ ] Update build scripts
- [ ] Setup CI/CD pipeline
- [ ] Configure CDN/caching
- [ ] Setup monitoring/alerts
- [ ] Test backup/recovery process
- [ ] Document deployment process

---

## Common Issues & Solutions

### "Module not found: @vivah/shared"

- Run `pnpm --filter @vivah/shared build`
- Restart dev server

### MongoDB connection fails

- Check MONGODB_URI in .env
- Ensure MongoDB is running
- Verify network access/firewall

### Port already in use

- Change port in .env (default: 4000 for API, 3000 for web)
- Or kill process using port: `lsof -i :4000`

### TypeScript compilation errors

- Run `pnpm typecheck`
- Check tsconfig.json
- Ensure all types are imported

### CORS errors

- Update CORS_ORIGINS in API .env
- Restart API server
- Check browser console for exact error

---

## Getting Help

1. **Check Full Documentation:** [CODEBASE_DOCUMENTATION.md](CODEBASE_DOCUMENTATION.md)
2. **Review Project Progress:** [PROJECT_PROGRESS.md](PROJECT_PROGRESS.md)
3. **Check Test Files:** Examples of correct usage
4. **Search Git History:** Recent changes and patterns
5. **Review UI/UX Rules:** [vivah_australia_ui_ux_planning.md](vivah_australia_ui_ux_planning.md)

---

**Keep this guide close—it covers the most frequent operations!**
