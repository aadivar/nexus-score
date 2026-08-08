import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import {
  CrossrefClient,
  calculateMemberScore,
  calculateDimensionsForPeriod,
  calculateContentTypeScores,
  calculateScorableMemberScore,
  rankByScore,
  CrossrefNotFoundError,
  type DimensionScores,
  type NexusScore,
  type ContentTypeScore,
  type ScorableMemberScore,
} from '@nexus-score/core';
import { MemberScoreView } from '@/components/member-score-view';
import {
  MemberChangeInsights,
  type MetricChange,
  type MixShiftEntry,
} from '@/components/member-change-insights';
import { MemberContentTypeProvider } from '@/components/member-content-type-context';
import { MemberScopeControls } from '@/components/member-scope-controls';
import {
  MemberRankingBanner,
  type RankingData,
} from '@/components/member-ranking-banner';
import { MetricsTable } from '@/components/metrics-table';
import { MemberScopedSearch } from '@/components/member-scoped-search';
import { MemberActionPlan } from '@/components/member-action-plan';
import { TrackMemberView } from '@/components/track-member-view';
import { CopyLinkButton } from '@/components/copy-link-button';
import { formatNumber, cn } from '@/lib/utils';
import { formatDataDate, parseBenchmarkEra, parseContentType } from '@/lib/benchmark-scope';

// Revalidate every 24 hours — keeps index values fresh between data refreshes
export const revalidate = 86400;

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ era?: string | string[]; contentType?: string | string[] }>;
}

interface LeaderboardContentType {
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
  currentWorks?: number;
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
  currentDimensions?: {
    provenance: number;
    people: number;
    organizations: number;
    funding: number;
    access: number;
  };
  contentTypes?: LeaderboardContentType[];
}

interface LeaderboardData {
  generatedAt: string;
  totalMembers: number;
  totalWithWorks: number;
  leaderboard: LeaderboardEntry[];
}

interface RankingInfo {
  score: number;
  rank: number;
  totalPublishers: number;
  percentile: number;
  nearbyPublishers: RankingData['nearbyPublishers'];
  topGap: number | null; // points needed to reach top 10%
}

interface CurrentLeaderboardEntry {
  rank: number;
  id: number;
  name: string;
  score: number;
  contentTypes?: LeaderboardContentType[];
}

interface CurrentLeaderboardData {
  generatedAt: string;
  totalActive: number;
  leaderboard: CurrentLeaderboardEntry[];
}

interface EraDimensions {
  current: DimensionScores;
  backfile: DimensionScores | null;
}

type MemberIndex = Pick<
  NexusScore,
  'total' | 'dimensions' | 'trend' | 'recommendations' | 'metadata'
>;

const client = new CrossrefClient({
  mailto: process.env.CROSSREF_MAILTO || 'varma2friend@gmail.com',
});

function getLeaderboardData(): LeaderboardData | null {
  const dataPath = join(process.cwd(), 'data', 'leaderboard.json');
  if (!existsSync(dataPath)) return null;
  try {
    const content = readFileSync(dataPath, 'utf-8');
    return JSON.parse(content) as LeaderboardData;
  } catch {
    return null;
  }
}

function getCurrentLeaderboardData(): CurrentLeaderboardData | null {
  const dataPath = join(process.cwd(), 'data', 'current-leaderboard.json');
  if (!existsSync(dataPath)) return null;
  try {
    const content = readFileSync(dataPath, 'utf-8');
    return JSON.parse(content) as CurrentLeaderboardData;
  } catch {
    return null;
  }
}

