'use client';

import type { ContentTypeScore } from '@nexus-score/core';
import { useMemberContentType } from '@/components/member-content-type-context';
import { cn, formatNumber } from '@/lib/utils';
import { getEraRange } from '@/lib/benchmark-scope';

interface MemberScopeControlsProps {
  contentTypeScores: ContentTypeScore[] | null;
}

export function MemberScopeControls({ contentTypeScores }: MemberScopeControlsProps) {
  const { contentTypeFilter, setContentTypeFilter, era, setEra } = useMemberContentType();
  const selected = contentTypeScores?.find((entry) => entry.type === contentTypeFilter);
  const range = getEraRange();

  return (
    <section className="mt-6 rounded-xl border bg-white p-4 shadow-sm" aria-label="Benchmark scope">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <label htmlFor="member-content-type" className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Content type
          </label>
          <select
            id="member-content-type"
            value={contentTypeFilter}
            onChange={(event) => setContentTypeFilter(event.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:w-auto"
          >
            <option value="all">All Benchmarked Content Types</option>
            <optgroup label="Available now">
              {(contentTypeScores ?? []).filter((entry) => entry.scorable).map((entry) => (
                <option key={entry.type} value={entry.type}>
                  {entry.label}{entry.works !== undefined ? ` (${formatNumber(entry.works)})` : ''}
                </option>
              ))}
            </optgroup>
            <optgroup label="Coming soon - not yet benchmarked">
              {(contentTypeScores ?? []).filter((entry) => !entry.scorable).map((entry) => (
                <option key={entry.type} value={entry.type} disabled>
                  {entry.label}{entry.works !== undefined ? ` (${formatNumber(entry.works)})` : ''} - Coming soon
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Benchmark emphasis</p>
          <div className="mt-1 grid grid-cols-2 overflow-hidden rounded-lg border border-gray-300" role="group" aria-label="Benchmark era">
            <button
              type="button"
              onClick={() => setEra('overall')}
              aria-pressed={era === 'overall'}
              className={cn(
                'min-w-36 px-4 py-2 text-left text-sm transition-colors',
                era === 'overall' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              )}
            >
              <span className="block font-semibold">Overall</span>
              <span className={cn('block text-xs', era === 'overall' ? 'text-gray-300' : 'text-gray-500')}>All years</span>
            </button>
            <button
              type="button"
              onClick={() => setEra('current')}
              aria-pressed={era === 'current'}
              className={cn(
                'min-w-36 border-l px-4 py-2 text-left text-sm transition-colors',
                era === 'current' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-blue-50'
              )}
            >
              <span className="block font-semibold">Current</span>
              <span className={cn('block text-xs', era === 'current' ? 'text-blue-100' : 'text-gray-500')}>
                {range.currentStart}-{range.currentEnd}
              </span>
            </button>
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-gray-500">
        Showing <strong className="text-gray-700">{selected?.label ?? 'All Benchmarked Content Types'}</strong>. Overall is all years; Current covers {range.currentStart}-{range.currentEnd}. Detailed Metrics compares Current with Backfile before {range.backfileBefore}. Other record schemas are listed as Coming soon and remain disclosed below as Not benchmarked.
      </p>
    </section>
  );
}
