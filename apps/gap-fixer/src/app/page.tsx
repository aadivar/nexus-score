'use client';

import { useState, useCallback } from 'react';
import { UploadZone } from '@/components/upload-zone';
import { AnalysisSummary } from '@/components/analysis-summary';
import { ComparisonList } from '@/components/article-comparison';
import type { ParsedArticle, getGapReportSummary } from '@/lib/parsers/gap-report';
import type { GapType } from '@/lib/db/types';
import type { ArticleComparison } from '@/lib/enrichers/orchestrator';
import { ArrowRight, Sparkles, RotateCcw } from 'lucide-react';

interface UploadData {
  articles: ParsedArticle[];
  summary: ReturnType<typeof getGapReportSummary>;
  gapCounts: Record<GapType, number>;
}

type Step = 'upload' | 'summary' | 'demo';

interface QueuedArticle {
  doi: string;
  gaps: GapType[];
}

export default function HomePage() {
  const [step, setStep] = useState<Step>('upload');
  const [uploadData, setUploadData] = useState<UploadData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [comparisons, setComparisons] = useState<ArticleComparison[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pendingArticles, setPendingArticles] = useState<QueuedArticle[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const handleUpload = (data: UploadData) => {
    setUploadData(data);
    setStep('summary');
    setError(null);
  };

  const enrichSingleArticle = useCallback(async (article: QueuedArticle): Promise<ArticleComparison | null> => {
    console.log(`[UI] Starting enrichment for ${article.doi} with gaps:`, article.gaps);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 min timeout

      const response = await fetch('/api/enrich-single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doi: article.doi,
          gaps: article.gaps,
          useReducto: true,
          skipPdf: false,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[UI] Failed to enrich ${article.doi}: ${response.status} - ${errorText}`);
        setError(`Failed: ${article.doi} - ${response.status}`);
        return null;
      }

      const data = await response.json();
      console.log(`[UI] Success for ${article.doi}:`, data.success);
      return data.comparison;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[UI] Error enriching ${article.doi}:`, errorMsg);
      setError(`Error: ${article.doi} - ${errorMsg}`);
      return null;
    }
  }, []);

  const handleStartDemo = async () => {
    if (!uploadData) return;

    // Reset state
    setComparisons([]);
    setError(null);
    setStep('demo');

    // Sort articles by gap count and get top 5
    const sorted = [...uploadData.articles]
      .sort((a, b) => b.gaps.length - a.gaps.length)
      .slice(0, 5)
      .map(a => ({ doi: a.doi, gaps: a.gaps }));

    setPendingArticles(sorted);
    setCurrentIndex(-1);
    setIsAnalyzing(false);
  };

  const handleProcessNext = async () => {
    const nextIndex = comparisons.length;
    if (nextIndex >= pendingArticles.length) return;

    setIsAnalyzing(true);
    setCurrentIndex(nextIndex);
    setError(null);

    const comparison = await enrichSingleArticle(pendingArticles[nextIndex]);

    if (comparison) {
      setComparisons(prev => [...prev, comparison]);
    }

    setCurrentIndex(-1);
    setIsAnalyzing(false);
  };

  const handleReset = () => {
    setStep('upload');
    setUploadData(null);
    setComparisons([]);
    setError(null);
    setPendingArticles([]);
    setCurrentIndex(-1);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Fix Your Crossref
          <span className="text-emerald-600"> Metadata Gaps</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
          Upload your Crossref Participation Gap Report and see exactly what metadata
          we can recover using AI-powered extraction from authoritative sources.
        </p>
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div className="space-y-8">
          <UploadZone onUpload={handleUpload} />

          {/* Features */}
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900">Multi-Source Validation</h3>
              <p className="mt-1 text-sm text-gray-500">
                Cross-reference OpenAlex, ORCID, and ROR for high-confidence recovery.
              </p>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <Sparkles className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">AI-Powered Extraction</h3>
              <p className="mt-1 text-sm text-gray-500">
                Use Reducto to extract references and abstracts directly from PDFs.
              </p>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900">Side-by-Side Comparison</h3>
              <p className="mt-1 text-sm text-gray-500">
                See exactly what's missing in Crossref vs what we can recover.
              </p>
            </div>
          </div>

          {/* How It Works */}
          <div className="mt-16">
            <h2 className="mb-8 text-center text-2xl font-bold text-gray-900">How It Works</h2>
            <div className="grid gap-8 sm:grid-cols-4">
              {[
                { step: '1', title: 'Upload', desc: 'Upload your Crossref Gap Report CSV' },
                { step: '2', title: 'Analyze', desc: 'We scan and identify recoverable gaps' },
                { step: '3', title: 'Compare', desc: 'See side-by-side Crossref vs Enriched data' },
                { step: '4', title: 'Fix', desc: 'Pay $2/article and get corrected metadata' },
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-600">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-gray-900">{item.title}</h3>
                  <p className="mt-1 text-sm text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Summary */}
      {step === 'summary' && uploadData && (
        <div className="space-y-8">
          <AnalysisSummary
            summary={uploadData.summary}
            gapCounts={uploadData.gapCounts}
            isAnalyzing={isAnalyzing}
          />

          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          {/* Demo explanation */}
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-6">
            <h3 className="font-semibold text-blue-900 mb-2">
              See It In Action
            </h3>
            <p className="text-blue-700 text-sm mb-4">
              We'll analyze the <strong>top 5 articles with the most gaps</strong> and show you
              a side-by-side comparison of what's currently in Crossref vs what we can recover.
              This uses OpenAlex, ORCID, ROR, and Reducto PDF extraction.
            </p>
            <ul className="text-sm text-blue-700 space-y-1 mb-4">
              <li>• Fetch current Crossref metadata for each article</li>
              <li>• Query OpenAlex, ORCID, and ROR APIs for missing data</li>
              <li>• Find PDFs via Unpaywall and extract with Reducto</li>
              <li>• Show field-by-field comparison with confidence scores</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
            <button
              onClick={handleReset}
              className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <RotateCcw className="h-4 w-4" />
              Upload Different File
            </button>

            <button
              onClick={handleStartDemo}
              disabled={isAnalyzing}
              className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Analyzing Top 5 Articles...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Run Demo Analysis
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Demo Results */}
      {step === 'demo' && (
        <div className="space-y-6">
          {/* Back button */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep('summary')}
              disabled={isAnalyzing}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
              Back to Summary
            </button>

            <button
              onClick={handleReset}
              disabled={isAnalyzing}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Upload New File
            </button>
          </div>

          {/* Results header */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {isAnalyzing ? 'Processing Article...' : 'Demo Analysis'}
            </h2>
            <p className="mt-1 text-gray-600">
              {comparisons.length} of {pendingArticles.length} articles processed
            </p>
          </div>

          {/* Process Next Button */}
          {comparisons.length < pendingArticles.length && (
            <div className="flex justify-center">
              <button
                onClick={handleProcessNext}
                disabled={isAnalyzing}
                className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Processing {pendingArticles[currentIndex]?.doi.substring(0, 30)}...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Process Article {comparisons.length + 1}: {pendingArticles[comparisons.length]?.doi.substring(0, 40)}...
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* All done message */}
          {comparisons.length === pendingArticles.length && pendingArticles.length > 0 && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-center">
              <p className="text-emerald-700 font-medium">
                All {pendingArticles.length} articles processed!
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
              {error}
            </div>
          )}

          {/* Comparison cards - shows results as they complete */}
          <ComparisonList
            comparisons={comparisons}
            isLoading={isAnalyzing}
            pendingArticles={pendingArticles}
            currentIndex={currentIndex}
          />

          {/* CTA */}
          {comparisons.length > 0 && uploadData && (
            <div className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 p-8 text-white text-center">
              <h3 className="text-2xl font-bold mb-2">
                Ready to Fix All {uploadData.summary.totalArticles.toLocaleString()} Articles?
              </h3>
              <p className="mb-6 text-emerald-100">
                ${uploadData.summary.pricePerArticle}/article • Total: ${uploadData.summary.estimatedPrice.toLocaleString()}
              </p>
              <button className="rounded-lg bg-white px-8 py-3 font-semibold text-emerald-600 hover:bg-emerald-50 transition-colors">
                Get Started
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
