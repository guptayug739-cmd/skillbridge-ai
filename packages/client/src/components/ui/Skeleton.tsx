export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-shimmer bg-gradient-to-r from-gray-100 via-gray-200/80 to-gray-100 bg-[length:200%_100%] rounded-lg ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-6">
      <div className="flex items-center gap-5">
        <Skeleton className="w-20 h-20 rounded-full" />
        <div className="space-y-3 flex-1">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-11/12" />
      <Skeleton className="h-3 w-4/5" />
      <div className="grid grid-cols-3 gap-4 pt-2">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="text-center space-y-2">
      <Skeleton className="h-10 w-24 mx-auto" />
      <Skeleton className="h-4 w-32 mx-auto" />
    </div>
  );
}
