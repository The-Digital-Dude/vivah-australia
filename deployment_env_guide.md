# Vivah Australia: Deployment & Environment Configuration Guide

This document outlines all the environment variables required to successfully deploy the Vivah Australia platform. Because the application utilizes multiple third-party services (for emails, SMS, payments, media, etc.), you will need to provision accounts and generate API keys for each of these integrations.

---

## 1. Core Infrastructure

These variables dictate how the application runs, where it listens, and how the frontend and backend communicate.

| Variable | Description | Example |
|---|---|---|
| `NODE_ENV` | Sets the application environment. Use `production` for live deployments. | `production` |
| `API_PORT` | The port the backend API runs on. | `4000` |
| `API_BASE_URL` | The public URL of your deployed backend. | `https://api.vivahaustralia.com.au` |
| `WEB_BASE_URL` | The public URL of your deployed frontend. | `https://vivahaustralia.com.au` |
| `CORS_ORIGINS` | Comma-separated list of allowed frontend origins to prevent CORS errors. | `https://vivahaustralia.com.au` |
| `NEXT_PUBLIC_API_BASE_URL` | (Frontend) Tells the Next.js app where to make API requests. | `https://api.vivahaustralia.com.au` |

---

## 2. Databases & Caching

| Variable | Description | Example | Where to get it |
|---|---|---|---|
| `MONGODB_URI` | Connection string for your MongoDB database. | `mongodb+srv://user:pass@cluster.mongodb.net/vivah` | MongoDB Atlas dashboard under "Connect" |
| `REDIS_URI` | Connection string for Redis (used for queueing emails & background jobs). | `redis://default:pass@redis-host:6379` | Redis Labs, Upstash, or AWS ElastiCache |

---

## 3. Authentication & Security

| Variable | Description | Example |
|---|---|---|
| `JWT_ACCESS_SECRET` | Secret key used to sign short-lived access tokens. **Must be a long random string.** | `generate_using_openssl_rand_hex_32` |
| `JWT_REFRESH_SECRET` | Secret key used to sign long-lived refresh tokens. **Must be a long random string.** | `generate_using_openssl_rand_hex_32` |
| `JWT_ACCESS_EXPIRES_IN` | Lifespan of the access token. | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Lifespan of the refresh token. | `30d` |
| `ADMIN_SEED_EMAIL` | Email for the initial super-admin account created on first run. | `admin@vivahaustralia.com.au` |
| `ADMIN_SEED_PASSWORD` | Password for the initial super-admin account (min 12 chars). | `SecurePassword123!` |

---

## 4. Bot Protection (hCaptcha)

Protects registration and contact forms from spam.

