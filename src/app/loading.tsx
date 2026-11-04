// Shown for a moment while a page loads its data.
export default function Loading() {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]" aria-busy="true" aria-label="Loading">
      <aside className="hidden border-r border-line bg-wash lg:block" />
      <div className="mx-auto w-full max-w-5xl space-y-5 px-4 py-5 lg:px-8 lg:py-8">
        <div className="flex items-center justify-between">
          <div className="shimmer h-9 w-9 rounded-xl" />
          <div className="shimmer h-8 w-44 rounded-full" />
        </div>
        <div className="shimmer h-7 w-40 rounded-lg" />
        <div className="shimmer h-52 rounded-[20px]" />
        <div className="shimmer h-14 rounded-xl" />
        <div className="space-y-3 pt-2">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="shimmer h-10 w-10 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="shimmer h-3.5 w-2/5 rounded" />
                <div className="shimmer h-3 w-1/4 rounded" />
              </div>
              <div className="shimmer h-4 w-20 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
