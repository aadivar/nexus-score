import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import {
  CrossrefClient,
  calculateMemberScore,
  calculateContentTypeScores,
  CrossrefNotFoundError,
  type NexusScore,
  type ContentTypeScore,
} from '@nexus-score/core';
import { MemberScoreView } from '@/components/member-score-view';
import { MemberContentTypeProvider } from '@/components/member-content-type-context';
import {
  MemberRankingBanner,
  type RankingData,
} from '@/components/member-ranking-banner';
import { MetricsTable } from '@/components/metrics-table';
import { RecommendationsList } from '@/components/recommendations-list';
import { MemberSearch } from '@/components/member-search';
import { TrackMemberView } from '@/components/track-member-view';
import { CopyLinkButton } from '@/components/copy-link-button';
import { formatNumber, cn } from '@/lib/utils';

// Revalidate every 24 hours — keeps scores fresh between 15-day leaderboard refreshes
export const revalidate = 86400;

interface PageProps {
  params: Promise<{ id: string }>;
}

interface LeaderboardContentType {
  type: string;
  label: string;
  score: number;
  grade: string;
}

interface LeaderboardEntry {
  rank: number;
  id: number;
  name: string;
  location?: string;
  score: number;
  grade: string;
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
  rank: number;
  totalPublishers: number;
  percentile: number;
  nearbyPublishers: LeaderboardEntry[];
  topGap: number | null; // points needed to reach top 10%
}

interface CurrentLeaderboardEntry {
  rank: number;
  id: number;
  name: string;
  score: number;
}

interface CurrentLeaderboardData {
  totalActive: number;
  leaderboard: CurrentLeaderboardEntry[];
}

interface EraRanking {
  overallRank: number | null;
  overallTotal: number;
  currentRank: number | null;
  currentTotal: number;
}

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

function getEraRanking(memberId: number): EraRanking | null {
  const overallData = getLeaderboardData();
  const currentData = getCurrentLeaderboardData();
  if (!overallData && !currentData) return null;

  const overallEntry = overallData?.leaderboard.find((e) => e.id === memberId);
  const currentEntry = currentData?.leaderboard.find((e) => e.id === memberId);

  return {
    overallRank: overallEntry?.rank ?? null,
    overallTotal: overallData?.totalWithWorks ?? 0,
    currentRank: currentEntry?.rank ?? null,
    currentTotal: currentData?.totalActive ?? 0,
  };
}

