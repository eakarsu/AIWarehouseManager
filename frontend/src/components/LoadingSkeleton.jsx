const shimmer = 'animate-pulse bg-gray-200 rounded';

function SkeletonLine({ className = '' }) {
  return <div className={`${shimmer} h-4 ${className}`} />;
}

function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
      <div className={`${shimmer} h-40 w-full rounded-lg`} />
      <SkeletonLine className="w-3/4" />
      <SkeletonLine className="w-1/2" />
      <div className="flex gap-2 pt-2">
        <div className={`${shimmer} h-8 w-20 rounded-lg`} />
        <div className={`${shimmer} h-8 w-20 rounded-lg`} />
      </div>
    </div>
  );
}

function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="grid gap-4 px-6 py-4 border-b border-gray-200" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className={`${shimmer} h-4 rounded`} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="grid gap-4 px-6 py-4 border-b border-gray-100 last:border-0"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <SkeletonLine key={colIdx} className={colIdx === 0 ? 'w-3/4' : 'w-full'} />
          ))}
        </div>
      ))}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      {/* Title */}
      <div className="flex items-center gap-4">
        <div className={`${shimmer} h-16 w-16 rounded-xl`} />
        <div className="flex-1 space-y-2">
          <SkeletonLine className="w-1/3 h-6" />
          <SkeletonLine className="w-1/4" />
        </div>
      </div>
      {/* Image placeholder */}
      <div className={`${shimmer} h-64 w-full rounded-lg`} />
      {/* Content lines */}
      <div className="space-y-3">
        <SkeletonLine className="w-full" />
        <SkeletonLine className="w-5/6" />
        <SkeletonLine className="w-4/6" />
      </div>
      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2 p-4 bg-gray-50 rounded-lg">
            <SkeletonLine className="w-1/2 h-3" />
            <SkeletonLine className="w-3/4 h-6" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LoadingSkeleton({ variant = 'card', count = 1, ...props }) {
  const Component = {
    card: CardSkeleton,
    table: TableSkeleton,
    detail: DetailSkeleton,
  }[variant] || CardSkeleton;

  if (variant === 'table' || variant === 'detail') {
    return <Component {...props} />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <Component key={i} {...props} />
      ))}
    </div>
  );
}
