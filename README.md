# EkoFare

A Lagos public-transit fare reference application designed to provide commuters with accurate fare information prior to boarding. 

## Overview

EkoFare is a mobile-first, desktop-responsive web application addressing the common issue of inconsistent public-transit fares in Lagos. Fares frequently fluctuate based on vehicle type (Danfo, BRT, Keke, Okada, Ferry), route segment, time of day, and driver discretion. EkoFare mitigates this by crowdsourcing fare data, facilitating community verification, and establishing a canonical fare repository for origin-to-destination pairs.

### Core Features

- **Fare Lookup:** Search for routes by vehicle type, origin, or destination.
- **Multi-Leg Trip Planning:** Calculate cumulative fares across multiple stops.
- **Save Routes:** Access frequently used routes conveniently without requiring user account registration.
- **Contribute:** Submit recent fare payments to assist the community.
- **Community Verification:** Confirm or dispute pending fare contributions via a dedicated queue. Three confirmations are required to promote a route to the verified list.

## Prerequisites

| Tool       | Version  | Notes                                      |
|------------|----------|--------------------------------------------|
| Node.js    | >= 20    | Run `node -v` to verify version            |
| pnpm       | >= 9     | Run `npm i -g pnpm` if not installed       |
| PostgreSQL | >= 14    | Required only for full-stack deployment    |

## Getting Started

### Frontend Only (Mock Mode)

This mode operates without a database, backend, or environment variables. It is the most efficient way to explore EkoFare locally.

1. Clone the repository and install dependencies:
   ```bash
   git clone <repo-url> && cd ekofare
   pnpm install
   ```
2. Start the frontend development server:
   ```bash
   pnpm --filter web dev
   ```

Navigate to `http://localhost:3000`. In this mode, routes load from mock data, contributions persist in `localStorage`, and the complete submission-to-verification workflow functions end-to-end.

### Full-Stack Setup (API and PostgreSQL)

Deploy this configuration to utilize the Express API and PostgreSQL database backend.

1. Configure the API Environment:
   ```bash
   cp apps/api/.env.example apps/api/.env
   ```
   Update `apps/api/.env` with appropriate credentials:
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/ekofare
   VERIFICATION_THRESHOLD=3
   PORT=3001
   ```

2. Initialize the Database Schema and Seed Data:
   ```bash
   pnpm --filter @ekofare/api db:push
   pnpm --filter @ekofare/api db:seed
   ```

3. Start the Backend Server:
   ```bash
   pnpm --filter @ekofare/api dev
   ```
   The API will initialize at `http://localhost:3001`.

4. Configure the Frontend Environment:
   Create `apps/web/.env.local`:
   ```env
   NEXT_PUBLIC_USE_MOCK=false
   NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
   ```

5. Start the Frontend Server:
   ```bash
   pnpm --filter web dev
   ```
   The application will now route all requests through Axios to the Express API.

## Environment Variable Reference

| Variable | Target | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_USE_MOCK` | `apps/web` | `true` | Set to `"false"` to utilize the Express API. When `true`, the application uses in-memory mock data. |
| `NEXT_PUBLIC_API_BASE_URL` | `apps/web` | `http://localhost:3001` | Base URL for the Express API. Required when `NEXT_PUBLIC_USE_MOCK=false`. |
| `DATABASE_URL` | `apps/api` | N/A | PostgreSQL connection string. |
| `VERIFICATION_THRESHOLD` | `apps/api` | `3` | Number of community confirmations required to promote a pending contribution. |
| `PORT` | `apps/api` | `3001` | Port designation for the Express server. |

## Architecture and Structure

```text
ekofare/
├── apps/
│   ├── web/                    (Next.js 14 App Router, Tailwind v4)
│   │   └── src/
│   │       ├── app/            (UI Components and Pages)
│   │       ├── api/            (Axios configuration and Mock Data)
│   │       ├── stores/         (Zustand State Management)
│   │       ├── utils/          (Helper Functions)
│   │       └── styles/         (Theme Tokens and Configuration)
│   │
│   └── api/                    (Express, Prisma, PostgreSQL)
│       ├── src/
│       │   ├── index.ts        (Server Entry Point)
│       │   ├── routes/         (API Handlers)
│       │   ├── schemas/        (Zod Validation Schemas)
│       │   └── db/             (Prisma Client and Seeding)
│       └── prisma/
│           └── schema.prisma   (Database Schema)
│
└── packages/
    └── types/                  (Shared TypeScript Definitions)
```

## Application Interface

| View | Path | Description |
|---|---|---|
| Home | `/` | Main landing page featuring search, popular routes, and recent activity. |
| Route List | `/routes` | Comprehensive route directory with filtering capabilities. |
| Route Detail | `/routes/:id` | Interactive stop timeline and specific fare calculations. |
| Fare Summary | `/routes/:id/fare` | Detailed breakdown of trip costs and sharing options. |
| Saved Routes | `/saved` | Repository of user-saved routes. |
| Contribute | `/contribute` | Interface for submitting new route data. |
| Pending | `/contribute/pending` | Community verification queue. |

The interface is responsive, transitioning at the `1024px` breakpoint. Mobile devices render a bottom navigation bar, while desktop environments utilize a sidebar navigation system.

## Component Development Environment

A dedicated development route facilitates comprehensive component testing across all states and viewports.

- Access the environment at `http://localhost:3000/dev` or press `Shift + D`.
- Note: The `/dev` route includes a `noindex` directive and remains inaccessible to standard users.

## Mock Mode Configuration

When `NEXT_PUBLIC_USE_MOCK` is active:
- Route data originates from `apps/web/src/api/mock/routes.json`.
- Artificial latency (200-400ms) simulates network conditions.
- Pending contributions are retained in `localStorage` (`ekofare.pending`).

### Resetting Pending Contributions

To clear the verification queue locally:

Via Developer Console:
```javascript
localStorage.removeItem('ekofare.pending');
location.reload();
```

Or remove all EkoFare local data:
```javascript
Object.keys(localStorage)
  .filter(key => key.startsWith('ekofare.'))
  .forEach(key => localStorage.removeItem(key));
location.reload();
```

## Technology Stack

### Frontend Architecture
- Next.js 14 (App Router), TypeScript
- Tailwind CSS v4, CSS-variable design tokens
- Zustand (Client State), TanStack React Query (Server State)
- Axios, lucide-react, sonner
- Typography: Syne, DM Sans

### Backend Architecture
- Express, TypeScript
- Prisma ORM, PostgreSQL
- Zod Data Validation

## License

Private — Refer to project documentation for terms of use.
