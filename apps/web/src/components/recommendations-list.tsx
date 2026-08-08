'use client';

import { cn } from '@/lib/utils';
import type { Recommendation, Priority } from '@nexus-score/core';
import { AlertCircle, AlertTriangle, Info, ExternalLink, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface RecommendationsListProps {
  recommendations: Recommendation[];
  limit?: number;
  scopeLabel?: string;
  title?: string;
  emptyMessage?: string;
  className?: string;
}

const priorityConfig: Record<
  Priority,
  { icon: typeof AlertCircle; color: string; label: string }
> = {
  high: {
    icon: AlertCircle,
    color: 'text-red-600 bg-red-50 border-red-200',
    label: 'High Priority',
  },
  medium: {
    icon: AlertTriangle,
    color: 'text-amber-600 bg-amber-50 border-amber-200',
    label: 'Medium Priority',
  },
  low: {
    icon: Info,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    label: 'Low Priority',
  },
};

export function RecommendationsList({
  recommendations,
  limit = 5,
  scopeLabel,
  title = 'Improvement Recommendations',
  emptyMessage = 'No observed gaps in this scope are below the recommendation targets.',
  className,
}: RecommendationsListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const displayedRecs = recommendations.slice(0, limit);

  if (recommendations.length === 0) {
    return (
      <div className={cn('rounded-xl border bg-white p-6 shadow-sm', className)}>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {scopeLabel && (
          <p className="mt-1 text-xs font-medium text-gray-500">{scopeLabel}</p>
        )}
        <p className="mt-4 text-gray-500">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl border bg-white p-6 shadow-sm print:p-4', className)}>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {scopeLabel && (
        <p className="mt-1 text-xs font-medium text-gray-500">{scopeLabel}</p>
      )}
      <p className="mt-1 text-sm text-gray-500">
        Actionable steps to improve observed metadata coverage
      </p>

      <div className="mt-6 space-y-4 print:mt-3 print:space-y-2">
        {displayedRecs.map((rec) => {
          const config = priorityConfig[rec.priority];
          const Icon = config.icon;
          const isExpanded = expandedId === rec.id;

          return (
            <div
              key={rec.id}
              className={cn('rounded-lg border p-4 print:p-3', config.color)}
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                className="flex w-full items-start justify-between text-left"
              >
                <div className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-5 w-5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">{rec.title}</h4>
                    <p className="mt-1 text-sm opacity-80">
                      Currently {rec.currentValue}% → Target {rec.targetValue}%
                      <span className="ml-2 font-medium">
                        ({rec.potentialGain > 0 ? `+${rec.potentialGain} points` : '<1 point'})
                      </span>
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={cn(
                    'h-5 w-5 flex-shrink-0 transition-transform',
                    isExpanded && 'rotate-180'
                  )}
                />
              </button>

              {isExpanded && (
                <div className="mt-4 border-t border-current/20 pt-4">
                  <p className="text-sm">{rec.description}</p>
                  <div className="mt-3">
                    <h5 className="text-sm font-medium">How to improve:</h5>
                    <p className="mt-1 text-sm opacity-80">{rec.howToImprove}</p>
                  </div>
                  <a
                    href={rec.documentationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-sm font-medium hover:underline"
                  >
                    View Crossref Documentation
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {recommendations.length > limit && (
        <p className="mt-4 text-center text-sm text-gray-500">
          Showing {limit} of {recommendations.length} recommendations
        </p>
      )}
    </div>
  );
}
