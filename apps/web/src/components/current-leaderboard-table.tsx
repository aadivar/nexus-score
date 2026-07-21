'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { PublisherRadar } from './publisher-radar';
import { trackEvent, normalizeQuery } from '@/lib/analytics';

type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

interface ContentTypeEntry {
  type: string;
  label: string;
  score: number;
  grade: string;
}

interface CurrentLeaderboardEntry {
  rank: number;
  id: number;
  name: string;
  location?: string;
  score: number;
  grade: string;
  totalWorks: number;
  currentWorks?: number;
  overallScore: number;
  overallGrade: string;
  improvement: number | null;
  dimensions: {
    provenance: number;
    people: number;
    organizations: number;
    funding: number;
    access: number;
  };
  contentTypes?: ContentTypeEntry[];
}

interface Props {
  leaderboard: CurrentLeaderboardEntry[];
  totalActive: number;
  availableContentTypes: { type: string; label: string; count: number }[];
}

const ITEMS_PER_PAGE = 50;

const gradeColors: Record<Grade, string> = {
  A: 'bg-green-100 text-green-800',
  B: 'bg-blue-100 text-blue-800',
  C: 'bg-yellow-100 text-yellow-800',
  D: 'bg-orange-100 text-orange-800',
  F: 'bg-red-100 text-red-800',
};

type DimensionKey = 'provenance' | 'people' | 'organizations' | 'funding' | 'access';
type SortField = 'default' | 'score' | 'works' | 'improvement' | 'overall' | DimensionKey;
type SortDirection = 'desc' | 'asc';

