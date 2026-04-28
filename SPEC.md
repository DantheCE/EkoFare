# EkoFare — Design & Technical Specification

A comprehensive build document for an AI agent (or engineering team) to rebuild EkoFare from scratch. This is the source of truth: the visible design, the token system, the data contracts, the screens, and the acceptance criteria. Build exactly what is described. Do not invent behavior not in this doc.

---

## 1. Product Overview

**EkoFare** is a mobile-first, desktop-responsive web app that helps Lagos commuters know the correct public-transit fare *before* boarding. Riders are routinely overcharged because fares vary by vehicle type (Danfo, BRT, Keke, Okada, Ferry), leg, time of day, and driver discretion. EkoFare crowdsources fare data, lets the community verify it, and surfaces the canonical fare for any origin → destination pair.

### Core user jobs
1. **Check a fare fast.** "I'm at CMS going to Lekki Phase 1 — how much should the danfo cost?"
2. **Plan a multi-leg trip.** Running cumulative fare across stops (CMS → Obalende → Lekki Phase 1).
3. **Save** frequently-used routes for one-tap access.
4. **Contribute** a fare you just paid, so others benefit.
5. **Verify** community submissions on a dedicated pending-contributions page — verification never happens on live route cards.

### Non-goals
- Turn-by-turn navigation. EkoFare is fare reference, not routing.
- Payments, ticketing, or driver-side tools.
- Real-time vehicle tracking.

---

## 2. Tech Stack

### Frontend
- **Next.js 14** (App Router) + **TypeScript** (the reference implementation uses Vite + React Router; Next.js is preferred for production)
- **Tailwind CSS v4** with CSS-variable token system (see §4)
- **Zustand** for client state (saved routes, filter UI)
- **TanStack React Query** for server state (routes, contributions)
- **Axios** for HTTP with a single configured instance
- **lucide-react** for standard icons; custom colored SVGs for vehicle icons
- **sonner** for toasts (dark-pill style, top-center)
- Google Fonts: **Syne** (display/headings, weights 700/800), **DM Sans** (body, 400/500/600)
- `NEXT_PUBLIC_USE_MOCK=true|false` toggles mock mode

### Backend
- **Node.js + Express + TypeScript**
- **PostgreSQL** (Prisma ORM)
- Routes stored with legs/stops as **JSONB**
- **Zod** for all request validation
- REST, JSON, `{ data, error }` envelope
- CORS open to frontend origin

### Tooling
- **pnpm** workspaces: `apps/web`, `apps/api`, `packages/types`
- Husky + lint-staged, ESLint, Prettier
- Vitest (frontend), Jest (backend)

---

## 3. Information Architecture & Routing

| Path | Screen | Primary nav | Auth |
|---|---|---|---|
| `/` | Home | yes | none |
| `/routes` | Route List | yes | none |
| `/routes/:id` | Route Detail | derived | none |
| `/routes/:id/fare` | Fare Summary | derived | none |
| `/saved` | Saved Routes | yes | none |
| `/contribute` | Contribute (add route) | yes | none |
| `/contribute/pending` | Pending Contributions (verify) | sub-nav | none |

**Navigation surfaces**
- **Mobile (<1024px)**: fixed bottom tab bar with four items: Routes (`/`), Search (`/routes`), Saved (`/saved`), Contribute (`/contribute`). 56–64px tall, white background, top border `--grey-100`, subtle shadow. Active item: `--green-800` icon + label, 2.5 stroke, weight 600. Inactive: `--grey-500`, 2 stroke, weight 500. Hidden on `lg:`.
- **Desktop (≥1024px)**: fixed left sidebar, 256px wide, white, right border `--grey-100`. Contains logo (bus icon in green-800 10px-radius tile + "EkoFare" in Syne 700/22), nav items (same four tabs, rendered as rounded-10px pills — active state: `--green-100` bg, `--green-800` text, weight 600), and a **"Help fellow commuters"** cream card at the bottom with a terra-700 "Contribute" button. Sidebar hidden below `lg:`.

The mobile and desktop layouts are **genuinely separate components per screen** (not the same layout stretched). Each page file is responsible for selecting the right variant via `lg:hidden` / `hidden lg:block`.

