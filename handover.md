# EkoFare — Handover Prompt for the Next AI Agent

You are taking over the **EkoFare** project — a Lagos public-transit fare reference web app. Your job is to deliver a complete, production-ready frontend with two genuinely separate layouts (mobile and desktop) and every UI state covered for both.

Use `DESIGN_SPEC.md` (in this repo) as the binding contract for tokens, data shapes, behavior, and acceptance criteria. This document tells you **what to deliver, how the deliverables are organized, and the traps to avoid**.

---

## ⚠️ CRITICAL — Read this first

### The phone bezel is NOT part of the UI

In the design mockups you will see screens framed inside a **phone shape** — rounded corners, a notch, a status bar showing "9:41", a home indicator at the bottom, sometimes a black device frame. **None of these are app UI.** They are presentation chrome the designer added so reviewers can tell "this is the mobile view" at a glance.

Previous agents have made this mistake: they implement the phone bezel as CSS — adding border-radius to the page, drawing a notch with a pseudo-element, hard-coding a 390px-wide rounded container with a black border, etc. **Do not do this.** Treat the mobile screens like any responsive web layout: page background fills the viewport, content flows from the top, no fake device chrome anywhere.

Concrete rules:
- **Never** render a status bar with a clock, battery, or signal icons.
- **Never** add `border-radius` to the root page container or `<body>` to mimic a phone shape.
- **Never** draw a notch, dynamic island, or home indicator.
- **Never** wrap the entire app in a fixed-width `390px` container with a black bezel on desktop. The mobile layout fills the viewport on phones; on desktop, it is replaced by the dedicated desktop layout — not framed inside a fake phone.
- The `--cream` page background fills the full viewport on mobile. Edge-to-edge.
- If you find yourself writing `clip-path`, `border: 12px solid black`, or `::before { content: '' /* notch */ }` — stop. You are implementing the wrong thing.

### Sanity check
Before you commit: open the running app at mobile width (≤ 390px). The design should occupy the full screen edge-to-edge with no rounded outer container, no clock, no notch. If you see any of those, delete them.

---

## What you are delivering

### 1. Two layouts per screen

Every screen has **two dedicated implementations**: a mobile layout and a desktop layout. They are separate component files — not one layout stretched with media queries. Switch between them at the `lg:` breakpoint (1024px):

```
src/app/pages/
  Home.tsx                  ← chooses variant via hidden lg:block / lg:hidden
  RouteList.tsx
  RouteDetail.tsx
  FareSummary.tsx
  Saved.tsx
  Contribute.tsx
  PendingContributions.tsx

src/app/pages/desktop/
  HomeDesktop.tsx
  RouteListDesktop.tsx
  RouteDetailDesktop.tsx
  FareSummaryDesktop.tsx
  SavedDesktop.tsx
  ContributeDesktop.tsx
  PendingContributionsDesktop.tsx
```

Each parent page renders the desktop variant inside `<div className="hidden lg:block">` and the mobile layout inside `<div className="lg:hidden">`. Both share the same data hooks; only the layout differs.

**Mobile navigation**: bottom tab bar (Routes / Search / Saved / Contribute), `lg:hidden`.
**Desktop navigation**: 256px fixed left sidebar with logo + nav + "Help fellow commuters" CTA card, `hidden lg:flex`.

Bottom nav and sidebar must never appear simultaneously.

### 2. Every UI state, on both platforms

For **every screen** above, deliver these states and label them clearly in code (file or component name) and in any documentation:

| State | When it shows |
|---|---|
| **Default / populated** | Data loaded, content present |
| **Loading** | Initial fetch — uses the shimmer skeleton system (see §Design system below) |
| **Empty** | Query returned no results, or user has no saved/pending items |
| **Error** | Network or server error — retry button included |
| **Disabled / submitting** | Forms in flight (Contribute) — button shows "Submitting…", inputs disabled |
| **Success** | Post-submit confirmation (Contribute → "Thank you!" screen) |

Naming: tag each variant clearly. For example, `HomeMobile.Loading`, `SavedMobile.Empty`, `ContributeMobile.Success`, `PendingContributionsDesktop.Empty`. If you build a Storybook or a `/dev` index page (recommended), each entry must read like **"Saved Routes — Mobile — Empty State"** so anyone can scan the list and know exactly what they're looking at.

### 3. Design system documentation a frontend dev can follow

Produce a single `DESIGN_SYSTEM.md` (or update the existing `DESIGN_SPEC.md`) covering — concretely, with copy-pasteable code:

- **Color tokens** as CSS variables, with the semantic role of each (page background, primary action, accent, etc.). Every value listed in `DESIGN_SPEC.md` §4.1 is exact — do not adjust.
- **Typography rules**, including the hard rule: **no Tailwind font-size, font-weight, or line-height utilities anywhere**. Set those via inline `style={{ fontFamily, fontSize, fontWeight, lineHeight }}` so Syne / DM Sans render consistently. List exact Syne / DM Sans sizes by role (hero mobile 40px, hero desktop 56px, section labels 14px UPPERCASE 0.5px tracking, money in Syne 800, etc.).
- **Radius scale**: inputs/buttons 10px, cards 14px, feature cards 16px, pills 20px.
- **Shadow scale**: card `0 2px 8px rgba(0,0,0,0.06)`; bottom-nav `0 -2px 8px rgba(0,0,0,0.06)`; floating pill `0 2px 10px rgba(0,0,0,0.08)`.
- **Focus ring**: global `*:focus-visible { outline: 2px solid var(--green-800); outline-offset: 2px }`.
- **Motion**: shimmer keyframes (the exact CSS is in `DESIGN_SPEC.md` §4.5), 1.4s ease-in-out infinite, dark variant for use over green headers, `prefers-reduced-motion` fallback to a static `--grey-100` fill.
- **Components inventory**: `RouteCard`, `VehicleIcon`, `BottomNav`, `DesktopSidebar`, `Layout`, `Skeleton` primitives, `LoadingPill`. Document props and the rules for when to use each.
- **Vehicle iconography**: per-vehicle SVG + token color (Danfo yellow, BRT blue, Keke red, Okada orange, Ferry teal, Uber dark).

A frontend developer reading this document alone, without seeing the mockups, must be able to build a screen that passes the acceptance checklist.

---

## Stack

- React + TypeScript (Next.js 14 App Router preferred; the existing scaffold uses Vite + React Router — keep whichever is already wired)
- Tailwind CSS v4 with CSS-variable tokens
- TanStack React Query for server state
- Zustand for saved-routes and device-id stores (localStorage-persisted)
- Axios for HTTP, with a mock-mode short-circuit gated by `NEXT_PUBLIC_USE_MOCK` (or `VITE_USE_MOCK`) — defaults to `true` so the app runs with no backend.
- `lucide-react` for standard icons
- `sonner` for toasts

Default to mock mode. The full app — including submit and verify flows — must work end-to-end with no backend running. Pending contributions persist to localStorage in mock mode.

---

## Screens you must deliver (mobile + desktop, each with all states from the table above)

1. **Home** — `/`
2. **Route List** — `/routes`
3. **Route Detail** — `/routes/:id`
4. **Fare Summary** — `/routes/:id/fare`
5. **Saved Routes** — `/saved`
6. **Contribute (add a route)** — `/contribute`
7. **Pending Contributions (verify)** — `/contribute/pending`

Critical behavior reminders (full detail in `DESIGN_SPEC.md` §6):

- **Contribute origin row** never renders a fare input. The first row shows an "ORIGIN" green-100 chip in place of the `₦` input. All later rows have a working `type="number" inputMode="numeric"` fare input.
- A live **Estimated total** card sits above the submit button on Contribute and updates as the user types.
- A submitted contribution lands in the **pending queue**, never the public routes list.
- **Verification only happens on `/contribute/pending`.** Live route cards never show confirm/reject controls. Threshold: 3 confirmations promote, 3 disputes reject. One vote per device id.
- The **Route Detail loading state** must include the centered "Loading route data…" white pill with a small green spinner over the timeline shimmer rows.

---

## Recommended workflow

