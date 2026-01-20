'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, ArrowRight, ExternalLink, FileText, Users, Building, DollarSign, Link as LinkIcon, ChevronDown, ChevronUp, Loader2, Code, Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ArticleComparison, ComparisonField } from '@/lib/enrichers/orchestrator';

interface ArticleComparisonCardProps {
  comparison: ArticleComparison;
  index: number;
  isCompact?: boolean;
}

const FIELD_ICONS: Record<string, React.ReactNode> = {
  abstract: <FileText className="h-4 w-4" />,
  references: <LinkIcon className="h-4 w-4" />,
  orcid_ids: <Users className="h-4 w-4" />,
  affiliations: <Building className="h-4 w-4" />,
  ror_ids: <Building className="h-4 w-4" />,
  funder_registry_ids: <DollarSign className="h-4 w-4" />,
  funding_award_numbers: <DollarSign className="h-4 w-4" />,
  license_urls: <FileText className="h-4 w-4" />,
};

// Format data for diff display based on field type
function formatDataForDiff(field: string, data: unknown): string[] {
  if (!data) return [];

  if (field === 'abstract') {
    return [String(data)];
  }

  if (field === 'references') {
    const refs = data as Array<{ doi?: string | null; title?: string | null; unstructured?: string | null }>;
    return refs.map((ref, i) => {
      const parts = [`[${i + 1}]`];
      if (ref.doi) parts.push(`DOI: ${ref.doi}`);
      if (ref.title) parts.push(ref.title);
      else if (ref.unstructured) parts.push(ref.unstructured.substring(0, 100) + (ref.unstructured.length > 100 ? '...' : ''));
      return parts.join(' ');
    });
  }

  if (field === 'orcid_ids' || field === 'affiliations' || field === 'ror_ids') {
    const authors = data as Array<{ name: string; orcid?: string; affiliations: Array<{ name: string; ror?: string }> }>;
    return authors.map(author => {
      const parts = [author.name];
      if (author.orcid) parts.push(`ORCID: ${author.orcid}`);
      if (author.affiliations?.length > 0) {
        const affs = author.affiliations.map(a => a.ror ? `${a.name} (ROR: ${a.ror})` : a.name);
        parts.push(`@ ${affs.join('; ')}`);
      }
      return parts.join(' | ');
    });
  }

  if (field === 'funder_registry_ids' || field === 'funding_award_numbers') {
    const funders = data as Array<{ name: string; doi?: string | null; awards?: string[]; awardNumber?: string }>;
    return funders.map(funder => {
      const parts = [funder.name];
      if (funder.doi) parts.push(`DOI: ${funder.doi}`);
      if (funder.awardNumber) parts.push(`Award: ${funder.awardNumber}`);
      if (funder.awards?.length) parts.push(`Awards: ${funder.awards.join(', ')}`);
      return parts.join(' | ');
    });
  }

  if (field === 'license_urls') {
    return [String(data)];
  }

  return [JSON.stringify(data, null, 2)];
}

// Git-style diff view component
function DiffView({ field, crossrefData, enrichedData }: {
  field: string;
  crossrefData: unknown | null;
  enrichedData: unknown | null;
}) {
  const crossrefLines = formatDataForDiff(field, crossrefData);
  const enrichedLines = formatDataForDiff(field, enrichedData);

  // Simple diff: show what's missing from Crossref and what we're adding
  const crossrefSet = new Set(crossrefLines);
  const enrichedSet = new Set(enrichedLines);

  const removed = crossrefLines.filter(line => !enrichedSet.has(line));
  const added = enrichedLines.filter(line => !crossrefSet.has(line));
  const unchanged = crossrefLines.filter(line => enrichedSet.has(line));

  return (
    <div className="mt-3 rounded-lg border border-gray-200 bg-gray-900 text-xs font-mono overflow-hidden">
      <div className="px-3 py-2 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
        <span className="text-gray-300 flex items-center gap-2">
          <Code className="h-3 w-3" />
          Data Diff
        </span>
        <div className="flex items-center gap-3 text-gray-400">
          {removed.length > 0 && <span className="text-red-400">-{removed.length}</span>}
          {added.length > 0 && <span className="text-emerald-400">+{added.length}</span>}
          {unchanged.length > 0 && <span className="text-gray-500">{unchanged.length} unchanged</span>}
        </div>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {/* Unchanged lines */}
        {unchanged.map((line, i) => (
          <div key={`u-${i}`} className="px-3 py-1 text-gray-400 border-b border-gray-800 flex items-start gap-2">
            <span className="text-gray-600 w-4 flex-shrink-0">&nbsp;</span>
            <span className="break-all">{line}</span>
          </div>
        ))}
        {/* Removed (missing in Crossref) */}
        {removed.map((line, i) => (
          <div key={`r-${i}`} className="px-3 py-1 bg-red-950/50 text-red-300 border-b border-gray-800 flex items-start gap-2">
            <Minus className="h-3 w-3 text-red-500 flex-shrink-0 mt-0.5" />
            <span className="break-all">{line}</span>
          </div>
        ))}
        {/* Added (from enrichment) */}
        {added.map((line, i) => (
          <div key={`a-${i}`} className="px-3 py-1 bg-emerald-950/50 text-emerald-300 border-b border-gray-800 flex items-start gap-2">
            <Plus className="h-3 w-3 text-emerald-500 flex-shrink-0 mt-0.5" />
            <span className="break-all">{line}</span>
          </div>
        ))}
        {/* Empty state */}
        {crossrefLines.length === 0 && enrichedLines.length === 0 && (
          <div className="px-3 py-4 text-gray-500 text-center">No data available</div>
        )}
      </div>
    </div>
  );
}