---

## 4. Design System

### 4.1 Color tokens (exact hex)

```css
/* Brand */
--green-900: #0A3D27;   --green-800: #0D5C3A;   --green-600: #1A7A50;
--green-400: #2DA574;   --green-200: #C8E8D8;   --green-100: #E1F0E8;

--terra-900: #7A3410;   --terra-700: #B85E1E;   --terra-500: #D4722A;
--terra-300: #E89B5F;   --terra-100: #FAEADA;

/* Neutral */
--grey-900:  #1C1A18;   --grey-700:  #4A3F35;   --grey-500:  #6B5E50;
--grey-300:  #A89E90;   --grey-100:  #EAE4DA;

--cream:     #F5F0E8;   --white:     #FFFFFF;   --off-white: #F9F6F1;

/* Vehicle */
--danfo-yellow: #F4B41A;   --danfo-yellow-dark: #D69A0F;
--brt-blue:     #1E88E5;   --brt-blue-dark:     #1565C0;
--keke-red:     #E53935;   --keke-red-dark:     #C62828;
--okada-orange: #FB8C00;
--ferry-teal:   #00897B;
```

All combinations of text-on-background used in the app must pass WCAG AA. Notably: `--grey-700` on `--cream`, `--white` on `--green-800`, `--terra-700` on `--white`, `--green-800` on `--green-100`.

### 4.2 Semantic roles

| Role | Token |
|---|---|
| Page background | `--cream` |
| Card surface | `--white` with 1px `--grey-100` border |
| Primary action / active nav / brand | `--green-800` |
| Accent / links / CTAs ("See all", "Share trip") | `--terra-700` |
| Body text | `--grey-900` |
| Secondary text | `--grey-700` / `--grey-500` |
| Dividers / subtle borders | `--grey-100` |
| Selected pill track (stop in range) | `--green-200` bg, `--green-600` border |
| Origin marker | `--green-800` fill, `--green-800` border |
| Destination marker | `--terra-700` fill, `--terra-700` border |

### 4.3 Typography

- **Display (hero, route names, big numerals)**: Syne 700–800. Sizes: mobile 40px hero / 28px page title / 24px card; desktop 56px hero / 44px page title.
- **Section labels**: Syne 700, 13–14px, UPPERCASE, letter-spacing 0.5px.
- **Body**: DM Sans. 16px default, 14px secondary, 12px meta/captions. Line-height 1.4–1.5.
- **Money**: Syne 800. Fare totals render as `₦12,300` with `toLocaleString()`.

**Hard rule**: do not use Tailwind font-size / font-weight / leading utilities (`text-xl`, `font-bold`, `leading-tight`). Set those via inline `style={{ fontFamily, fontSize, fontWeight, lineHeight }}`. This is how the Syne/DM Sans system stays consistent — Tailwind defaults override base CSS otherwise.

### 4.4 Shape, spacing, elevation

- **Radius**: inputs & buttons `10px`, cards `14px`, promo/feature cards `16px`, pills `20px`, circles `9999px`.
- **Spacing**: 4px grid. Standard gaps 12/16/24/32.
- **Shadow**: cards use `0 2px 8px rgba(0,0,0,0.06)` on white; bottom nav uses `0 -2px 8px rgba(0,0,0,0.06)`; desktop panels use `0 2px 10px rgba(0,0,0,0.08)`.
- **Focus ring** (all interactive elements): `outline: 2px solid var(--green-800); outline-offset: 2px;` — applied globally via `*:focus-visible`.

### 4.5 Motion

- Transitions: 150ms ease for color/background, 200ms ease for transforms.
- **Skeleton shimmer**: a left-to-right gradient sweep, 1.4s ease-in-out infinite. Implementation:

```css
.skeleton-shimmer {
  position: relative;
  overflow: hidden;
  background-color: var(--grey-100);
}
.skeleton-shimmer::after {
  content: "";
  position: absolute; inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255,255,255,0.65) 50%,
    transparent 100%
  );
  animation: ekofare-shimmer 1.4s ease-in-out infinite;
}
.skeleton-shimmer-dark { background-color: rgba(255,255,255,0.15); }
.skeleton-shimmer-dark::after {
  background: linear-gradient(90deg,
    transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%);
}
@keyframes ekofare-shimmer { 100% { transform: translateX(100%); } }
```

