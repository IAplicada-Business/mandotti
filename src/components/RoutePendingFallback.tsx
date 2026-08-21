import { Skeleton } from "@/components/ui/skeleton";

/** Só aparece se a rota nova demorar de verdade; a troca comum não passa por aqui. */
export function RoutePendingFallback() {
  return (
    <div className="space-y-6">
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
