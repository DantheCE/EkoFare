# EkoFare — Junior-Dev Ticket Backlog

> Read `DESIGN_DOC.md` for architecture context. Read `SPEC.md` end-to-end before starting any ticket.
> Tickets ship in order — each depends on the one(s) listed.

---

### TICKET-001 — Bootstrap monorepo + token system + global styles

**Why**: Every other ticket depends on the design token CSS variables and the project scaffold existing.

**Scope**:
- Initialise pnpm workspace with `apps/web` (Next.js 14 App Router + TypeScript), `apps/api` (Express + TypeScript skeleton), `packages/types` (shared type declarations).
- Create `apps/web/src/styles/fonts.css` — Google Fonts `@import` for Syne (700, 800) and DM Sans (400, 500, 600). This is the **only** file allowed to have `@import url(…)`.
- Create `apps/web/src/styles/theme.css` — all `:root` CSS variable tokens from `SPEC.md §4.1` (colour palette, semantic roles, radius scale, shadow scale, spacing base). Also add the global focus-ring rule: `*:focus-visible { outline: 2px solid var(--green-800); outline-offset: 2px; }`.
- Create `apps/web/src/styles/tailwind.css` and `apps/web/src/styles/index.css` that imports the three style files in order.
- Verify `pnpm dev` (web) launches without errors and the cream background fills the viewport edge-to-edge at all widths.

