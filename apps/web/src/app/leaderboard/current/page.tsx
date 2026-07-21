import { Metadata } from 'next';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import Link from 'next/link';
import { CurrentLeaderboardTable } from '@/components/current-leaderboard-table';

export const metadata: Metadata = {
  title: 'Current Era Leaderboard - Nexus Score',
  description:
    'See which publishers have the best metadata coverage on recent publications. Ranked by current content quality, not weighed down by historical backfiles.',
};

export const revalidate = 3600;

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

interface CurrentLeaderboardData {
  generatedAt: string;
  totalMembers: number;
  totalActive: number;
  availableContentTypes?: { type: string; label: string; count: number }[];
  leaderboard: CurrentLeaderboardEntry[];
}

function getCurrentLeaderboardData(): CurrentLeaderboardData | null {
  const dataPath = join(process.cwd(), 'data', 'current-leaderboard.json');
  if (!existsSync(dataPath)) return null;
  try {
    return JSON.parse(readFileSync(dataPath, 'utf-8')) as CurrentLeaderboardData;
  } catch {
    return null;
  }
}

function getNextUpdateDate(fromDate: Date): Date {
  const year = fromDate.getFullYear();
  const month = fromDate.getMonth();
  const day = fromDate.getDate();
  if (day < 15) return new Date(year, month, 15);
  return new Date(year, month + 1, 1);
}

export default function CurrentLeaderboardPage() {
  const data = getCurrentLeaderboardData();

  if (!data) {
    return (
      <div className="min-h-screen py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Current Era Leaderboard
            </h1>
            <div className="mt-8 rounded-lg border border-yellow-200 bg-yellow-50 p-6">
              <p className="text-lg font-medium text-yellow-800">
                Current-era leaderboard data not yet generated
              </p>
              <p className="mt-2 text-yellow-700">
                Run the leaderboard generator to produce this data:
              </p>
              <code className="mt-4 block rounded bg-yellow-100 p-3 font-mono text-sm text-yellow-900">
                pnpm --filter web generate-leaderboard
              </code>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { leaderboard, generatedAt, totalMembers, totalActive, availableContentTypes } = data;

  const gradeDistribution = leaderboard.reduce(
    (acc, entry) => {
      acc[entry.grade as keyof typeof acc] = (acc[entry.grade as keyof typeof acc] || 0) + 1;
      return acc;
    },
    { A: 0, B: 0, C: 0, D: 0, F: 0 }
  );

  const avgScore = leaderboard.length > 0
    ? Math.round(leaderboard.reduce((sum, e) => sum + e.score, 0) / leaderboard.length)
    : 0;

  // Count grade upgrades (current grade better than overall grade)
  const gradeOrder: Record<string, number> = { A: 5, B: 4, C: 3, D: 2, F: 1 };
  const upgrades = leaderboard.filter(
    (e) => gradeOrder[e.grade] > gradeOrder[e.overallGrade]
  ).length;

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
            Current Era
          </div>
          <h1 className="mt-3 text-3xl font-bold text-gray-900">
            Who&apos;s Getting It Right <em>Now</em>?
          </h1>
          <p className="mt-2 text-gray-600">
            Publishers ranked by metadata quality on recent publications — no backfile drag
          </p>
          <p className="mt-1 text-sm text-gray-500">
            <span className="font-semibold text-emerald-600">{totalActive.toLocaleString()}</span> active publishers
            out of <span className="font-semibold text-emerald-600">{totalMembers.toLocaleString()}</span> Crossref members
          </p>
        </div>

        {/* Content Type Note */}
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-600">
          <svg className="h-4 w-4 flex-shrink-0 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <p>
            Default scores aggregate across all content types. Publishers registering non-article content (reviews, components, corrections) may show lower aggregate scores.{' '}
            <span className="text-gray-500">Use the Content Type filter below to rank publishers by specific types like Journal Articles, Proceedings, or Books.</span>
          </p>
        </div>

        {/* Insights CTA */}
        <div className="mt-6 flex items-center justify-center">
          <Link
            href="/leaderboard/current/insights"
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-white px-4 py-2 text-sm font-medium text-emerald-700 shadow-sm hover:bg-emerald-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
            Read the insights: What changes when you drop the backfile?
          </Link>
        </div>

        {/* Explainer */}
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-start gap-3">
            <svg
              className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="text-sm text-emerald-800">
              <p className="font-medium">How is this different from the overall leaderboard?</p>
              <p className="mt-1">
                The <a href="/leaderboard" className="font-medium underline hover:text-emerald-900">overall leaderboard</a> averages
                current and backfile metadata — meaning publishers with large historical catalogs
                (some dating back centuries) get dragged down by old content they can&apos;t retroactively fix.
                This view ranks purely on <strong>current-era content</strong> (last 2 years),
                showing who&apos;s doing the best work <em>right now</em>.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-lg border bg-white p-4 text-center shadow-sm">
            <p className="text-sm text-gray-500">Active Publishers</p>
            <p className="text-2xl font-bold text-gray-900">
              {totalActive.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border bg-white p-4 text-center shadow-sm">
            <p className="text-sm text-gray-500">Average Score</p>
            <p className="text-2xl font-bold text-gray-900">{avgScore}</p>
          </div>
          <div className="rounded-lg border bg-white p-4 text-center shadow-sm">
            <p className="text-sm text-gray-500">Top Score</p>
            <p className="text-2xl font-bold text-emerald-600">
              {leaderboard[0]?.score || 0}
            </p>
          </div>
          <div className="rounded-lg border bg-white p-4 text-center shadow-sm">
            <p className="text-sm text-gray-500">Grade Upgrades</p>
            <p className="text-2xl font-bold text-emerald-600">
              {upgrades.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">vs overall grade</p>
          </div>
          <div className="rounded-lg border bg-white p-4 text-center shadow-sm">
            <p className="text-sm text-gray-500">Last Updated</p>
            <p className="text-lg font-medium text-gray-900">
              {new Date(generatedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Grade Distribution */}
        <div className="mt-6 rounded-lg border bg-white p-4 shadow-sm">
          <p className="mb-3 text-sm font-medium text-gray-700">Grade Distribution (Current Era)</p>
          <div className="flex flex-wrap items-center gap-4">
            {(['A', 'B', 'C', 'D', 'F'] as const).map((grade) => {
              const colors: Record<string, string> = {
                A: 'bg-green-100 text-green-800',
                B: 'bg-blue-100 text-blue-800',
                C: 'bg-yellow-100 text-yellow-800',
                D: 'bg-orange-100 text-orange-800',
                F: 'bg-red-100 text-red-800',
              };
              return (
                <div key={grade} className="flex items-center gap-2">
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${colors[grade]}`}
                  >
                    {grade}
                  </span>
                  <span className="text-sm text-gray-600">
                    {gradeDistribution[grade].toLocaleString()} (
                    {((gradeDistribution[grade] / totalActive) * 100).toFixed(1)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Table */}
        <div className="mt-8">
          <CurrentLeaderboardTable leaderboard={leaderboard} totalActive={totalActive} availableContentTypes={availableContentTypes || []} />
        </div>

        {/* Footer note */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Data updated on{' '}
          {new Date(generatedAt).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
          . Rankings refresh biweekly. &quot;Current&quot; = last 2 calendar years per Crossref.
        </p>
      </div>
    </div>
  );
}