Dark variant is used over the green header on Route Detail. A **loading pill** ("Loading route data…") sits centered over shimmering content — white rounded-full, 4px 16px padding, subtle shadow, small green spinner on the left.

### 4.6 Vehicle icons

Each vehicle has a dedicated colored SVG (bus silhouette for Danfo/BRT, three-wheeler for Keke, bike for Okada, boat for Ferry, sedan for Uber/Bolt). Rendered via a single `<VehicleIcon vehicle={type} size={n} />` component. Fill color comes from the vehicle token table. 40×40 is the standard card size; 32×32 inside form selectors.

---

## 5. Data Model

### 5.1 Shared types (publish from `packages/types`)

```ts
export type VehicleType =
  | 'danfo' | 'brt' | 'keke' | 'okada' | 'ferry' | 'uber';

// Backend wire format (authoritative)
export interface BackendStop {
  name: string;
  legFare: number;         // naira from previous stop; 0 for origin
}

export interface BackendRoute {
  id: number;
  name: string;            // "CMS → Lekki Phase 1"
  vehicle: VehicleType;
  type: string;            // semantic category e.g. "island-loop"
  duration: number;        // minutes
  icon: string;            // reference to vehicle icon id
  color: string;           // hex, denormalized accent
  confirmations: number;
  isVerified: boolean;
  stops: BackendStop[];
}

export interface ContributionPayload {
  route_name: string;      // "From → To"
  vehicle: VehicleType;
  stops_data: { name: string; fare_from_previous: number }[];
  notes?: string;
}

export interface VerificationResponse {
  success: boolean;
  confirmations: number;
  isVerified: boolean;
}
```

### 5.2 Frontend transformation

The frontend works in a slightly denormalized shape for ease of rendering. **A single `transformRoute()` util** converts backend → frontend; both mock and live data go through it.

```ts
export interface Stop {
  id: string;
  name: string;
  leg_fare: number;        // renamed from legFare
  cumulative_fare: number; // computed from ordered legs
  order: number;
}

export interface Route {
  id: string;
  name: string;
  from: string;
  to: string;
  vehicle: VehicleType;
  duration_min: number;
  stops: Stop[];
  last_updated: string;    // ISO
  contributor_count: number;
  confirmations: number;
  isVerified: boolean;
}
```

`cumulative_fare[i] = sum(stops[0..i].leg_fare)`. Origin stop always has `leg_fare = 0` and `cumulative_fare = 0`.

### 5.3 Contributions & verification

```ts
export interface Contribution {
  id: string;
  routeId?: string;        // omit for brand-new route proposals
  route_name: string;
  vehicle: VehicleType;
  stops_data: { name: string; fare_from_previous: number }[];
  notes?: string;
  status: 'pending' | 'verified' | 'rejected';
  confirmations: number;
  created_at: string;
  submitted_by?: string;   // anonymized id (device id) if unauthenticated
}
```

**Verification threshold: 3 confirmations** flip `status` to `verified` and promote the contribution into the public `/routes` list. Rejections require 3 rejections (mirrored). A single device cannot both confirm and reject the same contribution.

---

## 6. Screens

Each screen has a mobile variant and a desktop variant. Both are described. Mockups are the source of truth for layout — this doc captures behavior and edge cases.

### 6.1 Home (`/`)

