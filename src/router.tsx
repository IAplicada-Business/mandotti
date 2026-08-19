import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";

import { RoutePendingFallback } from "@/components/RoutePendingFallback";

import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        refetchOnWindowFocus: false,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 30_000,
    defaultPendingMs: 80,
    defaultPendingMinMs: 280,
    defaultPendingComponent: RoutePendingFallback,
  });

  return router;
};