1. **Read `DESIGN_SPEC.md` end-to-end** before writing code.
2. Set up the token system (`src/styles/theme.css`) and the shimmer keyframes first. Verify the focus ring works.
3. Build the shared primitives: `Layout`, `BottomNav`, `DesktopSidebar`, `RouteCard`, `VehicleIcon`, `Skeleton` family.
4. Implement screens in pairs — mobile + desktop together — and ship every state for the pair before moving on. This avoids the trap of "we'll do empty states at the end" (you won't).
5. After each pair, **resize the preview** to confirm the mobile and desktop variants swap cleanly at `lg:` and that no phone bezel has crept in.
6. Build a `/dev` index page (hidden from primary nav) that lists every screen × every state with a direct link. This makes review trivial.

---

## Done means

- [ ] All 7 screens, mobile + desktop layouts, all 6 states each — every variant reachable and labelled.
- [ ] Resizing the viewport flips mobile ↔ desktop at `lg:`. Bottom nav and sidebar never co-exist.
- [ ] **No phone bezel, status bar, notch, or fake device frame anywhere in the rendered app.** `body` background fills the viewport. Edge-to-edge on mobile.
- [ ] Skeleton uses the shimmer sweep (not opacity pulse). Route Detail loading matches the mockup including the "Loading route data…" pill.
- [ ] Contribute origin row is a chip, not an input. Estimated total updates live. Submission goes to the pending queue.
- [ ] `/contribute/pending` is the only verification surface.
- [ ] Mock mode runs the app fully without a backend; pending contributions persist across refresh.
- [ ] `DESIGN_SYSTEM.md` is comprehensive enough that a developer who has never seen the mockups can build a new screen that passes review.
- [ ] No Tailwind `text-{size}`, `font-{weight}`, `leading-{x}` utilities anywhere.
- [ ] WCAG AA: focus rings visible, aria labels on icon buttons, `aria-pressed` on filter pills, `prefers-reduced-motion` respected.

---

---

## Additional deliverables: design doc + ticket breakdown for a junior dev

Before you write any feature code, produce two planning artifacts in the repo root.

### 1. `DESIGN_DOC.md`

A standalone engineering design doc — not a copy of `DESIGN_SPEC.md`, which is the contract. The design doc explains **how you intend to build it**:

- **Goal & non-goals** (1 paragraph each).
- **Architecture overview**: module boundaries, where mock-mode lives, how the desktop/mobile layout split is wired, where Zustand stores sit, how React Query keys are organized.
- **Data flow**: backend wire format → `transformRoute()` → frontend types → React Query cache → components. Diagram in ASCII or Mermaid.
- **Component hierarchy**: tree of pages → layouts → shared primitives.
- **State decisions**: what lives in Zustand, what lives in React Query, what stays as local component state, and why.
- **Open questions / risks**: anything ambiguous in the spec, anything you'd flag to a tech lead.
- **Rollout plan**: the order tickets ship in (mirrors the ticket list below).

Keep it ≤ 3 pages. It is a working document, not a novel.

### 2. `TICKETS.md` — junior-dev-sized tickets

Break the implementation into a sequenced backlog. Calibrate each ticket so that:

- **A junior dev can finish it in roughly half a day to a day and a half.** Smaller than that becomes busywork; larger becomes "where do I start?"
- **Each ticket ships visible progress** — by the end, something new is on screen, in the design system, or in CI. No tickets that are pure setup with nothing to show. If setup is required, bundle it with the first piece of UI it unblocks.
- **Each ticket has one owner-shaped chunk of work.** Don't combine "build Home mobile" and "build Home desktop" into one ticket; they're two tickets.

Ticket format (use this verbatim):

```markdown
### TICKET-### — Short imperative title

**Why**: One sentence on user/dev value.
**Scope**: 3–6 bullets describing exactly what's in. Reference files to create/edit.
**Out of scope**: 1–3 bullets describing what someone might think is in but isn't.
**Acceptance criteria**: 3–6 checkboxes a reviewer can verify by clicking around or running a command.
**Depends on**: TICKET-### (or "none").
**Estimated**: S (≤ half day) / M (~1 day) / L (1–1.5 days). Anything bigger should be split.
```

Suggested rough sequencing (adapt as you see fit, but the spirit holds):

1. Token system + global styles + focus ring (S).
2. Shimmer keyframes + `Skeleton` primitives + `LoadingPill` (S).
3. `Layout`, `BottomNav`, `DesktopSidebar` shells with placeholder content (M).
4. `RouteCard` + `VehicleIcon` + mock route fixtures (M).
5. Home mobile — default + loading + empty states (M).
6. Home desktop — default + loading + empty states (M).
7. Route List mobile — all states (M).
8. Route List desktop — all states (M).
9. Route Detail mobile — including the "Loading route data…" pill (L).
10. Route Detail desktop (M).
11. Fare Summary mobile + desktop (M).
12. Saved mobile + desktop, including the dashed-circle empty state (M).
13. Contribute mobile — form, origin chip, live Estimated total, success screen (L).
14. Contribute desktop (M).
15. Pending Contributions queue + verification logic + localStorage persistence (L).
16. Pending Contributions desktop (M).
17. `/dev` index page listing every screen × every state for review (S).
18. Accessibility pass — focus rings, aria audit, `prefers-reduced-motion`, contrast (M).
19. Mock-mode → real-API toggle wiring + README (S).

For each ticket also include:
- A **"Junior-dev hints"** subsection (2–4 bullets) calling out the specific files in `DESIGN_SPEC.md` to consult, the gotcha most likely to bite (e.g. "don't use Tailwind `text-xl` — see Typography rules"), and any utility they should reach for instead of writing fresh.
- A **"How to demo"** subsection (1–2 bullets) describing exactly what to show in standup so the team can confirm it's done — e.g. "Resize the browser past 1024px and watch the layout swap; click into a route from Popular Routes and confirm the loading pill appears."

The ticket list is itself a deliverable — a tech lead should be able to drop the file straight into Linear / Jira / GitHub Issues with minimal massaging.

---

When mockups and `DESIGN_SPEC.md` disagree, mockups win for layout and `DESIGN_SPEC.md` wins for behavior, data, and tokens. When in doubt about whether something visible in a mockup is "real UI" or "presentation chrome," apply this test: **would a real EkoFare user on a real phone see this?** A status bar showing "9:41" — no, the OS draws that. A black rounded device frame — no, that's the phone itself. A green header with a back button — yes, build it.

Build it exactly. Ask no clarifying questions; the spec and mockups are the contract.
