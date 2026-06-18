"use client";

import { QueryClient, QueryClientProvider, QueryCache } from "@tanstack/react-query";
import { useState } from "react";
import axios from "axios";
import { toast } from "../../store/useToast";

// A NO_ROUTE_FOUND / STOP_NOT_FOUND from the route endpoints (real API), or the
// mock layer's "Route not found" throw, both map to the same user message.
function isNoRouteError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    const code = (error.response?.data as { error?: string } | undefined)?.error;
    return code === "NO_ROUTE_FOUND" || code === "STOP_NOT_FOUND";
  }
  return error instanceof Error && error.message.startsWith("Route not found");
}

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
        // Surface query failures as toasts: NO_ROUTE_FOUND gets a precise
        // message; any other failure while cached data is still held means we're
        // serving stale/offline data, so we say so without hiding it.
        queryCache: new QueryCache({
          onError: (error, query) => {
            if (isNoRouteError(error)) {
              toast.error("No route found between those stops");
              return;
            }
            if (query.state.data !== undefined) {
              toast.error("No connection — showing saved data");
            }
          },
        }),
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
