export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-md bg-surface-container-high dark:bg-surface-dim ${className}`} />;
}

export function BriefCardSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 dark:bg-surface-container-low">
      <Skeleton className="h-12 w-12 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-6 w-16" />
    </div>
  );
}

export function BriefListSkeleton({ count = 5 }) {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <BriefCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function FieldSkeleton() {
  return (
    <div className="rounded-lg border border-outline-variant p-stack-md">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="mt-2 h-3 w-4/5" />
    </div>
  );
}

export function AnalysisSkeleton() {
  return (
    <div className="mt-stack-lg space-y-stack-lg">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="mt-2 h-4 w-32" />
        </div>
        <Skeleton className="h-32 w-32 rounded-full" />
      </div>
      <div className="grid gap-stack-md sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <FieldSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function ProgressIndicator({ steps = [] }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
              step.done ? "bg-primary text-on-primary" : step.active ? "bg-primary-container text-on-primary-container" : "bg-surface-container text-on-surface-variant"
            }`}
          >
            {step.done ? "✓" : i + 1}
          </div>
          <span className={`text-xs ${step.active ? "text-primary font-medium" : "text-on-surface-variant"}`}>
            {step.label}
          </span>
          {i < steps.length - 1 && <div className="h-px w-6 bg-outline-variant" />}
        </div>
      ))}
    </div>
  );
}