**Mobile**
- Page bg: `--cream`. Max width 390px centered, 16px horizontal padding, 32px top padding.
- Greeting line (`getGreetingWithName()` → "Good morning, friend" by time of day).
- **Hero**: "Where are you **headed today?**" — 40px Syne 700. The phrase "headed today?" renders in `--green-800`.
- **Search input**: dark `--grey-900` bg, 10px radius, white text, grey-400 placeholder, round **Mic** button on the right in `--terra-700`.
- **Filter pills** (horizontal scroll, hide scrollbar): All / Danfo / BRT / Keke. Active pill: `--green-800` bg, white text. Inactive: white bg, `--grey-100` border, `--grey-700` text. Weight 600.
- **Popular Routes**: section label, "See all →" link (terra-700). 3–4 `RouteCard`s stacked.
- **Trending now**: green-gradient card (`linear-gradient(160deg, var(--green-800), var(--green-900))`), white text. Small "Trending now" pill (rgba white 15%) with `TrendingUp` icon. Title in Syne 700/20px. Body in DM Sans/13px/opacity 0.85.
- **Recently viewed**: white card, 16px radius, `--grey-100` border. Section label. 3 list items: 36px `--green-100` tile with bus icon, route name (14/600), `Clock` icon + "45 min" (12/grey-500), `ChevronRight` trailing.
- Bottom nav.

**Desktop**
- 3-column grid, `max-w-[1100px]` centered, 40px horizontal padding, 40px top padding.
- **Left (2 cols)**: greeting → 56px hero → wider dark search (with leading `Search` icon + trailing mic button) → filter pills → **2-column** route card grid (Popular Routes).
- **Right (1 col)**, starting at `pt-14`: Trending card → Recently viewed card (same content as mobile, slightly tighter).

**Loading state**
- Popular Routes section swaps to `RouteCardSkeleton` (44×44 shimmer tile + two shimmer bars + trailing pill), 3 rows mobile / 4 in 2-col desktop grid.
- Recently viewed shows 3 shimmer rows (round tile + two bars).

### 6.2 Route List (`/routes`)

**Mobile**
- Page title "Find Your Route" (Syne 800/24px).
- Search input: white, rounded-10px, leading `Search` icon, trailing `X` clear when populated.
- Filter pills (same set as Home).
- Results: vertical `RouteCard` stack.
- Empty state: 🔍 glyph (grey-300), "No routes found", "Try a different search or filter".
- Bottom nav.

**Desktop**
- Eyebrow "Browse" + title "Find Your Route" (Syne 800/44px). Right side: "{n} routes" meta.
- Grid: `[1fr 260px]` — main content left, **sticky vehicle filter card** right (white panel, "Vehicle" label, vertical list of filter buttons; active uses `--green-100` bg + `--green-800` text).
- Main content: full-width white search input (rounded-12) → **2-column `RouteCard` grid**.
- Empty state rendered inside a bordered white panel.

### 6.3 Route Detail (`/routes/:id`)

- **Green header** (`--green-800` bg, white text): back button, "Reverse" chip (rgba white 20%, uppercase, `ArrowUpDown` icon). Route name (Syne 700/24). Three meta pills: vehicle name (capitalized), "~N min", "N stops".
- **Instruction line** below header: "Tap your **start stop**, then tap your **end stop** to calculate fare." (grey-500).
- **Stop timeline**: for each stop, a left 12px circle + connector line, plus a right-aligned cumulative fare. Tapping a stop toggles origin → destination. Taps before origin reset origin.
  - Origin: green-800 fill, "FROM" pill (green-100/green-800).
  - Destination: terra-700 fill, "TO" pill (terra-100/terra-700).
  - In-range stops: green-200 fill, green-600 border, connector turns green-600.
- **Fare dock** (fixed bottom on mobile; in-flow on desktop when two stops selected): "Your fare" label, `₦{fare}` in Syne 800/36, origin → destination caption, full-width terra-700 "Share trip" button.
- **Reverse**: flips the stop order, triggers an info toast "Fares may differ in reverse direction" (sonner).

**Loading state (must match the provided mockup exactly)**
1. Green header with dark-shimmer title bar + 3 dark-shimmer tag pills.
2. A wide shimmer block under the header (title placeholder).
3. **Centered "Loading route data…" white pill** with green spinner, overlapping the content.
4. Timeline of 5–6 `StopRowSkeleton`s (grey-300 ring + grey-100 connector + variable-width shimmer bar).
5. Fare dock placeholder at the bottom with shimmer label + shimmer CTA.

### 6.4 Fare Summary (`/routes/:id/fare`)

