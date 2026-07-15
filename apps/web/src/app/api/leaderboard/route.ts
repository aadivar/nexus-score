import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

type Grade = 'A' | 'B' | 'C' | 'D' | 'F';
type DimensionKey = 'provenance' | 'people' | 'organizations' | 'funding' | 'access';
type SortField = 'default' | 'score' | 'works' | 'improvement' | DimensionKey;
type SortDirection = 'asc' | 'desc';
type ViewMode = 'overall' | 'progress';

interface ContentTypeEntry {
  type: string;
  label: string;
  score: number;
  grade: string;
}

interface DimensionScores {
  provenance: number;
  people: number;
  organizations: number;
  funding: number;
  access: number;
}

export interface LeaderboardEntry {
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
  dimensions: DimensionScores;
  currentDimensions?: DimensionScores;
  contentTypes?: ContentTypeEntry[];
  currentContentTypes?: ContentTypeEntry[];
}

interface LeaderboardData {
  generatedAt: string;
  totalMembers: number;
  totalWithWorks: number;
  leaderboard: LeaderboardEntry[];
}

const GRADES = new Set<Grade>(['A', 'B', 'C', 'D', 'F']);
const DIMENSIONS = new Set<DimensionKey>([
  'provenance',
  'people',
  'organizations',
  'funding',
  'access',
]);
const SORT_FIELDS = new Set<SortField>([
  'default',
  'score',
  'works',
  'improvement',
  ...DIMENSIONS,
]);

let cachedData: LeaderboardData | null | undefined;

function getLeaderboardData(): LeaderboardData | null {
  if (cachedData !== undefined) return cachedData;

  const dataPath = join(process.cwd(), 'data', 'leaderboard.json');

  if (!existsSync(dataPath)) {
    cachedData = null;
    return cachedData;
  }

  try {
    cachedData = JSON.parse(readFileSync(dataPath, 'utf-8')) as LeaderboardData;
  } catch {
    cachedData = null;
  }

  return cachedData;
}

function parseBoundedInteger(
  value: string | null,
  fallback: number,
  minimum: number,
  maximum: number
): number {
  if (value === null) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(maximum, Math.max(minimum, parsed));
}

function getContentType(entry: LeaderboardEntry, contentType: string): ContentTypeEntry | undefined {
  return entry.contentTypes?.find((item) => item.type === contentType);
}

function hasBackfileData(entry: LeaderboardEntry): boolean {
  return (
    entry.improvement !== undefined &&
    entry.improvement !== null &&
    entry.backfileScore !== undefined &&
    entry.backfileScore !== null &&
    entry.backfileScore > 0
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const limit = parseBoundedInteger(searchParams.get('limit'), 50, 1, 500);
  const offset = parseBoundedInteger(searchParams.get('offset'), 0, 0, Number.MAX_SAFE_INTEGER);
  const search = (searchParams.get('search') || '').trim().slice(0, 200).toLocaleLowerCase();
  const gradeParam = searchParams.get('grade');
  const grade = gradeParam && GRADES.has(gradeParam as Grade) ? (gradeParam as Grade) : null;
  const contentType = (searchParams.get('contentType') || 'all').slice(0, 100);
  const view: ViewMode = searchParams.get('view') === 'progress' ? 'progress' : 'overall';
  const sortParam = searchParams.get('sort') as SortField | null;
  const sort: SortField = sortParam && SORT_FIELDS.has(sortParam) ? sortParam : 'default';
  const direction: SortDirection = searchParams.get('direction') === 'asc' ? 'asc' : 'desc';

  const data = getLeaderboardData();

  if (!data) {
    return NextResponse.json(
      {
        error: 'Leaderboard data not generated',
        message: 'Run `pnpm --filter web generate-leaderboard` to generate data',
      },
      { status: 503 }
    );
  }

  let results = data.leaderboard.filter((entry) => {
    const selectedContentType = contentType === 'all' ? undefined : getContentType(entry, contentType);

    if (contentType !== 'all' && !selectedContentType) return false;
    if (view === 'progress' && !hasBackfileData(entry)) return false;
    if (search && !entry.name.toLocaleLowerCase().includes(search)) return false;

    if (grade) {
      const entryGrade = selectedContentType?.grade || entry.grade;
      if (entryGrade !== grade) return false;
    }

    return true;
  });

  let comparator: ((left: LeaderboardEntry, right: LeaderboardEntry) => number) | null = null;
  const directed = (left: number, right: number) =>
    direction === 'desc' ? right - left : left - right;

  if (sort === 'works') {
    comparator = (left, right) => directed(left.totalWorks, right.totalWorks);
  } else if (sort === 'score') {
    comparator = (left, right) => {
      const leftScore = contentType === 'all'
        ? left.score
        : (getContentType(left, contentType)?.score ?? 0);
      const rightScore = contentType === 'all'
        ? right.score
        : (getContentType(right, contentType)?.score ?? 0);
      return directed(leftScore, rightScore);
    };
  } else if (sort === 'improvement') {
    comparator = (left, right) => directed(left.improvement ?? 0, right.improvement ?? 0);
  } else if (DIMENSIONS.has(sort as DimensionKey)) {
    const dimension = sort as DimensionKey;
    comparator = (left, right) => directed(left.dimensions[dimension], right.dimensions[dimension]);
  } else if (contentType !== 'all') {
    comparator = (left, right) =>
      (getContentType(right, contentType)?.score ?? 0) -
      (getContentType(left, contentType)?.score ?? 0);
  } else if (view === 'progress') {
    comparator = (left, right) => (right.improvement ?? 0) - (left.improvement ?? 0);
  }

  if (comparator) {
    results = [...results].sort((left, right) => comparator!(left, right) || left.rank - right.rank);
  }

  const total = results.length;
  const paginatedLeaderboard = results.slice(offset, offset + limit);

  return NextResponse.json(
    {
      total,
      totalWithWorks: data.totalWithWorks,
      totalMembers: data.totalMembers,
      generatedAt: data.generatedAt,
      offset,
      limit,
      leaderboard: paginatedLeaderboard,
    },
    {
      headers: {
        // Each query is cached independently for one hour, with a stale response available for 24 hours.
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    }
  );
}
