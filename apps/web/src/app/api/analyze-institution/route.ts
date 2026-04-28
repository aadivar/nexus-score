import { NextRequest, NextResponse } from 'next/server';
import { analyzeInstitution, searchInstitutions } from '../../../lib/analyze-institution';
import type { ProgressEvent } from '../../../lib/publisher-map';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const ror = searchParams.get('ror');
  const search = searchParams.get('search');
  const stream = searchParams.get('stream') === '1';
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

  // Streaming branch: client passes ?stream=1 to receive newline-delimited
  // ProgressEvent JSON. Each line is one event; the final line is either a
  // `done` event with the full report or an `error` event.
  if (stream) {
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (event: ProgressEvent) => {
          controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'));
        };
        try {
          const report = await analyzeInstitution(ror, days, send);
          send({ type: 'done', report });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Analysis failed';
          send({ type: 'error', message });
        } finally {
          controller.close();
        }
      },
    });
    return new Response(body, {
      headers: {
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'Cache-Control': 'no-store, no-transform',
        // Tell Vercel/Nginx not to buffer — events should reach the client
        // as soon as they're enqueued.
        'X-Accel-Buffering': 'no',
      },
    });
  }

  // Back-compat JSON response for non-streaming callers (curl, MCP, scripts).
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
