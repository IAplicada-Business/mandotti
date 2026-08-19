import { Skeleton } from "@/components/ui/skeleton";

/** Feedback imediato enquanto a rota carrega — evita sensação de travamento ao trocar de menu. */
export function RoutePendingFallback() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="space-y-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-[320px] w-full rounded-2xl" />
      <Skeleton className="h-[240px] w-full rounded-2xl" />
    </div>
  );
}
