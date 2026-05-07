# EkoFare — Junior-Dev Ticket Backlog

> Read `DESIGN_DOC.md` for architecture context. Read `SPEC.md` end-to-end before starting any ticket.
> Tickets ship in order — each depends on the one(s) listed.

---



### TICKET-016 — Pending Contributions — Desktop layout

**Why**: Desktop layout shows the pending queue in a wider container; the logic is identical to mobile.

**Scope**:
- Create `src/app/pages/desktop/PendingContributionsDesktop.tsx` — same content as mobile, wider centred container, sidebar present.
- Reuse all hooks and store logic from TICKET-015.
- Update `PendingContributions.tsx` desktop slot.

**Out of scope**: Mobile (TICKET-015). Any new verification logic.

**Acceptance criteria**:
- [x] All TICKET-015 acceptance criteria pass at desktop width.
- [x] Sidebar visible, bottom nav absent.

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
- [x] Every screen (7) × every platform (mobile/desktop) × every state (default, loading, empty, error, + disabled/success for Contribute) is listed and reachable.
- [x] Entry labels read exactly "Screen — Platform — State" format.
- [x] Loading states show real shimmer (not static).
- [x] Page has `<meta name="robots" content="noindex">`.

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
- [x] All icon-only buttons have descriptive `aria-label` values.
- [x] Filter pills have `aria-pressed`.
- [x] `LoadingPill` has `role="status"`.
- [x] Estimated total card has `aria-live="polite"`.
- [x] Lighthouse accessibility score ≥ 95 on Home, Route Detail, and Contribute.
- [x] `prefers-reduced-motion` disables shimmer (verified via DevTools emulation).

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
- [x] `pnpm --filter @ekofare/web dev` starts the app in mock mode with no backend and no env file required.
- [x] Setting `NEXT_PUBLIC_USE_MOCK=false` and running both apps round-trips a real contribution through Postgres.
- [x] README env var table is accurate and complete.
- [x] README "frontend-only" instructions work on a clean machine with no DB.

**Depends on**: TICKET-018.
**Estimated**: S (≤ half day).

**Junior-dev hints**:
- Test the mock → real switch on a clean branch where no local Postgres is running first — confirms mock mode truly requires no DB.
- The seed script (`apps/api/src/seed.ts`) should import `routes.json` from `apps/web/src/api/mock/routes.json` (or a shared path) so mock and real data stay in sync.

**How to demo**:
- From a fresh clone, run `pnpm install && pnpm --filter @ekofare/web dev` — app opens in the browser, routes load from mock, no DB needed.
- Set `NEXT_PUBLIC_USE_MOCK=false`, start the API with a real DB — submit a contribution and confirm it promotes to `/routes` after 3 confirms.
