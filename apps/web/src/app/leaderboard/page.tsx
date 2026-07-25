import { Metadata } from 'next';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { LeaderboardTable } from '@/components/leaderboard-table';

export const metadata: Metadata = {
  title: 'Metadata Health Benchmark - Nexus-Index',
  description: 'Compare observed Crossref metadata health across publishers and content types.',
};

// Revalidate every hour (but data comes from static file)
export const revalidate = 3600;

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

interface LeaderboardData {
  generatedAt: string;
  totalMembers: number;
  totalWithWorks: number;
  availableContentTypes?: { type: string; label: string; count: number }[];
  leaderboard: LeaderboardEntry[];
}

function getLeaderboardData(): LeaderboardData | null {
  const dataPath = join(process.cwd(), 'data', 'leaderboard.json');

  if (!existsSync(dataPath)) {
    return null;
  }

  try {
    const content = readFileSync(dataPath, 'utf-8');
    return JSON.parse(content) as LeaderboardData;
  } catch {
    return null;
  }
}

function getNextUpdateDate(fromDate: Date): Date {
  const year = fromDate.getFullYear();
  const month = fromDate.getMonth();
  const day = fromDate.getDate();

  // Updates happen on 1st and 15th of each month
  if (day < 15) {
    // Next update is 15th of current month
    return new Date(year, month, 15);
  } else {
    // Next update is 1st of next month
    return new Date(year, month + 1, 1);
  }
}

