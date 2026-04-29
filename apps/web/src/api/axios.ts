import axios from 'axios';
import type { BackendRoute, Contribution, ContributionPayload, VerificationResponse } from '@ekofare/types';
import { transformRoute } from '../utils/helpers';
import mockRoutesRaw from './mock/routes.json';

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== 'false';
const API_BASE  = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

// Cast the JSON import to the backend type
const mockRoutes = mockRoutesRaw as BackendRoute[];

/** Simulate network latency so skeletons are actually visible. */
function mockDelay(): Promise<void> {
  const ms = 200 + Math.random() * 200; // 200–400ms
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─────────────────────────────────────────────────────────────────────────────
// Axios instance
// ─────────────────────────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// ─────────────────────────────────────────────────────────────────────────────
// Mock helper — localStorage-backed pending contributions
// ─────────────────────────────────────────────────────────────────────────────

const PENDING_KEY = 'ekofare.pending';

function getPending(): Contribution[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(PENDING_KEY) ?? '[]') as Contribution[];
  } catch {
    return [];
  }
}

function setPending(contributions: Contribution[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(PENDING_KEY, JSON.stringify(contributions));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// API surface — used by page-level query hooks
// ─────────────────────────────────────────────────────────────────────────────

/** GET /api/routes?vehicle=all&q= */
export async function fetchRoutes(vehicle = 'all', q = '') {
  if (USE_MOCK) {
    await mockDelay();
    let results = mockRoutes.map(transformRoute);
    if (vehicle !== 'all') {
      results = results.filter((r) => r.vehicle === vehicle);
    }
    if (q.trim()) {
      const lower = q.toLowerCase();
      results = results.filter(
        (r) =>
          r.name.toLowerCase().includes(lower) ||
          r.from.toLowerCase().includes(lower) ||
          r.to.toLowerCase().includes(lower),
      );
    }
    return results;
  }

  const res = await api.get<{ data: BackendRoute[] }>('/api/routes', {
    params: { vehicle, q },
  });
  return res.data.data.map(transformRoute);
}

/** GET /api/routes/:id */
export async function fetchRoute(id: string) {
  if (USE_MOCK) {
    await mockDelay();
    const raw = mockRoutes.find((r) => String(r.id) === id);
    if (!raw) throw new Error('Route not found');
    return transformRoute(raw);
  }

  const res = await api.get<{ data: BackendRoute }>(`/api/routes/${id}`);
  return transformRoute(res.data.data);
}

/** GET /api/contributions?status=pending */
export async function fetchPendingContributions() {
  if (USE_MOCK) {
    await mockDelay();
    return getPending().filter((c) => c.status === 'pending');
  }

  const res = await api.get<{ data: Contribution[] }>('/api/contributions', {
    params: { status: 'pending' },
  });
  return res.data.data;
}

/** POST /api/contributions */
export async function submitContribution(payload: ContributionPayload): Promise<Contribution> {
  if (USE_MOCK) {
    await mockDelay();
    const contribution: Contribution = {
      id: crypto.randomUUID(),
      route_name: payload.route_name,
      vehicle: payload.vehicle,
      stops_data: payload.stops_data,
      notes: payload.notes,
      status: 'pending',
      confirmations: 0,
      disputes: 0,
      created_at: new Date().toISOString(),
      votedBy: [],
    };
    setPending([...getPending(), contribution]);
    return contribution;
  }

  const res = await api.post<{ data: Contribution }>('/api/contributions', payload);
  return res.data.data;
}

/** POST /api/contributions/:id/confirm */
export async function confirmContribution(id: string, deviceId: string): Promise<VerificationResponse> {
  if (USE_MOCK) {
    await mockDelay();
    const pending = getPending();
    const updated = pending.map((c) => {
      if (c.id !== id) return c;
      const confirmations = c.confirmations + 1;
      const isVerified = confirmations >= 3;
      return {
        ...c,
        confirmations,
        status: isVerified ? ('verified' as const) : ('pending' as const),
        isVerified,
        votedBy: [...c.votedBy, deviceId],
      };
    });
    setPending(updated);
    const found = updated.find((c) => c.id === id)!;
    return { success: true, confirmations: found.confirmations, isVerified: found.status === 'verified' };
  }

  const res = await api.post<{ data: VerificationResponse }>(`/api/contributions/${id}/confirm`);
  return res.data.data;
}

/** POST /api/contributions/:id/dispute */
export async function disputeContribution(id: string, deviceId: string): Promise<VerificationResponse> {
  if (USE_MOCK) {
    await mockDelay();
    const pending = getPending();
    const updated = pending.map((c) => {
      if (c.id !== id) return c;
      const disputes = (c.disputes ?? 0) + 1;
      const isRejected = disputes >= 3;
      return {
        ...c,
        disputes,
        status: isRejected ? ('rejected' as const) : ('pending' as const),
        votedBy: [...c.votedBy, deviceId],
      };
    });
    setPending(updated);
    const found = updated.find((c) => c.id === id)!;
    return { success: true, confirmations: found.confirmations, isVerified: false };
  }

  const res = await api.post<{ data: VerificationResponse }>(`/api/contributions/${id}/dispute`);
  return res.data.data;
}

export default api;