**Out of scope**: Any page content, components, or shimmer animation (that's TICKET-002).

**Acceptance criteria**:
- [ ] `pnpm dev` runs with no TypeScript or build errors.
- [ ] Opening the app shows a `--cream` (`#F5F0E8`) full-viewport background — no white flash, no grey, no phone bezel shape.
- [ ] Inspecting `:root` in DevTools shows every colour token from `SPEC.md §4.1` present.
- [ ] Tabbing to any link or button shows a 2px green-800 focus ring.
- [ ] No Tailwind `text-{size}`, `font-{weight}`, or `leading-{x}` utilities exist anywhere in the codebase yet.

**Depends on**: none.
**Estimated**: S (≤ half day).

**Junior-dev hints**:
- Tailwind v4 uses `@theme` / `@layer` differently from v3. Declare all tokens as plain CSS variables in `:root` inside `theme.css` — do not put them inside `@theme {}` unless you're sure v4's CSS-variable resolution works with the rest of the stack.
- The focus ring goes in `theme.css` as a global selector, not as a Tailwind plugin.
- `packages/types/src/index.ts` should export empty stubs now; real types arrive in TICKET-004.

**How to demo**:
- Open the running app at 390px width — solid cream background, no rounded frame, no clock.
- Open DevTools → Elements → `:root` — every hex token from `SPEC.md §4.1` visible.

---

### TICKET-002 — Shimmer skeleton system + LoadingPill primitive

**Why**: Loading states appear on every screen; building the primitives once means every subsequent ticket can just import them.

**Scope**:
- Add shimmer keyframes and `.skeleton-shimmer` / `.skeleton-shimmer-dark` classes to `theme.css` — copy the exact CSS from `SPEC.md §4.5` verbatim.
- Add `@media (prefers-reduced-motion: reduce)` override that replaces the animation with a static `--grey-100` fill.
- Create `src/app/components/Skeleton.tsx` exporting: `Skeleton` (base shimmer block, accepts `width`, `height`, `borderRadius`, `className`), `RouteCardSkeleton` (44×44 shimmer tile + two bars + trailing pill), `StopRowSkeleton` (grey-300 ring + connector + variable bar), `LoadingPill` (white rounded-full pill, small green spinner left, "Loading route data…" text, `role="status" aria-live="polite"`).
- Create a minimal `/dev` stub page at `app/dev/page.tsx` that renders one of each skeleton variant with a label, so the team can visually verify them.

**Out of scope**: Full `/dev` index page (TICKET-017). Route Detail integration (TICKET-009).

**Acceptance criteria**:
- [ ] `.skeleton-shimmer` shows a left-to-right white sweep at 1.4 s, not an opacity pulse.
- [ ] `.skeleton-shimmer-dark` sweep is visible over a dark/green background.
- [ ] With `prefers-reduced-motion: reduce` set in OS, the shimmer stops and blocks show a solid `--grey-100`.
- [ ] `LoadingPill` renders with `role="status"` in the DOM (verify in DevTools).
- [ ] `/dev` page shows all four skeleton variants, labelled.

**Depends on**: TICKET-001.
**Estimated**: S (≤ half day).

**Junior-dev hints**:
- The shimmer is a `::after` pseudo-element using `translateX(-100% → 100%)` — not a background-position shift. See `SPEC.md §4.5` for the exact gradient.
- The dark variant changes only the `background-color` of the base block and the gradient opacity — the keyframe is shared.
- The green spinner inside `LoadingPill` can be a simple CSS border-spinner using `--green-800` border-top — no library needed.

**How to demo**:
- Navigate to `/dev` — all four skeleton variants are on screen, shimmer is running.
- Enable "Prefer reduced motion" in OS accessibility settings — shimmer stops, blocks go grey.

---

### TICKET-003 — Layout shell + BottomNav + DesktopSidebar

**Why**: Every screen sits inside this shell; building it first means all subsequent page tickets just fill the content slot.

**Scope**:
- Create `src/app/components/Layout.tsx` — wraps children with `<main className="lg:pl-64">`, renders `DesktopSidebar` and a `sonner` `<Toaster position="top-center" />`.
- Create `src/app/components/BottomNav.tsx` — four tabs: Routes (`/`), Search (`/routes`), Saved (`/saved`), Contribute (`/contribute`). Fixed bottom, `lg:hidden`, 56px tall, white bg, top border `--grey-100`, shadow `0 -2px 8px rgba(0,0,0,0.06)`. Active: `--green-800` icon + label, stroke 2.5, weight 600. Inactive: `--grey-500`, stroke 2, weight 500. Icon labels use `aria-current="page"` on active item.
- Create `src/app/components/DesktopSidebar.tsx` — fixed left, 256px, white, right border `--grey-100`. Logo row (bus icon in green-800 10px-radius tile + "EkoFare" Syne 700/22px). Nav pills (same four tabs, rounded-10px pills — active: `--green-100` bg, `--green-800` text 600; inactive: transparent). "Help fellow commuters" card at bottom (cream bg, terra-700 "Contribute" button → `/contribute`). `hidden lg:flex flex-col`.
- Wire `Layout` into the root `app/layout.tsx`.

**Out of scope**: Real page content inside any route (those come in TICKET-005+). Logo SVG asset (use a placeholder bus emoji or lucide `Bus` icon).

**Acceptance criteria**:
- [ ] At < 1024px: `BottomNav` visible, sidebar absent.
- [ ] At ≥ 1024px: sidebar visible, `BottomNav` absent. They never appear simultaneously.
- [ ] Active nav item highlights correctly when navigating between routes.
- [ ] Sidebar "Contribute" button navigates to `/contribute`.
- [ ] All icon-only buttons have `aria-label` attributes.

**Depends on**: TICKET-001.
**Estimated**: M (~1 day).

**Junior-dev hints**:
- Use `lucide-react` icons: `Bus`, `Search`, `BookmarkCheck`, `PlusCircle` for nav items.
- `sonner`'s `Toaster` must be inside the `Layout` so toasts appear on every page — not inside individual page components.
- The sidebar's bottom card is `mt-auto` — it sticks to the bottom of the flex column.
- Never add `border-radius` to `<body>` or the page root — this would create the fake phone bezel the handover document explicitly forbids.

**How to demo**:
- Open at 800px — bottom nav visible, sidebar absent.
- Drag to 1100px — sidebar slides in, bottom nav disappears.
- Click each nav item — active highlight moves, URL changes.

---

### TICKET-004 — RouteCard + VehicleIcon + shared types + mock fixtures

**Why**: `RouteCard` appears on Home, Route List, and Saved; building it with real mock data lets every page ticket just import it.

**Scope**:
- Populate `packages/types/src/index.ts` with all types from `SPEC.md §5.1` and `§5.2`: `VehicleType`, `BackendStop`, `BackendRoute`, `ContributionPayload`, `VerificationResponse`, `Stop`, `Route`, `Contribution`.
- Create `src/utils/helpers.ts` with `transformRoute(b: BackendRoute): Route` (computes `cumulative_fare`, renames fields, splits name into `from`/`to`).
- Create `src/api/mock/routes.json` — 12 realistic Lagos routes across all vehicle types including multi-leg (e.g. CMS → Obalende → Lekki Phase 1). See `SPEC.md §8` for seed guidance.
- Create `src/api/axios.ts` — single Axios instance; when `NEXT_PUBLIC_USE_MOCK=true`, intercept calls and resolve from mock data with 200–400ms delay.
- Create `src/app/components/VehicleIcon.tsx` — accepts `vehicle: VehicleType` and `size: number`. Returns a coloured inline SVG (bus for Danfo/BRT, three-wheeler for Keke, bike for Okada, boat for Ferry, sedan for Uber). Colours from vehicle token table in `SPEC.md §4.1`.
- Create `src/app/components/RouteCard.tsx` — white card, 14px radius, 1px `--grey-100` border, shadow. Shows: `VehicleIcon` (40×40), route name (Syne 700), vehicle·stops·duration meta (DM Sans 14px `--grey-500`), total fare (Syne 800 `--green-800`), heart icon (saves/removes via `savedRoutesStore`).
- Create `src/stores/savedRoutesStore.ts` (Zustand, localStorage `ekofare.saved`) and `src/stores/deviceStore.ts` (Zustand, localStorage `ekofare.device`, UUID v4 on first run).

**Out of scope**: Page-level query hooks (those sit in each page ticket). Verification logic (TICKET-015).

**Acceptance criteria**:
- [ ] `transformRoute()` correctly sets `cumulative_fare` on each stop (origin = 0; each subsequent stop adds the leg fare cumulatively).
- [ ] `VehicleIcon` renders a distinct icon and colour for all six vehicle types.
- [ ] `RouteCard` heart toggles save state and persists across page refresh.
- [ ] Mock Axios resolves in 200–400ms (skeleton is briefly visible before data appears).
- [ ] `packages/types` compiles without errors from both `apps/web` and `apps/api`.

**Depends on**: TICKET-001, TICKET-002, TICKET-003.
**Estimated**: M (~1 day).

**Junior-dev hints**:
- `cumulative_fare` on stop `i` = `stops[0..i].reduce((sum, s) => sum + s.leg_fare, 0)`.
- Format fares as `₦${fare.toLocaleString()}` — always use `toLocaleString()`, never raw numbers.
- UUID v4 for `deviceStore`: use `crypto.randomUUID()` (available in modern browsers) — no library needed.
- The heart icon is `lucide-react`'s `Heart` — filled (`fill="currentColor"`) when saved, outline when not.

**How to demo**:
- Temporarily render two `RouteCard`s on the home page. Click a heart — card shows filled heart, refresh — heart stays filled.
- Open DevTools Network — XHR/fetch calls resolve in ~300ms (mock latency visible).

---

### TICKET-005 — Home screen — Mobile layout (default + loading + empty states)

**Why**: Home is the entry point of the app; the mobile variant is the primary user experience.

**Scope**:
- Create `src/app/pages/HomeMobile.tsx`.
- Implement all content from `SPEC.md §6.1` mobile description: greeting line (`getGreetingWithName()` util), 40px Syne 700 hero ("Where are you **headed today?**" — "headed today?" in `--green-800`), dark search input with mic button, filter pills (All / Danfo / BRT / Keke — `aria-pressed`, horizontal scroll, no scrollbar), Popular Routes section (label + "See all →" terra-700 link + `RouteCard` stack), Trending now green-gradient card, Recently viewed white card (3 list items).
- **Loading state**: Popular Routes → `RouteCardSkeleton` × 3; Recently viewed → 3 shimmer rows.
- **Empty state**: Popular Routes → empty-state block: 🔍 icon (grey-300, large), "No routes found", "Try searching above".
- Wire `useRoutes()` React Query hook (`['routes', vehicle]`, staleTime 5 min).
- `src/app/pages/Home.tsx` renders `<div className="lg:hidden"><HomeMobile /></div>` + desktop slot (empty `<div>` for now — filled in TICKET-006).

**Out of scope**: Home desktop layout (TICKET-006). Error state (add in accessibility pass or a follow-up; loading + empty are the critical pair here).

**Acceptance criteria**:
- [ ] At < 1024px greeting, hero, search, pills, Popular Routes, Trending card, and Recently viewed all render.
- [ ] Selecting a filter pill highlights it (green-800 bg, white text) and updates the route list.
- [ ] While data is loading, `RouteCardSkeleton` rows appear with the shimmer sweep (not a spinner).
- [ ] With an empty dataset, the empty-state block appears instead of the route list.
- [ ] Page background is `--cream`, fills edge-to-edge. No rounded container, no phone bezel.

**Depends on**: TICKET-004.
**Estimated**: M (~1 day).

**Junior-dev hints**:
- `SPEC.md §6.1` — re-read the mobile description carefully. The hero bold span ("headed today?") is inline, not a separate element.
- `getGreetingWithName()` in `helpers.ts` returns "Good morning, friend" / "Good afternoon, friend" / "Good evening, friend" based on `new Date().getHours()`.
- Filter pills: `aria-pressed={isActive}` on each button — don't skip this, it's in the acceptance checklist.
- Do **not** use Tailwind `text-4xl` for the 40px hero — use `style={{ fontSize: '40px', fontFamily: 'Syne', fontWeight: 700 }}`.

**How to demo**:
- Open at 390px — full cream screen, hero visible, pills scrollable, route cards load after shimmer.
- Click "Danfo" pill — list filters; "See all →" navigates to `/routes`.

---

### TICKET-006 — Home screen — Desktop layout (default + loading + empty states)

**Why**: Desktop users get a richer 3-column layout that must match the SPEC exactly.

**Scope**:
- Create `src/app/pages/desktop/HomeDesktop.tsx`.
- Implement `SPEC.md §6.1` desktop layout: 3-column grid `max-w-[1100px]` centred, 40px padding. Left (2 cols): 56px hero, wide dark search with leading `Search` icon + trailing mic, filter pills, **2-column** `RouteCard` grid. Right (1 col, `pt-14`): Trending card → Recently viewed card.
- **Loading state**: 4 `RouteCardSkeleton`s in 2-col grid on the left, shimmer rows in Recently viewed on the right.
- **Empty state**: empty-state block inside the left column.
- Update `src/app/pages/Home.tsx` — fill the `hidden lg:block` slot with `<HomeDesktop />`.

**Out of scope**: Mobile layout (done in TICKET-005).

**Acceptance criteria**:
- [ ] At ≥ 1024px the 3-column grid renders with sidebar + main content + right panel.
- [ ] Desktop hero is 56px (not 40px).
- [ ] Popular Routes grid is 2 columns on desktop.
- [ ] Resizing through 1024px — mobile and desktop variants swap cleanly with no layout overlap.
- [ ] Bottom nav is absent, sidebar is present.

**Depends on**: TICKET-005.
**Estimated**: M (~1 day).

**Junior-dev hints**:
- `SPEC.md §6.1` — re-read the desktop description. The right column starts at `pt-14` to visually align with the hero, not the top of the grid.
- The 2-col route card grid: `display: grid; grid-template-columns: 1fr 1fr; gap: 16px` — don't use Tailwind `grid-cols-2` if it conflicts with the token system; a style prop is fine.
- Confirm the sidebar's 256px width is offset by `lg:pl-64` on `<main>` (from `Layout`) — the 3-col grid lives inside that offset space.

**How to demo**:
- Open at 1100px — 3-column layout visible, 2-col route grid, right panel with Trending + Recently viewed.
- Shrink to 800px — seamlessly switches to mobile HomeMobile.

---

### TICKET-007 — Route List screen — Mobile layout (all states)

**Why**: The primary search/browse surface; must handle all four data states correctly.

**Scope**:
- Create `src/app/pages/RouteListMobile.tsx` — all states from `SPEC.md §6.2` mobile: page title "Find Your Route" (Syne 800/24px), white search input with leading `Search` icon + trailing `X` clear button (only when query non-empty), filter pills, vertical `RouteCard` stack.
- **Loading**: 4 `RouteCardSkeleton`s.
- **Empty** (no results): 🔍 glyph (grey-300), "No routes found", "Try a different search or filter".
- **Error**: "Something went wrong" + retry button that calls `refetch()`.
- Wire `useRoutes(vehicle, q)` hook — `q` bound to search input (debounced 300ms).
- Create `src/app/pages/RouteList.tsx` parent — mobile slot + empty desktop slot.

**Out of scope**: Desktop layout (TICKET-008).

**Acceptance criteria**:
- [ ] Typing in search filters routes (debounced — no request on every keystroke).
- [ ] `X` clear button appears only when input is non-empty; clicking it clears query and resets list.
- [ ] Loading state shows shimmer skeletons, not a spinner.
- [ ] Empty state shows the glyph + copy described above.
- [ ] Error state shows the retry button; clicking it triggers a new fetch.

**Depends on**: TICKET-005.
**Estimated**: M (~1 day).

**Junior-dev hints**:
- `SPEC.md §6.2` — read carefully; the mobile search input here is white (not dark like on Home).
- Debounce: use a `useState` + `useEffect` pattern or a small `useDebounce` hook — no extra library required.
- The `X` icon is `lucide-react`'s `X`. Pair it with `aria-label="Clear search"`.
- All four states (default, loading, empty, error) must be reachable — the `/dev` page in TICKET-017 will link directly to each.

**How to demo**:
- Type "CMS" — list filters to matching routes; clear — all routes return.
- Temporarily force `isLoading=true` — shimmer visible; force `isError=true` — retry button appears.

---

### TICKET-008 — Route List screen — Desktop layout (all states)

**Why**: The desktop layout has a sticky filter sidebar and a 2-col card grid — a genuinely different UI from mobile.

**Scope**:
- Create `src/app/pages/desktop/RouteListDesktop.tsx` — `SPEC.md §6.2` desktop: eyebrow "Browse" + title "Find Your Route" (Syne 800/44px) + right-aligned `{n} routes` meta. Grid `[1fr 260px]`: main content (full-width white search input, 2-col `RouteCard` grid) + sticky right panel (white card, "Vehicle" label, vertical filter buttons — active: `--green-100` bg, `--green-800` text).
- All four states (loading / empty / error / default) inside the main content area.
- Update `RouteList.tsx` desktop slot.

**Out of scope**: Mobile (TICKET-007).

**Acceptance criteria**:
- [ ] Sticky vehicle filter panel stays fixed as route list scrolls.
- [ ] Active vehicle filter highlights correctly.
- [ ] Result count "{n} routes" updates when filter changes.
- [ ] Empty state renders inside a white bordered panel, not a full-page takeover.
- [ ] No bottom nav; sidebar present.

**Depends on**: TICKET-007.
**Estimated**: M (~1 day).

**Junior-dev hints**:
- `SPEC.md §6.2` — desktop section. The right filter panel is `position: sticky; top: 24px` — not `position: fixed` (that would layer it over the sidebar).
- The vehicle filter buttons in the right panel are the same logical filters as the pills on mobile — they share the same state/hook.
- Empty state: wrap it in `border: 1px solid var(--grey-100); border-radius: 14px; padding: 40px` for the bordered white panel look.

**How to demo**:
- Open at 1200px — 2-col card grid visible, sticky filter panel on right.
- Scroll the route list — filter panel stays in view.
- Click a vehicle filter — grid updates, count updates.

---

### TICKET-009 — Route Detail screen — Mobile layout (all states incl. loading pill)

**Why**: The most complex screen; the loading state must exactly match the provided mockup — this ticket earns its L estimate.

**Scope**:
- Create `src/app/pages/RouteDetailMobile.tsx` — all content from `SPEC.md §6.3`: green header (`--green-800` bg, back `ChevronLeft` button, "Reverse" chip, route name Syne 700/24, three meta pills), instruction line, stop timeline (origin/destination tap logic, in-range highlight, connector turns green-600), fixed-bottom fare dock (appears only when two stops are selected), "Reverse" flips stop order + sonner toast.
- **Loading state** (must match mockup exactly per SPEC): dark-shimmer header pills, wide shimmer block under header, **centered `LoadingPill`** overlapping content, 5 `StopRowSkeleton`s, fare dock shimmer.
- **Error state**: simple error + retry.
- Wire `useRoute(id)` hook.
- Create `src/app/pages/RouteDetail.tsx` parent.
- Local state: `originIdx: number | null`, `destIdx: number | null`.

**Out of scope**: Desktop (TICKET-010). Fare Summary (TICKET-011).

**Acceptance criteria**:
- [ ] Loading state includes the centered "Loading route data…" white pill with green spinner over the shimmer rows.
- [ ] Tapping a stop before origin sets origin (green-800 fill, "FROM" pill).
- [ ] Tapping a second stop sets destination (terra-700 fill, "TO" pill) and reveals the fare dock.
- [ ] Stops between origin and destination show green-200 fill + green-600 connector.
- [ ] "Reverse" reorders stops, shows sonner toast "Fares may differ in reverse direction".
- [ ] Fare dock "Share trip" button navigates to `/routes/:id/fare?origin=i&dest=j`.

**Depends on**: TICKET-004, TICKET-003.
**Estimated**: L (1–1.5 days).

**Junior-dev hints**:
- `SPEC.md §6.3` — the loading state spec is explicit: `LoadingPill` is **centred over** the shimmer content (absolute positioned, not above it).
- The fare dock is `position: fixed; bottom: 64px` on mobile (above the bottom nav). When no stops selected, render nothing — not a hidden element.
- "Taps before origin reset origin" means: if origin is already set and user taps a stop before origin index, that stop becomes the new origin and destination clears.
- Do **not** import Tailwind `text-2xl` for the 24px route name — use `style={{ fontSize: '24px', fontFamily: 'Syne', fontWeight: 700 }}`.

**How to demo**:
- Navigate to any route. Observe loading pill briefly then content loads.
- Tap stop 1 → "FROM" chip. Tap stop 3 → "TO" chip. Fare dock appears at bottom with the correct sum.
- Click "Reverse" → stops flip, toast appears.

---

### TICKET-010 — Route Detail screen — Desktop layout (all states)

**Why**: Desktop removes the fixed fare dock and places it inline; the layout is meaningfully different.

**Scope**:
- Create `src/app/pages/desktop/RouteDetailDesktop.tsx`.
- Same logic and states as `RouteDetailMobile` but layout: wider container, fare dock in-flow below the timeline (not fixed bottom), sidebar visible.
- Loading state: same shimmer structure but wider; `LoadingPill` still centred over content.
- Update `RouteDetail.tsx` desktop slot.

**Out of scope**: Mobile (TICKET-009).

**Acceptance criteria**:
- [ ] Fare dock renders in-flow (not fixed) at desktop widths.
- [ ] Stop timeline, origin/destination selection, and reverse all work identically to mobile.
- [ ] Loading pill centred over shimmer content (same as mobile).
- [ ] At ≥ 1024px: sidebar present, bottom nav absent.

**Depends on**: TICKET-009.
**Estimated**: M (~1 day).

**Junior-dev hints**:
- Extract the stop-selection logic into a custom hook `useStopSelection(stops)` so both `RouteDetailMobile` and `RouteDetailDesktop` share it without duplication.
- The fare dock on desktop can be a plain white card with `border-radius: 14px` and the same content — no `position: fixed` needed.

**How to demo**:
- Open a route at 1200px — fare dock is below the stop list, scrolls with content.
- Select two stops — fare dock updates in-place with the correct fare.

---

### TICKET-011 — Fare Summary screen — Mobile + Desktop

**Why**: This is the read-only deep-dive screen users reach after selecting stops; both layouts are simple enough to ship together.

**Scope**:
- Create `src/app/pages/FareSummaryMobile.tsx` and `src/app/pages/desktop/FareSummaryDesktop.tsx`.
- Read `?origin=i&dest=j&reversed=1` from the URL; resolve the route via `useRoute(id)`.
- Large total: Syne 800/48px, `₦{fare.toLocaleString()}`, origin → destination caption below.
- Leg-by-leg table: leg number, vehicle pill, "From → To", `+₦{leg_fare}`. Odd rows `--off-white`, even rows `--white`.
- Action row: **Save** heart toggle (terra-700 filled when saved, Zustand-backed), **Share trip** primary (green-800), **Copy link** ghost.
- Desktop: wider container, same content, sidebar present.
- `src/app/pages/FareSummary.tsx` parent wires both slots.

**Out of scope**: Actual share/copy browser APIs (stubs are fine — they can toast "Copied!" with sonner).

**Acceptance criteria**:
- [ ] Total fare equals sum of leg fares between origin and destination.
- [ ] Leg table is striped (off-white / white alternating rows).
- [ ] Save toggle persists across refresh (Zustand localStorage).
- [ ] "Copy link" shows a sonner toast "Link copied!".
- [ ] Mobile and desktop swap cleanly at 1024px.

**Depends on**: TICKET-010.
**Estimated**: M (~1 day).

**Junior-dev hints**:
- `SPEC.md §6.4` — "Receives `?origin=i&dest=j&reversed=1`" — use `useSearchParams()` in Next.js App Router.
- The total fare = `stops[origin..dest].reduce((sum, s) => sum + s.leg_fare, 0)` — origin leg_fare is 0, so it doesn't add to the total.
- `navigator.clipboard.writeText(window.location.href)` for the copy action; wrap in try/catch.

**How to demo**:
- From Route Detail, select two stops and click "Share trip" — lands on Fare Summary with correct total.
- Click "Save" — heart fills; refresh — still filled.
- Click "Copy link" — sonner toast "Link copied!" appears.

---

### TICKET-012 — Saved Routes screen — Mobile + Desktop (incl. dashed-circle empty state)

**Why**: The saved screen is straightforward but the empty state requires careful design work matching the mockup.

**Scope**:
- Create `src/app/pages/SavedMobile.tsx` and `src/app/pages/desktop/SavedDesktop.tsx`.
- Populated state: vertical list of `RouteCard`s (hearts pre-filled, clicking removes from saved).
- **Empty state** (match mockup exactly): dashed circle in `--green-200` with a heart glyph (grey-300) centred inside; "No saved routes yet" (Syne 700/20); copy "Tap ♡ on any route to save it here for quick access — handy for your daily commute." (DM Sans 14px grey-500); primary **"Browse routes"** button (green-800) → `/routes`; muted "or search for a stop above" link.
- Desktop: same content in a wider centred container.
- `src/app/pages/Saved.tsx` parent.

**Out of scope**: Search within saved (not in spec).

**Acceptance criteria**:
- [ ] With saved routes: list renders with heart icons filled.
- [ ] Clicking a heart removes the route; if last route removed, empty state appears immediately.
- [ ] Empty state shows the dashed-circle illustration and the "Browse routes" button.
- [ ] Mobile and desktop swap at 1024px.

**Depends on**: TICKET-004.
**Estimated**: M (~1 day).

**Junior-dev hints**:
- `SPEC.md §6.5` — empty state copy is exact, copy it verbatim.
- Dashed circle: `border: 2px dashed var(--green-200); border-radius: 9999px; width: 120px; height: 120px` with the heart icon centred — no image asset needed.
- Read saved routes from `savedRoutesStore.getSavedRoutes()` — it returns full `Route` objects so `RouteCard` can render them directly.

**How to demo**:
- Navigate to `/saved` with no saved routes — dashed circle + copy + "Browse routes" button visible.
- Save a route from Home; return to `/saved` — card appears. Click heart — card disappears; empty state reappears.

---

### TICKET-013 — Contribute screen — Mobile layout (form, origin chip, live total, success state)

**Why**: Contribute is the most behaviour-dense form in the app — origin chip, dynamic stop list, live estimated total, and a post-submit success screen all need careful implementation.

**Scope**:
- Create `src/app/pages/ContributeMobile.tsx`.
- Dark grey-900 header "Add a route" (Syne 700/24, white).
- From / To side-by-side inputs.
- Vehicle selector: 32×32 `VehicleIcon` tile + `<select>` (Danfo / BRT / Keke Napep / Okada / Ferry / Uber-Bolt).
- Dynamic stop list:
  - Row 0 (origin): stop-name input + read-only **"ORIGIN"** green-100 chip. **No fare input.** Hard rule.
  - Rows 1+: stop-name input + `₦` fare input (`type="number"`, `inputMode="numeric"`, `min=0`, placeholder "0") + `X` remove button.
  - "Add next stop" ghost button (plus icon, bordered).
- **Estimated total card** (dark, `aria-live="polite"`): "Estimated total" eyebrow + "{n} stops" meta left, `₦{sum}` Syne 800/28 right. Updates live on every fare keypress.
- Green-100 notice: "All submissions are reviewed before going live. Conflicting prices are flagged for community voting."
- Submit button (green-800): label "Submit route" → "Submitting…" during mutation, disabled during flight.
- **Submission**: POST to `/api/contributions` (mock mode: push to localStorage `ekofare.pending`). On success → **success screen** (white centred): green-100 circle with check icon, "Thank you!", review copy, "Add another route" (green-800) and "View pending routes" (ghost → `/contribute/pending`).
- `src/app/pages/Contribute.tsx` parent.

**Out of scope**: Desktop (TICKET-014). Pending page (TICKET-015).

**Acceptance criteria**:
- [ ] Origin row (index 0) shows "ORIGIN" chip; no fare input renders for it under any circumstance.
- [ ] Adding stops increments "{n} stops" and the total updates as fares are typed.
- [ ] Submit button is disabled and shows "Submitting…" while mutation is in flight.
- [ ] On success the success screen replaces the form; "Add another route" resets it.
- [ ] Submission appears in localStorage `ekofare.pending` (verify in DevTools → Application).

**Depends on**: TICKET-004.
**Estimated**: L (1–1.5 days).

**Junior-dev hints**:
- `SPEC.md §6.6` — re-read the entire section. The "ORIGIN chip, not input" rule is called out explicitly in `handover.md` as a common mistake.
- Estimated total: `stops.slice(1).reduce((sum, s) => sum + (Number(s.fare) || 0), 0)` — skip index 0 because origin has no fare.
- Use `useFieldArray`-style local state (array of `{ name: string; fare: string }`) — no external form library required.
- `ContributionPayload.stops_data[0].fare_from_previous` must always be `0` for the origin.

**How to demo**:
- Open `/contribute` — origin row shows "ORIGIN" chip; no ₦ input in that row.
- Add two more stops, type fares — estimated total card updates in real time.
- Submit — button shows "Submitting…"; success screen appears. DevTools → Application → localStorage shows `ekofare.pending` entry.

---

### TICKET-014 — Contribute screen — Desktop layout

**Why**: The desktop layout gives more horizontal space to the form and must be wired correctly.

**Scope**:
- Create `src/app/pages/desktop/ContributeDesktop.tsx` — same form logic as `ContributeMobile`, wider centred container, sidebar present.
- Reuse the same submission hook/logic (extract to `useContributeForm()` if not already done in TICKET-013).
- Success screen same content, wider centred card.
- Update `Contribute.tsx` desktop slot.

**Out of scope**: Mobile (TICKET-013). Any new form behaviour.

**Acceptance criteria**:
- [ ] All TICKET-013 acceptance criteria pass at desktop width.
- [ ] Sidebar visible, bottom nav absent.
- [ ] Form layout uses available width — not squashed to mobile width inside a wide viewport.

**Depends on**: TICKET-013.
**Estimated**: M (~1 day).

**Junior-dev hints**:
- Extract form logic into `useContributeForm()` hook before this ticket so the desktop component just consumes it — no duplication.
- The desktop layout can be `max-w-[720px]` centred — the form doesn't need to span the full page width.

**How to demo**:
- Open `/contribute` at 1200px — full form visible in a comfortable centred container, sidebar on left.
- Submit — success screen appears in the same centred layout.

---

### TICKET-015 — Pending Contributions — queue, verification logic + localStorage persistence

**Why**: This is the only verification surface; the one-vote-per-device gate and threshold logic are core business rules.

**Scope**:
- Create `src/app/pages/PendingContributionsMobile.tsx`.
- `useContributions('pending')` React Query hook (`['contributions', 'pending']`). In mock mode, read from localStorage `ekofare.pending`.
- Pending card per contribution: `VehicleIcon` tile, route name (Syne 700/18), meta ("{n} stops · ~₦{total} · submitted {relative time}"), optional notes blockquote, **confirmations bar** (`{confirmations}/3` filled dots in `--green-600`), **Confirm** (green-800) and **Dispute** (ghost grey-700) buttons.
- One vote per device: if `deviceStore.deviceId` is in the contribution's `votedBy` set, disable both buttons and show "You confirmed this" / "You disputed this" status chip.
- On 3rd confirmation: animate card out (CSS fade+slide), sonner toast "Promoted to verified routes". Move contribution to `status: 'verified'`.
- On 3rd dispute: animate card out, toast "Submission rejected". Move to `status: 'rejected'`.
- **Expandable view**: clicking card body toggles a read-only leg-by-leg breakdown (same timeline style as Route Detail, no tap-to-select).
- **Empty state**: "Nothing to review" + "Check back later, or add a route yourself." CTA → `/contribute`.
- Create `src/stores/verificationStore.ts` (Zustand, localStorage `ekofare.votes`) tracking `{ [contributionId]: 'confirm' | 'dispute' }` per device.
- `src/app/pages/PendingContributions.tsx` parent.

**Out of scope**: Desktop (TICKET-016). Real API calls beyond mock (those work in real mode automatically via the Axios instance).

**Acceptance criteria**:
- [ ] Pending contributions submitted in TICKET-013 appear in this list after page refresh.
- [ ] Confirm/Dispute buttons disable after one vote per device; status chip appears.
- [ ] After 3 confirms, card animates out and a sonner toast fires.
- [ ] After 3 disputes, card animates out with the rejection toast.
- [ ] Empty state renders when queue is empty.
- [ ] Expanding a card shows the full stop breakdown.

**Depends on**: TICKET-013.
**Estimated**: L (1–1.5 days).

**Junior-dev hints**:
- `SPEC.md §6.7` — read carefully. Verification **only** happens here, never on `RouteCard`.
- For the card animation on removal: add a CSS class `"animating-out"` that fades + slides, wait 300ms, then remove from state.
- `verificationStore` must persist to localStorage so a user who votes, refreshes, and returns still sees the disabled state.
- Relative time ("submitted 2 hours ago"): use a small helper `formatRelativeTime(isoString)` — no library needed for simple cases.

**How to demo**:
- Submit a route in `/contribute`, navigate to `/contribute/pending` — card appears.
- Click Confirm three times (using different mock device IDs if needed by temporarily clearing localStorage) — card animates out, toast fires.
- Refresh — card is gone; localStorage shows `status: 'verified'`.

---

### TICKET-016 — Pending Contributions — Desktop layout

**Why**: Desktop layout shows the pending queue in a wider container; the logic is identical to mobile.

**Scope**:
- Create `src/app/pages/desktop/PendingContributionsDesktop.tsx` — same content as mobile, wider centred container, sidebar present.
- Reuse all hooks and store logic from TICKET-015.
- Update `PendingContributions.tsx` desktop slot.

**Out of scope**: Mobile (TICKET-015). Any new verification logic.

**Acceptance criteria**:
- [ ] All TICKET-015 acceptance criteria pass at desktop width.
- [ ] Sidebar visible, bottom nav absent.

**Depends on**: TICKET-015.
**Estimated**: M (~1 day).

**Junior-dev hints**:
- Extract any card-specific sub-components (`PendingCard`, `ConfirmationsBar`) in TICKET-015 so this ticket just imports and lays them out.

**How to demo**:
- Open `/contribute/pending` at 1200px — cards in wider centred layout, sidebar present.
- Confirm a contribution — same animation and toast as mobile.

---

### TICKET-017 — `/dev` index page — every screen × every state

**Why**: Reviewers and QA need to navigate directly to any state without manually triggering loading/error/empty conditions.

**Scope**:
- Expand `app/dev/page.tsx` (stub created in TICKET-002) into a full index.
- List every screen × every state with a direct link or inline render. Format: **"Screen — Platform — State"** e.g. "Saved Routes — Mobile — Empty State".
- For states that require simulated conditions (loading, error, empty), pass props/flags to render the components in that state directly — don't rely on real network conditions.
- Group by screen. Use a simple card-grid layout with green section headers.
- Add a `noindex` meta tag — this page is dev-only, not for end users.
- Link from the sidebar "…" or add a keyboard shortcut (e.g. `Shift+D` → `/dev`) — note this in the README.

**Out of scope**: Storybook setup (plain `/dev` page is sufficient per spec).

**Acceptance criteria**:
- [ ] Every screen (7) × every platform (mobile/desktop) × every state (default, loading, empty, error, + disabled/success for Contribute) is listed and reachable.
- [ ] Entry labels read exactly "Screen — Platform — State" format.
- [ ] Loading states show real shimmer (not static).
- [ ] Page has `<meta name="robots" content="noindex">`.

**Depends on**: TICKET-016.
**Estimated**: S (≤ half day).

**Junior-dev hints**:
- Pass `isLoading`, `isError`, `isEmpty` as props to each screen component — the components should already accept these if built correctly in prior tickets.
- Don't overthink the layout — a simple `<section>` per screen with an `<h2>` and a link/button grid is sufficient.

**How to demo**:
- Navigate to `/dev` — every entry is listed. Click "Route Detail — Mobile — Loading" — the loading state renders with the shimmer pill.

---

### TICKET-018 — Accessibility pass (focus rings, aria audit, reduced motion, contrast)

**Why**: WCAG AA is a hard requirement; this dedicated pass catches anything missed in individual tickets.

**Scope**:
- Audit every interactive element for `aria-label` (icon-only buttons: mic, clear search, remove stop, heart, back button, reverse).
- Confirm `aria-pressed` on all filter pills across every screen.
- Confirm `aria-current="page"` on active nav items in both `BottomNav` and `DesktopSidebar`.
- Confirm `aria-live="polite"` on "Estimated total" card; `role="status" aria-live="polite"` on `LoadingPill`.
- Check tab order on every screen follows visual order. Fix any skip-overs.
- Run a colour-contrast audit (browser DevTools or axe extension) — fix any failures (minimum 4.5:1 body text, 3:1 large text).
- Verify touch targets are ≥ 44×44px on mobile for all interactive elements.
- Test `prefers-reduced-motion` via DevTools emulation — shimmer stops, no layout shift.
- Run Lighthouse accessibility audit on Home, Route Detail, and Contribute — score ≥ 95.

**Out of scope**: Full WCAG AAA compliance. Screen-reader testing beyond browser-level aria checks.

**Acceptance criteria**:
- [ ] All icon-only buttons have descriptive `aria-label` values.
- [ ] Filter pills have `aria-pressed`.
- [ ] `LoadingPill` has `role="status"`.
- [ ] Estimated total card has `aria-live="polite"`.
- [ ] Lighthouse accessibility score ≥ 95 on Home, Route Detail, and Contribute.
- [ ] `prefers-reduced-motion` disables shimmer (verified via DevTools emulation).

**Depends on**: TICKET-017.
**Estimated**: M (~1 day).

**Junior-dev hints**:
- `SPEC.md §9` — the full accessibility requirements list. Use it as your audit checklist.
- Browser DevTools: Rendering tab → "Emulate CSS media feature prefers-reduced-motion" → check shimmer stops.
- The axe browser extension is free and catches most WCAG AA violations automatically.
- Touch target size: inspect element in mobile emulation — min-height and min-width should be ≥ 44px for every button/link.

**How to demo**:
- Share Lighthouse report screenshot showing ≥ 95 on each audited page.
- Tab through the Contribute form — every input, button, and pill reachable and labeled.

---

### TICKET-019 — Mock → real-API toggle + environment wiring + README

**Why**: The app should work out of the box in mock mode and with one env change switch to the real backend — this ticket makes that seamless and documents it.

**Scope**:
- Verify `NEXT_PUBLIC_USE_MOCK=false` + `NEXT_PUBLIC_API_BASE_URL=http://localhost:3001` causes Axios to hit the real Express API (round-trip: submit contribution → confirm × 3 → appears in `/routes`).
- Confirm `VERIFICATION_THRESHOLD` env var on the backend is read by `apps/api` (default `3`).
- Write `README.md` at the repo root covering:
  - Prerequisites (Node ≥ 20, pnpm, PostgreSQL).
  - One-command setup: `pnpm install && pnpm --filter @ekofare/web dev` for frontend-only (mock mode, no DB required).
  - Full-stack setup: `DATABASE_URL`, `pnpm --filter @ekofare/api db:seed`, `pnpm dev` in both apps.
  - How to reset the pending queue in mock mode (clear `ekofare.pending` from localStorage, or run the provided helper script).
  - Env var reference table: `NEXT_PUBLIC_USE_MOCK`, `NEXT_PUBLIC_API_BASE_URL`, `DATABASE_URL`, `VERIFICATION_THRESHOLD`.
  - Link to `/dev` index page and note the `Shift+D` shortcut.

**Out of scope**: CI/CD setup. Production deployment. PWA manifest/service worker (noted as in-scope in `SPEC.md §14` but low-priority — add as a follow-up ticket if time allows).

**Acceptance criteria**:
- [ ] `pnpm --filter @ekofare/web dev` starts the app in mock mode with no backend and no env file required.
- [ ] Setting `NEXT_PUBLIC_USE_MOCK=false` and running both apps round-trips a real contribution through Postgres.
- [ ] README env var table is accurate and complete.
- [ ] README "frontend-only" instructions work on a clean machine with no DB.

**Depends on**: TICKET-018.
**Estimated**: S (≤ half day).

**Junior-dev hints**:
- Test the mock → real switch on a clean branch where no local Postgres is running first — confirms mock mode truly requires no DB.
- The seed script (`apps/api/src/seed.ts`) should import `routes.json` from `apps/web/src/api/mock/routes.json` (or a shared path) so mock and real data stay in sync.

**How to demo**:
- From a fresh clone, run `pnpm install && pnpm --filter @ekofare/web dev` — app opens in the browser, routes load from mock, no DB needed.
- Set `NEXT_PUBLIC_USE_MOCK=false`, start the API with a real DB — submit a contribution and confirm it promotes to `/routes` after 3 confirms.
