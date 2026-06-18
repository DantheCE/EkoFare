// ─────────────────────────────────────────────────────────────────────────────
// k6 load test (build spec §13). Exercises the read-heavy route surface plus a
// trickle of writes, the way real traffic hits the board. The point is to prove
// the cache + in-memory pathfinding hold up: with the cache warm, computed
// routes should serve well under target latency even as load ramps.
//
// Run against a seeded API:
//   pnpm db:seed
//   pnpm dev            # in another shell (or point BASE_URL at a deploy)
//   k6 run load/load-test.k6.js
//   BASE_URL=https://api.example.com k6 run load/load-test.k6.js
// ─────────────────────────────────────────────────────────────────────────────

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '20s', target: 20 }, // ramp up
    { duration: '40s', target: 50 }, // sustained load
    { duration: '20s', target: 0 }, // ramp down
  ],
  thresholds: {
    // Cached/computed reads should be fast; allow headroom for the write path.
    http_req_duration: ['p(95)<400'],
    errors: ['rate<0.01'],
    http_req_failed: ['rate<0.01'],
  },
};

// A few seeded journeys the pathfinder must stitch on the fly.
const FINDS = [
  ['Ikeja', 'TBS'],
  ['Ikeja', 'CMS'],
  ['Oshodi', 'Festac'],
  ['Maryland', 'CMS'],
];
const STOPS = ['Oshodi', 'CMS', 'Ikeja', 'Yaba'];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function () {
  // 1. The board (the most-hit endpoint; should be cache-warm).
  const board = http.get(`${BASE_URL}/routes`);
  check(board, { 'board 200': (r) => r.status === 200 }) || errorRate.add(1);

  // 2. A computed point-to-point route.
  const [from, to] = pick(FINDS);
  const find = http.get(`${BASE_URL}/routes/find?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
  check(find, { 'find ok': (r) => r.status === 200 || r.status === 404 }) || errorRate.add(1);

  // 3. Routes through a stop (transfer planning).
  const stop = pick(STOPS);
  const through = http.get(`${BASE_URL}/stops/${encodeURIComponent(stop)}/routes`);
  check(through, { 'stop routes ok': (r) => r.status === 200 || r.status === 404 }) || errorRate.add(1);

  // 4. Occasional write (5% of iterations), unique fingerprint to dodge the
  //    rate limiter and the 24h dedupe.
  if (Math.random() < 0.05) {
    const fp = `k6-${__VU}-${__ITER}`;
    const body = JSON.stringify({
      submitted_name: 'Load test route',
      vehicle: 'DANFO',
      stops: [
        { name: 'Ikeja', leg_fare: 0 },
        { name: 'Oshodi', leg_fare: 300 },
      ],
    });
    const post = http.post(`${BASE_URL}/contributions`, body, {
      headers: { 'Content-Type': 'application/json', 'X-EkoFare-Fingerprint': fp },
    });
    check(post, { 'contribute ok/limited': (r) => r.status === 201 || r.status === 429 }) || errorRate.add(1);
  }

  sleep(1);
}
