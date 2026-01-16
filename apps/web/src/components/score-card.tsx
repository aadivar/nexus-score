'use client';

import { cn } from '@/lib/utils';
import type { Grade, TrendDirection } from '@nexus-score/core';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ScoreCardProps {
  score: number;
  grade: Grade;
  trend: TrendDirection;
  change: number;
  className?: string;
}

const gradeColors: Record<Grade, string> = {
  A: 'text-green-600 bg-green-50 border-green-200',
  B: 'text-blue-600 bg-blue-50 border-blue-200',
  C: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  D: 'text-orange-600 bg-orange-50 border-orange-200',
  F: 'text-red-600 bg-red-50 border-red-200',
};

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

export function ScoreCard({ score, grade, trend, change, className }: ScoreCardProps) {
  const TrendIcon = trendIcons[trend];

  return (
    <div className={cn('rounded-xl border bg-white p-6 shadow-sm', className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">Nexus Score</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-5xl font-bold text-gray-900">{score}</span>
            <span className="text-lg text-gray-400">/ 100</span>
          </div>
        </div>
        <div
          className={cn(
            'flex h-20 w-20 items-center justify-center rounded-full border-4 text-4xl font-bold',
            gradeColors[grade]
          )}
        >
          {grade}
        </div>
      </div>

      <div className={cn('mt-4 flex items-center gap-1 text-sm', trendColors[trend])}>
        <TrendIcon className="h-4 w-4" />
        <span>
          {trend === 'stable'
            ? 'Stable vs historical'
            : `${change > 0 ? '+' : ''}${change} points vs historical`}
        </span>
      </div>
    </div>
  );
}
