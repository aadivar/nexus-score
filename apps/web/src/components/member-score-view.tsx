'use client';

import Link from 'next/link';
import type {
  TrendInfo,
  TrendDirection,
  DimensionScores,
  ContentTypeScore,
} from '@nexus-score/core';
import { ScoreCard } from '@/components/score-card';
import { DimensionChart } from '@/components/dimension-chart';
import { DimensionRadar } from '@/components/dimension-radar';
import { useMemberContentType } from '@/components/member-content-type-context';
import { formatNumber, cn } from '@/lib/utils';

interface EraRankingInfo {
  overallRank: number | null;
  overallTotal: number;
  currentRank: number | null;
  currentTotal: number;
}

interface MemberScoreViewProps {
  total: number;
  trend: TrendInfo;
  dimensions: DimensionScores;
  currentWorks: number;
  backfileWorks: number;
  contentTypeScores: ContentTypeScore[] | null;
  eraRanking: EraRankingInfo | null;
}

// Dimension weights mirror packages/core scoring/weights.ts — used only to
// render per-type dimension bars on the same points scale as the aggregate.
const DIMENSION_WEIGHTS: Record<keyof ContentTypeScore['dimensions'], number> = {
  provenance: 25,
  people: 20,
  organizations: 15,
  funding: 20,
  access: 20,
};

function buildDimensionScores(ct: ContentTypeScore): DimensionScores {
  const build = (name: keyof ContentTypeScore['dimensions']) => {
    const percentage = ct.dimensions[name];
    const maxScore = DIMENSION_WEIGHTS[name];
    return {
      score: Math.round((percentage * maxScore) / 100),
      maxScore,
      percentage,
      metrics: [],
    };
  };

  return {
    provenance: build('provenance'),
    people: build('people'),
    organizations: build('organizations'),
    funding: build('funding'),
    access: build('access'),
  };
}

