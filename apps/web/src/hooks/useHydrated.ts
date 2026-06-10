'use client';

import { useSyncExternalStore } from 'react';

// True only after client hydration. Used to gate persisted (localStorage) state
// so the server-rendered empty state never flashes — without a setState effect.
const noopSubscribe = () => () => {};

export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true, // client snapshot
    () => false, // server snapshot
  );
}
