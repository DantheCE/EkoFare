// ─────────────────────────────────────────────────────────────────────────────
// Single Axios instance (Spec §2 / §7). One baseURL, one interceptor that
// attaches the anonymous fingerprint header so rate-limiting parity holds
// against the real backend. Components never import axios directly — they call
// the typed functions in ./routes.ts, which switch on NEXT_PUBLIC_USE_MOCKS.
// ─────────────────────────────────────────────────────────────────────────────

import axios from 'axios';
import { getFingerprint } from '../fingerprint';

export const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS !== 'false';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  config.headers.set('X-EkoFare-Fingerprint', getFingerprint());
  return config;
});

/** Simulated network latency so the loading/skeleton states are observable. */
export function mockLatency(ms = 350): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
