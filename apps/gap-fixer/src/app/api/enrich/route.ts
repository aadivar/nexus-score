import { NextRequest, NextResponse } from 'next/server';
import { enrichTopArticles } from '@/lib/enrichers/orchestrator';
import type { GapType } from '@/lib/db/types';

export const maxDuration = 60; // Allow up to 60 seconds for this endpoint

interface EnrichRequest {
  articles: Array<{
    doi: string;
    gaps: GapType[];
  }>;
  count?: number;
  useReducto?: boolean;
  skipPdf?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: EnrichRequest = await request.json();

    if (!body.articles || !Array.isArray(body.articles)) {
      return NextResponse.json(
        { error: 'Invalid request: articles array required' },
        { status: 400 }
      );
    }

    const count = Math.min(body.count || 5, 10); // Max 10 articles at once
    const useReducto = body.useReducto ?? true;
    const skipPdf = body.skipPdf ?? false;

    console.log(`[API] Enriching top ${count} articles`);
    console.log(`  useReducto: ${useReducto}, skipPdf: ${skipPdf}`);

    const comparisons = await enrichTopArticles(
      body.articles,
      count,
      { useReducto, skipPdf }
    );

    // Calculate summary stats
    const totalGaps = comparisons.reduce((sum, c) => sum + c.gaps.length, 0);
    const totalImprovements = comparisons.reduce((sum, c) => sum + c.totalImprovements, 0);
    const avgConfidence = comparisons.length > 0
      ? Math.round(comparisons.reduce((sum, c) => sum + c.overallConfidence, 0) / comparisons.length)
      : 0;

    return NextResponse.json({
      success: true,
      comparisons,
      summary: {
        articlesAnalyzed: comparisons.length,
        totalGaps,
        totalImprovements,
        avgConfidence,
        reductoUsed: comparisons.filter(c => c.reductoUsed).length,
      },
    });
  } catch (error) {
    console.error('[API] Enrichment error:', error);
    return NextResponse.json(
      { error: 'Failed to enrich articles', details: String(error) },
      { status: 500 }
    );
  }
}