function getRankingInfo(memberId: number, score: number): RankingInfo | null {
  const data = getLeaderboardData();
  if (!data) return null;

  const { leaderboard, totalWithWorks } = data;
  const ranked = rankByScore(leaderboard, (entry) => entry.score);
  const memberIndex = ranked.findIndex((entry) => entry.id === memberId);
  const memberEntry = memberIndex >= 0 ? ranked[memberIndex] : null;

  if (!memberEntry) {
    // Member not in leaderboard (maybe 0 works) - estimate rank by score
    const betterCount = leaderboard.filter((e) => e.score > score).length;
    const rank = betterCount + 1;
    const percentile = Math.round((1 - rank / totalWithWorks) * 100);
    const top10PercentRank = Math.ceil(totalWithWorks * 0.1);
    const top10Entry = leaderboard[top10PercentRank - 1];
    const topGap = top10Entry ? Math.max(0, top10Entry.score - score) : null;

    return {
      score,
      rank,
      totalPublishers: totalWithWorks,
      percentile: Math.max(0, percentile),
      nearbyPublishers: [],
      topGap,
    };
  }

  const rank = memberEntry.rank;
  const percentile = Math.round((1 - rank / totalWithWorks) * 100);

  // Get nearby publishers (2 above, 2 below)
  const nearbyPublishers = ranked
    .slice(Math.max(0, memberIndex - 2), memberIndex + 3)
    .filter((entry) => entry.id !== memberId)
    .slice(0, 4);

  // Calculate gap to top 10%
  const top10PercentRank = Math.ceil(totalWithWorks * 0.1);
  const top10Entry = ranked[top10PercentRank - 1];
  const topGap =
    rank > top10PercentRank && top10Entry
      ? Math.max(0, top10Entry.score - score)
      : null;

  return {
    score: memberEntry.score,
    rank,
    totalPublishers: totalWithWorks,
    percentile: Math.max(0, percentile),
    nearbyPublishers,
    topGap,
  };
}

function getCurrentRankingInfo(memberId: number, score: number): RankingInfo | null {
  const data = getCurrentLeaderboardData();
  if (!data) return null;

  const { leaderboard, totalActive } = data;
  const ranked = rankByScore(leaderboard, (entry) => entry.score);
  const memberIndex = ranked.findIndex((entry) => entry.id === memberId);
  const memberEntry = memberIndex >= 0 ? ranked[memberIndex] : null;

  if (!memberEntry) {
    const betterCount = leaderboard.filter((entry) => entry.score > score).length;
    const rank = betterCount + 1;
    const percentile = Math.round((1 - rank / totalActive) * 100);
    const top10Entry = ranked[Math.ceil(totalActive * 0.1) - 1];

    return {
      score,
      rank,
      totalPublishers: totalActive,
      percentile: Math.max(0, percentile),
      nearbyPublishers: [],
      topGap: top10Entry ? Math.max(0, top10Entry.score - score) : null,
    };
  }

  const rank = memberEntry.rank;
  const percentile = Math.round((1 - rank / totalActive) * 100);
  const nearbyPublishers = ranked
    .slice(Math.max(0, memberIndex - 2), memberIndex + 3)
    .filter((entry) => entry.id !== memberId)
    .slice(0, 4);
  const top10Entry = ranked[Math.ceil(totalActive * 0.1) - 1];

  return {
    score: memberEntry.score,
    rank,
    totalPublishers: totalActive,
    percentile: Math.max(0, percentile),
    nearbyPublishers,
    topGap:
      rank > Math.ceil(totalActive * 0.1) && top10Entry
        ? Math.max(0, top10Entry.score - score)
        : null,
  };
}

/**
 * Recompute rankings within each of the member's content types, mirroring
 * the /api/leaderboard?contentType= re-ranking: publishers with that type,
 * sorted by that type's all-years score.
 */
function getContentTypeRankings(
  memberId: number,
  types: string[],
  era: 'overall' | 'current' = 'overall'
): Record<string, RankingData> {
  const data = era === 'current' ? getCurrentLeaderboardData() : getLeaderboardData();
  const rankings: Record<string, RankingData> = {};
  if (!data || types.length === 0) return rankings;

  for (const type of types) {
    const ranked = rankByScore(data.leaderboard
      .map((entry) => {
        const ct = entry.contentTypes?.find((c) => c.type === type);
        return ct ? { entry, ctScore: ct.score } : null;
      })
      .filter((x): x is { entry: LeaderboardEntry; ctScore: number } => x !== null),
      (entry) => entry.ctScore
    );

    const index = ranked.findIndex((x) => x.entry.id === memberId);
    if (index === -1) continue;

    const rank = ranked[index].rank;
    const total = ranked.length;
    const percentile = Math.round((1 - rank / total) * 100);

    const nearbyPublishers = ranked
      .slice(Math.max(0, index - 2), index + 3)
      .filter((x) => x.entry.id !== memberId)
      .slice(0, 4)
      .map((x) => ({
        id: x.entry.id,
        name: x.entry.name,
        rank: x.rank,
        score: x.ctScore,
      }));

    const top10PercentRank = Math.ceil(total * 0.1);
    const top10 = ranked[top10PercentRank - 1];
    const topGap =
      rank > top10PercentRank && top10
        ? Math.max(0, top10.ctScore - ranked[index].ctScore)
        : null;

    rankings[type] = {
      score: ranked[index].ctScore,
      rank,
      totalPublishers: total,
      percentile: Math.max(0, percentile),
      nearbyPublishers,
      topGap,
    };
  }

  return rankings;
}

