'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

interface LeaderboardEntry {
  rank: number;
  id: number;
  name: string;
  location?: string;
  score: number;
  grade: string;
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
}

interface LeaderboardTableProps {
  leaderboard: LeaderboardEntry[];
  totalWithWorks: number;
}

const ITEMS_PER_PAGE = 50;

const gradeColors: Record<Grade, string> = {
  A: 'bg-green-100 text-green-800',
  B: 'bg-blue-100 text-blue-800',
  C: 'bg-yellow-100 text-yellow-800',
  D: 'bg-orange-100 text-orange-800',
  F: 'bg-red-100 text-red-800',
};

const rankStyles: Record<number, string> = {
  1: 'text-yellow-500',
  2: 'text-gray-400',
  3: 'text-amber-600',
};

type SortField = 'default' | 'score' | 'works' | 'improvement';
type SortDirection = 'desc' | 'asc';
type ViewMode = 'overall' | 'progress';

export function LeaderboardTable({ leaderboard, totalWithWorks }: LeaderboardTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('default');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('overall');

  // Check if improvement data is available (non-null values exist)
  const hasImprovementData = leaderboard.some(e => e.improvement !== undefined && e.improvement !== null);

  // Count publishers with valid improvement data (has backfile)
  const publishersWithBackfile = useMemo(() =>
    leaderboard.filter(e => e.improvement !== undefined && e.improvement !== null).length,
    [leaderboard]
  );

  // Filter and sort leaderboard
  const filteredLeaderboard = useMemo(() => {
    let filtered = leaderboard;

    // In progress view, only show publishers with backfile data
    if (viewMode === 'progress') {
      filtered = filtered.filter((entry) => entry.improvement !== undefined && entry.improvement !== null);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((entry) =>
        entry.name.toLowerCase().includes(query)
      );
    }

    if (gradeFilter !== 'all') {
      filtered = filtered.filter((entry) => entry.grade === gradeFilter);
    }

    // Apply sorting
    if (sortField === 'works') {
      filtered = [...filtered].sort((a, b) =>
        sortDirection === 'desc' ? b.totalWorks - a.totalWorks : a.totalWorks - b.totalWorks
      );
    } else if (sortField === 'score') {
      filtered = [...filtered].sort((a, b) =>
        sortDirection === 'desc' ? b.score - a.score : a.score - b.score
      );
    } else if (sortField === 'improvement') {
      filtered = [...filtered].sort((a, b) =>
        sortDirection === 'desc'
          ? (b.improvement ?? 0) - (a.improvement ?? 0)
          : (a.improvement ?? 0) - (b.improvement ?? 0)
      );
    }

    // In progress view, default sort by improvement
    if (viewMode === 'progress' && sortField === 'default') {
      filtered = [...filtered].sort((a, b) => (b.improvement ?? 0) - (a.improvement ?? 0));
    }

    return filtered;
  }, [leaderboard, searchQuery, gradeFilter, sortField, sortDirection, viewMode]);

  // Pagination
  const totalPages = Math.ceil(filteredLeaderboard.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedLeaderboard = filteredLeaderboard.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleGradeFilterChange = (value: string) => {
    setGradeFilter(value);
    setCurrentPage(1);
  };

  const handleSortToggle = (field: 'score' | 'works' | 'improvement') => {
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

  const getSortIcon = (field: 'score' | 'works' | 'improvement') => {
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
              Overall Score
            </button>
            <button
              onClick={() => handleViewModeChange('progress')}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                viewMode === 'progress'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              Most Improved
            </button>
          </div>
          {viewMode === 'progress' && (
            <p className="mt-2 text-sm text-gray-500">
              Comparing current (&lt;2 years) vs backfile (&gt;2 years) metadata coverage.
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

        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600">Grade:</label>
          <select
            value={gradeFilter}
            onChange={(e) => handleGradeFilterChange(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Grades</option>
            <option value="A">A (80-100)</option>
            <option value="B">B (60-79)</option>
            <option value="C">C (40-59)</option>
            <option value="D">D (20-39)</option>
            <option value="F">F (0-19)</option>
          </select>
        </div>
      </div>

      {/* Results count */}
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-gray-600">
        <span>
          {searchQuery || gradeFilter !== 'all' ? (
            <>
              Showing {filteredLeaderboard.length.toLocaleString()} results
              {searchQuery && ` for "${searchQuery}"`}
              {gradeFilter !== 'all' && ` with grade ${gradeFilter}`}
            </>
          ) : (
            <>Showing all {totalWithWorks.toLocaleString()} publishers</>
          )}
        </span>
        {sortField !== 'default' && (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
            Sorted by {sortField} {sortDirection === 'desc' ? '(high to low)' : '(low to high)'}
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
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                {viewMode === 'progress' ? '#' : 'Rank'}
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
                      Score
                      {getSortIcon('score')}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                    Grade
                  </th>
                  <th className="hidden px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 md:table-cell">
                    Provenance
                  </th>
                  <th className="hidden px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 md:table-cell">
                    People
                  </th>
                  <th className="hidden px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 lg:table-cell">
                    Orgs
                  </th>
                  <th className="hidden px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 lg:table-cell">
                    Funding
                  </th>
                  <th className="hidden px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 lg:table-cell">
                    Access
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
                <td colSpan={viewMode === 'progress' ? 6 : 10} className="px-4 py-8 text-center text-gray-500">
                  No publishers found matching your search.
                </td>
              </tr>
            ) : (
              paginatedLeaderboard.map((entry, index) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-4">
                    {viewMode === 'progress' ? (
                      <span className="text-lg font-bold text-gray-400">
                        #{(startIndex + index + 1).toLocaleString()}
                      </span>
                    ) : (
                      <span
                        className={cn(
                          'text-lg font-bold',
                          rankStyles[entry.rank] || 'text-gray-400'
                        )}
                      >
                        {entry.rank <= 3 ? (
                          <>
                            {entry.rank === 1 && '🥇'}
                            {entry.rank === 2 && '🥈'}
                            {entry.rank === 3 && '🥉'}
                          </>
                        ) : (
                          `#${entry.rank.toLocaleString()}`
                        )}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <Link
                      href={`/member/${entry.id}`}
                      className="font-medium text-gray-900 hover:text-blue-600"
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
                          {entry.score}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-center">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2 py-1 text-xs font-bold',
                            gradeColors[entry.grade as Grade] || 'bg-gray-100 text-gray-800'
                          )}
                        >
                          {entry.grade}
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
              ))
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
    </div>
  );
}
