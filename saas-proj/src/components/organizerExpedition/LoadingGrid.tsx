export default function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm"
        >
          <div className="aspect-[16/10] w-full animate-pulse bg-stone-100" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-3/4 animate-pulse rounded bg-stone-100" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-stone-100" />
            <div className="h-12 w-full animate-pulse rounded bg-stone-100" />
            <div className="h-9 w-full animate-pulse rounded bg-stone-100" />
          </div>
        </div>
      ))}
    </div>
  );
}