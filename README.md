# EkoFare 🚍

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue)
![Live](https://img.shields.io/badge/Live-eko--fare--web.vercel.app-brightgreen)

A crowdsourced Lagos public-transit fare reference app — **know your fare before you board**.

📍 **Live Demo:** [eko-fare-web.vercel.app](https://eko-fare-web.vercel.app/)

---

## 🚦 What is EkoFare?

Navigating Lagos public transit can be unpredictable. A Danfo bus, BRT, Keke Napep, or Okada ride between the exact same two stops can cost different amounts depending on the driver, the time of day, or traffic conditions. Commuters frequently overpay simply because they don't know the going rate.

**EkoFare** solves this by acting like a community-driven fare ledger:
1. **Search Before You Board:** Look up a route to see the median price that other commuters recently paid.
2. **Contribute Your Fare:** After your trip, quickly log what you paid to keep the community data fresh.
3. **Self-Correcting:** The system automatically filters out extreme outlier prices, ensuring the displayed fare is highly accurate and trustworthy.

---

## ✨ Features

- **Multi-Modal Transit:** Supports Danfo, BRT, Keke, Okada, Ferry, and Rideshare.
- **Smart Pathfinding:** The backend computes multi-stop transfer routes dynamically, even if no single user has submitted that exact full journey before.
- **Lagos-Native Design:** A vibrant, dark-mode-first UI ("Danfo Board") inspired by the colors and feel of Lagos transit.
- **Lightning Fast:** Built on Next.js 16 and heavily cached via Redis to handle massive commuter traffic spikes without breaking a sweat.

---

## 🛠️ Tech Stack

EkoFare is built as a robust, scalable monorepo.

**Frontend (`apps/web`)**
- Next.js 16 (App Router) & React 19
- Tailwind CSS v4 & custom design tokens
- TanStack Query v5 & Zustand for state management
- Framer Motion for micro-animations

**Backend (`apps/api`)**
- Node.js & Express API
- PostgreSQL (via Prisma & Neon) for relational storage
- Redis (via ioredis) for rate-limiting and high-speed graph caching
- In-memory Dijkstra algorithm for intelligent route pathfinding

---

## 🚀 Getting Started (Local Development)

You can run EkoFare locally in just a few minutes. 

### Option 1: Frontend Only (Mock Mode)
Want to just poke around the UI? You can run the app entirely in memory without setting up a database.

```bash
git clone https://github.com/DantheCE/EkoFare.git && cd EkoFare
pnpm install
pnpm --filter web dev
```
Open [http://localhost:3000](http://localhost:3000) to see the app running with mock transit data.

### Option 2: Full-Stack (API + Database)
To run the full Node.js API alongside PostgreSQL and Redis:

1. **Start the Infrastructure:**
   ```bash
   pnpm --filter @ekofare/api infra:up
   ```
2. **Configure Environment Variables:**
   ```bash
   cp apps/api/.env.example apps/api/.env
   # Update DATABASE_URL and REDIS_URL in the newly created .env file
   ```
3. **Migrate & Seed the Database:**
   ```bash
   pnpm --filter @ekofare/api db:migrate
   pnpm --filter @ekofare/api db:seed
   ```
4. **Start the API:**
   ```bash
   pnpm --filter @ekofare/api dev
   ```
5. **Start the Frontend (Connected to API):**
   ```bash
   # In apps/web/.env.local, set NEXT_PUBLIC_USE_MOCKS=false
   pnpm --filter web dev
   ```

---

## 🧪 Testing

The codebase is heavily tested across both environments.

```bash
# Frontend Tests
pnpm --filter web test
pnpm --filter web test:e2e

# Backend Tests
pnpm --filter @ekofare/api test
pnpm --filter @ekofare/api test:int
```

## 🤝 Contributing

We welcome contributions from the community! Whether you want to improve the pathfinding algorithm, add new transit modes, or tweak the UI, feel free to open a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License.
