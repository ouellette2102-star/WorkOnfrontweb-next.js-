export function FeedSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-workon-border bg-workon-bg p-6">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-workon-border" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/3 rounded-full bg-workon-border" />
          <div className="h-3 w-1/4 rounded-full bg-workon-border" />
        </div>
        <div className="h-3 w-12 rounded-full bg-workon-border" />
      </div>
      <div className="mt-6 space-y-3">
        <div className="h-3 w-2/3 rounded-full bg-workon-border" />
        <div className="h-3 w-3/4 rounded-full bg-workon-border" />
        <div className="h-3 w-1/2 rounded-full bg-workon-border" />
        <div className="h-64 rounded-2xl bg-workon-border" />
      </div>
    </div>
  );
}