function buildScoreFromLeaderboard(entry: LeaderboardEntry): MemberIndex {
  const currentScore = entry.currentScore ?? entry.score;
  const backfileScore = entry.backfileScore ?? entry.score;
  const change = currentScore - backfileScore;

  return {
    total: entry.score,
    dimensions: {
      provenance: { score: Math.round(entry.dimensions.provenance * 25 / 100), maxScore: 25, percentage: entry.dimensions.provenance, metrics: [] },
      people: { score: Math.round(entry.dimensions.people * 20 / 100), maxScore: 20, percentage: entry.dimensions.people, metrics: [] },
      organizations: { score: Math.round(entry.dimensions.organizations * 15 / 100), maxScore: 15, percentage: entry.dimensions.organizations, metrics: [] },
      funding: { score: Math.round(entry.dimensions.funding * 20 / 100), maxScore: 20, percentage: entry.dimensions.funding, metrics: [] },
      access: { score: Math.round(entry.dimensions.access * 20 / 100), maxScore: 20, percentage: entry.dimensions.access, metrics: [] },
    },
    trend: {
      direction: change > 2 ? 'up' : change < -2 ? 'down' : 'stable',
      change: Math.round(change),
      currentScore,
      backfileScore,
    },
    recommendations: [],
    metadata: {
      entityId: entry.id,
      entityType: 'member',
      entityName: entry.name,
      location: entry.location,
      calculatedAt: getLeaderboardData()?.generatedAt || new Date().toISOString(),
      totalWorks: entry.totalWorks,
      currentWorks: entry.currentWorks ?? 0,
      backfileWorks: entry.totalWorks - (entry.currentWorks ?? 0),
      dataSource: 'leaderboard-cache',
    },
  };
}

// The 11 scored metrics with their simplified coverage-type keys and weights
// (mirrors packages/core scoring/weights.ts)
const SIMPLIFIED_METRICS: { key: string; name: string; weight: number }[] = [
  { key: 'references', name: 'References', weight: 15 },
  { key: 'update-policies', name: 'Update Policies', weight: 5 },
  { key: 'similarity-checking', name: 'Similarity Check', weight: 5 },
  { key: 'orcids', name: 'ORCID iDs', weight: 20 },
  { key: 'affiliations', name: 'Affiliations', weight: 5 },
  { key: 'ror-ids', name: 'ROR IDs', weight: 10 },
  { key: 'funders', name: 'Funder Registry IDs', weight: 10 },
  { key: 'award-numbers', name: 'Award Numbers', weight: 10 },
  { key: 'licenses', name: 'Licenses', weight: 7 },
  { key: 'resource-links', name: 'Full-text Links', weight: 7 },
  { key: 'abstracts', name: 'Abstracts', weight: 6 },
];

interface ChangeInsights {
  aggregate: MetricChange[];
  perType: Record<string, MetricChange[]>;
  mixShift: MixShiftEntry[];
}

function buildMetricChanges(
  getCurrent: (key: string) => number,
  getBackfile: (key: string) => number
): MetricChange[] {
  return SIMPLIFIED_METRICS.map((m) => {
    const current = getCurrent(m.key) * 100;
    const backfile = getBackfile(m.key) * 100;
    return {
      key: m.key,
      name: m.name,
      weight: m.weight,
      current,
      backfile,
      impact: Math.round((current - backfile) * m.weight) / 100,
    };
  });
}

