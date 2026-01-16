import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface LeaderboardEntry {
  rank: number;
  id: number;
  name: string;
  score: number;
  grade: string;
  totalWorks: number;
  dimensions: {
    provenance: number;
    people: number;
    organizations: number;
    funding: number;
    access: number;
  };
}

interface LeaderboardData {
  generatedAt: string;
  totalMembers: number;
  totalWithWorks: number;
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

export async function GET(request: NextRequest) {
  const limitParam = request.nextUrl.searchParams.get('limit');
  const offsetParam = request.nextUrl.searchParams.get('offset');
  const limit = limitParam ? Math.min(parseInt(limitParam, 10), 500) : 50;
  const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

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

  const paginatedLeaderboard = data.leaderboard.slice(offset, offset + limit);

  return NextResponse.json(
    {
      total: data.totalWithWorks,
      totalMembers: data.totalMembers,
      generatedAt: data.generatedAt,
      offset,
      limit,
      leaderboard: paginatedLeaderboard,
    },
    {
      headers: {
        // Cache for 1 hour, stale-while-revalidate for 24 hours
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    }
  );
}