export default function LeaderboardPage() {
  const data = getLeaderboardData();

  if (!data) {
    return (
      <div className="min-h-screen py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Metadata Health Benchmark
            </h1>
            <div className="mt-8 rounded-lg border border-yellow-200 bg-yellow-50 p-6">
              <p className="text-lg font-medium text-yellow-800">
                Benchmark data not yet generated
              </p>
              <p className="mt-2 text-yellow-700">
                Run the following command to generate benchmark data:
              </p>
              <code className="mt-4 block rounded bg-yellow-100 p-3 font-mono text-sm text-yellow-900">
                pnpm --filter web generate-leaderboard
              </code>
              <p className="mt-4 text-sm text-yellow-600">
                This will fetch Crossref members and calculate their index values.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { leaderboard, generatedAt, totalMembers, totalWithWorks, availableContentTypes } = data;
  const initialLeaderboard = leaderboard.slice(0, 50);
  const publishersWithBackfile = leaderboard.filter(
    (entry) =>
      entry.improvement !== undefined &&
      entry.improvement !== null &&
      entry.backfileScore !== undefined &&
      entry.backfileScore !== null &&
      entry.backfileScore > 0
  ).length;

  // Index distribution across diagnostic bands (mirrors core thresholds)
  const scoreBands = [
    { label: '80–100', color: 'bg-green-100 text-green-800', min: 80, max: 101 },
    { label: '65–79', color: 'bg-blue-100 text-blue-800', min: 65, max: 80 },
    { label: '50–64', color: 'bg-yellow-100 text-yellow-800', min: 50, max: 65 },
    { label: '35–49', color: 'bg-orange-100 text-orange-800', min: 35, max: 50 },
    { label: '0–34', color: 'bg-red-100 text-red-800', min: 0, max: 35 },
  ].map((band) => ({
    ...band,
    count: leaderboard.filter((e) => e.score >= band.min && e.score < band.max).length,
  }));

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Metadata Health Benchmark
          </h1>
          <p className="mt-2 text-gray-600">
            Compare the metadata currently visible in Crossref—not publisher or research quality
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Comparing <span className="font-semibold text-blue-600">{totalWithWorks.toLocaleString()}</span> members with registered works out of{' '}
            <span className="font-semibold text-blue-600">{totalMembers.toLocaleString()}</span> Crossref members
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
            Default index values aggregate across all content types. Reviews, components,
            corrections, and other non-article records can follow different metadata patterns.{' '}
            <span className="text-gray-500">Use the Content Type filter to compare like with like.</span>
          </p>
        </div>

        {/* CTA to Current Era */}
        <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-start gap-3">
            <svg
              className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
            <div className="text-sm text-emerald-800">
              <p className="font-medium">Looking for who&apos;s doing well <em>right now</em>?</p>
              <p className="mt-1">
                This benchmark averages current and backfile metadata. Large historical catalogs
                can contain records created before today&apos;s identifier standards. To focus on
                current deposit practices, see the{' '}
                <a
                  href="/leaderboard/current"
                  className="inline-flex items-center gap-1 font-semibold text-emerald-700 underline hover:text-emerald-900"
                >
                  Current Era Benchmark
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Limitations */}
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <svg
              className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="text-sm text-amber-800">
              <p className="font-medium">How to interpret this benchmark</p>
              <ul className="mt-1 list-inside list-disc space-y-1">
                <li>
                  <strong>Historical context:</strong> Large backfiles can have lower index values because
                  old content (pre-ORCID, pre-ROR era) lacks modern metadata that didn&apos;t exist at the time.
                </li>
                <li>
                  <strong>Not all members are publishers:</strong> Digital archives (JSTOR), intergovernmental
                  organizations (UN, OECD), and data repositories register DOIs for different purposes. Their
                  lower values can reflect a different mission or content model, not negligence.
                </li>
                <li>
                  <strong>Scale isn&apos;t accounted for:</strong> Achieving 100% metadata coverage on 172
                  articles is a different challenge than on 24 million. Small publishers have a structural
                  advantage in direct comparisons.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Info about excluded members */}
        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-start gap-3">
            <svg
              className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-400"
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
            <div className="text-sm text-gray-600">
              <p className="font-medium text-gray-700">
                Why are {(totalMembers - totalWithWorks).toLocaleString()} members excluded?
              </p>
              <p className="mt-1">
                Crossref members with <strong>zero registered DOIs</strong> are excluded from the
                comparisons. These are typically organizations that have registered as members but
                haven&apos;t yet deposited any metadata, or legacy accounts that are no longer
                active. Only members with at least one DOI receive an index value.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-lg border bg-white p-4 text-center shadow-sm">
            <p className="text-sm text-gray-500">Members Compared</p>
            <p className="text-2xl font-bold text-gray-900">
              {totalWithWorks.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border bg-white p-4 text-center shadow-sm">
            <p className="text-sm text-gray-500">Average Index</p>
            <p className="text-2xl font-bold text-gray-900">
              {leaderboard.length > 0
                ? Math.round(
                    leaderboard.reduce((sum, e) => sum + e.score, 0) /
                      leaderboard.length
                  )
                : 0}
            </p>
          </div>
          <div className="rounded-lg border bg-white p-4 text-center shadow-sm">
            <p className="text-sm text-gray-500">Highest Index</p>
            <p className="text-2xl font-bold text-green-600">
              {leaderboard[0]?.score || 0}
            </p>
          </div>
          <div className="rounded-lg border bg-white p-4 text-center shadow-sm">
            <p className="text-sm text-gray-500">Last Updated</p>
            <p className="text-lg font-medium text-gray-900">
              {new Date(generatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <div className="rounded-lg border bg-white p-4 text-center shadow-sm">
            <p className="text-sm text-gray-500">Next Update</p>
            <p className="text-lg font-medium text-blue-600">
              {getNextUpdateDate(new Date()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Index Distribution */}
        <div className="mt-6 rounded-lg border bg-white p-4 shadow-sm">
          <p className="mb-3 text-sm font-medium text-gray-700">Index Distribution</p>
          <div className="flex flex-wrap items-center gap-4">
            {scoreBands.map((band) => (
              <div key={band.label} className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold ${band.color}`}
                >
                  {band.label}
                </span>
                <span className="text-sm text-gray-600">
                  {band.count.toLocaleString()} ({((band.count / totalWithWorks) * 100).toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard Table with Search and Pagination */}
        <div className="mt-8">
          <LeaderboardTable
            initialLeaderboard={initialLeaderboard}
            initialTotal={totalWithWorks}
            totalWithWorks={totalWithWorks}
            publishersWithBackfile={publishersWithBackfile}
            availableContentTypes={availableContentTypes || []}
          />
        </div>

        {/* Footer note */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Data updated on {new Date(generatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.
          Rankings refresh biweekly (1st and 15th of each month).
        </p>
      </div>
    </div>
  );
}