function buildChangeInsights(
  member: Awaited<ReturnType<CrossrefClient['getMember']>>,
  contentTypeScores: ContentTypeScore[],
  scorableScore: ScorableMemberScore
): ChangeInsights {
  const aggregate = scorableScore.current && scorableScore.backfile
    ? buildMetricChanges(
        (key) => (scorableScore.current!.coverage as unknown as Record<string, number>)[key] || 0,
        (key) => (scorableScore.backfile!.coverage as unknown as Record<string, number>)[key] || 0
      )
    : [];

  const perType: Record<string, MetricChange[]> = {};
  const coverageType = member['coverage-type'] as unknown as {
    current?: Record<string, Record<string, number>>;
    backfile?: Record<string, Record<string, number>>;
  };
  for (const ct of contentTypeScores) {
    // Only meaningful when the type exists in both eras
    if (!ct.scorable || !ct.current || !ct.backfile) continue;
    const cur = coverageType.current?.[ct.type];
    const back = coverageType.backfile?.[ct.type];
    if (!cur || !back) continue;
    perType[ct.type] = buildMetricChanges(
      (key) => cur[key] || 0,
      (key) => back[key] || 0
    );
  }

  const mixShift: MixShiftEntry[] = [];
  const counts = member['counts-type'];
  const currentTotal = scorableScore.current?.works ?? 0;
  const backfileTotal = scorableScore.backfile?.works ?? 0;
  if (counts && currentTotal > 0 && backfileTotal > 0) {
    for (const ct of contentTypeScores) {
      if (!ct.scorable) continue;
      const currentWorks = counts.current?.[ct.type] ?? 0;
      const backfileWorks = counts.backfile?.[ct.type] ?? 0;
      if (currentWorks === 0 && backfileWorks === 0) continue;
      mixShift.push({
        type: ct.type,
        label: ct.label,
        currentShare: (currentWorks / currentTotal) * 100,
        backfileShare: (backfileWorks / backfileTotal) * 100,
        currentWorks,
        backfileWorks,
        score: ct.score,
      });
    }
  }

  return { aggregate, perType, mixShift };
}

async function getMemberData(id: string): Promise<{
  score: MemberIndex;
  contentTypeScores: ContentTypeScore[] | null;
  changeInsights: ChangeInsights | null;
  eraDimensions: EraDimensions | null;
  scorableScore: ScorableMemberScore | null;
} | null> {
  try {
    const member = await client.getMember(id);
    const score = calculateMemberScore(member);
    const contentTypeScores = calculateContentTypeScores(
      member['coverage-type'],
      member['counts-type']
    );
    const scorableScore = calculateScorableMemberScore(member);
    const changeInsights = buildChangeInsights(member, contentTypeScores, scorableScore);
    const eraDimensions: EraDimensions = {
      current: calculateDimensionsForPeriod(member.coverage, 'current'),
      backfile:
        member.counts['backfile-dois'] > 0
          ? calculateDimensionsForPeriod(member.coverage, 'backfile')
          : null,
    };
    return { score, contentTypeScores, changeInsights, eraDimensions, scorableScore };
  } catch (error) {
    if (error instanceof CrossrefNotFoundError) {
      return null;
    }

    // Fallback to cached leaderboard data on network/API errors
    const data = getLeaderboardData();
    if (data) {
      const entry = data.leaderboard.find((e) => e.id === parseInt(id));
      if (entry) {
        return {
          score: buildScoreFromLeaderboard(entry),
          contentTypeScores: null,
          changeInsights: null,
          eraDimensions: null,
          scorableScore: null,
        };
      }
    }

    throw error;
  }
}

