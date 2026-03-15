export default function Loading() {
  return (
    <main className="min-h-screen bg-slate-950">
      <div className="border-b border-slate-800 bg-slate-900/60 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-800" />
          <div className="mt-2 h-4 w-48 animate-pulse rounded bg-slate-800" />
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
              <div className="flex gap-2">
                <div className="h-5 w-20 animate-pulse rounded-full bg-slate-800" />
                <div className="h-5 w-24 animate-pulse rounded bg-slate-800" />
              </div>
              <div className="h-4 w-full animate-pulse rounded bg-slate-800" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-slate-800" />
              <div className="h-3 w-full animate-pulse rounded bg-slate-800" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-slate-800" />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