export function CurrentLeaderboardTable({ leaderboard, totalActive, availableContentTypes }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('default');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [contentTypeFilter, setContentTypeFilter] = useState<string>('all');
  const [radarEntry, setRadarEntry] = useState<CurrentLeaderboardEntry | null>(null);

  const getCtScore = (entry: CurrentLeaderboardEntry): number | null => {
    if (contentTypeFilter === 'all') return null;
    const ct = entry.contentTypes?.find((c) => c.type === contentTypeFilter);
    return ct ? ct.score : null;
  };

  const getCtGrade = (entry: CurrentLeaderboardEntry): string | null => {
    if (contentTypeFilter === 'all') return null;
    const ct = entry.contentTypes?.find((c) => c.type === contentTypeFilter);
    return ct ? ct.grade : null;
  };

  const filteredLeaderboard = useMemo(() => {
    let filtered = leaderboard;

    // Content type filter
    if (contentTypeFilter !== 'all') {
      filtered = filtered.filter((entry) =>
        entry.contentTypes?.some((c) => c.type === contentTypeFilter)
      );
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((entry) =>
        entry.name.toLowerCase().includes(query)
      );
    }

    if (gradeFilter !== 'all') {
      const gradeForEntry = (entry: CurrentLeaderboardEntry) => {
        if (contentTypeFilter !== 'all') {
          const ct = entry.contentTypes?.find((c) => c.type === contentTypeFilter);
          return ct?.grade || entry.grade;
        }
        return entry.grade;
      };
      filtered = filtered.filter((entry) => gradeForEntry(entry) === gradeFilter);
    }

    // When content type is selected, default sort by that type's score
    if (contentTypeFilter !== 'all' && sortField === 'default') {
      filtered = [...filtered].sort((a, b) => {
        const aScore = a.contentTypes?.find((c) => c.type === contentTypeFilter)?.score ?? 0;
        const bScore = b.contentTypes?.find((c) => c.type === contentTypeFilter)?.score ?? 0;
        return bScore - aScore;
      });
    }

    if (sortField === 'works') {
      filtered = [...filtered].sort((a, b) =>
        sortDirection === 'desc' ? b.totalWorks - a.totalWorks : a.totalWorks - b.totalWorks
      );
    } else if (sortField === 'score') {
      filtered = [...filtered].sort((a, b) => {
        const aScore = contentTypeFilter !== 'all'
          ? (a.contentTypes?.find((c) => c.type === contentTypeFilter)?.score ?? 0)
          : a.score;
        const bScore = contentTypeFilter !== 'all'
          ? (b.contentTypes?.find((c) => c.type === contentTypeFilter)?.score ?? 0)
          : b.score;
        return sortDirection === 'desc' ? bScore - aScore : aScore - bScore;
      });
    } else if (sortField === 'improvement') {
      filtered = [...filtered].sort((a, b) =>
        sortDirection === 'desc'
          ? (b.improvement ?? 0) - (a.improvement ?? 0)
          : (a.improvement ?? 0) - (b.improvement ?? 0)
      );
    } else if (sortField === 'overall') {
      filtered = [...filtered].sort((a, b) =>
        sortDirection === 'desc' ? b.overallScore - a.overallScore : a.overallScore - b.overallScore
      );
    } else if (['provenance', 'people', 'organizations', 'funding', 'access'].includes(sortField)) {
      const dim = sortField as DimensionKey;
      filtered = [...filtered].sort((a, b) =>
        sortDirection === 'desc'
          ? b.dimensions[dim] - a.dimensions[dim]
          : a.dimensions[dim] - b.dimensions[dim]
      );
    }

    return filtered;
  }, [leaderboard, searchQuery, gradeFilter, sortField, sortDirection, contentTypeFilter]);

  // Track leaderboard searches, debounced so we log the settled query (the
  // literal text people type) and how many publishers it matched — not every
  // keystroke.
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) return;
    const timer = setTimeout(() => {
      trackEvent('leaderboard_search', {
        query: normalizeQuery(q),
        results: filteredLeaderboard.length,
        era: 'current',
        contentType: contentTypeFilter,
      });
    }, 700);
    return () => clearTimeout(timer);
  }, [searchQuery, filteredLeaderboard.length, contentTypeFilter]);

  const totalPages = Math.ceil(filteredLeaderboard.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedLeaderboard = filteredLeaderboard.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleGradeFilterChange = (value: string) => {
    setGradeFilter(value);
    setCurrentPage(1);
  };

  const handleContentTypeChange = (value: string) => {
    setContentTypeFilter(value);
    setSortField('default');
    setSortDirection('desc');
    setCurrentPage(1);
  };

  const handleSortToggle = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'desc') {
        setSortDirection('asc');
      } else {
        setSortField('default');
        setSortDirection('desc');
      }
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
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
        <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      );
    }
    return (
      <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    );
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 7;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const gradeOrder: Record<string, number> = { A: 5, B: 4, C: 3, D: 2, F: 1 };

  return (
    <div>
      {/* Search and Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-md">
          <input
            type="text"
            placeholder="Search publishers..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 pl-10 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <svg
            className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
                className="rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
          <label className="text-sm text-gray-600">Grade:</label>
          <select
            value={gradeFilter}
            onChange={(e) => handleGradeFilterChange(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">All Grades</option>
            <option value="A">A (80-100)</option>
            <option value="B">B (65-79)</option>
            <option value="C">C (50-64)</option>
            <option value="D">D (35-49)</option>
            <option value="F">F (0-34)</option>
          </select>
        </div>
      </div>

      {/* Results count */}
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-gray-600">
        <span>
          {searchQuery || gradeFilter !== 'all' || contentTypeFilter !== 'all' ? (
            <>
              Showing {filteredLeaderboard.length.toLocaleString()} results
              {contentTypeFilter !== 'all' && ` for ${availableContentTypes.find(ct => ct.type === contentTypeFilter)?.label || contentTypeFilter}`}
              {searchQuery && ` matching "${searchQuery}"`}
              {gradeFilter !== 'all' && ` with grade ${gradeFilter}`}
            </>
          ) : (
            <>Showing all {totalActive.toLocaleString()} active publishers</>
          )}
        </span>
        {sortField !== 'default' && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
            Sorted by {sortField === 'organizations' ? 'orgs' : sortField} {sortDirection === 'desc' ? '(high to low)' : '(low to high)'}
            <button
              onClick={() => {
                setSortField('default');
                setSortDirection('desc');
                setCurrentPage(1);
              }}
              className="ml-1 hover:text-emerald-900"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Rank
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Publisher
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                <button
                  onClick={() => handleSortToggle('score')}
                  className="inline-flex items-center gap-1 hover:text-gray-700"
                >
                  Current Score
                  {getSortIcon('score')}
                </button>
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                Grade
              </th>
              {contentTypeFilter === 'all' && (
              <th className="hidden px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 sm:table-cell">
                <button
                  onClick={() => handleSortToggle('overall')}
                  className="inline-flex items-center gap-1 hover:text-gray-700"
                >
                  Overall
                  {getSortIcon('overall')}
                </button>
              </th>
              )}
              {contentTypeFilter === 'all' && (
              <th className="hidden px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 md:table-cell">
                <button
                  onClick={() => handleSortToggle('improvement')}
                  className="inline-flex items-center gap-1 hover:text-gray-700"
                >
                  Trend
                  {getSortIcon('improvement')}
                </button>
              </th>
              )}
              <th className="hidden px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 lg:table-cell">
                <button onClick={() => handleSortToggle('provenance')} className="inline-flex items-center gap-1 hover:text-gray-700">
                  Prov.{getSortIcon('provenance')}
                </button>
              </th>
              <th className="hidden px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 lg:table-cell">
                <button onClick={() => handleSortToggle('people')} className="inline-flex items-center gap-1 hover:text-gray-700">
                  People{getSortIcon('people')}
                </button>
              </th>
              <th className="hidden px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 xl:table-cell">
                <button onClick={() => handleSortToggle('organizations')} className="inline-flex items-center gap-1 hover:text-gray-700">
                  Orgs{getSortIcon('organizations')}
                </button>
              </th>
              <th className="hidden px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 xl:table-cell">
                <button onClick={() => handleSortToggle('funding')} className="inline-flex items-center gap-1 hover:text-gray-700">
                  Funding{getSortIcon('funding')}
                </button>
              </th>
              <th className="hidden px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 xl:table-cell">
                <button onClick={() => handleSortToggle('access')} className="inline-flex items-center gap-1 hover:text-gray-700">
                  Access{getSortIcon('access')}
                </button>
              </th>
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
                <td colSpan={contentTypeFilter === 'all' ? 12 : 10} className="px-4 py-8 text-center text-gray-500">
                  No publishers found matching your search.
                </td>
              </tr>
            ) : (
              paginatedLeaderboard.map((entry, index) => {
                const useOriginalRank = contentTypeFilter === 'all' && sortField === 'default' && !searchQuery && gradeFilter === 'all';
                const displayRank = useOriginalRank ? entry.rank : startIndex + index + 1;
                const displayGrade = getCtGrade(entry) ?? entry.grade;
                const gradeUpgrade = gradeOrder[displayGrade] > gradeOrder[entry.overallGrade];
                const gradeDowngrade = gradeOrder[displayGrade] < gradeOrder[entry.overallGrade];

                return (
                  <tr key={entry.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setRadarEntry(entry)}>
                    <td className="whitespace-nowrap px-4 py-4">
                      <span className="text-lg font-bold text-gray-400">
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
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        href={`/member/${entry.id}`}
                        className="font-medium text-gray-900 hover:text-emerald-600"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {entry.name}
                      </Link>
                      {entry.location && (
                        <p className="mt-0.5 text-xs text-gray-500">{entry.location}</p>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-center">
                      <span className="text-lg font-bold text-gray-900">{getCtScore(entry) ?? entry.score}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-center">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2 py-1 text-xs font-bold',
                          gradeColors[(getCtGrade(entry) ?? entry.grade) as Grade] || 'bg-gray-100 text-gray-800'
                        )}
                      >
                        {getCtGrade(entry) ?? entry.grade}
                      </span>
                      {contentTypeFilter === 'all' && gradeUpgrade && (
                        <span className="ml-1 text-xs text-emerald-600" title={`Overall: ${entry.overallGrade}`}>
                          ↑
                        </span>
                      )}
                      {contentTypeFilter === 'all' && gradeDowngrade && (
                        <span className="ml-1 text-xs text-red-500" title={`Overall: ${entry.overallGrade}`}>
                          ↓
                        </span>
                      )}
                    </td>
                    {contentTypeFilter === 'all' && (
                    <td className="hidden whitespace-nowrap px-4 py-4 text-center text-sm text-gray-500 sm:table-cell">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                          gradeColors[entry.overallGrade as Grade] || 'bg-gray-100 text-gray-800'
                        )}
                      >
                        {entry.overallScore} ({entry.overallGrade})
                      </span>
                    </td>
                    )}
                    {contentTypeFilter === 'all' && (
                    <td className="hidden whitespace-nowrap px-4 py-4 text-center md:table-cell">
                      {entry.improvement !== null && (
                        <span
                          className={cn(
                            'inline-flex items-center gap-0.5 text-sm font-semibold',
                            entry.improvement > 0
                              ? 'text-emerald-600'
                              : entry.improvement < 0
                              ? 'text-red-500'
                              : 'text-gray-400'
                          )}
                        >
                          {entry.improvement > 0 && (
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                            </svg>
                          )}
                          {entry.improvement < 0 && (
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                          )}
                          {entry.improvement > 0 ? '+' : ''}
                          {entry.improvement}
                        </span>
                      )}
                    </td>
                    )}
                    <td className="hidden whitespace-nowrap px-4 py-4 text-center text-sm text-gray-600 lg:table-cell">
                      {entry.dimensions.provenance}%
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-4 text-center text-sm text-gray-600 lg:table-cell">
                      {entry.dimensions.people}%
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-4 text-center text-sm text-gray-600 xl:table-cell">
                      {entry.dimensions.organizations}%
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-4 text-center text-sm text-gray-600 xl:table-cell">
                      {entry.dimensions.funding}%
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-4 text-center text-sm text-gray-600 xl:table-cell">
                      {entry.dimensions.access}%
                    </td>
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
            {Math.min(startIndex + ITEMS_PER_PAGE, filteredLeaderboard.length)} of{' '}
            {filteredLeaderboard.length.toLocaleString()} publishers
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
                        ? 'bg-emerald-600 text-white'
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
            grade={(getCtGrade(radarEntry) ?? radarEntry.grade)}
            dimensions={radarEntry.dimensions}
            contentTypeFilter={contentTypeFilter}
            onClose={() => setRadarEntry(null)}
          />
        </>
      )}
    </div>
  );
}
