import Link from 'next/link';

export function DataEnvironmentNotice({ className = '' }: { className?: string }) {
  return (
    <aside className={`rounded-lg border border-brand-rule bg-brand-mist p-5 ${className}`} aria-label="Current data environment and roadmap">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-ink">Current data environment</p>
          <p className="mt-2 text-sm leading-6 text-brand-neutral">
            This implementation begins with{' '}
            <a
              href="https://www.crossref.org/documentation/reports/participation-reports/"
              target="_blank"
              rel="noopener noreferrer"
              className="brand-link rounded font-semibold underline"
            >
              Crossref Participation Report
            </a>{' '}
            coverage data exposed through the Crossref <code className="rounded bg-brand-paper px-1.5 py-0.5 font-brand-outlier text-xs text-brand-primary">/members</code> API.
          </p>
        </div>
        <div className="max-w-sm border-t border-brand-rule pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-muted">Evolving architecture</p>
          <p className="mt-2 text-sm leading-6 text-brand-neutral">
            Nexus is designed to extend to other scholarly metadata and research-information environments as source-specific mappings are validated.
          </p>
          <Link href="/about#future-directions" className="brand-link mt-2 inline-flex rounded text-sm font-semibold underline">
            Explore future directions →
          </Link>
        </div>
      </div>
    </aside>
  );
}
