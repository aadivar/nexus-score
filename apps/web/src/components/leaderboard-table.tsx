'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { PublisherRadar } from './publisher-radar';
import { trackEvent, normalizeQuery } from '@/lib/analytics';

interface ContentTypeEntry {
  type: string;
  label: string;
  score: number;
}

interface LeaderboardEntry {
  rank: number;
  id: number;
  name: string;
  location?: string;
  score: number;
  totalWorks: number;
  currentScore?: number;
  backfileScore?: number | null;
  improvement?: number | null;
  dimensions: {
    provenance: number;
    people: number;
    organizations: number;
    funding: number;
    access: number;
  };
  contentTypes?: ContentTypeEntry[];
}

interface LeaderboardTableProps {
  initialLeaderboard: LeaderboardEntry[];
  initialTotal: number;
  totalWithWorks: number;
  publishersWithBackfile: number;
  availableContentTypes: { type: string; label: string; count: number }[];
}

interface LeaderboardApiResponse {
  total: number;
  leaderboard: LeaderboardEntry[];
}

const ITEMS_PER_PAGE = 50;

const rankStyles: Record<number, string> = {
  1: 'text-yellow-500',
  2: 'text-gray-400',
  3: 'text-amber-600',
};

type DimensionKey = 'provenance' | 'people' | 'organizations' | 'funding' | 'access';
type SortField = 'default' | 'score' | 'works' | 'improvement' | DimensionKey;
type SortDirection = 'desc' | 'asc';
type ViewMode = 'overall' | 'progress';

