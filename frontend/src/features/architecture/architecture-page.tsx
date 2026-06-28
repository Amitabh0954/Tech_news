export function ArchitecturePage() {
  return (
    <section className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Architecture Overview</h1>
        <p className="text-sm text-slate-600">
          This placeholder view is ready for the new ingestion, processing, and storage layers.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="font-medium">Ingestion</h2>
          <p className="mt-2 text-sm text-slate-600">Providers collect raw content.</p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="font-medium">Processing</h2>
          <p className="mt-2 text-sm text-slate-600">LLM and ranking services enrich stories.</p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="font-medium">Storage</h2>
          <p className="mt-2 text-sm text-slate-600">Raw and processed data are separated.</p>
        </div>
      </div>
    </section>
  );
}