export function MemberScoreView({
  total,
  trend,
  dimensions,
  currentWorks,
  backfileWorks,
  contentTypeScores,
  eraRanking,
}: MemberScoreViewProps) {
  const { contentTypeFilter, setContentTypeFilter } = useMemberContentType();

  const hasFilter =
    contentTypeScores !== null && contentTypeScores.length > 1;
  const selected =
    hasFilter && contentTypeFilter !== 'all'
      ? contentTypeScores.find((ct) => ct.type === contentTypeFilter) ?? null
      : null;

  // Per-type trend: current vs backfile era scores, same thresholds as the
  // aggregate trend in packages/core scoring/calculator.ts
  const selectedTrend =
    selected?.current && selected?.backfile
      ? {
          change: selected.current.score - selected.backfile.score,
          direction: (selected.current.score - selected.backfile.score > 2
            ? 'up'
            : selected.current.score - selected.backfile.score < -2
              ? 'down'
              : 'stable') as TrendDirection,
        }
      : null;

  // All 11 coverage fields at 0% — works exist but carry no scoreable metadata
  const selectedIsEmpty =
    selected !== null &&
    selected.score === 0 &&
    Object.values(selected.dimensions).every((v) => v === 0);

  const displayDimensions = selected
    ? buildDimensionScores(selected)
    : dimensions;
  const radarDimensions = selected
    ? selected.dimensions
    : {
        provenance: dimensions.provenance.percentage,
        people: dimensions.people.percentage,
        organizations: dimensions.organizations.percentage,
        funding: dimensions.funding.percentage,
        access: dimensions.access.percentage,
      };

  return (
    <>
      {/* Content Type Filter */}
      {hasFilter && (
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <label
              htmlFor="member-content-type"
              className="text-sm font-medium text-gray-600"
            >
              View index for:
            </label>
            <select
              id="member-content-type"
              value={contentTypeFilter}
              onChange={(e) => setContentTypeFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Content Types</option>
              {contentTypeScores.map((ct) => (
                <option key={ct.type} value={ct.type}>
                  {ct.label}
                  {ct.works !== undefined ? ` (${formatNumber(ct.works)})` : ''}
                </option>
              ))}
            </select>
          </div>
          {selected && (
            <p className="mt-2 text-xs text-gray-500">
              Showing {selected.label.toLowerCase()} only. Detailed metrics and
              recommendations further down reflect all content types.
            </p>
          )}
        </div>
      )}

      <ScoreCard
        score={selected ? selected.score : total}
        trend={selectedTrend ? selectedTrend.direction : trend.direction}
        change={selectedTrend ? selectedTrend.change : trend.change}
        label={selected ? `Index — ${selected.label} (all years)` : 'Nexus-Index'}
        hideTrend={selected !== null && selectedTrend === null}
      />

      {/* Zero-metadata explanation — a bare 0 otherwise looks like a bug */}
      {selectedIsEmpty && selected && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-sm">
          <svg
            className="mt-0.5 h-4 w-4 flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>
            {selected.works !== undefined
              ? `${formatNumber(selected.works)} ${selected.label.toLowerCase()} are registered with Crossref, but none of them carry any of the 11 scoreable metadata fields (ORCID iDs, licenses, references, etc.).`
              : `Works of this type are registered with Crossref, but none of them carry any of the 11 scoreable metadata fields (ORCID iDs, licenses, references, etc.).`}{' '}
            This is real signal, not missing data — these works dilute the
            aggregate index value above. Depositing metadata for them would
            improve the observed coverage.
          </span>
        </div>
      )}

      {/* Current vs Backfile Breakdown */}
      {selected ? (
        <div className="rounded-xl border bg-white p-4 sm:p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-4">
            {selected.label} — Index by Era
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {/* Current Era */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                Current
              </p>
              <p className="text-xs text-gray-500 mb-2">Last 2 years</p>
              {selected.current ? (
                <>
                  <p className="text-3xl font-bold text-blue-700">
                    {selected.current.score}
                  </p>
                  {selected.current.works !== undefined && (
                    <p className="text-sm text-gray-500 mt-1">
                      {formatNumber(selected.current.works)} works
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-500">
                  No recent works of this type
                </p>
              )}
            </div>

            {/* Backfile Era */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                Backfile
              </p>
              <p className="text-xs text-gray-500 mb-2">Older than 2 years</p>
              {selected.backfile ? (
                <>
                  <p className="text-3xl font-bold text-gray-700">
                    {selected.backfile.score}
                  </p>
                  {selected.backfile.works !== undefined && (
                    <p className="text-sm text-gray-500 mt-1">
                      {formatNumber(selected.backfile.works)} works
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-500">
                  No older works of this type
                </p>
              )}
            </div>
          </div>

          {selectedTrend && selectedTrend.direction !== 'stable' && (
            <div
              className={cn(
                'mt-3 flex items-center gap-1.5 text-sm rounded-lg px-3 py-2',
                selectedTrend.direction === 'up'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              )}
            >
              {selectedTrend.direction === 'up' ? (
                <svg
                  className="h-4 w-4 flex-shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                  <polyline points="16 7 22 7 22 13" />
                </svg>
              ) : (
                <svg
                  className="h-4 w-4 flex-shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
                  <polyline points="16 17 22 17 22 11" />
                </svg>
              )}
              <span>
                The recent {selected.label.toLowerCase()} index is{' '}
                <strong>
                  {Math.abs(selectedTrend.change)} points{' '}
                  {selectedTrend.direction === 'up' ? 'higher' : 'lower'}
                </strong>{' '}
                than older works
              </span>
            </div>
          )}

          <p className="mt-3 text-xs text-gray-400">
            The current-era benchmark compares the current index value shown
            here; the overall benchmark uses the all-years value.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-white p-4 sm:p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-4">
            Index by Era
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {/* Current Era */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                    Current
                  </p>
                  <p className="text-xs text-gray-500 mb-2">Last 2 years</p>
                </div>
                {eraRanking?.currentRank && (
                  <Link
                    href="/leaderboard/current"
                    className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 hover:bg-blue-200 transition-colors"
                    title={`Benchmark position #${eraRanking.currentRank.toLocaleString()} of ${eraRanking.currentTotal.toLocaleString()} active publishers`}
                  >
                    #{eraRanking.currentRank.toLocaleString()}
                  </Link>
                )}
              </div>
              <p className="text-3xl font-bold text-blue-700">
                {trend.currentScore}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {formatNumber(currentWorks)} works
              </p>
            </div>

            {/* Backfile Era */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Backfile
                  </p>
                  <p className="text-xs text-gray-500 mb-2">
                    Older than 2 years
                  </p>
                </div>
                {eraRanking?.overallRank && (
                  <Link
                    href="/leaderboard"
                    className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-600 hover:bg-gray-300 transition-colors"
                    title={`Overall benchmark position #${eraRanking.overallRank.toLocaleString()} of ${eraRanking.overallTotal.toLocaleString()} publishers`}
                  >
                    #{eraRanking.overallRank.toLocaleString()}
                  </Link>
                )}
              </div>
              <p className="text-3xl font-bold text-gray-700">
                {trend.backfileScore}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {formatNumber(backfileWorks)} works
              </p>
            </div>
          </div>

          {/* Rank comparison insight */}
          {eraRanking?.currentRank &&
            eraRanking?.overallRank &&
            eraRanking.currentRank !== eraRanking.overallRank && (
              <div
                className={cn(
                  'mt-3 flex items-center gap-1.5 text-sm rounded-lg px-3 py-2',
                  eraRanking.currentRank < eraRanking.overallRank
                    ? 'bg-green-50 text-green-700'
                    : 'bg-amber-50 text-amber-700'
                )}
              >
                {eraRanking.currentRank < eraRanking.overallRank ? (
                  <svg
                    className="h-4 w-4 flex-shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                    <polyline points="16 7 22 7 22 13" />
                  </svg>
                ) : (
                  <svg
                    className="h-4 w-4 flex-shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
                    <polyline points="16 17 22 17 22 11" />
                  </svg>
                )}
                <span>
                  Benchmark position{' '}
                  <strong>#{eraRanking.currentRank.toLocaleString()}</strong>{' '}
                  for recent publications vs{' '}
                  <strong>#{eraRanking.overallRank.toLocaleString()}</strong>{' '}
                  overall
                  {eraRanking.currentRank < eraRanking.overallRank
                    ? ' — higher for recent work'
                    : ' — lower for recent work'}
                </span>
              </div>
            )}

          {/* Score trend indicator (when ranks aren't available or are equal) */}
          {(!eraRanking?.currentRank ||
            !eraRanking?.overallRank ||
            eraRanking.currentRank === eraRanking.overallRank) &&
            trend.direction !== 'stable' && (
              <div
                className={cn(
                  'mt-3 flex items-center gap-1.5 text-sm rounded-lg px-3 py-2',
                  trend.direction === 'up'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                )}
              >
                {trend.direction === 'up' ? (
                  <svg
                    className="h-4 w-4 flex-shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                    <polyline points="16 7 22 7 22 13" />
                  </svg>
                ) : (
                  <svg
                    className="h-4 w-4 flex-shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
                    <polyline points="16 17 22 17 22 11" />
                  </svg>
                )}
                <span>
                  The recent-publication index is{' '}
                  <strong>
                    {Math.abs(trend.change)} points{' '}
                    {trend.direction === 'up' ? 'higher' : 'lower'}
                  </strong>{' '}
                  than historical average
                </span>
              </div>
            )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DimensionChart dimensions={displayDimensions} />
        <DimensionRadar dimensions={radarDimensions} />
      </div>
    </>
  );
}