| Variable | Description | Where to get it |
|---|---|---|
| `NEXT_PUBLIC_HCAPTCHA_SITEKEY` | (Frontend) Public key for the hCaptcha widget. | [hCaptcha Dashboard](https://dashboard.hcaptcha.com) -> Sites |
| `HCAPTCHA_SECRET` | (Backend) Secret key to verify the user's captcha response. | [hCaptcha Dashboard](https://dashboard.hcaptcha.com) -> Settings |

---

## 5. Media & File Uploads (Cloudinary)

Handles user profile pictures, gallery photos, and verification document storage.

| Variable | Description | Where to get it |
|---|---|---|
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary account name. | Cloudinary Dashboard |
| `CLOUDINARY_API_KEY` | Public API Key. | Cloudinary Dashboard |
| `CLOUDINARY_API_SECRET` | Secret API Key. | Cloudinary Dashboard |
| `MEDIA_ACCESS_SECRET` | Internal secret for signing private media URLs (documents). | Generate a random 32-char string. |

---

## 6. Billing & Payments

### Stripe (Primary Gateway)
| Variable | Description | Where to get it |
|---|---|---|
| `STRIPE_SECRET_KEY` | Backend API key to process payments. | Stripe Dashboard -> Developers -> API Keys |
| `STRIPE_WEBHOOK_SECRET` | Secret to verify incoming Stripe webhook events. | Stripe Dashboard -> Webhooks (starts with `whsec_`) |
| `STRIPE_PRICE_PREFIX` | Prefix to identify Stripe Price IDs. | Usually `price_` |

### PayPal (Secondary Gateway)
| Variable | Description | Where to get it |
|---|---|---|
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | (Frontend) Public Client ID to render PayPal buttons. | PayPal Developer Dashboard -> Apps & Credentials |
| `PAYPAL_CLIENT_ID` | (Backend) Client ID. | PayPal Developer Dashboard |
| `PAYPAL_CLIENT_SECRET` | (Backend) Secret Key. | PayPal Developer Dashboard |

---

## 7. Notifications (Email, SMS, Push)

### Email
| Variable | Description | Where to get it |
|---|---|---|
| `EMAIL_PROVIDER` | `sendgrid`, `mailgun`, or `console` (for local dev). | N/A |
| `EMAIL_FROM` | The verified email address you send from. | e.g. `noreply@vivahaustralia.com.au` |
| `SENDGRID_API_KEY` | If using SendGrid. | SendGrid Dashboard -> API Keys |
| `MAILGUN_API_KEY` | If using Mailgun. | Mailgun Dashboard -> API Keys |
| `MAILGUN_DOMAIN` | If using Mailgun. | Mailgun Dashboard -> Domains |

### SMS (Twilio)
| Variable | Description | Where to get it |
|---|---|---|
| `SMS_PROVIDER` | `twilio` or `console` (for local dev). | N/A |
| `TWILIO_ACCOUNT_SID` | Twilio Account ID. | Twilio Console Dashboard |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token. | Twilio Console Dashboard |
| `TWILIO_FROM_NUMBER` | Your purchased Twilio phone number. | Twilio Phone Numbers |

### Web Push
| Variable | Description | Where to get it |
|---|---|---|
| `PUSH_PROVIDER` | `webpush` or `console`. | N/A |
| `WEB_PUSH_PUBLIC_KEY` | VAPID public key. | Generate using `npx web-push generate-vapid-keys` |
| `WEB_PUSH_PRIVATE_KEY` | VAPID private key. | Generate using `npx web-push generate-vapid-keys` |

---

## 8. Error Tracking (Optional)

| Variable | Description |
|---|---|
| `ERROR_TRACKING_PROVIDER` | `none` or `webhook`. |
| `ERROR_TRACKING_WEBHOOK_URL` | e.g., a Discord/Slack webhook URL to alert you of crashes. |

---

## Generating your `.env` File

Here is a ready-to-copy `.env` template. Fill this out on your production server.

```env
# -----------------------------
# 1. CORE
# -----------------------------
NODE_ENV=production
API_PORT=4000
API_BASE_URL=https://api.yourdomain.com.au
WEB_BASE_URL=https://yourdomain.com.au
CORS_ORIGINS=https://yourdomain.com.au
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com.au

# -----------------------------
# 2. DATABASES
# -----------------------------
MONGODB_URI=
REDIS_URI=

# -----------------------------
# 3. AUTHENTICATION
# -----------------------------
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
ADMIN_SEED_EMAIL=admin@vivahaustralia.com.au
ADMIN_SEED_PASSWORD=

# -----------------------------
# 4. CAPTCHA
# -----------------------------
NEXT_PUBLIC_HCAPTCHA_SITEKEY=
HCAPTCHA_SECRET=

# -----------------------------
# 5. MEDIA (CLOUDINARY)
# -----------------------------
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
MEDIA_ACCESS_SECRET=

# -----------------------------
# 6. PAYMENTS
# -----------------------------
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_PREFIX=price_

NEXT_PUBLIC_PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=

# -----------------------------
# 7. NOTIFICATIONS
# -----------------------------
EMAIL_PROVIDER=sendgrid
EMAIL_FROM=noreply@vivahaustralia.com.au
SENDGRID_API_KEY=

SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=

PUSH_PROVIDER=webpush
WEB_PUSH_PUBLIC_KEY=
WEB_PUSH_PRIVATE_KEY=
```

## Next Steps for Deployment

1. **Register Accounts:** Sign up for MongoDB Atlas, Upstash (Redis), Cloudinary, Stripe, PayPal, SendGrid/Mailgun, Twilio, and hCaptcha.
2. **Generate Keys:** Walk through the tables above and copy the required keys into your `.env` file.
3. **Set up Vercel / Render / AWS:** 
   - Add the `.env` variables to your hosting provider's dashboard.
   - For the **Frontend (Next.js)**, ensure variables starting with `NEXT_PUBLIC_` are exposed.
   - For the **Backend (Express)**, all variables are required.
4. **Deploy & Seed:** Once deployed, the system will automatically seed the `ADMIN_SEED_EMAIL` account on the first startup. Log in and configure the CMS from the admin dashboard!