function getRankingInfo(memberId: number, score: number): RankingInfo | null {
  const data = getLeaderboardData();
  if (!data) return null;

  const { leaderboard, totalWithWorks } = data;
  const memberEntry = leaderboard.find((e) => e.id === memberId);

  if (!memberEntry) {
    // Member not in leaderboard (maybe 0 works) - estimate rank by score
    const betterCount = leaderboard.filter((e) => e.score > score).length;
    const rank = betterCount + 1;
    const percentile = Math.round((1 - rank / totalWithWorks) * 100);
    const top10PercentRank = Math.ceil(totalWithWorks * 0.1);
    const top10Entry = leaderboard[top10PercentRank - 1];
    const topGap = top10Entry ? Math.max(0, top10Entry.score - score) : null;

    return {
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
  const nearbyPublishers = leaderboard
    .filter(
      (e) =>
        e.id !== memberId &&
        e.rank >= Math.max(1, rank - 2) &&
        e.rank <= rank + 2
    )
    .slice(0, 4);

  // Calculate gap to top 10%
  const top10PercentRank = Math.ceil(totalWithWorks * 0.1);
  const top10Entry = leaderboard[top10PercentRank - 1];
  const topGap =
    rank > top10PercentRank && top10Entry
      ? Math.max(0, top10Entry.score - score)
      : null;

  return {
    rank,
    totalPublishers: totalWithWorks,
    percentile: Math.max(0, percentile),
    nearbyPublishers,
    topGap,
  };
}

/**
 * Recompute rankings within each of the member's content types, mirroring
 * the /api/leaderboard?contentType= re-ranking: publishers with that type,
 * sorted by that type's all-years score.
 */
function getContentTypeRankings(
  memberId: number,
  types: string[]
): Record<string, RankingData> {
  const data = getLeaderboardData();
  const rankings: Record<string, RankingData> = {};
  if (!data || types.length === 0) return rankings;

  for (const type of types) {
    const ranked = data.leaderboard
      .map((entry) => {
        const ct = entry.contentTypes?.find((c) => c.type === type);
        return ct ? { entry, ctScore: ct.score } : null;
      })
      .filter((x): x is { entry: LeaderboardEntry; ctScore: number } => x !== null)
      .sort((a, b) => b.ctScore - a.ctScore);

    const index = ranked.findIndex((x) => x.entry.id === memberId);
    if (index === -1) continue;

    const rank = index + 1;
    const total = ranked.length;
    const percentile = Math.round((1 - rank / total) * 100);

    const nearbyPublishers = ranked
      .slice(Math.max(0, index - 2), index + 3)
      .filter((x) => x.entry.id !== memberId)
      .slice(0, 4)
      .map((x) => ({
        id: x.entry.id,
        name: x.entry.name,
        rank: ranked.indexOf(x) + 1,
        score: x.ctScore,
      }));

    const top10PercentRank = Math.ceil(total * 0.1);
    const top10 = ranked[top10PercentRank - 1];
    const topGap =
      rank > top10PercentRank && top10
        ? Math.max(0, top10.ctScore - ranked[index].ctScore)
        : null;

    rankings[type] = {
      rank,
      totalPublishers: total,
      percentile: Math.max(0, percentile),
      nearbyPublishers,
      topGap,
    };
  }

  return rankings;
}

function getImprovementTips(dimensions: NexusScore['dimensions']): {
  dimension: string;
  currentPercent: number;
  potentialGain: number;
  tip: string;
  docUrl: string;
}[] {
  const tips: {
    dimension: string;
    currentPercent: number;
    potentialGain: number;
    tip: string;
    docUrl: string;
  }[] = [];

  // Calculate potential gains for each dimension
  if (dimensions.provenance.percentage < 80) {
    const gain = Math.round((80 - dimensions.provenance.percentage) * 0.25);
    tips.push({
      dimension: 'Provenance',
      currentPercent: dimensions.provenance.percentage,
      potentialGain: gain,
      tip: 'Add reference lists to your DOI deposits. Even partial references help establish citation links.',
      docUrl: 'https://www.crossref.org/documentation/cited-by/',
    });
  }

  if (dimensions.people.percentage < 80) {
    const gain = Math.round((80 - dimensions.people.percentage) * 0.2);
    tips.push({
      dimension: 'People',
      currentPercent: dimensions.people.percentage,
      potentialGain: gain,
      tip: 'Include ORCID iDs for authors. Encourage authors to authenticate their ORCID during submission.',
      docUrl: 'https://www.crossref.org/documentation/member-setup/orcid/',
    });
  }

  if (dimensions.organizations.percentage < 80) {
    const gain = Math.round((80 - dimensions.organizations.percentage) * 0.15);
    tips.push({
      dimension: 'Organizations',
      currentPercent: dimensions.organizations.percentage,
      potentialGain: gain,
      tip: 'Add author affiliations with ROR IDs. The ROR API can help match institution names to IDs.',
      docUrl: 'https://www.crossref.org/documentation/schema-library/markup-guide-metadata-segments/affiliations/',
    });
  }

  if (dimensions.funding.percentage < 80) {
    const gain = Math.round((80 - dimensions.funding.percentage) * 0.2);
    tips.push({
      dimension: 'Funding',
      currentPercent: dimensions.funding.percentage,
      potentialGain: gain,
      tip: 'Include funder information using Open Funder Registry IDs and grant/award numbers.',
      docUrl: 'https://www.crossref.org/documentation/funder-registry/',
    });
  }

  if (dimensions.access.percentage < 80) {
    const gain = Math.round((80 - dimensions.access.percentage) * 0.2);
    tips.push({
      dimension: 'Access',
      currentPercent: dimensions.access.percentage,
      potentialGain: gain,
      tip: 'Add abstracts, license URLs (using SPDX identifiers), and full-text links to your metadata.',
      docUrl: 'https://www.crossref.org/documentation/schema-library/markup-guide-metadata-segments/abstracts/',
    });
  }

  // Sort by potential gain (highest first)
  tips.sort((a, b) => b.potentialGain - a.potentialGain);

  return tips.slice(0, 3); // Return top 3
}

function scoreToGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 80) return 'A';
  if (score >= 65) return 'B';
  if (score >= 50) return 'C';
  if (score >= 35) return 'D';
  return 'F';
}

