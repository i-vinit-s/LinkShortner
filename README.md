# ShortLink

A production-grade URL shortener with session-based authentication, real-time click analytics, an admin control panel, customizable bio pages, Razorpay-powered subscriptions, and abuse-resistant infrastructure — built as a full-stack learning project and open-sourced for anyone who wants to study, fork, or contribute.

Long URLs go in, short trackable ones come out — with password protection, expiration, custom aliases, tags, downloadable QR codes with full scan analytics, customizable bio/link-in-bio pages, and a Free/Pro subscription model behind them. Anonymous visitors can shorten links too, with a lighter feature set that nudges toward creating an account.

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
  - [Creating your first admin account](#creating-your-first-admin-account)
  - [Razorpay setup](#razorpay-setup)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Security Notes](#security-notes)
- [Legal & Trust](#legal--trust)
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
- Downloadable QR code per link, generated on demand (not stored as an image — regenerated from the link data, keeping the database lean)
- A standalone QR generator, separate from the link-shortening flow:
  - Anonymous use: encodes the raw destination URL directly (no scan tracking, no database record)
  - Authenticated use: transparently creates a real tracked short link behind the QR, so scans show up in that link's analytics like any other click — tagged with `source: 'qr'` so it's distinguishable from links created via the normal "Shorten URL" flow

### Bio Pages
- Linktree-style public profile pages — avatar, display name, bio, and an ordered list of link buttons (Discord, Instagram, GitHub, X/Twitter, YouTube, LinkedIn, or a generic website link)
- Multiple bio pages per account, each with its own unique slug, independently publishable/unpublishable
- Live slug availability checking while typing
- Full visual customization: built-in color presets (Signal, Ocean, Sunset, Forest, Mono) or fully custom colors per element (background, surface, accent, text), plus a button-style choice (rounded, pill, square)
- Live side-by-side preview while editing, matching exactly what visitors will see
- Public pages are server-rendered with per-page dynamic metadata (title, description, Open Graph/Twitter card image) generated from the page's own content — so sharing a bio page link produces a real rich preview on Discord/Twitter/WhatsApp instead of the site's generic title
- Simple page-level view counter, incremented server-side on each public load
- Free plan: 1 bio page. Pro plan: unlimited bio pages (enforced server-side, not just hidden in the UI)
- "Made with ShortLink" footer branding shown on Free-tier pages, automatically omitted on Pro-tier pages

### Billing & Subscriptions
- Razorpay Subscriptions integration for a recurring Free → Pro upgrade path
- Webhook-driven state sync (`subscription.activated`, `subscription.charged`, `subscription.cancelled`, `subscription.completed`, `subscription.pending`, `subscription.halted`, `payment.failed`) — the webhook is treated as the single source of truth for plan state, not the browser checkout callback, since a browser tab closing after a successful payment shouldn't leave a user's account out of sync
- Cancel-at-period-end semantics: cancelling does **not** immediately revoke Pro access — the account keeps Pro features until the current billing period actually ends, then lazily downgrades to Free the next time anything checks the user's plan (mirroring the same lazy-expiry pattern used for expired links)
- A "resume" action to undo a pending cancellation before the period ends
- Every captured and failed payment is logged to a dedicated `Transaction` collection (amount, currency, status, originating webhook event), independent of the user's current live subscription snapshot — this is what powers the admin transaction history and revenue figures
- Estimated monthly revenue on the admin billing overview is derived from the most recent actual captured transaction amount, not a hardcoded price — it stays correct even if the underlying plan price changes later
- Feature gating (bio page limit, branding) reads from the user's synced plan, checked lazily on the relevant action rather than via a background job

### Redirect Engine
- Redis-first lookup on the hot path, falling back to MongoDB on cache miss
- Cache is repopulated on miss and matches the link's TTL if it has an expiry
- Fire-and-forget click tracking so redirects are never slowed down by analytics writes
- Open-redirect protection — only `http`/`https` destination URLs are accepted anywhere a URL is submitted (link creation, QR generation, bio page links)

### Analytics
- Per-link dashboard: clicks over time, top referrers, device breakdown, top countries
- Device/browser/OS parsing via `ua-parser-js`, approximate geolocation via `geoip-lite`
- Click events are queued in Redis and drained in batches by a background worker (not written to MongoDB one-by-one) to keep the hot path fast
- Raw click-event CSV export per link

### Admin Dashboard
- Gated behind an `isAdmin` flag and a dedicated `requireAdmin` middleware, layered on top of session auth (no self-service way to become an admin — promotion happens directly in the database)
- **Overview** — live counts of total users, total/active links, total clicks, and pending reports
- **Users** — searchable, paginated list; ban/reinstate any non-admin account (admins cannot be banned or ban other admins)
- **Links** — searchable, paginated list across all users; deactivate/reactivate any link
- **Reports** — review, action (deactivate the reported link), or dismiss abuse reports
- **Bio Pages** — searchable, paginated list of every user's bio pages; publish/unpublish or permanently delete any page
- **Billing** — overview cards (active Pro subscribers, cancelling-soon count, total and estimated monthly revenue), a searchable subscriber list with live plan/status badges (Active, Cancelling, Past due, Free), and a full transaction log

### Trust & Safety
- Public abuse-report form, rate-limited to prevent spam reports
- Reports are validated against real links at submission time (rejects reports for codes/URLs that don't correspond to an existing link) and store a direct reference to the reported link
- Privacy Policy, Terms of Service, and Cookie Notice pages
- A minimal, dismissible cookie notice banner (session cookie is strictly essential — no tracking/advertising cookies are used)

### Reliability & Abuse Prevention
- Redis-backed rate limiting (`rate-limiter-flexible`) — separate limits for anonymous link creation, authenticated link creation, redirects, login attempts, OTP resends, QR generation, public bio page views, and abuse reports
- Custom request-body sanitization middleware to strip NoSQL injection operators (`$`, dotted keys) from incoming requests
- `/health` endpoint reporting server, MongoDB, and Redis status
- A frontend latency indicator, present on every page, that polls `/health` every few seconds — shows live round-trip time and flags backend downtime
- An optional internal keep-alive ping (every 10 minutes, production-only) that hits the server's own `/health` endpoint to help avoid free-tier host spin-down; documented as a partial measure only — an external scheduled monitor (e.g. UptimeRobot, cron-job.org) is the more reliable way to prevent and detect downtime, since a self-ping can't wake up or report on a process that's already stopped

### UI/UX
- Dark, custom-themed interface (no default component-library look) with a consistent color and typography system across every page
- Fully responsive — dashboard, filters, bulk actions, and navbar all adapt to mobile with dedicated mobile patterns (sticky action bars, hamburger menu, stacked cards)
- Skeleton loading states instead of bare "Loading..." text
- A visual bio page builder with live preview and theme picker, matching the rest of the app's design system

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
| Payments | Razorpay (Subscriptions API + Webhooks) |

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
                    │   Express API    │◄──── Razorpay Webhooks (signature-verified)
                    └───┬─────────┬───┘
                        │         │
             ┌──────────┘         └──────────┐
             ▼                                ▼
      ┌─────────────┐                  ┌──────────────┐
      │    Redis    │                  │   MongoDB    │
      │  sessions   │                  │   users      │
      │  short-URL  │◄── cache miss ───│   links      │
      │  cache      │    fallback      │  click events│
      │  rate limits│                  │  reports     │
      │  click queue│                  │  bio pages   │
      └──────┬──────┘                  │  transactions│
             │  drained every 5s       └──────────────┘
             ▼
      ┌─────────────┐
      │ Click Worker │  batches queued click events → MongoDB
      └─────────────┘
```

**Why Redis-first redirects?** Every visit to a short link hits the same lookup — this is the hottest path in the whole system. Checking Redis before MongoDB keeps redirects fast even under load, and click analytics are queued rather than written synchronously so a burst of traffic never blocks a redirect.

**Anonymous vs. authenticated link creation** both flow through the same `POST /links` endpoint and the same Redis-first redirect path — the only difference is which fields the controller allows to be set and which short-code generation strategy is used, keeping the hot path identical regardless of who created the link.

**Why webhooks, not the checkout callback, drive billing state:** a payment can succeed on Razorpay's side even if the user's browser tab closes before the frontend confirms it. Webhooks are Razorpay's servers calling yours directly, so subscription state stays correct regardless of what happens in the browser.

---

## Project Structure

```
url-shortener/
├── client/                      # Next.js frontend
│   └── src/
│       ├── app/                 # App Router pages: /admin, /report, /privacy, /terms, /cookies,
│       │                        #   /pricing, /u/[slug] (public bio pages), /dashboard/bio/*
│       ├── components/          # Reusable UI components (incl. BioBuilder, BioThemePicker, BillingStatus)
│       ├── context/             # AuthContext (global session state)
│       └── lib/                 # Axios instance, bio theme presets, shared utilities
│
└── server/                      # Express backend
    └── src/
        ├── config/              # DB, Redis, mailer, Razorpay connections
        ├── controllers/         # Route handlers (auth, link, redirect, analytics, qr, bio, billing, admin, report)
        ├── middleware/          # Auth guard, admin guard, rate limiters, sanitizer
        ├── models/               # Mongoose schemas: User, Link, ClickEvent, Report, BioPage, Transaction
        ├── routes/               # Express routers
        ├── utils/                # base62 + random code generation, OTP, validators, plan-sync, keep-alive
        └── workers/              # Background click-event processor
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Redis (local or hosted)
- An SMTP account for sending OTP emails (Gmail App Password works for development)
- A Razorpay account (Test Mode is sufficient for local development)

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

### Razorpay setup

1. Sign up at [razorpay.com](https://razorpay.com) and grab your **Test Mode** Key ID and Key Secret from Settings → API Keys.
2. Under Subscriptions → Plans, create a plan (e.g. monthly, any price) to get a `plan_id`.
3. Under Webhooks, register a webhook pointing at `https://your-api-domain/api/v1/billing/webhook`. For local development, expose your local server with a tunneling tool (e.g. `ngrok http 5000`) and use that temporary URL.
4. Copy the Key ID, Key Secret, Plan ID, and the webhook secret Razorpay generates into your `server/.env` (see below).

Razorpay's published test card numbers can be used to simulate successful/failed payments without moving real money.

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
| `APP_URL` | The domain your short links resolve through (usually the frontend); also used as the self-ping target for the keep-alive utility |
| `NODE_ENV` | `development` or `production` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | Outbound email config for OTP delivery |
| `SAFE_BROWSING_API_KEY` | (Optional) Google Safe Browsing key to flag malicious destination URLs |
| `RAZORPAY_KEY_ID` | Razorpay API Key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay API Key Secret |
| `RAZORPAY_PLAN_ID` | Razorpay Subscription Plan ID |
| `RAZORPAY_WEBHOOK_SECRET` | Secret used to verify incoming Razorpay webhook signatures |

### `client/.env.local`

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API (e.g. `http://localhost:5000/api/v1`) |
| `NEXT_PUBLIC_APP_URL` | The domain short links and bio pages are displayed/generated with |

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

| Method | Route | Description |
|---|---|---|
| GET | `/qr/:id` | Generate a QR code (data URL) for one of the authenticated user's existing shortened links |
| POST | `/qr/generate` | Generate a QR code for any URL, rate-limited. Anonymous: raw URL encoded directly, no record created. Authenticated: creates a real tracked short link (`source: 'qr'`) and encodes that instead, so scans appear in analytics |

### Bio Pages

| Method | Route | Description |
|---|---|---|
| GET | `/bio/mine` | List the authenticated user's bio pages |
| GET | `/bio/mine/:id` | Fetch one of the authenticated user's bio pages by ID |
| GET | `/bio/check-slug` | Check whether a slug is available (optionally excluding the page currently being edited) |
| POST | `/bio` | Create (`pageId` omitted) or update (`pageId` provided) a bio page |
| DELETE | `/bio/:id` | Delete a bio page |
| GET | `/bio/public/:slug` | Fetch a published bio page's public data (rate-limited, increments the view counter) |

### Billing & Subscriptions

| Method | Route | Description |
|---|---|---|
| POST | `/billing/create-subscription` | Create a Razorpay subscription for the authenticated user and return checkout details |
| GET | `/billing/status` | Get the current plan, subscription status, current period end, and pending-cancellation flag |
| POST | `/billing/cancel` | Schedule cancellation at the end of the current billing period (Pro access continues until then) |
| POST | `/billing/resume` | Clear a pending cancellation, so the subscription continues renewing |
| POST | `/billing/webhook` | Razorpay webhook endpoint (signature-verified, not session-authenticated) |

### Reports

| Method | Route | Description |
|---|---|---|
| POST | `/reports` | Submit an abuse report for a link (public, rate-limited, validated against a real existing link) |

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
| GET | `/admin/bio-pages` | Paginated, searchable list of all bio pages across all users |
| POST | `/admin/bio-pages/:id/toggle-publish` | Publish or unpublish any bio page |
| DELETE | `/admin/bio-pages/:id` | Permanently delete any bio page |
| GET | `/admin/billing/overview` | Active Pro count, cancelling-soon count, total revenue, and estimated monthly revenue |
| GET | `/admin/billing/users` | Paginated list of users with plan/subscription details |
| GET | `/admin/billing/transactions` | Paginated log of all captured/failed payments |

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
- Only `http`/`https` destination URLs are accepted anywhere a URL is submitted, closing off `javascript:`/`data:` URI open-redirect vectors.
- Admin routes require both a valid session **and** an `isAdmin` flag, checked via two independently composable middleware functions rather than one combined check.
- Admin accounts cannot be banned, including by other admins, to prevent accidental or malicious lockouts.
- Bio page theme colors are validated as strict 6-digit hex values server-side before being stored, since they're later rendered directly as inline CSS on public pages.
- Razorpay webhook requests are verified using an HMAC signature check against the raw request body before any event is processed; requests with an invalid signature are rejected outright.
- Billing mutations (`create-subscription`, `cancel`, `resume`) require an authenticated session; only the webhook endpoint is exempt, and it authenticates via signature instead.
- Payment card details are never handled or stored by this application — Razorpay's hosted checkout handles all card data directly.

**Known limitations:**
- Banning a user blocks future logins but does not invalidate an already-active session for that user. Immediate mid-session revocation would require indexing sessions by user ID in Redis.
- "Resuming" a cancelled subscription clears the app's own tracking flag rather than reversing the cancellation with Razorpay directly, since not all cancellation schedules can be undone via the API — the underlying subscription was never told to stop billing in the first place (only scheduled to at cycle end), so this is safe, but it's a simplification worth knowing about.
- The internal keep-alive ping only prevents sleep while the process is already running; it cannot wake a sleeping instance or alert anyone if the process crashes. An external uptime monitor is the more robust solution for production use.

---

## Legal & Trust

Since this is a public-facing tool that collects account information, click/geo data, and payment-linked subscription data, it ships with:

- `/privacy` — what's collected and why
- `/terms` — acceptable use and service terms
- `/cookies` — plain-language cookie disclosure (one essential session cookie only, no tracking/ads)
- `/report` — public abuse-reporting form, feeding directly into the admin Reports queue

These are intentionally simple markdown-style pages, appropriate for a portfolio-scale public launch rather than a fully lawyered compliance program. Real payment processing requires switching Razorpay from Test to Live mode, which in turn requires business KYC verification through Razorpay directly — outside the scope of this codebase.

---

## Roadmap

Ideas being considered for future contributions:

- [ ] API key authentication for programmatic link creation
- [ ] Custom domain support with DNS verification
- [ ] Webhooks for real-time click notifications (distinct from the Razorpay billing webhooks already in place)
- [ ] Team/workspace support with shared link collections
- [ ] Real-time click feed via WebSockets/SSE
- [ ] Session revocation on ban (invalidate active sessions immediately, not just future logins)
- [ ] Drag-and-drop reordering for bio page links (currently up/down buttons)
- [ ] Per-link click tracking within bio pages (currently page-level view count only)

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
