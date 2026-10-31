# Contributing

Thanks for helping improve ShortLink. For larger product or architecture changes, open an issue first so the scope and trade-offs can be discussed.

## Local setup

Use Node.js 20.19 or newer and npm. Start the local MongoDB and Redis services from the repository root with Docker Compose:

```sh
docker compose up -d mongo redis
```

Copy `server/.env.example` to `server/.env` and `client/.env.example` to `client/.env.local`, then follow the setup steps in the README. The Compose services bind only to localhost and use persistent named volumes; they are for local development, not production.

## Branches and changes

- Branch from the current default branch using a descriptive name, such as `fix/report-validation` or `feat/custom-domains`.
- Keep changes focused and avoid committing `.env`, credentials, customer data, generated build output, or local database dumps.
- Update `TODO.md` and the README when a change materially alters the roadmap, setup, API, or security behavior.
- Include tests for behavior changes and state any manual verification that remains.

## Validation

Run the checks relevant to your change before opening a pull request:

```sh
cd server && npm test
cd ../client && npm run lint && npm run build
```

The client build needs the public API and app URL values from `client/.env.example` (or equivalent environment variables).

## Pull requests

Use a concise title, explain the user or operational impact, list notable implementation decisions, and include test results. For visual changes, attach before/after screenshots at desktop and mobile widths. Call out migrations, new environment variables, and deployment steps explicitly.

## Security reports

Do not publish exploit details, credentials, or sensitive user data in public issues. Contact the repository maintainers privately through the security contact configured for the repository. If no private channel is configured, open a minimal issue asking for a secure reporting channel without including exploit details.
