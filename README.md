# ShortLink

A production-grade URL shortener with session-based authentication, real-time click analytics, and abuse-resistant infrastructure — built as a full-stack learning project and open-sourced for anyone who wants to study, fork, or contribute.

Long URLs go in, short trackable ones come out — with password protection, expiration, custom aliases, tags, and a full analytics dashboard behind them.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Security Notes](#security-notes)
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

### Link Management
- Shorten any valid URL, with optional custom aliases
- Base62 counter-based short code generation (collision-free, no uniqueness-check roundtrip needed)
- Password-protected links (bcrypt-hashed, verified via a dedicated resolve/verify flow)
- Link expiration with lazy deactivation on read
- Tags (up to 5 per link, normalized and deduplicated) for organizing links
- Soft deletes — deactivated links keep their analytics history intact
- Bulk select + bulk deactivate from the dashboard
- Search, status filter (active / expired / password-protected), tag filter, and sort (newest, oldest, most/least clicks)
- Downloadable QR code per link

### Redirect Engine
- Redis-first lookup on the hot path, falling back to MongoDB on cache miss
- Cache is repopulated on miss and matches the link's TTL if it has an expiry
- Fire-and-forget click tracking so redirects are never slowed down by analytics writes

### Analytics
- Per-link dashboard: clicks over time, top referrers, device breakdown, top countries
- Device/browser/OS parsing via `ua-parser-js`, approximate geolocation via `geoip-lite`
- Click events are queued in Redis and drained in batches by a background worker (not written to MongoDB one-by-one) to keep the hot path fast
- Raw click-event CSV export per link

### Reliability & Abuse Prevention
- Redis-backed rate limiting (`rate-limiter-flexible`) — separate limits for anonymous link creation, authenticated link creation, redirects, login attempts, and OTP resends
- `/health` endpoint reporting server, MongoDB, and Redis status
- A frontend latency indicator that polls `/health` every few seconds, showing live round-trip time and flagging backend downtime

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
      │  rate limits│                  └─────────────┘
      │  click queue│
      └──────┬──────┘
             │  drained every 5s
             ▼
      ┌─────────────┐
      │ Click Worker │  batches queued click events → MongoDB
      └─────────────┘
```

**Why Redis-first redirects?** Every visit to a short link hits the same lookup — this is the hottest path in the whole system. Checking Redis before MongoDB keeps redirects fast even under load, and click analytics are queued rather than written synchronously so a burst of traffic never blocks a redirect.

---

## Project Structure

```
url-shortener/
├── client/                      # Next.js frontend
│   └── src/
│       ├── app/                 # App Router pages
│       ├── components/          # Reusable UI components
│       ├── context/             # AuthContext (global session state)
│       └── lib/                 # Axios instance, shared utilities
│
└── server/                      # Express backend
    └── src/
        ├── config/              # DB, Redis, mailer connections
        ├── controllers/         # Route handlers
        ├── middleware/          # Auth guard, rate limiters
        ├── models/               # Mongoose schemas
        ├── routes/               # Express routers
        ├── utils/                # base62 encoding, OTP, validators
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

---

## Environment Variables

### `server/.env`

| Variable | Description |
|---|---|
| `PORT` | Port the Express server listens on |
| `MONGO_URI` | MongoDB connection string |
| `REDIS_URL` | Redis connection string |
| `SESSION_SECRET` | Long random string used to sign session cookies |
| `CLIENT_URL` | Your frontend's origin (for CORS) |
| `APP_URL` | The domain your short links resolve through (usually the frontend) |
| `NODE_ENV` | `development` or `production` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | Outbound email config for OTP delivery |

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
| POST | `/links` | Create a short link (works anonymously or authenticated) |
| GET | `/links/mine` | List the current user's links |
| GET | `/links/tags` | List all distinct tags the user has used |
| POST | `/links/bulk-delete` | Deactivate multiple links at once |
| DELETE | `/links/:id` | Deactivate a single link |

### Resolving Short Links

| Method | Route | Description |
|---|---|---|
| GET | `/resolve/:shortCode` | Resolve a short code to its destination (or flag that a password is required) |
| POST | `/resolve/:shortCode/verify` | Submit a password for a protected link |

### Analytics

| Method | Route | Description |
|---|---|---|
| GET | `/analytics/:id` | Aggregated stats: clicks over time, top referrers, device breakdown, top countries |
| GET | `/analytics/:id/events` | Raw click events (used for CSV export) |

### QR Codes

| Method | Route | Description |
|---|---|---|
| GET | `/qr/:id` | Generate a QR code (as a data URL) for a link |

### Health

| Method | Route | Description |
|---|---|---|
| GET | `/health` | Server, MongoDB, and Redis status |

---

## Security Notes

- Session cookies are `httpOnly`, and `secure` + `sameSite: 'none'` in production to support a split frontend/backend deployment over HTTPS.
- Passwords and OTPs are hashed (bcrypt and SHA-256 respectively) before being stored — never in plaintext.
- Password-protected links only cache their `hasPassword` flag in Redis, never the hash itself — password verification always checks against MongoDB directly.
- All rate limiters are Redis-backed, so limits hold correctly across restarts and multiple server instances.
- Bulk and single-link operations are always scoped to `req.session.userId` server-side — client-supplied IDs alone are never trusted.

---

## Roadmap

Ideas being considered for future contributions:

- [ ] API key authentication for programmatic link creation
- [ ] Custom domain support with DNS verification
- [ ] Webhooks for real-time click notifications
- [ ] Team/workspace support with shared link collections
- [ ] Real-time click feed via WebSockets/SSE

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
