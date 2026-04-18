import { cn } from "@/lib/utils";

/**
 * Skeleton — shimmer placeholder used in place of spinners for
 * list/grid pages. Cheaper cognitive load than a whirling circle:
 * the page layout is already locked in when data arrives.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-workon-bg-cream",
        className,
      )}
    />
  );
}

/** Ready-made card skeleton — matches the shape of a typical list item. */
export function SkeletonCard({
  className,
  lines = 2,
}: {
  className?: string;
  lines?: number;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-white border border-workon-border p-4 space-y-3 shadow-sm",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <Skeleton className="h-12 w-12 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-3 w-full" />
      ))}
    </div>
  );
}

/** Worker carousel skeleton — mirrors the rich WorkerCard compact layout. */
export function SkeletonWorkerCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-white border border-workon-border p-3 space-y-2.5 shadow-sm",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <Skeleton className="h-20 w-20 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <Skeleton className="h-3 w-2/3" />
      <div className="flex gap-1.5">
        <Skeleton className="aspect-square flex-1 rounded-md" />
        <Skeleton className="aspect-square flex-1 rounded-md" />
        <Skeleton className="aspect-square flex-1 rounded-md" />
      </div>
      <Skeleton className="h-9 w-full rounded-lg" />
      <Skeleton className="h-9 w-full rounded-lg" />
    </div>
  );
}
