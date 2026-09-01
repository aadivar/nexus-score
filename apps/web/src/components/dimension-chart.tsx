'use client';

import { cn } from '@/lib/utils';
import type { DimensionScores, DimensionName } from '@nexus-score/core';

interface DimensionChartProps {
  historical: DimensionScores | null;
  current: DimensionScores | null;
  scopeLabel: string;
  className?: string;
}

const dimensionLabels: Record<DimensionName, string> = {
  provenance: 'Provenance',
  people: 'People',
  organizations: 'Organizations',
  funding: 'Funding',
  access: 'Access',
};

const dimensionDescriptions: Record<DimensionName, string> = {
  provenance: 'References, updates, similarity',
  people: 'ORCID coverage',
  organizations: 'Affiliations and ROR',
  funding: 'Funders and awards',
  access: 'Licenses, links, abstracts',
};

const dimensionColors: Record<DimensionName, string> = {
  provenance: 'bg-purple-500',
  people: 'bg-blue-500',
  organizations: 'bg-green-500',
  funding: 'bg-amber-500',
  access: 'bg-rose-500',
};

const dimensionOrder: DimensionName[] = [
  'provenance',
  'people',
  'organizations',
  'funding',
  'access',
];

function DimensionColumn({
  title,
  subtitle,
  dimensions,
  current,
}: {
  title: string;
  subtitle: string;
  dimensions: DimensionScores | null;
  current?: boolean;
}) {
  return (
    <section className={cn('p-4 sm:p-5', current && 'bg-blue-50/50')}>
      <p className={cn('text-xs font-semibold uppercase tracking-wide', current ? 'text-blue-700' : 'text-gray-600')}>
        {title}
      </p>
      <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>

      {dimensions ? (
        <div className="mt-5 space-y-4">
          {dimensionOrder.map((key) => {
            const dimension = dimensions[key];
            return (
              <div key={key}>
                <div className="flex items-end justify-between gap-2 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{dimensionLabels[key]}</p>
                    <p className="truncate text-[11px] text-gray-500">{dimensionDescriptions[key]}</p>
                  </div>
                  <span className="flex-shrink-0 font-semibold text-gray-900">
                    {dimension.score.toFixed(1)} / {dimension.maxScore}
                  </span>
                </div>
                <div className="mt-1.5 h-2.5 w-full rounded-full bg-gray-100">
                  <div
                    className={cn('h-2.5 rounded-full transition-colors', dimensionColors[key])}
                    style={{ width: `${dimension.percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-5 text-sm text-gray-500">No dimension data is available for this era.</p>
      )}
    </section>
  );
}

export function DimensionChart({
  historical,
  current,
  scopeLabel,
  className,
}: DimensionChartProps) {
  const currentYear = new Date().getFullYear();

  return (
    <div className={cn('overflow-hidden rounded-xl border bg-white shadow-sm', className)}>
      <div className="border-b px-4 py-4 sm:px-6">
        <h3 className="text-lg font-semibold text-gray-900">Dimension Breakdown</h3>
        <p className="mt-1 text-sm text-gray-500">{scopeLabel} · equal comparison by era</p>
      </div>
      <div className="grid grid-cols-1 divide-y divide-gray-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <DimensionColumn
          title="Backfile"
          subtitle="Older records"
          dimensions={historical}
        />
        <DimensionColumn
          title="Current"
          subtitle={`${currentYear - 2}–${currentYear}`}
          dimensions={current}
          current
        />
      </div>
    </div>
  );
}
