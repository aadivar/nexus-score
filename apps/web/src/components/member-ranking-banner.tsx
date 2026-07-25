'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useMemberContentType } from '@/components/member-content-type-context';

export interface NearbyPublisher {
  id: number;
  name: string;
  rank: number;
  score: number;
}

export interface RankingData {
  rank: number;
  totalPublishers: number;
  percentile: number;
  nearbyPublishers: NearbyPublisher[];
  topGap: number | null;
}

interface MemberRankingBannerProps {
  aggregate: RankingData;
  /** Ranking recomputed per content type from the leaderboard data */
  perContentType: Record<string, RankingData>;
  /** Content type key -> human label, for banner captions */
  contentTypeLabels: Record<string, string>;
}

export function MemberRankingBanner({
  aggregate,
  perContentType,
  contentTypeLabels,
}: MemberRankingBannerProps) {
  const { contentTypeFilter } = useMemberContentType();

  const filtered = contentTypeFilter !== 'all';
  const ranking = filtered
    ? (perContentType[contentTypeFilter] ?? null)
    : aggregate;
  const label = filtered ? contentTypeLabels[contentTypeFilter] : null;

  if (!ranking) {
    return (
      <div className="mt-6 rounded-xl border bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6 shadow-sm">
        <p className="text-sm text-gray-600">
          Benchmark comparisons are not available for {label ?? 'this content type'} —
          there is no per-type data for this member yet.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-xl border bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="grid grid-cols-2 gap-4 sm:flex sm:items-center sm:gap-6">
          <div className="text-center">
            <p className="text-xs sm:text-sm font-medium text-gray-500">
              {filtered ? `Benchmark position — ${label}` : 'Benchmark position'}
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-blue-600">
              #{ranking.rank.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">
              of {ranking.totalPublishers.toLocaleString()}
              {filtered && ' with this type'}
            </p>
          </div>
          <div className="hidden sm:block h-12 w-px bg-gray-200" />
          <div className="text-center">
            <p className="text-xs sm:text-sm font-medium text-gray-500">Percentile</p>
            <p
              className={cn(
                'text-2xl sm:text-3xl font-bold',
                ranking.percentile >= 90
                  ? 'text-green-600'
                  : ranking.percentile >= 70
                    ? 'text-blue-600'
                    : ranking.percentile >= 50
                      ? 'text-yellow-600'
                      : 'text-gray-600'
              )}
            >
              Top {100 - ranking.percentile}%
            </p>
            <p className="text-xs text-gray-500">
              {filtered ? `of ${label?.toLowerCase()} publishers` : 'of all publishers'}
            </p>
          </div>
          {ranking.topGap !== null && ranking.topGap > 0 && (
            <>
              <div className="hidden md:block h-12 w-px bg-gray-200" />
              <div className="hidden md:block text-center">
                <p className="text-sm font-medium text-gray-500">
                  Gap to Top 10%
                </p>
                <p className="text-3xl font-bold text-indigo-600">
                  +{ranking.topGap}
                </p>
                <p className="text-xs text-gray-500">points needed</p>
              </div>
            </>
          )}
        </div>
        <Link
          href="/leaderboard"
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 w-full sm:w-auto sm:self-end"
        >
          Explore Full Benchmark
        </Link>
      </div>

      {/* Nearby Publishers */}
      {ranking.nearbyPublishers.length > 0 && (
        <div className="mt-6 border-t border-gray-200 pt-4">
          <p className="mb-3 text-sm font-medium text-gray-600">
            Nearby benchmark values{filtered ? ` (${label})` : ''}:
          </p>
          <div className="flex flex-wrap gap-2">
            {ranking.nearbyPublishers.map((pub) => (
              <Link
                key={pub.id}
                href={`/member/${pub.id}`}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm transition-colors',
                  pub.rank < ranking.rank
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                <span className="font-medium">#{pub.rank}</span>
                <span className="max-w-[150px] truncate">{pub.name}</span>
                <span className="text-xs">({pub.score} index)</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {filtered && (
        <p className="mt-4 text-xs text-gray-400">
          Compared with members registering {label?.toLowerCase()} by their
          all-years index value for that type, matching the overall benchmark
          filter.
        </p>
      )}
    </div>
  );
}
