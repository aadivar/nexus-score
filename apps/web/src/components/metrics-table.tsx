'use client';

import { cn } from '@/lib/utils';
import type { DimensionScores, MetricStatus, MetricDetail, DimensionDetail } from '@nexus-score/core';

interface MetricsTableProps {
  dimensions: DimensionScores;
  className?: string;
}

const statusColors: Record<MetricStatus, string> = {
  excellent: 'bg-green-100 text-green-800',
  good: 'bg-blue-100 text-blue-800',
  'needs-work': 'bg-amber-100 text-amber-800',
  poor: 'bg-red-100 text-red-800',
};

const statusLabels: Record<MetricStatus, string> = {
  excellent: 'Excellent',
  good: 'Good',
  'needs-work': 'Needs Work',
  poor: 'Poor',
};

interface MetricWithDimension extends MetricDetail {
  dimension: string;
}

export function MetricsTable({ dimensions, className }: MetricsTableProps) {
  const allMetrics: MetricWithDimension[] = (
    Object.entries(dimensions) as [string, DimensionDetail][]
  ).flatMap(([dimension, data]) =>
    data.metrics.map((metric: MetricDetail) => ({
      ...metric,
      dimension,
    }))
  );

  return (
    <div className={cn('rounded-xl border bg-white shadow-sm', className)}>
      <div className="px-6 py-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Detailed Metrics</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="px-4 py-3 text-left sm:px-6 text-xs font-medium uppercase tracking-wider text-gray-500">
                Metric
              </th>
              <th className="px-4 py-3 text-left sm:px-6 text-xs font-medium uppercase tracking-wider text-gray-500">
                Coverage
              </th>
              <th className="px-4 py-3 text-left sm:px-6 text-xs font-medium uppercase tracking-wider text-gray-500">
                Points
              </th>
              <th className="px-4 py-3 text-left sm:px-6 text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {allMetrics.map((metric) => (
              <tr key={metric.key} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-4 sm:px-6">
                  <div>
                    <p className="font-medium text-gray-900">{metric.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{metric.dimension}</p>
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-4 sm:px-6">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 rounded-full bg-gray-200">
                      <div
                        className="h-2 rounded-full bg-gray-900"
                        style={{ width: `${metric.value * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">
                      {(metric.value * 100).toFixed(0)}%
                    </span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-4 sm:px-6 text-sm text-gray-900">
                  {metric.contribution.toFixed(1)} / {metric.maxContribution}
                </td>
                <td className="whitespace-nowrap px-4 py-4 sm:px-6">
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2 py-1 text-xs font-medium',
                      statusColors[metric.status]
                    )}
                  >
                    {statusLabels[metric.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
