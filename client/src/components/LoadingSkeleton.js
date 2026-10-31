export function SkeletonBlock({ className = "" }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-md bg-white/[0.06] ${className}`}
    />
  );
}

export function PageSkeleton({ label = "Loading page" }) {
  return (
    <div className="min-h-screen bg-ink" role="status" aria-label={label} aria-busy="true">
      <div className="border-b border-white/10 px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <SkeletonBlock className="h-8 w-32" />
          <div className="flex gap-2">
            <SkeletonBlock className="h-10 w-20" />
            <SkeletonBlock className="h-10 w-24" />
          </div>
        </div>
      </div>
      <main className="mx-auto max-w-5xl space-y-6 px-5 py-10 sm:px-8">
        <SkeletonBlock className="h-8 w-56" />
        <SkeletonBlock className="h-4 w-80 max-w-full" />
        <div className="grid gap-3 sm:grid-cols-2">
          <SkeletonBlock className="h-24 w-full rounded-xl" />
          <SkeletonBlock className="h-24 w-full rounded-xl" />
        </div>
        <SkeletonBlock className="h-20 w-full rounded-xl" />
        <SkeletonBlock className="h-20 w-full rounded-xl" />
      </main>
    </div>
  );
}

export function AuthSkeleton({ label = "Loading form" }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-5 py-12" role="status" aria-label={label} aria-busy="true">
      <div className="w-full max-w-md space-y-5 rounded-2xl border border-white/10 bg-surface p-6 sm:p-8">
        <SkeletonBlock className="h-4 w-32" />
        <SkeletonBlock className="h-9 w-56 max-w-full" />
        <SkeletonBlock className="h-4 w-full" />
        <SkeletonBlock className="h-12 w-full rounded-lg" />
        <SkeletonBlock className="h-12 w-full rounded-lg" />
        <SkeletonBlock className="h-11 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function ListSkeleton({ label = "Loading items", rows = 3 }) {
  return (
    <div className="space-y-3" role="status" aria-label={label} aria-busy="true">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-surface p-4">
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonBlock className="h-4 w-40 max-w-full" />
            <SkeletonBlock className="h-3 w-64 max-w-full" />
          </div>
          <SkeletonBlock className="h-9 w-20 shrink-0 rounded-md" />
        </div>
      ))}
    </div>
  );
}
