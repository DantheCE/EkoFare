import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─────────────────────────────────────────────────────────────────────────────
// deviceStore — stable anonymized device id for one-vote-per-device gating
// Key: ekofare.device
// ─────────────────────────────────────────────────────────────────────────────

interface DeviceState {
  /** UUID v4, generated once on first run via crypto.randomUUID(). */
  deviceId: string;
}

export const useDeviceStore = create<DeviceState>()(
  persist(
    () => ({
      // crypto.randomUUID() is available in all modern browsers (and in Node ≥ 19).
      // No external UUID library needed.
      deviceId: typeof crypto !== 'undefined' ? crypto.randomUUID() : 'ssr-placeholder',
    }),
    {
      name: 'ekofare.device',
    },
  ),
);
