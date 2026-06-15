# EkoFare

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue)
![Live](https://img.shields.io/badge/Live-eko--fare--web.vercel.app-brightgreen)

A crowdsourced Lagos public-transit fare reference app — know your fare before you board.

**Live:** https://eko-fare-web.vercel.app/

## Executive Summary (For Non-Technical Readers & Recruiters)

Lagos public transit has no fixed fare board. A Danfo bus, BRT, Keke Napep, or Okada ride between the same two stops can cost different amounts depending on the driver, the time of day, or traffic conditions. Commuters frequently overpay simply because they don't know the going rate.

**EkoFare** solves this by acting like a community fare ledger. Commuters look up a route before boarding to see what others recently paid, and after the trip they submit what they paid to keep the data fresh. Three community confirmations are required before a fare reaches "verified" status — building a self-correcting dataset that improves with every user.

The app is fully functional without a backend. All routes, search, and the contribution flow run in mock mode so anyone can experience the full product instantly — no sign-up, no database, no wait.

## Technical Overview (For Software Engineers)

EkoFare is a mobile-first Next.js 16 application built on a mock-mode-first data layer. The frontend maintains its own strict TypeScript contract decoupled from the backend schema, allowing the UI to ship and iterate independently of API readiness. A discriminated union type covers all five possible server responses to a contribution submission, enforced at the component layer.

```mermaid
graph LR
    User([User]) -->|browse / search| Web(Next.js 16 App)
    Web -->|NEXT_PUBLIC_USE_MOCKS=true| Mock[(Mock Fixtures)]
    Web -->|NEXT_PUBLIC_USE_MOCKS=false| API(Express API)
    API -->|Prisma ORM| DB[(PostgreSQL)]
    Web -->|Zustand + localStorage| Saved[Saved Routes]
    Web -->|TanStack Query| Cache[Client Cache]
```

### Technology Stack

**Frontend**
- Next.js 16 (App Router, Turbopack) · React 19 · TypeScript strict
- Tailwind CSS v4 (`@theme inline`, CSS-variable design tokens)
- Fonts: Plus Jakarta Sans (body/numbers) · Danfo (wordmark/headers only) — both via `next/font`
- TanStack Query v5 · Zustand v5 + persist · Axios · Framer Motion · lucide-react · sonner

**Backend**
- Express · TypeScript · Prisma ORM · PostgreSQL · Zod

**Testing**
- Vitest + React Testing Library (48 unit/integration tests)
- Playwright (5 E2E happy paths, mobile-chrome, mock mode)

---

## Recent Development: v3.2 Danfo Board

The entire frontend was overhauled to the locked v3.2 "Danfo Board" design system — a dark warm-black UI with danfo-yellow accents built around the visual language of Lagos transit.

1. **Design System (`src/styles/`)**: Full token set — `--ink` (#131109 warm black), `--yellow` (#FFCE3A), `--go` (#46E08C), `--stop` (#FF7A45) — mapped to Tailwind utilities via `@theme inline`. Danfo stripe gradient, skeleton shimmer, and a global `prefers-reduced-motion` reset.

2. **Single Frontend Contract (`src/types/index.ts`)**: The legacy `@ekofare/types` workspace package was dropped. The frontend owns its own type definitions matching the v3.2 spec exactly — uppercase `Vehicle` union, `RouteStatus` enum, discriminated contribution response union — so the UI is not blocked by backend schema evolution.

3. **Pure Logic Layer (`src/lib/`)**: All fare math, stop-selection state machine, route filtering/sorting, and contribution validation live as pure functions with colocated Vitest test files. Zero framework dependencies.

4. **All 8 Screens Shipped**: Home, All Routes, Route Detail (interactive stop timeline + fare calculator), Fare Ticket (boarding pass with share), Search (debounced + transfer sheet + recents), Saved, Contribute (full StopBuilder + all 5 POST response states), and Contribute Success.

---

## Architectural Trade-offs & Design Decisions

### 1. Mock-Mode-First Data Layer
- **Trade-off:** The entire data layer branches on a single `NEXT_PUBLIC_USE_MOCKS` flag. Mock and real API paths share identical TypeScript return types.
- **Why:** It decouples frontend shipping from backend readiness. The complete contribution flow — including duplicate detection, rate limiting, sub-route warnings, and success — is exercisable without a running server. Playwright E2E tests run entirely in mock mode with no database dependency.

### 2. Single Frontend Contract, Decoupled from Backend Schema
- **Trade-off:** `apps/web` maintains its own `src/types/index.ts` rather than consuming the shared `packages/types` workspace package.
- **Why:** The legacy shared package used lowercase vehicle types and a different `Route` shape than the v3.2 spec. Maintaining a dual contract created a permanent coupling that blocked UI iteration. The frontend contract was cut free; backend reconciliation is a deferred, separate concern.

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

### Full-Stack Setup (API + PostgreSQL)

1. Configure the API:
   ```bash
   cp apps/api/.env.example apps/api/.env
   ```
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/ekofare
   VERIFICATION_THRESHOLD=3
   PORT=3001
   ```

2. Initialise the database and start the API:
   ```bash
   pnpm --filter @ekofare/api db:push
   pnpm --filter @ekofare/api db:seed
   pnpm --filter @ekofare/api dev
   ```

3. Configure the frontend (`apps/web/.env.local`):
   ```env
   NEXT_PUBLIC_USE_MOCKS=false
   NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
   ```

4. Start the frontend:
   ```bash
   pnpm --filter web dev
   ```

### Running Tests

```bash
# Unit + integration (48 tests)
pnpm --filter web test

# E2E happy paths (5 tests, requires Chromium)
npx playwright install chromium
pnpm --filter web test:e2e

# Type-check
pnpm --filter web typecheck
```