function ComparisonRow({ comparison }: { comparison: ComparisonField }) {
  const [showDiff, setShowDiff] = useState(false);
  const hasDiffData = !!(comparison.crossrefFullData || comparison.enrichedFullData);

  return (
    <div className="border-b border-gray-100 py-3 last:border-0">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5 text-gray-400">
          {FIELD_ICONS[comparison.field] || <FileText className="h-4 w-4" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="font-medium text-gray-900">{comparison.label}</span>
            {comparison.isImproved ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                <CheckCircle className="h-3 w-3" />
                Recoverable
              </span>
            ) : comparison.hasEnrichedData ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                <CheckCircle className="h-3 w-3" />
                Found (Crossref has it)
              </span>
            ) : null}
            {comparison.confidence > 0 && (
              <span className={cn(
                'rounded-full px-2 py-0.5 text-xs font-medium',
                comparison.confidence >= 80 ? 'bg-emerald-100 text-emerald-700' :
                comparison.confidence >= 60 ? 'bg-amber-100 text-amber-700' :
                'bg-gray-100 text-gray-600'
              )}>
                {comparison.confidence}% confidence
              </span>
            )}
            {/* View Diff button */}
            {hasDiffData && (
              <button
                onClick={() => setShowDiff(!showDiff)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors",
                  showDiff
                    ? "bg-gray-800 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                <Code className="h-3 w-3" />
                {showDiff ? 'Hide Diff' : 'View Diff'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-2 items-center">
            {/* Crossref (current) */}
            <div className={cn(
              'rounded-lg p-3 text-sm',
              comparison.crossrefValue ? 'bg-gray-50' : 'bg-red-50'
            )}>
              <div className="text-xs font-medium text-gray-500 mb-1">Crossref (Current)</div>
              {comparison.crossrefValue ? (
                <p className="text-gray-700 break-words">{comparison.crossrefValue}</p>
              ) : (
                <p className="text-red-600 flex items-center gap-1">
                  <XCircle className="h-4 w-4" />
                  Missing
                </p>
              )}
            </div>

            {/* Arrow */}
            <div className="hidden md:flex items-center justify-center">
              <ArrowRight className={cn(
                'h-5 w-5',
                comparison.isImproved ? 'text-emerald-500' :
                comparison.hasEnrichedData ? 'text-blue-500' : 'text-gray-300'
              )} />
            </div>

            {/* Enriched (recovered) */}
            <div className={cn(
              'rounded-lg p-3 text-sm',
              comparison.hasEnrichedData ? (comparison.isImproved ? 'bg-emerald-50' : 'bg-blue-50') : 'bg-gray-50'
            )}>
              <div className="text-xs font-medium text-gray-500 mb-1">
                Enriched ({comparison.sources.join(', ') || 'N/A'})
              </div>
              {comparison.enrichedValue ? (
                <p className={cn(
                  'break-words',
                  comparison.isImproved ? 'text-emerald-700' : 'text-blue-700'
                )}>{comparison.enrichedValue}</p>
              ) : (
                <p className="text-gray-400">No data found</p>
              )}
            </div>
          </div>

          {/* Git-style Diff View */}
          {showDiff && hasDiffData && (
            <DiffView
              field={comparison.field}
              crossrefData={comparison.crossrefFullData}
              enrichedData={comparison.enrichedFullData}
            />
          )}

          {/* Source verification links */}
          {comparison.sourceVerifications && comparison.sourceVerifications.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {comparison.sourceVerifications.map((v, i) => (
                <a
                  key={i}
                  href={v.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  {v.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ArticleComparisonCard({ comparison, index, isCompact = false }: ArticleComparisonCardProps) {
  const [isExpanded, setIsExpanded] = useState(!isCompact);

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header - always visible */}
      <div
        className={cn(
          "bg-gray-50 px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors",
          isExpanded && "border-b border-gray-200"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700 flex-shrink-0">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 text-sm truncate">
                {comparison.title || comparison.doi}
              </h3>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                <span className="truncate">{comparison.doi}</span>
                {comparison.reductoUsed && (
                  <span className="rounded bg-purple-100 px-1.5 py-0.5 text-purple-700 flex-shrink-0">
                    Reducto
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-right">
              <div className="text-lg font-bold text-emerald-600">
                {comparison.totalImprovements}/{comparison.gaps.length}
              </div>
              <div className="text-xs text-gray-500">fixed</div>
            </div>
            <div className={cn(
              'rounded-full px-2 py-1 text-xs font-medium',
              comparison.overallConfidence >= 80 ? 'bg-emerald-100 text-emerald-700' :
              comparison.overallConfidence >= 60 ? 'bg-amber-100 text-amber-700' :
              'bg-gray-100 text-gray-600'
            )}>
              {comparison.overallConfidence}%
            </div>
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>

        {/* Compact gap badges */}
        {!isExpanded && (
          <div className="flex flex-wrap gap-1 mt-2 ml-10">
            {comparison.gaps.slice(0, 4).map(gap => {
              const comp = comparison.comparisons.find(c => c.field === gap);
              const isImproved = comp?.isImproved;
              const hasData = comp?.hasEnrichedData;
              return (
                <span
                  key={gap}
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                    isImproved ? "bg-emerald-100 text-emerald-700" :
                    hasData ? "bg-blue-100 text-blue-700" :
                    "bg-red-100 text-red-700"
                  )}
                >
                  {gap.replace(/_/g, ' ')}
                </span>
              );
            })}
            {comparison.gaps.length > 4 && (
              <span className="text-xs text-gray-400">+{comparison.gaps.length - 4} more</span>
            )}
          </div>
        )}
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <>
          {/* Gap badges - full */}
          <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100">
            <div className="flex flex-wrap gap-1.5">
              {comparison.gaps.map(gap => {
                const comp = comparison.comparisons.find(c => c.field === gap);
                const isImproved = comp?.isImproved;
                const hasData = comp?.hasEnrichedData;
                return (
                  <span
                    key={gap}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                      isImproved ? "bg-emerald-100 text-emerald-700" :
                      hasData ? "bg-blue-100 text-blue-700" :
                      "bg-red-100 text-red-700"
                    )}
                  >
                    {(isImproved || hasData) && <CheckCircle className="h-3 w-3" />}
                    {gap.replace(/_/g, ' ')}
                    {hasData && !isImproved && <span className="text-[10px] opacity-75">(exists)</span>}
                  </span>
                );
              })}
            </div>

            {/* PDF info */}
            {comparison.pdfUrl && (
              <div className="mt-2 flex items-center gap-2 text-sm text-emerald-600">
                <FileText className="h-4 w-4" />
                <span>PDF found via {comparison.pdfSource}</span>
              </div>
            )}
          </div>

          {/* Comparison rows */}
          <div className="px-4 py-2">
            {comparison.comparisons.map((comp, i) => (
              <ComparisonRow key={i} comparison={comp} />
            ))}
          </div>

          {/* Footer with verification links */}
          <div className="bg-gray-50 border-t border-gray-200 px-4 py-2">
            <div className="flex items-center justify-between text-xs flex-wrap gap-2">
              <span className="text-gray-500">
                Sources: {comparison.enrichmentSources.join(', ')}
              </span>
              <div className="flex items-center gap-3">
                <a
                  href={comparison.crossrefUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-blue-600 hover:underline flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-3 w-3" />
                  Crossref API
                </a>
                {comparison.openalexUrl && (
                  <a
                    href={comparison.openalexUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-blue-600 hover:underline flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-3 w-3" />
                    OpenAlex
                  </a>
                )}
                {comparison.pdfUrl && (
                  <a
                    href={comparison.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-blue-600 hover:underline flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-3 w-3" />
                    PDF Source
                  </a>
                )}
                <a
                  href={`https://doi.org/${comparison.doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  View article <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Loading card placeholder
export function ArticleCardLoading({ index }: { index: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="bg-gray-50 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-gray-400">
            {index + 1}
          </span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
              <span className="text-sm text-gray-600">Processing article...</span>
            </div>
            <div className="h-3 w-32 bg-gray-200 rounded mt-1 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Pending card placeholder
export function ArticleCardPending({ index, doi }: { index: number; doi: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden opacity-60">
      <div className="bg-gray-50 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-gray-400">
            {index + 1}
          </span>
          <div className="flex-1 min-w-0">
            <span className="text-sm text-gray-500">Waiting...</span>
            <p className="text-xs text-gray-400 truncate">{doi}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ComparisonListProps {
  comparisons: ArticleComparison[];
  isLoading?: boolean;
  pendingArticles?: Array<{ doi: string; gaps: string[] }>;
  currentIndex?: number;
}

export function ComparisonList({ comparisons, isLoading, pendingArticles = [], currentIndex = -1 }: ComparisonListProps) {
  // Summary stats (only from completed)
  const totalImprovements = comparisons.reduce((sum, c) => sum + c.totalImprovements, 0);
  const totalWithData = comparisons.reduce((sum, c) => sum + (c.totalWithData || 0), 0);
  const totalGaps = comparisons.reduce((sum, c) => sum + c.gaps.length, 0);
  const avgConfidence = comparisons.length > 0
    ? Math.round(comparisons.reduce((sum, c) => sum + c.overallConfidence, 0) / comparisons.length)
    : 0;

  const totalArticles = comparisons.length + (currentIndex >= 0 ? 1 : 0) +
    pendingArticles.slice(currentIndex + 1).length;

  // Fields where we found data but Crossref already has it
  const alreadyExists = totalWithData - totalImprovements;

  return (
    <div className="space-y-4">
      {/* Summary - updates in real-time */}
      <div className="grid grid-cols-5 gap-3">
        <div className="rounded-lg bg-white p-3 shadow-sm text-center">
          <div className="text-2xl font-bold text-gray-900">
            {comparisons.length}/{totalArticles}
          </div>
          <div className="text-xs text-gray-500">Completed</div>
        </div>
        <div className="rounded-lg bg-white p-3 shadow-sm text-center">
          <div className="text-2xl font-bold text-emerald-600">{totalImprovements}</div>
          <div className="text-xs text-gray-500">Recoverable</div>
        </div>
        <div className="rounded-lg bg-white p-3 shadow-sm text-center">
          <div className="text-2xl font-bold text-blue-600">{alreadyExists}</div>
          <div className="text-xs text-gray-500">Already in Crossref</div>
        </div>
        <div className="rounded-lg bg-white p-3 shadow-sm text-center">
          <div className="text-2xl font-bold text-red-500">{totalGaps - totalWithData}</div>
          <div className="text-xs text-gray-500">Not Found</div>
        </div>
        <div className="rounded-lg bg-white p-3 shadow-sm text-center">
          <div className="text-2xl font-bold text-purple-600">{avgConfidence || '--'}%</div>
          <div className="text-xs text-gray-500">Confidence</div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="space-y-3">
        {/* Completed cards */}
        {comparisons.map((comparison, index) => (
          <ArticleComparisonCard
            key={comparison.doi}
            comparison={comparison}
            index={index}
            isCompact={true}
          />
        ))}

        {/* Currently loading card */}
        {currentIndex >= 0 && currentIndex < pendingArticles.length && (
          <ArticleCardLoading index={comparisons.length} />
        )}

        {/* Pending cards */}
        {pendingArticles.slice(currentIndex + 1).map((article, i) => (
          <ArticleCardPending
            key={article.doi}
            index={comparisons.length + 1 + i}
            doi={article.doi}
          />
        ))}
      </div>

      {/* Empty state */}
      {comparisons.length === 0 && currentIndex < 0 && pendingArticles.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No comparisons to display
        </div>
      )}
    </div>
  );
}