- Receives `?origin=i&dest=j&reversed=1`.
- Large total (Syne 800/48), origin → destination caption.
- Leg-by-leg table: leg number, vehicle pill, "From → To", `+₦{leg_fare}`. Striped with `--off-white`.
- Actions: **Save** (heart toggle, terra-700 when saved), **Share trip** (green-800 primary), **Copy link** (ghost).

### 6.5 Saved (`/saved`)

- Page title "Saved Routes" (Syne 700).
- Populated: vertical list of `RouteCard`s with heart active state.
- **Empty state** (match provided mockup): dashed circle in `--green-200` with heart glyph; "No saved routes yet"; copy "Tap ♡ on any route to save it here for quick access — handy for your daily commute."; primary **"Browse routes"** button (green-800) → `/routes`; "or search for a stop above" muted link.

### 6.6 Contribute (`/contribute`)

**Form**
- Dark grey-900 header "Add a route" (Syne 700/24, white).
- **From** and **To** side-by-side inputs.
- **Vehicle**: 12×12 square tile showing current `VehicleIcon` + select (Danfo / BRT / Keke Napep / Okada / Ferry / Uber–Bolt).
- **Stops & fares**: dynamic list.
  - **First row (origin)**: stop-name input + a read-only "ORIGIN" green-100 chip in place of the fare input (the origin has no fare — there is nothing before it). This is a hard rule — the fare input must not render for index 0.
  - **Later rows**: stop-name input + `₦` fare input (`type="number"`, `inputMode="numeric"`, `min=0`, placeholder "0") + trailing `X` remove button.
  - "Add next stop" ghost button (bordered, plus icon).
- **Notes** textarea (optional).
- **Running total card** (dark, above submit): small "Estimated total" eyebrow + "{n} stops" meta on the left, `₦{sum}` in Syne 800/28 on the right. Updates live as fares are typed. This card is non-negotiable — the user must see their total tally as they input data.
- Informational green-100 notice: "All submissions are reviewed before going live. Conflicting prices are flagged for community voting."
- Primary submit button (green-800), disabled while mutation pending, label "Submitting…" during flight.

**Submission behavior**
- POST `/api/contributions` with `ContributionPayload`.
- On success, the route is **NOT** added to the public `/routes` list. It lands in the pending queue with `status: 'pending'`, `confirmations: 0`.
- Show a success screen (white, centered): green check in `--green-100` circle, "Thank you!", copy "Your submission is under review. Conflicting prices are flagged for community voting.", buttons **"Add another route"** (green-800) and **"View pending routes"** (ghost, links to `/contribute/pending`).

### 6.7 Pending Contributions (`/contribute/pending`)

This is the **only** place verification happens. Live route cards never show verify/reject controls.

- Page title "Pending routes" + sub-label "{n} awaiting community review".
- List of pending cards, newest first. Each card:
  - Vehicle icon tile.
  - Route name (Syne 700/18).
  - Meta: "{n} stops · ~₦{estimatedTotal} · submitted {relative time}".
  - Optional notes blockquote.
  - **Confirmations bar**: `{confirmations}/3` filled dots or progress segment in `--green-600`.
  - Actions: **Confirm** (green-800 primary, compact) and **Dispute** (ghost, grey-700). Each device can only act once per contribution; after acting, both buttons disable and the card shows a "You confirmed this" / "You disputed this" status chip.
  - Tapping the card body opens a lightweight expandable view with the full leg-by-leg breakdown (same timeline style as Route Detail, read-only).
- Empty state: "Nothing to review" + "Check back later, or add a route yourself." CTA → `/contribute`.
- Threshold behavior: on 3rd confirmation, animate the card out and toast "Promoted to verified routes". On 3rd dispute, animate out with "Submission rejected".

---

## 7. API Contract

All responses envelope as `{ data, error }`. `error` is `null` on success; on failure, `data` is `null` and `error` is `{ code: string, message: string, fields?: Record<string, string> }`.