function buildScoreFromLeaderboard(entry: LeaderboardEntry): NexusScore {
  const currentScore = entry.currentScore ?? entry.score;
  const backfileScore = entry.backfileScore ?? entry.score;
  const change = currentScore - backfileScore;

  return {
    total: entry.score,
    grade: scoreToGrade(entry.score),
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

async function getMemberData(id: string): Promise<{
  score: NexusScore;
  contentTypeScores: ContentTypeScore[] | null;
} | null> {
  try {
    const member = await client.getMember(id);
    const score = calculateMemberScore(member);
    const contentTypeScores = calculateContentTypeScores(member['coverage-type']);
    return { score, contentTypeScores };
  } catch (error) {
    if (error instanceof CrossrefNotFoundError) {
      return null;
    }

    // Fallback to cached leaderboard data on network/API errors
    const data = getLeaderboardData();
    if (data) {
      const entry = data.leaderboard.find((e) => e.id === parseInt(id));
      if (entry) {
        return { score: buildScoreFromLeaderboard(entry), contentTypeScores: null };
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
      title: 'Member Not Found - Nexus Score',
    };
  }

  return {
    title: `${score.metadata.entityName} - Nexus Score`,
    description: `Nexus Score: ${score.total}/100 (Grade ${score.grade}). View metadata coverage breakdown and recommendations.`,
    openGraph: {
      title: `${score.metadata.entityName} - Nexus Score: ${score.total}`,
      description: `Grade ${score.grade} - View metadata coverage breakdown and improvement recommendations.`,
    },
  };
}

export default async function MemberPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getMemberData(id);

  if (!result) {
    notFound();
  }

  const { score, contentTypeScores } = result;
  const rankingInfo = getRankingInfo(parseInt(id), score.total);
  const improvementTips = getImprovementTips(score.dimensions);
  const isCachedData = score.metadata.dataSource === 'leaderboard-cache';
  const eraRanking = getEraRanking(parseInt(id));
  const contentTypeRankings = getContentTypeRankings(
    parseInt(id),
    contentTypeScores?.map((ct) => ct.type) ?? []
  );
  const contentTypeLabels = Object.fromEntries(
    (contentTypeScores ?? []).map((ct) => [ct.type, ct.label])
  );

  return (
    <MemberContentTypeProvider>
    <div className="min-h-screen py-8">
      <TrackMemberView
        name={score.metadata.entityName}
        grade={score.grade}
        score={score.total}
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
          <MemberSearch
            placeholder="Search another publisher..."
            className="w-full sm:w-80"
          />
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
              {new Date(score.metadata.calculatedAt).toLocaleDateString()}.
              Live data from Crossref is temporarily unavailable. Detailed metrics and recommendations are not available in cached mode.
            </p>
          </div>
        )}

        {/* Ranking Banner — reacts to the content-type filter */}
        {rankingInfo && (
          <MemberRankingBanner
            aggregate={{
              rank: rankingInfo.rank,
              totalPublishers: rankingInfo.totalPublishers,
              percentile: rankingInfo.percentile,
              nearbyPublishers: rankingInfo.nearbyPublishers.map((pub) => ({
                id: pub.id,
                name: pub.name,
                rank: pub.rank,
                score: pub.score,
              })),
              topGap: rankingInfo.topGap,
            }}
            perContentType={contentTypeRankings}
            contentTypeLabels={contentTypeLabels}
          />
        )}

        {/* Main Content */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Left Column - Score and Dimensions */}
          <div className="space-y-6 lg:col-span-2">
            <MemberScoreView
              total={score.total}
              grade={score.grade}
              trend={score.trend}
              dimensions={score.dimensions}
              currentWorks={score.metadata.currentWorks}
              backfileWorks={score.metadata.backfileWorks}
              contentTypeScores={contentTypeScores}
              eraRanking={eraRanking}
            />

            {/* Content Type Breakdown */}
            {contentTypeScores && contentTypeScores.length > 0 && (
              <div className="rounded-xl border bg-white p-4 sm:p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Score by Content Type</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {contentTypeScores.length === 1
                        ? `All works are ${contentTypeScores[0].label.toLowerCase()} \u2014 the aggregate score above is accurate.`
                        : 'Scores calculated separately for each content type registered with Crossref. Score covers all years; Current and Backfile split it by era. The aggregate score above includes all types.'}
                    </p>
                  </div>
                </div>

                {contentTypeScores.length > 1 && (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                          <th className="pb-2 pr-4">Content Type</th>
                          <th className="pb-2 pr-4 text-center">Score</th>
                          <th className="pb-2 pr-4 text-center">Grade</th>
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
                        {contentTypeScores.map((ct, idx) => (
                          <tr
                            key={ct.type}
                            className={cn(
                              'border-b last:border-0',
                              idx === 0 && 'bg-blue-50/50'
                            )}
                          >
                            <td className="py-2.5 pr-4 font-medium text-gray-900">
                              {ct.label}
                              {idx === 0 && contentTypeScores.length > 1 && (
                                <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                                  TOP
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 pr-4 text-center font-semibold text-gray-900">
                              {ct.score}
                            </td>
                            <td className="py-2.5 pr-4 text-center">
                              <span
                                className={cn(
                                  'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                                  ct.grade === 'A' && 'bg-green-100 text-green-700',
                                  ct.grade === 'B' && 'bg-blue-100 text-blue-700',
                                  ct.grade === 'C' && 'bg-yellow-100 text-yellow-700',
                                  ct.grade === 'D' && 'bg-orange-100 text-orange-700',
                                  ct.grade === 'F' && 'bg-red-100 text-red-700'
                                )}
                              >
                                {ct.grade}
                              </span>
                            </td>
                            <td className="py-2.5 pr-4 text-center font-medium text-blue-700">
                              {ct.current ? ct.current.score : '\u2014'}
                            </td>
                            <td className="py-2.5 pr-4 text-center text-gray-600">
                              {ct.backfile ? ct.backfile.score : '\u2014'}
                            </td>
                            <td className="hidden py-2.5 pr-2 text-center text-gray-600 sm:table-cell">
                              {ct.dimensions.provenance}%
                            </td>
                            <td className="hidden py-2.5 pr-2 text-center text-gray-600 sm:table-cell">
                              {ct.dimensions.people}%
                            </td>
                            <td className="hidden py-2.5 pr-2 text-center text-gray-600 sm:table-cell">
                              {ct.dimensions.organizations}%
                            </td>
                            <td className="hidden py-2.5 pr-2 text-center text-gray-600 sm:table-cell">
                              {ct.dimensions.funding}%
                            </td>
                            <td className="hidden py-2.5 text-center text-gray-600 sm:table-cell">
                              {ct.dimensions.access}%
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
                        Non-article content types (reviews, components, corrections) typically have lower metadata coverage, which can reduce the aggregate score above.
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
                        The <Link href="/leaderboard/current" className="text-blue-600 hover:underline">leaderboard</Link> supports filtering by content type — use it to see how publishers rank for journal articles, peer reviews, or other types individually.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!isCachedData && <MetricsTable dimensions={score.dimensions} />}

            {/* Improvement Tips CTA */}
            {!isCachedData && improvementTips.length > 0 && (
              <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-6">
                {/* Context note when primary content type scores much higher than aggregate */}
                {contentTypeScores && contentTypeScores.length > 1 && contentTypeScores[0].score - score.total >= 15 && (
                  <div className="mb-4 flex items-start gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
                    <svg className="mt-0.5 h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    <span>
                      Your <strong>{contentTypeScores[0].label.toLowerCase()}</strong> score <strong>{contentTypeScores[0].score}</strong> (Grade {contentTypeScores[0].grade}) — strong work on your primary research outputs! The tips below reflect your aggregate coverage across all content types, where there&apos;s still room to grow.
                    </span>
                  </div>
                )}
                <h3 className="flex items-center gap-2 text-lg font-semibold text-blue-900">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                  Quick Wins to Improve Your Ranking
                </h3>
                <p className="mt-2 text-sm text-blue-700">
                  Small metadata improvements can significantly boost your score.
                  Here are the highest-impact changes you can make:
                </p>
                <div className="mt-4 space-y-4">
                  {improvementTips.map((tip, index) => (
                    <div
                      key={tip.dimension}
                      className="rounded-lg bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                              {index + 1}
                            </span>
                            <h4 className="font-semibold text-gray-900">
                              Improve {tip.dimension}
                            </h4>
                            <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                              +{tip.potentialGain} pts potential
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-gray-600">{tip.tip}</p>
                          <div className="mt-2 flex items-center gap-4">
                            <span className="text-xs text-gray-500">
                              Current: {tip.currentPercent}% coverage
                            </span>
                            <a
                              href={tip.docUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-medium text-blue-600 hover:underline"
                            >
                              View Crossref Documentation &rarr;
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-lg bg-blue-100 p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Pro Tip:</strong> Focus on your current (recent)
                    publications first. Improving metadata on new deposits is easier
                    than updating backfiles, and it will immediately improve your
                    &quot;current&quot; coverage scores.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Recommendations */}
          <div>
            {!isCachedData && <RecommendationsList recommendations={score.recommendations} limit={5} />}

            {/* Additional Info */}
            <div className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">About This Score</h3>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-gray-500">Data Source</dt>
                  <dd className="font-medium text-gray-900">
                    {isCachedData ? 'Cached leaderboard data' : 'Crossref /members API'}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Last Updated</dt>
                  <dd className="font-medium text-gray-900">
                    {new Date(score.metadata.calculatedAt).toLocaleDateString()}
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
                Share your Research Nexus Score with stakeholders or use it in reports.
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
