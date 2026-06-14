export default function AppLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Page title area */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-48 rounded-lg bg-slate-200" />
          <div className="h-4 w-72 rounded bg-slate-100" />
        </div>
        <div className="h-9 w-32 rounded-lg bg-slate-200" />
      </div>

      {/* KPI cards row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
            <div className="h-3 w-20 rounded bg-slate-100" />
            <div className="h-7 w-28 rounded bg-slate-200" />
            <div className="h-3 w-16 rounded bg-slate-100" />
          </div>
        ))}
      </div>

      {/* Main content area */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        {/* Table header */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-4">
          <div className="h-4 w-24 rounded bg-slate-200" />
          <div className="h-4 w-16 rounded bg-slate-100" />
          <div className="ml-auto h-8 w-28 rounded-lg bg-slate-100" />
        </div>
        {/* Table rows */}
        {[...Array(6)].map((_, i) => (
          <div key={i} className="px-5 py-3.5 flex items-center gap-4 border-b border-slate-50 last:border-0">
            <div className="h-3 w-3 rounded-full bg-slate-200 shrink-0" />
            <div className="h-4 rounded bg-slate-200" style={{ width: `${45 + (i % 3) * 12}%` }} />
            <div className="ml-auto h-4 w-20 rounded bg-slate-100" />
            <div className="h-4 w-16 rounded bg-slate-200" />
          </div>
        ))}
      </div>

      {/* Second block (charts / second section) */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
          <div className="h-4 w-32 rounded bg-slate-200" />
          <div className="h-32 rounded-lg bg-slate-100" />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
          <div className="h-4 w-28 rounded bg-slate-200" />
          <div className="space-y-2.5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-slate-200 shrink-0" />
                <div className="h-3 flex-1 rounded bg-slate-100" />
                <div className="h-3 w-12 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
