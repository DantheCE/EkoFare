# EkoFare

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue)
![Live](https://img.shields.io/badge/Live-eko--fare--web.vercel.app-brightgreen)

A crowdsourced Lagos public-transit fare reference app — know your fare before you board.

**Live:** https://eko-fare-web.vercel.app/

## Executive Summary (For Non-Technical Readers & Recruiters)

Lagos public transit has no fixed fare board. A Danfo bus, BRT, Keke Napep, or Okada ride between the same two stops can cost different amounts depending on the driver, the time of day, or traffic conditions. Commuters frequently overpay simply because they don't know the going rate.

**EkoFare** solves this by acting like a community fare ledger. Commuters look up a route before boarding to see what others recently paid, and after the trip they submit what they paid to keep the data fresh. Each fare is the **median of what the community reports**, with outliers filtered out — a self-correcting dataset that improves with every submission.

The frontend is fully functional without a backend: all routes, search, and the contribution flow run in mock mode so anyone can experience the product instantly. Behind it sits a real **graph-model API** (Express + PostgreSQL + Redis) that computes routes on demand — including transfers no single person ever submitted whole.

## Technical Overview (For Software Engineers)

EkoFare is a mobile-first Next.js 16 application built on a mock-mode-first data layer. The frontend maintains its own strict TypeScript contract decoupled from the backend schema, allowing the UI to ship and iterate independently of API readiness. A discriminated union type covers all five possible server responses to a contribution submission, enforced at the component layer.

```mermaid
graph LR
    User([User]) -->|browse / search| Web(Next.js 16 App)
    Web -->|NEXT_PUBLIC_USE_MOCKS=true| Mock[(Mock Fixtures)]
    Web -->|NEXT_PUBLIC_USE_MOCKS=false| API(Express API)
    API -->|Prisma| DB[("PostgreSQL — stops · connections · reports")]
    API -->|ioredis| Redis[("Redis — route cache · rate limit · graph_version")]
    API -.->|in-memory Dijkstra| Computed{{Computed Routes}}
    Web -->|Zustand + localStorage| Saved[Saved Routes]
    Web -->|TanStack Query| ClientCache[Client Cache]
```

### Technology Stack

**Frontend**
- Next.js 16 (App Router, Turbopack) · React 19 · TypeScript strict
- Tailwind CSS v4 (`@theme inline`, CSS-variable design tokens)
- Fonts: Plus Jakarta Sans (body/numbers) · Danfo (wordmark/headers only) — both via `next/font`
- TanStack Query v5 · Zustand v5 + persist · Axios · Framer Motion · lucide-react · sonner

**Backend** (Option A pure-graph model — see below)
- Express · TypeScript strict · Prisma · PostgreSQL 15 (`pg_trgm`) · Redis 7 (ioredis)
- Zod validation · JWT admin auth · pino logging · in-memory Dijkstra pathfinding
- Stampede-protected Redis cache · `node-cron`-free hourly job · `express-rate-limit`

**Testing**
- Frontend: Vitest + React Testing Library (48 tests) · Playwright (5 E2E, mock mode)
- Backend: Vitest + Supertest (37 unit + 34 integration against real Postgres + Redis) · k6 load test

---

## Recent Development: v3.2 Danfo Board

The entire frontend was overhauled to the locked v3.2 "Danfo Board" design system — a dark warm-black UI with danfo-yellow accents built around the visual language of Lagos transit.

1. **Design System (`src/styles/`)**: Full token set — `--ink` (#131109 warm black), `--yellow` (#FFCE3A), `--go` (#46E08C), `--stop` (#FF7A45) — mapped to Tailwind utilities via `@theme inline`. Danfo stripe gradient, skeleton shimmer, and a global `prefers-reduced-motion` reset.

2. **Single Frontend Contract (`src/types/index.ts`)**: The legacy `@ekofare/types` workspace package was dropped. The frontend owns its own type definitions matching the v3.2 spec exactly — uppercase `Vehicle` union, `RouteStatus` enum, discriminated contribution response union — so the UI is not blocked by backend schema evolution.

3. **Pure Logic Layer (`src/lib/`)**: All fare math, stop-selection state machine, route filtering/sorting, and contribution validation live as pure functions with colocated Vitest test files. Zero framework dependencies.

4. **All 8 Screens Shipped**: Home, All Routes, Route Detail (interactive stop timeline + fare calculator), Fare Ticket (boarding pass with share), Search (debounced + transfer sheet + recents), Saved, Contribute (full StopBuilder + all 5 POST response states), and Contribute Success.

---

## Backend: Option A — Pure Graph Model

The API stores the transit **network as a graph, not as routes**. Three tables hold the truth: **stops** (nodes), **connections** (directed edges, one per vehicle, carrying a consensus fare), and **fare reports** (raw evidence). Every route a user sees is **computed on demand** — never stored.

- **Contribution shred:** a submitted path of N stops becomes N−1 directed edges, each filing one fare report. No approval queue.
- **Consensus:** a connection's fare is the **median of its non-outlier reports**; values beyond a sigma threshold are flagged once there's enough signal. Confidence (routable → verified → major) is derived from the clean report count.
- **Pathfinding:** routes are found with an **in-memory Dijkstra** over a cached graph snapshot — including transfers no single contributor submitted whole (e.g. Ikeja→TBS stitched from two separately-reported legs).
- **Caching:** computed routes serve through a **stampede-protected Redis cache** (in-process single-flight + probabilistic early refresh), invalidated by a shared `graph_version` counter so a new report silently expires stale routes across every instance.
- **Stop normalization:** `pg_trgm` trigram matching collapses "Oshodi", "Oshodi Bus Stop", and typos onto one canonical node.
- **Moderation:** Redis-backed rate limiting, anonymous abuse flags, and a JWT admin surface (stop-merge, fare correction, flag queue).

Delivered in six green checkpoints: foundation → shred + consensus → pathfinding + cache → featured board + search → security + admin → seed + load + deploy. The headline acceptance test computes a route between two stops that **no single contribution ever spanned**.

---

## Architectural Trade-offs & Design Decisions

### 1. Mock-Mode-First Data Layer
- **Trade-off:** The entire data layer branches on a single `NEXT_PUBLIC_USE_MOCKS` flag. Mock and real API paths share identical TypeScript return types.
- **Why:** It decouples frontend shipping from backend readiness. The complete contribution flow — including duplicate detection, rate limiting, sub-route warnings, and success — is exercisable without a running server. Playwright E2E tests run entirely in mock mode with no database dependency.

### 2. Single Frontend Contract, Decoupled from Backend Schema
- **Trade-off:** `apps/web` maintains its own `src/types/index.ts` rather than consuming the shared `packages/types` workspace package.
- **Why:** The legacy shared package used lowercase vehicle types and a different `Route` shape than the v3.2 spec. Maintaining a dual contract created a permanent coupling that blocked UI iteration. The frontend contract was cut free, and the backend was **later rebuilt to satisfy it exactly** (routers mount at root, `POST /contributions` returns a superset of the locked success shape) — so the two now match without the frontend ever having been blocked.

### 3. Pure Selection State Machine
- **Trade-off:** Stop selection (tap origin → tap destination → reverse → re-tap to reroute) is a pure function `nextSelection(state, index)` with no side effects.
- **Why:** The interaction has six distinct transition cases that are easy to get wrong under stateful component logic. A pure machine with a colocated test file makes every case explicit and regression-proof.

### 4. `useSyncExternalStore` for Hydration Guard
- **Trade-off:** The Saved screen uses `useSyncExternalStore` instead of `useEffect + setState` to detect client hydration.
- **Why:** Zustand's localStorage rehydration is asynchronous. A naive `useEffect` approach flashes the empty state before saved routes load and also triggers a `react-hooks/exhaustive-deps` lint error. `useSyncExternalStore` returns `false` on the server and `true` immediately on the client — no flash, no lint warning.

### 5. WSL / Windows Native Binary Parity
- **Trade-off:** `pnpm.supportedArchitectures` in the root `package.json` fetches both `win32` and `linux/x64/glibc` native binaries in a single `pnpm install`.
- **Why:** The repo is developed across both a Windows shell (MINGW64) and WSL, sharing one `node_modules` on `/mnt/c`. Tailwind v4's `lightningcss`, `@next/swc`, `esbuild`, and `sharp` all ship platform-specific binaries. Without this flag, switching shells breaks the build.

---

## Getting Started

### Frontend Only — Mock Mode (Recommended)

No database, no backend, no environment variables.

```bash
git clone https://github.com/DantheCE/EkoFare.git && cd EkoFare
pnpm install
pnpm --filter web dev
```

Open `http://localhost:3000`. All routes, search, and the full contribute flow run against in-memory mock data.

> **Corporate proxy / custom root CA:** prefix commands with `NODE_OPTIONS="--use-system-ca"` if you see `UNABLE_TO_VERIFY_LEAF_SIGNATURE` during install.

### Full-Stack Setup (API + PostgreSQL + Redis)

1. Start Postgres + Redis (or point at your own):
   ```bash
   pnpm --filter @ekofare/api infra:up    # docker-compose: Postgres 15 + Redis 7
   ```

2. Configure the API:
   ```bash
   cp apps/api/.env.example apps/api/.env
   ```
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/ekofare
   REDIS_URL=redis://localhost:6379        # optional — cache degrades to live compute if unset
   # JWT_SECRET=...                          # optional — enables the admin surface
   ```

3. Migrate, seed, and run:
   ```bash
   pnpm --filter @ekofare/api db:migrate
   pnpm --filter @ekofare/api db:seed       # idempotent Lagos network
   pnpm --filter @ekofare/api dev
   ```

4. Point the frontend at the API (`apps/web/.env.local`):
   ```env
   NEXT_PUBLIC_USE_MOCKS=false
   NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
   ```

5. Start the frontend:
   ```bash
   pnpm --filter web dev
   ```

### Deployment

Frontend on **Vercel**; API on **Render** (free tier) with managed **Neon** Postgres and **Upstash** Redis. [`render.yaml`](render.yaml) is a one-file blueprint, and [`apps/api/DEPLOY.md`](apps/api/DEPLOY.md) is the full runbook. The cutover is a single switch: set `NEXT_PUBLIC_USE_MOCKS=false` on Vercel.

### Running Tests

```bash
# Frontend: unit + integration (48 tests)
pnpm --filter web test
# Frontend: E2E happy paths (5 tests, requires Chromium)
npx playwright install chromium && pnpm --filter web test:e2e

# Backend: unit (37 tests)
pnpm --filter @ekofare/api test
# Backend: integration (34 tests, needs Postgres + Redis)
pnpm --filter @ekofare/api test:int

# Type-check (either package)
pnpm --filter web typecheck
pnpm --filter @ekofare/api typecheck
```
