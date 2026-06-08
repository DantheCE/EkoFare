import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Reset DOM + persisted localStorage between tests so Zustand-persist state
// (saved routes, fingerprint) never leaks across cases.
afterEach(() => {
  cleanup();
  localStorage.clear();
});