// Pre-generate top publishers at build time for fast initial loads
export async function generateStaticParams() {
  const data = getLeaderboardData();
  if (!data) return [];

  // Pre-render top 100 publishers — most likely to be visited
  return data.leaderboard.slice(0, 100).map((entry) => ({
    id: entry.id.toString(),
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getMemberData(id);
  const score = result?.score;

  if (!score) {
    return {
      title: 'Member Not Found - Nexus-Index',
    };
  }

  return {
    title: `${score.metadata.entityName} - Nexus-Index`,
    description: `Index value: ${result?.scorableScore?.all?.score ?? score.total}/100. Explore observed Crossref metadata coverage, context, and recommendations.`,
    openGraph: {
      title: `${score.metadata.entityName} - Nexus-Index: ${result?.scorableScore?.all?.score ?? score.total}`,
      description: `Diagnostic index ${result?.scorableScore?.all?.score ?? score.total}/100 — explore observed Crossref metadata coverage, context, and recommendations.`,
    },
  };
}

export default async function MemberPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const requestedScope = await searchParams;
  const result = await getMemberData(id);

  if (!result) {
    notFound();
  }

  const { score, contentTypeScores, changeInsights, eraDimensions, scorableScore } = result;
  const rankingInfo = getRankingInfo(parseInt(id), score.total);
  const currentRankingInfo = getCurrentRankingInfo(
    parseInt(id),
    score.trend.currentScore
  );
  const isCachedData = score.metadata.dataSource === 'leaderboard-cache';
  const contentTypeRankings = getContentTypeRankings(
    parseInt(id),
    contentTypeScores?.filter((ct) => ct.scorable).map((ct) => ct.type) ?? []
  );
  const currentContentTypeRankings = getContentTypeRankings(
    parseInt(id),
    contentTypeScores?.filter((ct) => ct.scorable).map((ct) => ct.type) ?? [],
    'current'
  );
  const contentTypeLabels = Object.fromEntries(
    (contentTypeScores ?? []).map((ct) => [ct.type, ct.label])
  );
  const requestedContentType = parseContentType(requestedScope.contentType);
  const defaultContentType = contentTypeScores?.find((entry) => entry.type === 'journal-article' && entry.scorable)?.type
    ?? contentTypeScores?.find((entry) => entry.scorable)?.type
    ?? 'all';
  const hasExplicitContentType = typeof requestedScope.contentType === 'string';
  const contentType = !hasExplicitContentType
    ? defaultContentType
    : requestedContentType === 'all' || contentTypeScores?.some((entry) => entry.type === requestedContentType && entry.scorable)
      ? requestedContentType
      : defaultContentType;
  const initialScope = {
    contentType,
    era: parseBenchmarkEra(requestedScope.era),
  } as const;
  const benchmarkGeneratedAt = getLeaderboardData()?.generatedAt ?? null;
  const currentBenchmarkGeneratedAt = getCurrentLeaderboardData()?.generatedAt ?? null;
  const topScorableType = contentTypeScores?.find((entry) => entry.scorable)?.type;

  return (
    <MemberContentTypeProvider key={`${initialScope.contentType}-${initialScope.era}`} initialScope={initialScope}>
    <div className="min-h-screen py-8">
      <TrackMemberView
        name={score.metadata.entityName}
        indexValue={scorableScore?.all?.score ?? score.total}
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {score.metadata.entityName}
            </h1>
            <p className="mt-1 text-gray-500">
              {score.metadata.location && (
                <>
                  <span className="inline-flex items-center gap-1">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    {score.metadata.location}
                  </span>
                  {' '}&middot;{' '}
                </>
              )}
              Member ID: {score.metadata.entityId} &middot;{' '}
              {formatNumber(score.metadata.totalWorks)} total works
            </p>
          </div>
          <MemberScopedSearch />
        </div>

        {/* Cached Data Notice */}
        {isCachedData && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p>
              Showing cached data from{' '}
              {formatDataDate(score.metadata.calculatedAt)}.
              Live data from Crossref is temporarily unavailable. Detailed metrics and recommendations are not available in cached mode.
            </p>
          </div>
        )}

        <MemberScopeControls contentTypeScores={contentTypeScores} />

        {/* Ranking Banner — reacts to the content-type filter */}
        {(rankingInfo || currentRankingInfo) && (
          <MemberRankingBanner
            historical={rankingInfo}
            current={currentRankingInfo}
            historicalByContentType={contentTypeRankings}
            currentByContentType={currentContentTypeRankings}
            contentTypeLabels={contentTypeLabels}
            benchmarkGeneratedAt={benchmarkGeneratedAt}
            currentBenchmarkGeneratedAt={currentBenchmarkGeneratedAt}
            liveOverallScore={scorableScore?.all?.score ?? score.total}
            liveCurrentScore={scorableScore?.current?.score ?? score.trend.currentScore}
            contentTypeScores={contentTypeScores}
            aggregateBenchmarkAvailable={false}
          />
        )}

        {/* Main Content */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Left Column - Index and Dimensions */}
          <div className="space-y-6 lg:col-span-2">
            <MemberScoreView
              total={score.total}
              trend={score.trend}
              dimensions={score.dimensions}
              currentWorks={score.metadata.currentWorks}
              backfileWorks={score.metadata.backfileWorks}
              contentTypeScores={contentTypeScores}
              eraDimensions={eraDimensions}
              scorableScore={scorableScore}
            />

            {/* What changed between backfile and current era, and why */}
            {changeInsights && (
              <MemberChangeInsights
                aggregate={changeInsights.aggregate}
                perType={changeInsights.perType}
                mixShift={changeInsights.mixShift}
                currentScore={scorableScore?.current?.score ?? score.trend.currentScore}
                backfileScore={scorableScore?.backfile?.score ?? score.trend.backfileScore}
                aggregateScope={scorableScore?.current && scorableScore.backfile ? {
                  currentWorks: scorableScore.current.works,
                  backfileWorks: scorableScore.backfile.works,
                  currentExcludedWorks: scorableScore.current.excludedWorks,
                  backfileExcludedWorks: scorableScore.backfile.excludedWorks,
                } : undefined}
                perTypeScores={Object.fromEntries(
                  (contentTypeScores ?? []).map((ct) => [
                    ct.type,
                    {
                      current: ct.current?.score,
                      backfile: ct.backfile?.score,
                      label: ct.label,
                    },
                  ])
                )}
              />
            )}

            {/* Content Type Breakdown */}
            {contentTypeScores && contentTypeScores.length > 0 && (
              <div className="rounded-xl border bg-white p-4 sm:p-6 shadow-sm print:break-inside-avoid">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Index by Content Type</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {contentTypeScores.length === 1
                        ? `All works are ${contentTypeScores[0].label.toLowerCase()} \u2014 the aggregate index above reflects that content type.`
                        : 'Index values are calculated separately for each content type registered with Crossref. Overall is all years; Current and Backfile show the two deposit eras.'}
                    </p>
                  </div>
                </div>

                {contentTypeScores.length > 1 && (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                          <th className="pb-2 pr-4">Content Type</th>
                          <th className="pb-2 pr-4 text-right">Works</th>
                          <th className="pb-2 pr-4 text-center">Index</th>
                          <th className="pb-2 pr-4 text-center text-blue-600">Current</th>
                          <th className="pb-2 pr-4 text-center">Backfile</th>
                          <th className="hidden pb-2 pr-2 text-center sm:table-cell">Prov</th>
                          <th className="hidden pb-2 pr-2 text-center sm:table-cell">People</th>
                          <th className="hidden pb-2 pr-2 text-center sm:table-cell">Orgs</th>
                          <th className="hidden pb-2 pr-2 text-center sm:table-cell">Fund</th>
                          <th className="hidden pb-2 text-center sm:table-cell">Access</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contentTypeScores.map((ct) => (
                          <tr
                            key={ct.type}
                            className={cn(
                              'border-b last:border-0',
                              ct.type === topScorableType && 'bg-blue-50/50',
                              !ct.scorable && 'bg-slate-50 text-slate-500'
                            )}
                          >
                            <td className="py-2.5 pr-4 font-medium text-gray-900">
                              {ct.label}
                              {ct.type === topScorableType && contentTypeScores.length > 1 && (
                                <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                                  TOP
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 pr-4 text-right text-gray-600">
                              {ct.works !== undefined ? formatNumber(ct.works) : '\u2014'}
                            </td>
                            <td className="py-2.5 pr-4 text-center font-semibold text-gray-900">
                              {ct.scorable ? ct.score : <span className="text-xs font-medium text-slate-500">Not benchmarked</span>}
                            </td>
                            <td className="py-2.5 pr-4 text-center font-medium text-blue-700">
                              {ct.scorable && ct.current ? ct.current.score : '\u2014'}
                            </td>
                            <td className="py-2.5 pr-4 text-center text-gray-600">
                              {ct.scorable && ct.backfile ? ct.backfile.score : '\u2014'}
                            </td>
                            <td className="hidden py-2.5 pr-2 text-center text-gray-600 sm:table-cell">
                              {ct.scorable ? `${ct.dimensions.provenance}%` : '\u2014'}
                            </td>
                            <td className="hidden py-2.5 pr-2 text-center text-gray-600 sm:table-cell">
                              {ct.scorable ? `${ct.dimensions.people}%` : '\u2014'}
                            </td>
                            <td className="hidden py-2.5 pr-2 text-center text-gray-600 sm:table-cell">
                              {ct.scorable ? `${ct.dimensions.organizations}%` : '\u2014'}
                            </td>
                            <td className="hidden py-2.5 pr-2 text-center text-gray-600 sm:table-cell">
                              {ct.scorable ? `${ct.dimensions.funding}%` : '\u2014'}
                            </td>
                            <td className="hidden py-2.5 text-center text-gray-600 sm:table-cell">
                              {ct.scorable ? `${ct.dimensions.access}%` : '\u2014'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {contentTypeScores.length > 1 && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
                      <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      <span>
                        Only Crossref Participation Report work types are benchmarked. Peer reviews, journal issues, and other schema-specific records remain visible as <strong>Not benchmarked</strong> and do not reduce the aggregate.
                      </span>
                    </div>
                    <div className="flex items-start gap-1.5 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-500">
                      <svg className="mt-0.5 h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                      <span>
                        <strong className="text-gray-600">Want to compare by content type?</strong>{' '}
                        The <Link href="/leaderboard?era=current" className="text-blue-600 hover:underline">Benchmark Explorer</Link> supports filtering by content type - use it to compare like with like.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!isCachedData && (
              <MetricsTable
                contentTypeScores={contentTypeScores}
                eraDimensions={eraDimensions}
                currentWorks={score.metadata.currentWorks}
                backfileWorks={score.metadata.backfileWorks}
                scorableScore={scorableScore}
              />
            )}

            {!isCachedData && (
              <MemberActionPlan
                memberCurrentDimensions={scorableScore?.current?.metricDetails ?? null}
                memberCurrentWorks={scorableScore?.current?.works}
                contentTypeScores={contentTypeScores}
              />
            )}
          </div>

          {/* Right Column - provenance and sharing */}
          <div>
            {/* Additional Info */}
            <div className="rounded-xl border bg-white p-6 shadow-sm print:break-inside-avoid">
              <h3 className="text-lg font-semibold text-gray-900">About This Index</h3>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-gray-500">Data Source</dt>
                  <dd className="font-medium text-gray-900">
                    {isCachedData ? 'Cached benchmark data' : 'Crossref /members API'}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Live profile retrieved</dt>
                  <dd className="font-medium text-gray-900">
                    {formatDataDate(score.metadata.calculatedAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Overall benchmark snapshot</dt>
                  <dd className="font-medium text-gray-900">
                    {benchmarkGeneratedAt ? formatDataDate(benchmarkGeneratedAt) : 'Not available'}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Current benchmark snapshot</dt>
                  <dd className="font-medium text-gray-900">
                    {currentBenchmarkGeneratedAt ? formatDataDate(currentBenchmarkGeneratedAt) : 'Not available'}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Crossref Participation Report */}
            <div className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">Crossref Reports</h3>
              <p className="mt-2 text-sm text-gray-600">
                View detailed metadata coverage on Crossref&apos;s official tools.
              </p>
              <div className="mt-4 space-y-2">
                <a
                  href={`https://www.crossref.org/members/prep/${id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                  </svg>
                  Crossref Participation Report
                </a>
                <a
                  href={`https://api.crossref.org/members/${id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 18 22 12 16 6"/>
                    <polyline points="8 6 2 12 8 18"/>
                  </svg>
                  View Raw API Data
                </a>
              </div>
            </div>

            {/* Share Section */}
            <div className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">Share Results</h3>
              <p className="mt-2 text-sm text-gray-600">
                Share this diagnostic metadata health profile with stakeholders or use it in reports.
              </p>
              <div className="mt-4">
                <CopyLinkButton />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </MemberContentTypeProvider>
  );
}
