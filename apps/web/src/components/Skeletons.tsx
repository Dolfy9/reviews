export function ProductCardSkeleton() {
  return (
    <div className="card p-6">
      <div className="skeleton h-5 w-3/4" />
      <div className="skeleton mt-3 h-4 w-full" />
      <div className="skeleton mt-2 h-4 w-2/3" />
      <div className="mt-5 flex items-center justify-between">
        <div className="skeleton h-6 w-16" />
        <div className="skeleton h-4 w-20" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ReviewSkeleton() {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div className="skeleton h-5 w-1/3" />
        <div className="skeleton h-8 w-8 rounded-full" />
      </div>
      <div className="skeleton mt-3 h-4 w-full" />
      <div className="skeleton mt-2 h-4 w-4/5" />
      <div className="mt-4 flex gap-3">
        <div className="skeleton h-4 w-16" />
        <div className="skeleton h-4 w-16" />
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="card p-8">
      <div className="skeleton h-8 w-1/2" />
      <div className="skeleton mt-4 h-5 w-full" />
      <div className="skeleton mt-2 h-5 w-3/4" />
      <div className="mt-6 flex items-center gap-8 border-t border-slate-100 pt-6 dark:border-slate-800/50">
        <div className="skeleton h-8 w-24" />
        <div className="skeleton h-5 w-32" />
      </div>
    </div>
  );
}
