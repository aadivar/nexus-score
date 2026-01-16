'use client';

import { cn } from '@/lib/utils';
import type { DimensionScores, DimensionName } from '@nexus-score/core';

interface DimensionChartProps {
  dimensions: DimensionScores;
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
  provenance: 'References, update policies, similarity check',
  people: 'ORCID coverage',
  organizations: 'Affiliations and ROR IDs',
  funding: 'Funder registry and award numbers',
  access: 'Licenses, full-text links, abstracts',
};

const dimensionColors: Record<DimensionName, string> = {
  provenance: 'bg-purple-500',
  people: 'bg-blue-500',
  organizations: 'bg-green-500',
  funding: 'bg-amber-500',
  access: 'bg-rose-500',
};

export function DimensionChart({ dimensions, className }: DimensionChartProps) {
  const dimensionOrder: DimensionName[] = [
    'provenance',
    'people',
    'organizations',
    'funding',
    'access',
  ];

  return (
    <div className={cn('rounded-xl border bg-white p-6 shadow-sm', className)}>
      <h3 className="text-lg font-semibold text-gray-900">Dimension Breakdown</h3>
      <div className="mt-6 space-y-5">
        {dimensionOrder.map((key) => {
          const dim = dimensions[key];
          return (
            <div key={key}>
              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium text-gray-900">{dimensionLabels[key]}</span>
                  <p className="text-xs text-gray-500">{dimensionDescriptions[key]}</p>
                </div>
                <span className="font-semibold text-gray-900">
                  {dim.score.toFixed(1)} / {dim.maxScore}
                </span>
              </div>
              <div className="mt-2 h-3 w-full rounded-full bg-gray-100">
                <div
                  className={cn('h-3 rounded-full transition-all', dimensionColors[key])}
                  style={{ width: `${dim.percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
