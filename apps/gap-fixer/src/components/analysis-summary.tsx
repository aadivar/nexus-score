'use client';

import { FileText, DollarSign, CheckCircle, AlertTriangle, Wrench } from 'lucide-react';
import { cn, formatNumber, formatCurrency } from '@/lib/utils';
import type { GapType } from '@/lib/db/types';
import type { getGapReportSummary } from '@/lib/parsers/gap-report';

interface AnalysisSummaryProps {
  summary: ReturnType<typeof getGapReportSummary>;
  gapCounts: Record<GapType, number>;
  recoverableGaps?: Record<GapType, number>;
  isAnalyzing?: boolean;
}

const GAP_LABELS: Record<GapType, string> = {
  references: 'References',
  abstracts: 'Abstracts',
  orcid_ids: 'ORCID IDs',
  affiliations: 'Affiliations',
  ror_ids: 'ROR IDs',
  funder_registry_ids: 'Funder IDs',
  funding_award_numbers: 'Award Numbers',
  license_urls: 'License URLs',
  crossmark_enabled: 'Crossmark',
};

const GAP_RECOVERABLE: Record<GapType, boolean> = {
  references: true,
  abstracts: true,
  orcid_ids: true,
  affiliations: true,
  ror_ids: true,
  funder_registry_ids: true,
  funding_award_numbers: true,
  license_urls: true,
  crossmark_enabled: false, // Policy setting, not recoverable
};

export function AnalysisSummary({
  summary,
  gapCounts,
  recoverableGaps,
  isAnalyzing = false,
}: AnalysisSummaryProps) {
  const recoverableGapTypes = Object.entries(GAP_RECOVERABLE)
    .filter(([, recoverable]) => recoverable)
    .map(([type]) => type as GapType);

  const totalRecoverableGaps = recoverableGapTypes.reduce(
    (sum, type) => sum + (gapCounts[type] || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <FileText className="h-4 w-4" />
            <span>Articles</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {formatNumber(summary.totalArticles)}
          </p>
        </div>

        <div className="rounded-lg bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <AlertTriangle className="h-4 w-4" />
            <span>Total Gaps</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {formatNumber(summary.totalGaps)}
          </p>
        </div>

        <div className="rounded-lg bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Wrench className="h-4 w-4" />
            <span>Recoverable</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-emerald-600">
            {formatNumber(totalRecoverableGaps)}
          </p>
        </div>

        <div className="rounded-lg bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <DollarSign className="h-4 w-4" />
            <span>Estimated Cost</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {formatCurrency(summary.estimatedPrice)}
          </p>
        </div>
      </div>

      {/* Gap Breakdown */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Gap Breakdown</h3>

        <div className="space-y-3">
          {Object.entries(gapCounts)
            .filter(([, count]) => count > 0)
            .sort((a, b) => b[1] - a[1])
            .map(([type, count]) => {
              const gapType = type as GapType;
              const isRecoverable = GAP_RECOVERABLE[gapType];
              const recoveredCount = recoverableGaps?.[gapType] || 0;
              const percentage = (count / summary.totalGaps) * 100;

              return (
                <div key={type} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {isRecoverable ? (
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      )}
                      <span className={cn(
                        'font-medium',
                        isRecoverable ? 'text-gray-900' : 'text-gray-500'
                      )}>
                        {GAP_LABELS[gapType]}
                      </span>
                      {!isRecoverable && (
                        <span className="text-xs text-amber-600">(not recoverable)</span>
                      )}
                    </div>
                    <span className="text-gray-500">
                      {formatNumber(count)}
                      {recoverableGaps && isRecoverable && (
                        <span className="ml-1 text-emerald-600">
                          ({formatNumber(recoveredCount)} found)
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        isRecoverable ? 'bg-emerald-500' : 'bg-gray-300'
                      )}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Pricing Note */}
      <div className="rounded-lg bg-emerald-50 p-4">
        <div className="flex gap-3">
          <DollarSign className="h-5 w-5 flex-shrink-0 text-emerald-600" />
          <div>
            <p className="font-medium text-emerald-900">
              {formatCurrency(summary.pricePerArticle)} per article
            </p>
            <p className="mt-1 text-sm text-emerald-700">
              We fix all recoverable gaps for each article. Average of{' '}
              {summary.avgGapsPerArticle.toFixed(1)} gaps per article in your report.
            </p>
          </div>
        </div>
      </div>

      {isAnalyzing && (
        <div className="rounded-lg bg-blue-50 p-4">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
            <p className="text-sm text-blue-700">
              Analyzing articles to find recoverable metadata...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
