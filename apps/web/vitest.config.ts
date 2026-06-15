import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Gate tests (Spec / AGENTS.md): deterministic, local, free, <2s. jsdom env for
// component tests; pure fare math runs without a DOM.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    css: false,
  },
});