export function LeaderboardTable({
  initialLeaderboard,
  initialTotal,
  totalWithWorks,
  publishersWithBackfile,
  availableContentTypes,
}: LeaderboardTableProps) {
  const [leaderboard, setLeaderboard] = useState(initialLeaderboard);
  const [resultTotal, setResultTotal] = useState(initialTotal);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('default');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('overall');
  const [contentTypeFilter, setContentTypeFilter] = useState<string>('all');
  const [radarEntry, setRadarEntry] = useState<LeaderboardEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const skipInitialFetch = useRef(true);

  const hasImprovementData = publishersWithBackfile > 0;

  // Helper to get content-type score for an entry
  const getCtScore = (entry: LeaderboardEntry): number | null => {
    if (contentTypeFilter === 'all') return null;
    const ct = entry.contentTypes?.find((c) => c.type === contentTypeFilter);
    return ct ? ct.score : null;
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setCurrentPage(1);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (skipInitialFetch.current) {
      skipInitialFetch.current = false;
      return;
    }

    const controller = new AbortController();
    const params = new URLSearchParams({
      limit: ITEMS_PER_PAGE.toString(),
      offset: ((currentPage - 1) * ITEMS_PER_PAGE).toString(),
      view: viewMode,
      sort: sortField,
      direction: sortDirection,
    });

    if (debouncedSearch) params.set('search', debouncedSearch);
    if (contentTypeFilter !== 'all') params.set('contentType', contentTypeFilter);

    async function loadLeaderboard() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const response = await fetch(`/api/leaderboard?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Leaderboard request failed with status ${response.status}`);
        }

        const result = (await response.json()) as LeaderboardApiResponse;
        setLeaderboard(result.leaderboard);
        setResultTotal(result.total);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setLoadError('Could not update the benchmark. Please try again.');
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadLeaderboard();
    return () => controller.abort();
  }, [contentTypeFilter, currentPage, debouncedSearch, sortDirection, sortField, viewMode]);

  // Track leaderboard searches, debounced so we log the settled query and how
  // many publishers it matched — not every keystroke.
  useEffect(() => {
    const q = debouncedSearch;
    if (q.length < 2) return;
    const timer = setTimeout(() => {
      trackEvent('leaderboard_search', {
        query: normalizeQuery(q),
        results: resultTotal,
        era: viewMode === 'progress' ? 'progress' : 'aggregate',
        contentType: contentTypeFilter,
      });
    }, 700);
    return () => clearTimeout(timer);
  }, [debouncedSearch, resultTotal, contentTypeFilter, viewMode]);

  // Pagination
  const totalPages = Math.ceil(resultTotal / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedLeaderboard = leaderboard;

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleContentTypeChange = (value: string) => {
    setContentTypeFilter(value);
    setSortField('default');
    setSortDirection('desc');
    setCurrentPage(1);
    // Reset to overall view when content-type filter is active — improvement data is aggregate only
    if (value !== 'all' && viewMode === 'progress') {
      setViewMode('overall');
    }
  };

  const handleSortToggle = (field: 'score' | 'works' | 'improvement' | DimensionKey) => {
    if (sortField === field) {
      // Toggle direction or reset to default
      if (sortDirection === 'desc') {
        setSortDirection('asc');
      } else {
        setSortField('default');
        setSortDirection('desc');
      }
    } else {
      // New field, start with descending
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    setSortField('default');
    setSortDirection('desc');
    setCurrentPage(1);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    if (sortDirection === 'desc') {
      return (
        <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      );
    }
    return (
      <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    );
  };

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 7;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div>
      {/* View Mode Toggle */}
      {hasImprovementData && (
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleViewModeChange('overall')}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                viewMode === 'overall'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              Overall Index
            </button>
            <button
              onClick={() => handleViewModeChange('progress')}
              disabled={contentTypeFilter !== 'all'}
              title={contentTypeFilter !== 'all' ? 'Trend data is only available for aggregate index values' : undefined}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                viewMode === 'progress'
                  ? 'bg-green-600 text-white'
                  : contentTypeFilter !== 'all'
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              Recent vs Backfile
            </button>
          </div>
          {viewMode === 'progress' && (
            <p className="mt-2 text-sm text-gray-500">
              Trend = Current Index − Backfile Index. Positive values indicate better metadata
              coverage on recent publications (&lt;2 years) compared to older content (&gt;2 years).
              Showing {publishersWithBackfile.toLocaleString()} publishers with historical data.
            </p>
          )}
        </div>
      )}

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-md">
          <input
            type="text"
            placeholder="Search publishers..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 pl-10 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <svg
            className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {searchQuery && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {availableContentTypes.length > 0 && (
            <>
              <label className="text-sm text-gray-600">Content:</label>
              <select
                value={contentTypeFilter}
                onChange={(e) => handleContentTypeChange(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Content Types</option>
                {availableContentTypes
                  .filter((ct) => ct.count >= 100)
                  .map((ct) => (
                    <option key={ct.type} value={ct.type}>
                      {ct.label} ({ct.count.toLocaleString()})
                    </option>
                  ))}
              </select>
            </>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-gray-600">
        <span>
          {searchQuery || contentTypeFilter !== 'all' ? (
            <>
              Showing {resultTotal.toLocaleString()} results
              {contentTypeFilter !== 'all' && ` for ${availableContentTypes.find(ct => ct.type === contentTypeFilter)?.label || contentTypeFilter}`}
              {searchQuery && ` matching "${searchQuery}"`}
            </>
          ) : viewMode === 'progress' ? (
            <>Showing all {publishersWithBackfile.toLocaleString()} publishers with historical data</>
          ) : (
            <>Showing all {totalWithWorks.toLocaleString()} publishers</>
          )}
        </span>
        {sortField !== 'default' && (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
            Sorted by {sortField === 'organizations' ? 'orgs' : sortField} {sortDirection === 'desc' ? '(high to low)' : '(low to high)'}
            <button
              onClick={() => {
                setSortField('default');
                setSortDirection('desc');
                setCurrentPage(1);
              }}
              className="ml-1 hover:text-blue-900"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        )}
        {isLoading && (
          <span className="inline-flex items-center gap-1 text-xs text-gray-500" role="status">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
            Updating
          </span>
        )}
      </div>

      {loadError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {loadError}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm" aria-busy={isLoading}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                {viewMode === 'progress' ? '#' : 'Position'}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Publisher
              </th>
              {viewMode === 'progress' ? (
                <>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                    <button
                      onClick={() => handleSortToggle('improvement')}
                      className="inline-flex items-center gap-1 hover:text-gray-700"
                    >
                      Improvement
                      {getSortIcon('improvement')}
                    </button>
                  </th>
                  <th className="hidden px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 sm:table-cell">
                    Current
                  </th>
                  <th className="hidden px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 sm:table-cell">
                    Backfile
                  </th>
                </>
              ) : (
                <>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                    <button
                      onClick={() => handleSortToggle('score')}
                      className="inline-flex items-center gap-1 hover:text-gray-700"
                    >
                      Index
                      {getSortIcon('score')}
                    </button>
                  </th>
                  <th className="hidden px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 md:table-cell">
                    <button onClick={() => handleSortToggle('provenance')} className="inline-flex items-center gap-1 hover:text-gray-700">
                      Provenance{getSortIcon('provenance')}
                    </button>
                  </th>
                  <th className="hidden px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 md:table-cell">
                    <button onClick={() => handleSortToggle('people')} className="inline-flex items-center gap-1 hover:text-gray-700">
                      People{getSortIcon('people')}
                    </button>
                  </th>
                  <th className="hidden px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 lg:table-cell">
                    <button onClick={() => handleSortToggle('organizations')} className="inline-flex items-center gap-1 hover:text-gray-700">
                      Orgs{getSortIcon('organizations')}
                    </button>
                  </th>
                  <th className="hidden px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 lg:table-cell">
                    <button onClick={() => handleSortToggle('funding')} className="inline-flex items-center gap-1 hover:text-gray-700">
                      Funding{getSortIcon('funding')}
                    </button>
                  </th>
                  <th className="hidden px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 lg:table-cell">
                    <button onClick={() => handleSortToggle('access')} className="inline-flex items-center gap-1 hover:text-gray-700">
                      Access{getSortIcon('access')}
                    </button>
                  </th>
                </>
              )}
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                <button
                  onClick={() => handleSortToggle('works')}
                  className="inline-flex items-center gap-1 hover:text-gray-700"
                >
                  Works
                  {getSortIcon('works')}
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedLeaderboard.length === 0 ? (
              <tr>
                <td colSpan={viewMode === 'progress' ? 6 : 9} className="px-4 py-8 text-center text-gray-500">
                  No publishers found matching your search.
                </td>
              </tr>
            ) : (
              paginatedLeaderboard.map((entry, index) => {
                const useOriginalRank = contentTypeFilter === 'all' && sortField === 'default' && !searchQuery;
                const displayRank = useOriginalRank ? entry.rank : startIndex + index + 1;
                return (
                <tr key={entry.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setRadarEntry(entry)}>
                  <td className="whitespace-nowrap px-4 py-4">
                    {viewMode === 'progress' ? (
                      <span className="text-lg font-bold text-gray-400">
                        #{(startIndex + index + 1).toLocaleString()}
                      </span>
                    ) : (
                      <span
                        className={cn(
                          'text-lg font-bold',
                          useOriginalRank ? (rankStyles[displayRank] || 'text-gray-400') : 'text-gray-400'
                        )}
                      >
                        {useOriginalRank && displayRank <= 3 ? (
                          <>
                            {displayRank === 1 && '🥇'}
                            {displayRank === 2 && '🥈'}
                            {displayRank === 3 && '🥉'}
                          </>
                        ) : (
                          `#${displayRank.toLocaleString()}`
                        )}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <Link
                      href={`/member/${entry.id}`}
                      className="font-medium text-gray-900 hover:text-blue-600"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {entry.name}
                    </Link>
                    {entry.location && (
                      <p className="mt-0.5 text-xs text-gray-500">{entry.location}</p>
                    )}
                  </td>
                  {viewMode === 'progress' ? (
                    <>
                      <td className="whitespace-nowrap px-4 py-4 text-center">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 text-lg font-bold',
                            (entry.improvement ?? 0) > 0
                              ? 'text-green-600'
                              : (entry.improvement ?? 0) < 0
                              ? 'text-red-600'
                              : 'text-gray-500'
                          )}
                        >
                          {(entry.improvement ?? 0) > 0 && (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                            </svg>
                          )}
                          {(entry.improvement ?? 0) < 0 && (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                          )}
                          {(entry.improvement ?? 0) > 0 ? '+' : ''}{entry.improvement ?? 0}
                        </span>
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-4 text-center text-sm text-gray-600 sm:table-cell">
                        {entry.currentScore ?? '-'}
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-4 text-center text-sm text-gray-600 sm:table-cell">
                        {entry.backfileScore ?? '-'}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="whitespace-nowrap px-4 py-4 text-center">
                        <span className="text-lg font-bold text-gray-900">
                          {getCtScore(entry) ?? entry.score}
                        </span>
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-4 text-center text-sm text-gray-600 md:table-cell">
                        {entry.dimensions.provenance}%
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-4 text-center text-sm text-gray-600 md:table-cell">
                        {entry.dimensions.people}%
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-4 text-center text-sm text-gray-600 lg:table-cell">
                        {entry.dimensions.organizations}%
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-4 text-center text-sm text-gray-600 lg:table-cell">
                        {entry.dimensions.funding}%
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-4 text-center text-sm text-gray-600 lg:table-cell">
                        {entry.dimensions.access}%
                      </td>
                    </>
                  )}
                  <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-gray-500">
                    {entry.totalWorks.toLocaleString()}
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-gray-600">
            Showing {startIndex + 1} to{' '}
            {Math.min(startIndex + ITEMS_PER_PAGE, resultTotal)} of{' '}
            {resultTotal.toLocaleString()} publishers
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              First
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Prev
            </button>

            <div className="hidden items-center gap-1 sm:flex">
              {getPageNumbers().map((page, index) =>
                typeof page === 'string' ? (
                  <span key={`ellipsis-${index}`} className="px-2 text-gray-500">
                    {page}
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    {page}
                  </button>
                )
              )}
            </div>

            <span className="px-2 text-sm text-gray-600 sm:hidden">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Last
            </button>
          </div>
        </div>
      )}
      {radarEntry && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setRadarEntry(null)} />
          <PublisherRadar
            id={radarEntry.id}
            name={radarEntry.name}
            score={getCtScore(radarEntry) ?? radarEntry.score}
            dimensions={radarEntry.dimensions}
            contentTypeFilter={contentTypeFilter}
            onClose={() => setRadarEntry(null)}
          />
        </>
      )}
    </div>
  );
}
