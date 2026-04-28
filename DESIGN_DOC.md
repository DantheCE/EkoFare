# EkoFare — Engineering Design Document

> Version 1.0 · 2026-04-28  
> Status: Draft — for junior-dev orientation and tech-lead review

---

## Goal

Build a complete, production-ready frontend for **EkoFare**: a Lagos public-transit fare reference app. Users look up fares, plan multi-leg trips, save routes, and contribute/verify crowd-sourced data — all without signing in. The app runs fully in mock mode (no backend required) and optionally connects to an Express + PostgreSQL backend.

## Non-Goals

- Auth, accounts, or user profiles (device ID is enough for MVP).
- Turn-by-turn navigation or real-time tracking.
- Native iOS/Android apps (PWA is the ceiling for now).
- i18n (English only; copy is wrapped in a translation stub for later).
- Any server-side work beyond the API contract documented in `SPEC.md §7`.

---

## Architecture Overview

### Monorepo layout

```
apps/
  web/   ← Next.js 14 (App Router) + Tailwind v4
  api/   ← Express + Prisma + Postgres
packages/
  types/ ← Shared TS types (VehicleType, Route, Contribution, …)
```

`packages/types` is the single source of truth for wire and frontend types. Both `apps/` import from it; nothing is duplicated.

### Mobile / Desktop layout split

Every screen has **two separate layout files** — not one file with scattered media queries.

```
pages/Home.tsx              ← parent: chooses variant
pages/desktop/HomeDesktop.tsx
```

The parent renders:
```tsx
<>
  <div className="lg:hidden">  <HomeMobile />  </div>
  <div className="hidden lg:block"> <HomeDesktop /> </div>
</>
```

Both variants share the **same React Query hooks** — only layout JSX differs. The breakpoint is `1024px` (`lg:`).

Navigation surfaces are independent components:
- `BottomNav` — `lg:hidden` — mobile-only tab bar
- `DesktopSidebar` — `hidden lg:flex` — desktop-only left rail

They **never render simultaneously**.

### Mock mode

A single environment flag `NEXT_PUBLIC_USE_MOCK` (default `true`) controls whether Axios calls real endpoints or in-memory fixtures:

```
src/api/axios.ts
  ↳ if USE_MOCK → import mock adapter → load routes.json + localStorage pending queue
  ↳ else        → point at NEXT_PUBLIC_API_BASE_URL
```

The mock adapter adds 200–400ms latency so skeletons actually flash. Pending contributions in mock mode persist to `localStorage('ekofare.pending')`.

---

## Data Flow

```
Backend (Express/Postgres)   OR   Mock (routes.json + localStorage)
          │                                    │
          └──────────── Axios instance ─────────┘
                              │
                    transformRoute(BackendRoute)
                              │
                         Route (frontend type)
                              │
                    React Query cache
                    ['routes', vehicle]
                    ['routes', vehicle, q]
                    ['route', id]
                    ['contributions', 'pending']
                              │
               ┌──────────────┴──────────────┐
          Page-level hooks              Zustand stores
          useRoutes(), useRoute(id)     savedRoutesStore  → ekofare.saved
          useContributions()            deviceStore       → ekofare.device
               │
          Layout component (mobile or desktop)
               │
          Shared primitives (RouteCard, VehicleIcon, Skeleton…)
```

`transformRoute()` lives in `src/utils/helpers.ts`. It is the **only** place `BackendRoute → Route` conversion happens. Mock data and live data both pass through it.

---

## Component Hierarchy

```
App.tsx
└── Layout                          (DesktopSidebar + Toaster + lg:pl-64)
    ├── BottomNav                   (lg:hidden)
    └── <Page>                      (router outlet)
        ├── <div lg:hidden>
        │   └── <ScreenMobile />    (e.g. HomeMobile)
        └── <div hidden lg:block>
            └── <ScreenDesktop />   (e.g. HomeDesktop)

Shared primitives (src/app/components/)
├── RouteCard
│   └── VehicleIcon
├── Skeleton / RouteCardSkeleton / StopRowSkeleton / LoadingPill
├── StatusBadge / VerificationBadge
├── GradientHeader
└── InfoCard
```

---

## State Decisions

| What | Where | Why |
|---|---|---|
| Route list, route detail, contributions | React Query | Server data; needs staleness, refetch, caching |
| Saved route IDs | Zustand (localStorage) | Pure client preference, no server roundtrip |
| Device ID (verification gate) | Zustand (localStorage) | Stable across sessions; generated once (UUID v4) |
| Which stops are selected (origin/dest) | Local component state in RouteDetail | Ephemeral UI; no sharing needed |
| Filter pills, search query | Local component state | Page-local UI |
| Which contributions the device has acted on | Zustand (localStorage) | Cross-session, no auth |

---

## Open Questions / Risks

1. **Next.js vs Vite** — The SPEC says "Next.js 14 preferred; Vite is fine if already wired." The repo is currently empty; Next.js 14 is the target. If the team prefers Vite, the architecture is identical — only the file routing convention differs.
2. **Tailwind v4 CSS-variable token system** — v4's `@theme` directive works differently from v3 `extend`. Tokens must be declared in `:root` in `theme.css` and referenced as CSS variables (not Tailwind class names) for typography (see hard rule in SPEC §4.3).
3. **PWA manifest / service worker** — Listed in scope but not in the ticket backlog. Should be bundled with the README ticket (TICKET-019) or split into its own ticket if the team wants offline support beyond localStorage.
4. **Rate-limiting** — Backend write endpoints must be rate-limited at 10 req/min/ip (`SPEC §7`). Not a frontend concern, but the dev should know the API can 429 them in testing.

---

## Rollout Plan

Tickets ship in this order (mirrors `TICKETS.md`):

1. Token system + global styles + focus ring
2. Shimmer keyframes + Skeleton primitives + LoadingPill
3. Layout + BottomNav + DesktopSidebar shells
4. RouteCard + VehicleIcon + mock fixtures
5. Home mobile (default / loading / empty)
6. Home desktop (default / loading / empty)
7. Route List mobile — all states
8. Route List desktop — all states
9. Route Detail mobile — all states incl. loading pill
10. Route Detail desktop
11. Fare Summary mobile + desktop
12. Saved mobile + desktop incl. empty state
13. Contribute mobile — form, origin chip, live total, success
14. Contribute desktop
15. Pending Contributions — queue, verification logic, localStorage
16. Pending Contributions desktop
17. `/dev` index page
18. Accessibility pass
19. Mock-mode → real-API toggle + README

Each ticket ships visible progress. No ticket is pure setup without something on screen.
