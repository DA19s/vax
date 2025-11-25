"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { SystemSettingsProvider } from "@/contexts/SystemSettingsContext";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SystemSettingsProvider>
        <AuthProvider>
          <SettingsProvider>
            {children}
          </SettingsProvider>
        </AuthProvider>
      </SystemSettingsProvider>
    </QueryClientProvider>
  );
}