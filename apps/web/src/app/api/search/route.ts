import { NextRequest, NextResponse } from 'next/server';
import { CrossrefClient } from '@nexus-score/core';

const client = new CrossrefClient({
  mailto: process.env.CROSSREF_MAILTO || 'varma2friend@gmail.com',
});

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q');
  const limitParam = request.nextUrl.searchParams.get('limit');
  const limit = limitParam ? Math.min(parseInt(limitParam, 10), 20) : 10;

  if (!query || query.length < 2) {
    return NextResponse.json(
      { error: 'Query must be at least 2 characters' },
      { status: 400 }
    );
  }

  try {
    const result = await client.searchMembers(query, limit);

    const members = result.items.map((m) => ({
      id: m.id,
      name: m['primary-name'],
      totalWorks: m.counts['total-dois'],
    }));

    return NextResponse.json(
      {
        total: result['total-results'],
        members,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to search members' },
      { status: 500 }
    );
  }
}
