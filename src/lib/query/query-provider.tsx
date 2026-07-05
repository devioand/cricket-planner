"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * App-wide React Query client. One instance per browser session (lazy `useState`
 * init keeps it stable across re-renders and avoids sharing a client between
 * requests during SSR). React Query owns the sync/finish mutation lifecycle.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
