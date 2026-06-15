"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

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
  // Lazy state initializer creates the client exactly once per mount without
  // touching a ref during render (react-hooks/refs).
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 5-minute stale time globally — individual hooks can override
            staleTime: 5 * 60 * 1000,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      {children}
    </QueryClientProvider>
  );
}
