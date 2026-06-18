# Deploying the EkoFare API (free stack)

API on **Render** (free web service) · Postgres on **Neon** (free) · Redis on
**Upstash** (free). The frontend stays on Vercel; the last step flips it from
mock data to this live API.

> Free Render web services sleep after ~15 min idle, so the first request after a
> quiet spell waits for a cold start (~30–60s). The API self-warms on boot
> (reloads the graph, rebuilds the featured board).

---

## 1. Postgres — Neon

1. Create a project at [neon.tech](https://neon.tech) (region: **AWS eu-central-1 / Frankfurt** for the lowest latency to Render Frankfurt).
2. Copy the **direct** connection string (the one *without* `-pooler` in the host). It looks like:
   `postgresql://USER:PASSWORD@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require`
   - Use the direct (non-pooled) string so Prisma migrations run cleanly.
3. `pg_trgm` is created by our migration (`CREATE EXTENSION IF NOT EXISTS pg_trgm`); Neon allows it, no manual step.

## 2. Redis — Upstash

1. Create a Redis database at [upstash.com](https://upstash.com) (region: **EU / Frankfurt**).
2. Copy the **TLS** connection URL (starts with `rediss://`):
   `rediss://default:PASSWORD@xxx.upstash.io:6379`
   - `ioredis` enables TLS automatically for `rediss://`; no extra config.

## 3. API — Render

1. Push this branch and merge to `main` (the blueprint deploys from `main`).
2. In Render: **New → Blueprint**, connect this repo. Render reads [`render.yaml`](../../render.yaml) and provisions the `ekofare-api` web service.
3. Set the two secret env vars when prompted (they're `sync: false`):
   - `DATABASE_URL` → the Neon direct string from step 1.
   - `REDIS_URL` → the Upstash `rediss://` URL from step 2.
   - `JWT_SECRET` is auto-generated; `NODE_ENV=production` is set by the blueprint.
4. Deploy. The build runs `prisma migrate deploy` + `db:seed` (idempotent), so the
   board is populated on first boot.

### Verify

```bash
curl https://ekofare-api.onrender.com/health
# → {"status":"ok","db":"up","redis":"up"}

curl "https://ekofare-api.onrender.com/routes/find?from=Ikeja&to=TBS"
# → a computed (stitched) Route
```

## 4. Cutover — point the frontend at the live API

In the **Vercel** project (apps/web), set env vars and redeploy:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_USE_MOCKS` | `false` |
| `NEXT_PUBLIC_API_BASE_URL` | `https://ekofare-api.onrender.com` |

Redeploy the frontend. It now reads live data.

---

## Notes / optional

- **Admin login:** the env admin is optional. To enable it, set `ADMIN_EMAIL` and
  `ADMIN_PASSWORD_HASH` (a bcrypt hash) on Render, or seed an `AdminUser` row.
  Generate a hash locally: `node -e "console.log(require('bcryptjs').hashSync('YOUR_PW',10))"`.
- **Re-seeding:** `db:seed` runs on every deploy and is idempotent (tops up to
  target report counts; never duplicates). Remove it from `render.yaml`'s
  `buildCommand` if you'd rather seed once and let real contributions take over.
- **CORS:** the API currently allows all origins. Tighten to the Vercel domain in
  `app.ts` (`cors({ origin: ... })`) if you want to lock it down.
- **Load test:** `pnpm --filter @ekofare/api load` (needs [k6](https://k6.io)
  installed); point it at the deploy with `BASE_URL=https://… k6 run load/load-test.k6.js`.
