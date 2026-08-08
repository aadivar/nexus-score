import Link from 'next/link';

export function DataEnvironmentNotice({ className = '' }: { className?: string }) {
  return (
    <aside className={`rounded-xl border border-blue-200 bg-blue-50/80 p-5 shadow-sm ${className}`} aria-label="Current data environment and roadmap">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Current data environment</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            This implementation begins with{' '}
            <a
              href="https://www.crossref.org/documentation/reports/participation-reports/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-blue-800 underline decoration-blue-300 underline-offset-2 hover:decoration-blue-700"
            >
              Crossref Participation Report
            </a>{' '}
            coverage data exposed through the Crossref <code className="rounded bg-white px-1.5 py-0.5 text-xs text-slate-700">/members</code> API.
          </p>
        </div>
        <div className="max-w-sm border-t border-blue-200 pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700">Evolving architecture</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Nexus is designed to extend to other scholarly metadata and research-information environments as source-specific mappings are validated.
          </p>
          <Link href="/about#future-directions" className="mt-2 inline-flex text-sm font-semibold text-indigo-700 hover:underline">
            Explore future directions →
          </Link>
        </div>
      </div>
    </aside>
  );
}
