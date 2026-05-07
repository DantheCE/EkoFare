<p align="center">
  <strong style="font-size:28px;">🚌 EkoFare</strong>
</p>

<p align="center">
  Know the fare before you board — a Lagos public-transit fare reference app.
</p>

---

## Overview

**EkoFare** is a mobile-first, desktop-responsive web application that helps Lagos commuters look up correct public-transit fares before boarding. Riders are routinely overcharged because fares vary by vehicle type (Danfo, BRT, Keke, Okada, Ferry), leg, time of day, and driver discretion. EkoFare crowdsources fare data, lets the community verify it, and surfaces the canonical fare for any origin → destination pair.

### Core Features

- **Fare Lookup** — Search routes by vehicle type, origin, or destination.
- **Multi-Leg Trip Planning** — Running cumulative fare across stops.
- **Save Routes** — One-tap access for frequently used routes (no account required).
- **Contribute** — Submit a fare you just paid so others benefit.
- **Community Verification** — Confirm or dispute pending contributions on a dedicated queue; 3 confirmations promotes a route to the live list.

---

## Prerequisites

| Tool       | Version  | Notes                                      |
|------------|----------|--------------------------------------------|
| **Node.js** | ≥ 20     | `node -v` to check                        |
| **pnpm**   | ≥ 9      | `npm i -g pnpm` if not installed           |
| **PostgreSQL** | ≥ 14 | Only required for full-stack mode          |

---

## Quick Start — Frontend Only (Mock Mode)

No database, no backend, no `.env` file required. This is the fastest way to explore EkoFare:

```bash
# 1. Clone the repo and install dependencies
git clone <repo-url> && cd ekofare
pnpm install

# 2. Start the frontend dev server
pnpm --filter web dev
```

Open **http://localhost:3000** — routes load from mock data, contributions persist in `localStorage`, and the entire submit → verify → promote flow works end-to-end without a backend.

---

## Full-Stack Setup (Real API + PostgreSQL)

Use this when you want the Express API and a real database behind the frontend.

### 1. Configure the API

```bash
# Copy the example env and fill in your Postgres credentials
cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env`:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/ekofare
VERIFICATION_THRESHOLD=3
PORT=3001
```

### 2. Push the schema & seed data

```bash
# Push the Prisma schema to Postgres
pnpm --filter @ekofare/api db:push

# Seed routes from the shared mock JSON
pnpm --filter @ekofare/api db:seed
```

### 3. Start the backend

```bash
pnpm --filter @ekofare/api dev
```

The API will be running at **http://localhost:3001**.

### 4. Configure the frontend for real mode

Create `apps/web/.env.local`:

```env
NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

### 5. Start the frontend

```bash
pnpm --filter web dev
```

The app now sends all requests through Axios to the Express API, round-tripping through PostgreSQL.

---

## Environment Variable Reference

| Variable | App | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_USE_MOCK` | `apps/web` | `true` | Set to `"false"` to hit the real Express API. When `true` (or absent), the app uses in-memory mock data with no backend required. |
| `NEXT_PUBLIC_API_BASE_URL` | `apps/web` | `http://localhost:3001` | Base URL of the Express API. Only used when `NEXT_PUBLIC_USE_MOCK=false`. |
| `DATABASE_URL` | `apps/api` | — | PostgreSQL connection string (required for the backend). |
| `VERIFICATION_THRESHOLD` | `apps/api` | `3` | Number of community confirmations required to promote a pending contribution to the verified routes list. |
| `PORT` | `apps/api` | `3001` | Port the Express server listens on. |

---

## Project Structure

```
ekofare/
├── apps/
│   ├── web/                    ← Next.js 14 (App Router) + Tailwind v4
│   │   └── src/
│   │       ├── app/
│   │       │   ├── components/ ← Shared UI: RouteCard, VehicleIcon, Skeleton…
│   │       │   └── pages/      ← Screen components (mobile + desktop/ variants)
│   │       ├── api/
│   │       │   ├── axios.ts    ← Single Axios instance with mock/real toggle
│   │       │   └── mock/
│   │       │       └── routes.json  ← 12 realistic Lagos routes
│   │       ├── stores/         ← Zustand: savedRoutes, device, verification
│   │       ├── utils/          ← transformRoute, helpers
│   │       └── styles/         ← Theme tokens, fonts, Tailwind config
│   │
│   └── api/                    ← Express + Prisma + PostgreSQL
│       ├── src/
│       │   ├── index.ts        ← Server entry point
│       │   ├── routes/         ← Route & Contribution handlers
│       │   ├── schemas/        ← Zod validation schemas
│       │   ├── db/             ← Prisma client
│       │   └── seed.ts         ← Seeds DB from mock/routes.json
│       └── prisma/
│           └── schema.prisma
│
└── packages/
    └── types/                  ← Shared TS types for both apps
        └── src/index.ts
```

---

## Screens

| Screen | Path | Description |
|---|---|---|
| Home | `/` | Hero, search, filter pills, popular routes, trending, recently viewed |
| Route List | `/routes` | Searchable/filterable route listing with vehicle filter sidebar (desktop) |
| Route Detail | `/routes/:id` | Interactive stop timeline, tap origin→destination to calculate fare |
| Fare Summary | `/routes/:id/fare` | Leg-by-leg fare breakdown, save/share/copy actions |
| Saved Routes | `/saved` | Persisted favourites with empty state |
| Contribute | `/contribute` | Submit a new route with dynamic stops and live total |
| Pending | `/contribute/pending` | Community verification queue — the **only** place verify/reject happens |

Every screen has separate **mobile** and **desktop** layout components. The breakpoint is `1024px` — below that, mobile renders with a bottom tab bar; at or above, desktop renders with a left sidebar.

---

## Component Dev Lab

A dedicated development index page lets you preview **every screen × every platform × every state** (default, loading, empty, error, success) without triggering real network conditions.

- Navigate to **http://localhost:3000/dev**
- Or press **`Shift + D`** from anywhere in the app

> The `/dev` page has a `noindex` meta tag and is not visible to end users.

---

## Mock Mode Details

When `NEXT_PUBLIC_USE_MOCK` is `true` (default):

- Routes load from `apps/web/src/api/mock/routes.json` — 12 realistic Lagos routes across all vehicle types.
- 200–400 ms artificial latency is added so skeleton shimmers are visible.
- Pending contributions persist to `localStorage` under the key `ekofare.pending`.
- The entire submit → verify → promote flow works without any backend.

### Resetting the Pending Queue

If you need to clear out pending contributions during development:

**Option 1 — Browser DevTools:**
```js
localStorage.removeItem('ekofare.pending');
location.reload();
```

**Option 2 — Clear all EkoFare data:**
```js
Object.keys(localStorage)
  .filter(k => k.startsWith('ekofare.'))
  .forEach(k => localStorage.removeItem(k));
location.reload();
```

---

## Tech Stack

### Frontend
- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS v4** with CSS-variable design token system
- **Zustand** for client state (saved routes, device ID, verification votes)
- **TanStack React Query** for server state (routes, contributions)
- **Axios** with mock/real toggle
- **lucide-react** icons + custom vehicle SVGs
- **sonner** toasts (dark-pill, top-center)
- **Syne** (display) + **DM Sans** (body) via Google Fonts

### Backend
- **Express + TypeScript**
- **Prisma ORM** + **PostgreSQL**
- **Zod** request validation
- REST JSON API with `{ data, error }` envelope

### Tooling
- **pnpm** workspaces
- Shared `packages/types` for wire + frontend types

---

## License

Private — see project documentation.
