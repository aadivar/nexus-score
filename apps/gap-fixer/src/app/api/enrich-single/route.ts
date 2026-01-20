import { NextRequest, NextResponse } from 'next/server';
import { enrichArticle } from '@/lib/enrichers/orchestrator';
import type { GapType } from '@/lib/db/types';

export const maxDuration = 120; // Allow up to 120 seconds per article (Reducto can be slow)

interface EnrichSingleRequest {
  doi: string;
  gaps: GapType[];
  useReducto?: boolean;
  skipPdf?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: EnrichSingleRequest = await request.json();

    if (!body.doi || !body.gaps) {
      return NextResponse.json(
        { error: 'Invalid request: doi and gaps required' },
        { status: 400 }
      );
    }

    const useReducto = body.useReducto ?? true;
    const skipPdf = body.skipPdf ?? false;

    console.log(`[API] Enriching single article: ${body.doi}`);

    const comparison = await enrichArticle(body.doi, body.gaps, {
      useReducto,
      skipPdf,
    });

    return NextResponse.json({
      success: true,
      comparison,
    });
  } catch (error) {
    console.error('[API] Single enrichment error:', error);
    return NextResponse.json(
      { error: 'Failed to enrich article', details: String(error) },
      { status: 500 }
    );
  }
}
