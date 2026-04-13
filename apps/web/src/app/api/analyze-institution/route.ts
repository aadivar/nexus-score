import { NextRequest, NextResponse } from 'next/server';
import { analyzeInstitution, searchInstitutions } from '../../../lib/analyze-institution';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const ror = searchParams.get('ror');
  const search = searchParams.get('search');
  const daysRaw = searchParams.get('days');
  const days = daysRaw ? Math.max(7, Math.min(365, parseInt(daysRaw, 10))) : 90;

  if (search) {
    try {
      const results = await searchInstitutions(search);
      return NextResponse.json({ results });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed';
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  if (!ror) {
    return NextResponse.json(
      { error: 'Provide ?ror=<ror_id> or ?search=<institution name>' },
      { status: 400 }
    );
  }

  try {
    const report = await analyzeInstitution(ror, days);
    return NextResponse.json(report);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Analysis failed';
    const isRateLimit = /429|rate/i.test(message);
    return NextResponse.json(
      {
        error: isRateLimit
          ? 'OpenAlex or Crossref is rate-limiting. Wait a moment and retry.'
          : message,
      },
      { status: isRateLimit ? 429 : 500 }
    );
  }
}
