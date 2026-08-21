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
    defaultPreloadDelay: 0,
    defaultPreloadStaleTime: 30_000,
    // Mantém a página atual até a próxima estar pronta. O esqueleto só entra
    // se o chunk realmente demorar; a barra fina do AppShell já indica o trânsito.
    defaultPendingMs: 1200,
    defaultPendingMinMs: 0,
    defaultPendingComponent: RoutePendingFallback,
  });

  return router;
};