```
GET    /api/routes?vehicle=danfo|brt|keke|all&q=<search>
  200  { data: BackendRoute[] }

GET    /api/routes/:id
  200  { data: BackendRoute }
  404  { error: { code: "NOT_FOUND", message: "Route not found" } }

POST   /api/contributions               (body: ContributionPayload)
  201  { data: Contribution }
  400  { error: { code: "INVALID", fields: { ... } } }

GET    /api/contributions?status=pending
  200  { data: Contribution[] }

POST   /api/contributions/:id/confirm
  200  { data: VerificationResponse }

POST   /api/contributions/:id/dispute
  200  { data: VerificationResponse }
```

Zod schemas must validate every body. Rate-limit write endpoints (10 req/min/ip). Verification threshold is configurable via `VERIFICATION_THRESHOLD` env var, default `3`.

---

## 8. Mock Mode

- When `NEXT_PUBLIC_USE_MOCK=true` (the **default** in development), the Axios client short-circuits to in-memory data from `src/api/mock/routes.json` with a 200–400ms artificial latency so skeletons actually show.
- Pending contributions in mock mode persist to **localStorage** (`ekofare.pending`) so refreshes preserve the queue.
- Mock seed covers ~12 realistic Lagos routes across all vehicle types, including multi-leg routes (e.g. CMS → Obalende → Lekki Phase 1).
- With mock on, the backend does not need to be running — the entire app including submit and verify flows works end-to-end.

---

## 9. Accessibility (WCAG AA minimum)

- All interactive elements have `aria-label`s where the visible label is insufficient (icon-only buttons, mic, clear-search, remove-stop).
- Filter pills expose `aria-pressed`.
- Toggle nav items expose `aria-current="page"` when active.
- Live regions: "Estimated total" card uses `aria-live="polite"`; "Loading route data…" pill uses `role="status" aria-live="polite"`.
- Tab order follows visual order. Focus rings must be visible on every control (2px `--green-800`).
- Color contrast ≥ 4.5:1 for body text, ≥ 3:1 for large text.
- Touch targets ≥ 44×44 on mobile.
- Reduced motion: wrap the shimmer animation in `@media (prefers-reduced-motion: reduce)` and fall back to a static `--grey-100` fill.

---

## 10. Component Inventory

Frontend components under `src/app/components/`:

| Component | Purpose |
|---|---|
| `Layout` | Root shell: renders `DesktopSidebar` and a `sonner` `Toaster`; applies `lg:pl-64` so pages flow beside the sidebar on desktop. |
| `BottomNav` | Mobile bottom tab bar; `lg:hidden`. |
| `DesktopSidebar` | Desktop-only left nav; `hidden lg:flex`. |
| `RouteCard` | Card used across Home, RouteList, Saved. Shows vehicle icon, name, vehicle · stops · duration meta, total fare, and a heart toggle (Zustand-backed). |
| `VehicleIcon` | Single entry point for vehicle SVGs. Props: `vehicle`, `size`. |
| `VerificationBadge` | Small green or terra pill used inside the pending page (not on route cards). |
| `StatusBadge` | Generic pill for vehicle names, durations, stop counts. |
| `GradientHeader` | Reusable green-to-green-900 feature header (Trending card is a variant). |
| `InfoCard` | White 16-radius bordered card used for Recently viewed and similar sections. |
| `Skeleton` | Primitives: `Skeleton`, `LoadingPill`, `RouteCardSkeleton`, `StopRowSkeleton`. |

Pages live under `src/app/pages/` with desktop variants in `src/app/pages/desktop/`:

```
pages/
  Home.tsx                 pages/desktop/HomeDesktop.tsx
  RouteList.tsx            pages/desktop/RouteListDesktop.tsx
  RouteDetail.tsx          pages/desktop/RouteDetailDesktop.tsx
  FareSummary.tsx          pages/desktop/FareSummaryDesktop.tsx
  Saved.tsx                pages/desktop/SavedDesktop.tsx
  Contribute.tsx           pages/desktop/ContributeDesktop.tsx
  PendingContributions.tsx pages/desktop/PendingContributionsDesktop.tsx
```

Each parent page file renders the desktop variant inside `<div className="hidden lg:block">` and the mobile layout inside `<div className="lg:hidden">`. Both share the same query hooks — only the layout differs.

