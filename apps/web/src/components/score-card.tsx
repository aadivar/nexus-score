'use client';

import { cn } from '@/lib/utils';
import type { TrendDirection } from '@nexus-score/core';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ScoreCardProps {
  score: number;
  trend: TrendDirection;
  change: number;
  label?: string;
  hideTrend?: boolean;
  className?: string;
}

const trendIcons: Record<TrendDirection, typeof TrendingUp> = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus,
};

const trendColors: Record<TrendDirection, string> = {
  up: 'text-green-600',
  down: 'text-red-600',
  stable: 'text-gray-500',
};

export function ScoreCard({ score, trend, change, label, hideTrend, className }: ScoreCardProps) {
  const TrendIcon = trendIcons[trend];

  return (
    <div className={cn('rounded-xl border bg-white p-4 sm:p-6 shadow-sm', className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label ?? 'Nexus Score'}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-bold text-gray-900">{score}</span>
            <span className="text-base sm:text-lg text-gray-400">/ 100</span>
          </div>
        </div>
        <p className="max-w-[180px] text-right text-xs text-gray-400">
          A diagnosis, not a judgment — every point lost is a fixable metadata
          field.
        </p>
      </div>

      {!hideTrend && (
        <div className={cn('mt-4 flex items-center gap-1 text-sm', trendColors[trend])}>
          <TrendIcon className="h-4 w-4" />
          <span>
            {trend === 'stable'
              ? 'Stable vs historical'
              : `${change > 0 ? '+' : ''}${change} points vs historical`}
          </span>
        </div>
      )}
    </div>
  );
}
