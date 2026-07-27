# ShortLink

A production-grade URL shortener with session-based authentication, real-time click analytics, an admin control panel, and abuse-resistant infrastructure — built as a full-stack learning project and open-sourced for anyone who wants to study, fork, or contribute.

Long URLs go in, short trackable ones come out — with password protection, expiration, custom aliases, tags, downloadable QR codes, a standalone Quick QR generator, and a full analytics dashboard behind them. Anonymous visitors can shorten links too, with a lighter feature set that nudges toward creating an account.

---

## Table of Contents

- [ShortLink](#shortlink)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
    - [Authentication](#authentication)
    - [Link Management](#link-management)
    - [Redirect Engine](#redirect-engine)
    - [Analytics](#analytics)
    - [Admin Dashboard](#admin-dashboard)
    - [Trust \& Safety](#trust--safety)
    - [Reliability \& Abuse Prevention](#reliability--abuse-prevention)
    - [UI/UX](#uiux)
  - [Tech Stack](#tech-stack)
  - [Architecture](#architecture)
  - [Project Structure](#project-structure)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Backend Setup](#backend-setup)
    - [Frontend Setup](#frontend-setup)
    - [Creating your first admin account](#creating-your-first-admin-account)
  - [Environment Variables](#environment-variables)
    - [`server/.env`](#serverenv)
    - [`client/.env.local`](#clientenvlocal)
  - [API Reference](#api-reference)
    - [Auth](#auth)
    - [Links](#links)
    - [Resolving Short Links](#resolving-short-links)
    - [Analytics](#analytics-1)
    - [QR Codes](#qr-codes)
      - [Quick QR Generator](#quick-qr-generator)
    - [Reports](#reports)
    - [Admin](#admin)
    - [Health](#health)
  - [Security Notes](#security-notes)
  - [Legal \& Trust](#legal--trust)
  - [Roadmap](#roadmap)
  - [Contributing](#contributing)
  - [License](#license)

---

## Features

### Authentication
- Session-based auth (not JWT) — sessions stored in Redis via `express-session` + `connect-redis`
- Email verification via OTP (6-digit code, hashed at rest, 10-minute expiry)
- Enforced password strength (uppercase, lowercase, number, special character, 8+ chars)
- Rate-limited login and OTP resend to prevent brute-force / email-bombing abuse
- Generic (non-enumerable) responses on sensitive endpoints to avoid leaking account existence
- Role-based access via an `isAdmin` flag on the user model

### Link Management
- **Anonymous shortening** from the homepage — no account required. Anonymous links get random, non-sequential short codes and auto-expire after 14 days, encouraging sign-up for permanent links
- **Authenticated shortening** unlocks the full feature set: custom aliases, password protection, custom expiry, and tags
- Base62 counter-based short code generation for authenticated users (collision-free); cryptographically random codes for anonymous users (harder to enumerate, reads as disposable)
- Password-protected links (bcrypt-hashed, verified via a dedicated resolve/verify flow)
- Link expiration with lazy deactivation on read
- Tags (up to 5 per link, normalized and deduplicated) for organizing links
- Soft deletes — deactivated links keep their analytics history intact
- Bulk select + bulk deactivate from the dashboard, with a mobile-friendly sticky action bar
- Search, status filter (active / expired / password-protected), tag filter, and sort (newest, oldest, most/least clicks)
- Downloadable QR code for every shortened link
- Public QR generation for any URL without creating a shortened link
- Dedicated `QuickQrForm` component for instant QR generation from the homepage and dashboard

### Redirect Engine
- Redis-first lookup on the hot path, falling back to MongoDB on cache miss
- Cache is repopulated on miss and matches the link's TTL if it has an expiry
- Fire-and-forget click tracking so redirects are never slowed down by analytics writes
- Open-redirect protection — only `http`/`https` destination URLs are accepted

### Analytics
- Per-link dashboard: clicks over time, top referrers, device breakdown, top countries
- Device/browser/OS parsing via `ua-parser-js`, approximate geolocation via `geoip-lite`
- Click events are queued in Redis and drained in batches by a background worker (not written to MongoDB one-by-one) to keep the hot path fast
- Raw click-event CSV export per link

### Admin Dashboard
- Gated behind an `isAdmin` flag and a dedicated `requireAdmin` middleware, layered on top of session auth
- **Overview** — live counts of total users, total/active links, total clicks, and pending reports
- **Users** — searchable, paginated list; ban/reinstate any non-admin account (admins cannot be banned or ban other admins)
- **Links** — searchable, paginated list across all users; deactivate/reactivate any link
- **Reports** — review, action (deactivate the reported link), or dismiss abuse reports

### Trust & Safety
- Public abuse-report form, rate-limited to prevent spam reports
- Reports are validated against real links at submission time (rejects reports for codes/URLs that don't correspond to an existing link) and store a direct reference to the reported link
- Privacy Policy, Terms of Service, and Cookie Notice pages
- A minimal, dismissible cookie notice banner (session cookie is strictly essential — no tracking/advertising cookies are used)

### Reliability & Abuse Prevention
- Redis-backed rate limiting (`rate-limiter-flexible`) — separate limits for anonymous link creation, authenticated link creation, redirects, login attempts, OTP resends, QR generation, and abuse reports
- Custom request-body sanitization middleware to strip NoSQL injection operators (`$`, dotted keys) from incoming requests
- `/health` endpoint reporting server, MongoDB, and Redis status
- A frontend latency indicator, present on every page, that polls `/health` every few seconds — shows live round-trip time and flags backend downtime (also doubles as a partial keep-alive signal for free-tier hosts while a tab is open)

### UI/UX
- Dark, custom-themed interface (no default component-library look) with a consistent color and typography system across every page
- Fully responsive — dashboard, filters, bulk actions, and navbar all adapt to mobile with dedicated mobile patterns (sticky action bars, hamburger menu, stacked cards)
- Skeleton loading states instead of bare "Loading..." text

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), Tailwind CSS |
| Backend | Node.js, Express |
| Database | MongoDB (Mongoose) |
| Cache / Sessions / Queues | Redis |
| Auth | `express-session` + `connect-redis` (session-based, not JWT) |
| Charts | Recharts |
| Email | Nodemailer (SMTP) |
| Rate Limiting | `rate-limiter-flexible` |
| CSV Export | PapaParse |
| QR Codes | `qrcode` |

---

## Architecture

```
                    ┌─────────────────┐
                    │   Next.js App    │
                    │  (client, SSR)   │
                    └────────┬─────────┘
                             │  fetch (credentials: include)
                             ▼
                    ┌─────────────────┐
                    │   Express API    │
                    └───┬─────────┬───┘
                        │         │
             ┌──────────┘         └──────────┐
             ▼                                ▼
      ┌─────────────┐                  ┌─────────────┐
      │    Redis    │                  │   MongoDB   │
      │  sessions   │                  │   users     │
      │  short-URL  │◄── cache miss ───│   links     │
      │  cache      │    fallback      │ click events│
      │  rate limits│                  │  reports    │
      │  click queue│                  └─────────────┘
      └──────┬──────┘
             │  drained every 5s
             ▼
      ┌─────────────┐
      │ Click Worker │  batches queued click events → MongoDB
      └─────────────┘
```

**Why Redis-first redirects?** Every visit to a short link hits the same lookup — this is the hottest path in the whole system. Checking Redis before MongoDB keeps redirects fast even under load, and click analytics are queued rather than written synchronously so a burst of traffic never blocks a redirect.

**Anonymous vs. authenticated link creation** both flow through the same `POST /links` endpoint and the same Redis-first redirect path — the only difference is which fields the controller allows to be set and which short-code generation strategy is used, keeping the hot path identical regardless of who created the link.

---

## Project Structure

```
url-shortener/
├── client/                      # Next.js frontend
│   └── src/
│       ├── app/                 # App Router pages (incl. /admin, /report, /privacy, /terms, /cookies)
│       ├── components/          # Reusable UI components
│       ├── context/             # AuthContext (global session state)
│       └── lib/                 # Axios instance, shared utilities
│
└── server/                      # Express backend
    └── src/
        ├── config/              # DB, Redis, mailer connections
        ├── controllers/         # Route handlers (incl. admin, report controllers)
        ├── middleware/          # Auth guard, admin guard, rate limiters, sanitizer
        ├── models/               # Mongoose schemas (incl. Report)
        ├── routes/               # Express routers
        ├── utils/                # base62 + random code generation, OTP, validators
        └── workers/              # Background click-event processor
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Redis (local or hosted)
- An SMTP account for sending OTP emails (Gmail App Password works for development)

### Backend Setup

```bash
cd server
npm install
cp .env.example .env   # then fill in your own values
npm run dev
```

The API runs on `http://localhost:5000` by default. Confirm it's healthy:

```bash
curl http://localhost:5000/health
```

### Frontend Setup

```bash
cd client
npm install
cp .env.local.example .env.local   # then fill in your own values
npm run dev
```

The app runs on `http://localhost:3000` by default.

### Creating your first admin account

There is no self-service way to become an admin — this is deliberate. Sign up normally, then promote yourself directly in the database:

```bash
mongosh
use url-shortener
db.users.updateOne({ email: "your_email@example.com" }, { $set: { isAdmin: true } })
```

Log out and back in afterward so your session picks up the updated flag, then visit `/admin`.

---

## Environment Variables

### `server/.env`

| Variable | Description |
|---|---|
| `PORT` | Port the Express server listens on |
| `MONGO_URI` | MongoDB connection string |
| `REDIS_URL` | Redis connection string |
| `SESSION_SECRET` | Long random string used to sign session cookies |
| `CLIENT_URL` | Your frontend's origin (for CORS) / The domain your short links resolve through (usually the frontend) |
| `NODE_ENV` | `development` or `production` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | Outbound email config for OTP delivery |
| `SAFE_BROWSING_API_KEY` | (Optional) Google Safe Browsing key to flag malicious destination URLs |

### `client/.env.local`

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API (e.g. `http://localhost:5000/api/v1`) |
| `NEXT_PUBLIC_APP_URL` | The domain short links are displayed/generated with |

---

## API Reference

All routes are prefixed with `/api/v1` unless noted otherwise.

### Auth

| Method | Route | Description |
|---|---|---|
| POST | `/auth/signup` | Register and receive an OTP by email |
| POST | `/auth/verify-otp` | Verify email with the OTP code |
| POST | `/auth/resend-otp` | Request a new OTP (rate-limited) |
| POST | `/auth/login` | Log in (rate-limited) |
| POST | `/auth/logout` | Destroy the current session |
| GET | `/auth/me` | Get the current authenticated user |

### Links

| Method | Route | Description |
|---|---|---|
| POST | `/links` | Create a short link. Works anonymously (random code, 14-day expiry, no alias/password/tags) or authenticated (full feature set) |
| GET | `/links/mine` | List the current user's links |
| GET | `/links/tags` | List all distinct tags the user has used |
| POST | `/links/bulk-delete` | Deactivate multiple links at once |
| DELETE | `/links/:id` | Deactivate a single link |

### Resolving Short Links

| Method | Route | Description |
|---|---|---|
| GET | `/resolve/:shortCode` | Resolve a short code to its destination (or flag that a password is required, or that it's expired) |
| POST | `/resolve/:shortCode/verify` | Submit a password for a protected link |

### Analytics

| Method | Route | Description |
|---|---|---|
| GET | `/analytics/:id` | Aggregated stats: clicks over time, top referrers, device breakdown, top countries |
| GET | `/analytics/:id/events` | Raw click events (used for CSV export) |

### QR Codes

| Method | Route          | Description                                                                                    |
| ------ | -------------- | ---------------------------------------------------------------------------------------------- |
| GET    | `/qr/:id`      | Generate a QR code (data URL) for one of the authenticated user's shortened links              |
| POST   | `/qr/generate` | Generate a QR code for any valid URL without creating a database record (public, rate-limited) |

#### Quick QR Generator

The frontend includes a dedicated **QuickQrForm** component that allows visitors to generate a QR code for any valid URL instantly.

Unlike shortened links, Quick QR generation:

- does **not** create a database record
- does **not** require authentication
- returns the QR code immediately
- is protected by Redis-backed rate limiting to prevent abuse

Authenticated users can still generate QR codes for their own shortened links using the `/qr/:id` endpoint.

### Reports

| Method | Route | Description |
|---|---|---|
| POST | `/reports` | Submit an abuse report for a link (public, rate-limited) |

### Admin

All routes below require an authenticated session **and** `isAdmin: true`.

| Method | Route | Description |
|---|---|---|
| GET | `/admin/stats` | Overview counts (users, links, clicks, pending reports) |
| GET | `/admin/users` | Paginated, searchable user list |
| POST | `/admin/users/:id/toggle-ban` | Ban or reinstate a non-admin user |
| GET | `/admin/links` | Paginated, searchable list of all links |
| POST | `/admin/links/:id/toggle-active` | Deactivate or reactivate any link |
| GET | `/admin/reports` | List reports, filterable by status |
| POST | `/admin/reports/:id/action` | Deactivate the reported link and mark the report actioned |
| POST | `/admin/reports/:id/dismiss` | Mark a report reviewed without taking action |

### Health

| Method | Route | Description |
|---|---|---|
| GET | `/health` | Server, MongoDB, and Redis status |

---

## Security Notes

- Session cookies are `httpOnly`, and `secure` + `sameSite: 'none'` in production to support a split frontend/backend deployment over HTTPS. `trust proxy` is enabled in production so this works correctly behind a reverse-proxy host (Railway, Render, etc.).
- Passwords and OTPs are hashed (bcrypt and SHA-256 respectively) before being stored — never in plaintext.
- Password-protected links only cache their `hasPassword` flag in Redis, never the hash itself — password verification always checks against MongoDB directly.
- All rate limiters are Redis-backed, so limits hold correctly across restarts and multiple server instances.
- Bulk and single-link operations are always scoped to `req.session.userId` server-side — client-supplied IDs alone are never trusted.
- A custom sanitization middleware strips `$`-prefixed keys and dotted keys from request bodies/params to prevent NoSQL injection.
- Only `http`/`https` destination URLs are accepted, closing off `javascript:`/`data:` URI open-redirect vectors.
- Admin routes require both a valid session **and** an `isAdmin` flag, checked via two independently composable middleware functions rather than one combined check.
- Admin accounts cannot be banned, including by other admins, to prevent accidental or malicious lockouts.

**Known limitation:** banning a user blocks future logins but does not invalidate an already-active session for that user. Immediate mid-session revocation would require indexing sessions by user ID in Redis — noted here for anyone extending this project.

---

## Legal & Trust

Since this is a public-facing tool that collects account information and click/geo data, it ships with:

- `/privacy` — what's collected and why
- `/terms` — acceptable use and service terms
- `/cookies` — plain-language cookie disclosure (one essential session cookie only, no tracking/ads)
- `/report` — public abuse-reporting form, feeding directly into the admin Reports queue

These are intentionally simple markdown-style pages, appropriate for a portfolio-scale public launch rather than a fully lawyered compliance program.

---

## Roadmap

Ideas being considered for future contributions:

- [ ] API key authentication for programmatic link creation
- [ ] Custom domain support with DNS verification
- [ ] Webhooks for real-time click notifications
- [ ] Team/workspace support with shared link collections
- [ ] Real-time click feed via WebSockets/SSE
- [ ] Session revocation on ban (invalidate active sessions immediately, not just future logins)

---

## Contributing

Contributions are welcome. Please open an issue to discuss significant changes before submitting a pull request.

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Push and open a pull request

---

## License

MIT License — free to use, modify, and distribute.