---

## 11. State Management

- **React Query** owns all server data. Cache keys: `['routes', vehicle]`, `['routes', vehicle, q]`, `['route', id]`, `['contributions', 'pending']`. `staleTime` 5min, `gcTime` 10min.
- **Zustand** (`savedRoutesStore`) persists saved route IDs to localStorage under `ekofare.saved`. Expose `isRouteSaved(id)`, `addRoute(route)`, `removeRoute(id)`, `getSavedRoutes()`.
- **Zustand** (`deviceStore`) persists a stable anonymized device id to localStorage under `ekofare.device` (UUID v4 generated once). Used to gate verification one-vote-per-device.

---

## 12. Project Structure

```
apps/web/
  src/
    app/
      App.tsx
      components/
      pages/
      pages/desktop/
    api/
      axios.ts
      routes.ts
      contributions.ts
      mock/
        routes.json
    stores/
    types/
    utils/
      helpers.ts          (transformRoute, calculateFare, reverseRoute,
                           getVehicleColor, formatDuration, getGreetingWithName)
    styles/
      fonts.css           (Syne + DM Sans imports — only file with @import url)
      theme.css           (:root tokens + @layer utilities for shimmer etc.)
      tailwind.css
      index.css           (imports the three above)

apps/api/
  src/
    index.ts
    routes/routes.ts
    routes/contributions.ts
    db/prisma.ts
    schemas/               (Zod)
    seed.ts
  prisma/schema.prisma

packages/types/
  src/index.ts             (all shared TS types)
```

---

## 13. Acceptance Checklist

### Must pass before shipping

- [ ] All 7 screens render mobile and desktop variants from dedicated layout files; resizing the viewport flips between them at `lg:`.
- [ ] Bottom tab bar shown on mobile only; sidebar shown on desktop only; never both simultaneously.
- [ ] Skeleton loading uses the **shimmer sweep** animation (not opacity pulse). Route Detail loading matches the provided mockup including the centered "Loading route data…" pill.
- [ ] Home (mobile) includes **Trending now** and **Recently viewed** sections below Popular Routes.
- [ ] Contribute origin row shows an "ORIGIN" chip, not a fare input. Every later stop has a working `₦` input. A **live Estimated total** card updates as the user types.
- [ ] Submitting a contribution lands it in the **pending queue**, not the public routes list.
- [ ] `/contribute/pending` is the **only** place verification happens. Route cards never show confirm/reject controls.
- [ ] A contribution with 3 confirmations promotes to verified and appears in `/routes`. A contribution with 3 disputes disappears.
- [ ] Mock mode works with the backend stopped; pending submissions persist across refresh via localStorage.
- [ ] Real mode round-trips a contribution → confirm → verified through Express + Postgres.
- [ ] Lighthouse accessibility score ≥ 95 on every page.
- [ ] No Tailwind `text-{size}`, `font-{weight}`, or `leading-{x}` utilities anywhere in the codebase.
- [ ] `prefers-reduced-motion` disables shimmer.
- [ ] Color contrast audited — AA minimum on all text.

### Build artifacts

- [ ] `apps/web` — Next.js 14, `pnpm dev` runs it.
- [ ] `apps/api` — Express + Prisma, `pnpm dev` runs it with nodemon.
- [ ] `packages/types` — shared types published to both apps.
- [ ] Seed script populates Postgres from the mock JSON.
- [ ] README documents env vars (`NEXT_PUBLIC_USE_MOCK`, `NEXT_PUBLIC_API_BASE_URL`, `DATABASE_URL`, `VERIFICATION_THRESHOLD`), how to run frontend-only (mock) vs full-stack, and how to reset the pending queue in dev.

---

## 14. Out of Scope

- Auth / accounts — device id is sufficient for MVP.
- Push notifications.
- Native mobile apps. The web app must be installable as a PWA (manifest + service worker) but that's it.
- i18n — English only at launch; copy should be wrapped in a translation function so Yoruba/Igbo/Pidgin can follow.

---

Build this exactly. When mockups and this document disagree, the mockups win for layout; this document wins for behavior, data, and tokens.
