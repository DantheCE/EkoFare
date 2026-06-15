# EkoFare

A Lagos public-transit fare reference app — crowdsourced, community-verified, and designed for commuters who want to know the fare before they board.

## Overview

Lagos public-transit fares fluctuate by vehicle type (Danfo, BRT, Keke, Okada, Ferry, Rideshare), route segment, and driver discretion. EkoFare mitigates this by crowdsourcing fare data and requiring community verification before a route reaches "verified" status.

**v3.2 "Danfo Board"** — dark warm-black UI, danfo-yellow accents, mobile-first single-column layout, mock-mode-first data layer.

### Screens

| Path | Description |
|---|---|
| `/` | Home — greeting, search bar, filter chips, popular routes |
| `/routes` | All Routes — filterable and sortable route directory |
| `/routes/:id` | Route Detail — interactive stop timeline, fare calculator |
| `/routes/:id/fare` | Fare Ticket — boarding-pass breakdown with share/correct actions |
| `/search` | Search — debounced stops + routes, transfer sheet, recents |
| `/saved` | Saved Routes — persisted offline via Zustand + localStorage |
| `/contribute` | Contribute — stop builder, validation, all server response states |
| `/contribute/success` | Submission confirmation |

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | >= 20 | Node 24 recommended (`--use-system-ca` flag available) |
| pnpm | >= 9 | `npm i -g pnpm` |
| PostgreSQL | >= 14 | Full-stack only; not needed for mock mode |

> **Corporate proxy / custom root CA:** prefix all Node commands with `NODE_OPTIONS="--use-system-ca"` if you see `UNABLE_TO_VERIFY_LEAF_SIGNATURE` errors during `pnpm install` or `pnpm dev`.

## Getting Started

### Frontend Only (Mock Mode — recommended)

No database, no backend, no environment variables needed.

```bash
git clone <repo-url> && cd ekofare
pnpm install
pnpm --filter web dev
```

Open `http://localhost:3000`. Routes, search, and contribute all work against in-memory mock data. Contributions and saved routes persist in `localStorage`.

### Full-Stack Setup (API + PostgreSQL)

1. Configure the API:
   ```bash
   cp apps/api/.env.example apps/api/.env
   ```
   `apps/api/.env`:
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/ekofare
   VERIFICATION_THRESHOLD=3
   PORT=3001
   ```

2. Initialise the database:
   ```bash
   pnpm --filter @ekofare/api db:push
   pnpm --filter @ekofare/api db:seed
   ```

3. Start the API:
   ```bash
   pnpm --filter @ekofare/api dev
   ```

4. Configure the frontend (`apps/web/.env.local`):
   ```env
   NEXT_PUBLIC_USE_MOCKS=false
   NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
   ```

5. Start the frontend:
   ```bash
   pnpm --filter web dev
   ```

## Environment Variables

| Variable | App | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_USE_MOCKS` | `apps/web` | `true` | `"false"` to route requests to the Express API |
| `NEXT_PUBLIC_API_BASE_URL` | `apps/web` | `http://localhost:3001` | Express API base URL |
| `DATABASE_URL` | `apps/api` | — | PostgreSQL connection string |
| `VERIFICATION_THRESHOLD` | `apps/api` | `3` | Confirmations needed to promote a contribution |
| `PORT` | `apps/api` | `3001` | Express server port |

## Architecture

```text
ekofare/
├── apps/
│   ├── web/                        Next.js 16, React 19, Tailwind v4
│   │   └── src/
│   │       ├── app/                Pages + screen-level components
│   │       │   └── components/     Shared UI (RouteCard, BottomNav, Sheet, …)
│   │       ├── lib/                Pure logic + API layer
│   │       │   ├── fare.ts         Fare math (fareBetween, tripSlice, …)
│   │       │   ├── selection.ts    Stop-selection state machine
│   │       │   ├── routeView.ts    Filtering + sorting
│   │       │   ├── contributionValidation.ts
│   │       │   └── api/            Axios client, mock fixtures, route/contrib calls
│   │       ├── store/              Zustand (saved routes, UI recents)
│   │       ├── hooks/              useRouteQueries, useStopSelection, useHydrated
│   │       ├── types/              Single source of truth for all frontend types
│   │       └── styles/             Theme tokens (CSS vars) + Tailwind @theme
│   │
│   └── api/                        Express, Prisma, PostgreSQL
│       ├── src/
│       │   ├── index.ts            Server entry point
│       │   └── routes/             API handlers
│       └── prisma/
│           └── schema.prisma       Database schema
```

## Testing

```bash
# Unit + integration (Vitest + React Testing Library) — 48 tests
pnpm --filter web test

# E2E happy paths (Playwright, mobile-chrome, mock mode) — 5 tests
pnpm --filter web test:e2e

# Type-check
pnpm --filter web typecheck
```

E2E tests run against a production build on port 3100 with `NEXT_PUBLIC_USE_MOCKS=true`. Playwright browser: `npx playwright install chromium`.

## Tech Stack

**Frontend**
- Next.js 16 (App Router) · React 19 · TypeScript strict
- Tailwind CSS v4 (`@theme inline`, CSS-variable tokens)
- Fonts: Plus Jakarta Sans (body/numbers, `next/font`) · Danfo (wordmark/headers only)
- TanStack Query v5 · Zustand v5 + persist · Axios · Framer Motion · lucide-react · sonner

**Backend**
- Express · TypeScript · Prisma ORM · PostgreSQL · Zod

## Resetting Local State

Clear all EkoFare data from `localStorage` (saved routes, recents, fingerprint):

```javascript
Object.keys(localStorage)
  .filter(k => k.startsWith('ekofare.'))
  .forEach(k => localStorage.removeItem(k));
location.reload();
```

## License

Private — refer to project documentation for terms of use.
