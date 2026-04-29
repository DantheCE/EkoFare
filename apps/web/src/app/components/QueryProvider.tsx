"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRef } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// QueryProvider
// Wraps the app in a React Query client. Declared as a client component so
// the server-component root layout can import it without error.
// The QueryClient is created once per component mount (useRef prevents
// re-creation across re-renders).
// ─────────────────────────────────────────────────────────────────────────────

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const clientRef = useRef<QueryClient | null>(null);
  if (!clientRef.current) {
    clientRef.current = new QueryClient({
      defaultOptions: {
        queries: {
          // 5-minute stale time globally — individual hooks can override
          staleTime: 5 * 60 * 1000,
          retry: 1,
        },
      },
    });
  }

  return (
    <QueryClientProvider client={clientRef.current}>
      {children}
    </QueryClientProvider>
  );
}
