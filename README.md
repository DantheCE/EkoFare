# EkoFare

A public transit fare reference application for Lagos. Users can lookup fares, plan multi-leg trips, and contribute crowd-sourced data.

## Features

- Fare lookup for various vehicle types (Danfo, BRT, Train, etc.)
- Multi-leg trip planning
- Save frequent routes locally (no account required)
- Crowd-sourced fare verification and contributions

## Current Status

- ✅ **TICKET-009**: Route Detail Mobile implemented (Interactive timeline, Fare Dock, Reversed stops).
- 🚧 **TICKET-010**: Route Detail Desktop (Pending).

## Tech Stack

- **Frontend:** Next.js 14 (App Router), Tailwind CSS v4, Zustand
- **Backend:** Express, Prisma, PostgreSQL (optional)
- **Shared:** Shared TypeScript types package

## Getting Started

### Prerequisites

- Node.js (>=20)
- pnpm

### Installation

```bash
pnpm install
```

### Running the App

Start the development server:

```bash
pnpm dev
```

The web application will be available at `http://localhost:3000`.

## Development

### Mock Mode

By default, the application runs in mock mode using in-memory fixtures. This is controlled by the environment variable:

```
NEXT_PUBLIC_USE_MOCK=true
```

To connect to a live backend, set this to `false` and provide the `NEXT_PUBLIC_API_BASE_URL`.

### Project Structure

- `apps/web`: Next.js frontend application
- `apps/api`: Express backend application
- `packages/types`: Shared TypeScript definitions

### Component Dev Lab

A dedicated development lab index is available to preview every UI screen across all its states (e.g., Loading, Empty, Error) without needing to trigger actual network conditions.
- Navigate to **`http://localhost:3000/dev`**
- Or use the keyboard shortcut: **`Shift + D`** from anywhere in the app.
