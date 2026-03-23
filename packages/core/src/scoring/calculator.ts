/**
 * Nexus Score Calculator
 * Calculates metadata coverage scores from Crossref member/journal data
 */

import type { CrossrefMember, CrossrefJournal, MemberCoverage } from '../crossref/types.js';
import type {
  NexusScore,
  DimensionScores,
  DimensionDetail,
  MetricDetail,
  MetricStatus,
  TrendInfo,
  Grade,
  DimensionName,
} from './types.js';
import {
  METRICS_BY_DIMENSION,
  DIMENSION_WEIGHTS,
  GRADE_THRESHOLDS,
  STATUS_THRESHOLDS,
  TREND_THRESHOLD,
  type MetricWeight,
} from './weights.js';
import { generateRecommendations } from '../recommendations/engine.js';

/**
 * Calculate Nexus Score for a Crossref member (publisher)
 * Uses pre-computed coverage statistics from the API
 */
export function calculateMemberScore(member: CrossrefMember): NexusScore {
  const coverage = member.coverage;

  // Calculate current and backfile dimensions separately, then average
  const currentDimensions = calculateDimensions(coverage, 'current');
  const backfileDimensions = calculateDimensions(coverage, 'backfile');
  const hasBackfile = member.counts['backfile-dois'] > 0;

  // Average current and backfile to get overall dimensions (matching leaderboard logic)
  const dimensions = averageDimensions(currentDimensions, backfileDimensions, hasBackfile);

  // Sum total score
  const total = Math.round(
    Object.values(dimensions).reduce((sum, dim) => sum + dim.score, 0)
  );

  // Calculate trend (current vs backfile)
  const trend = calculateTrend(member.coverage);

  // Generate recommendations
  const recommendations = generateRecommendations(dimensions, coverage);

  return {
    total,
    grade: scoreToGrade(total),
    dimensions,
    trend,
    recommendations,
    metadata: {
      entityId: member.id,
      entityType: 'member',
      entityName: member['primary-name'],
      location: member.location,
      calculatedAt: new Date().toISOString(),
      totalWorks: member.counts['total-dois'],
      currentWorks: member.counts['current-dois'],
      backfileWorks: member.counts['backfile-dois'],
      dataSource: 'api-coverage',
    },
  };
}

/**
 * Calculate Nexus Score for a journal
 */
export function calculateJournalScore(journal: CrossrefJournal): NexusScore {
  const coverage = journal.coverage;

  // Calculate current and backfile dimensions separately, then average
  const currentDimensions = calculateDimensions(coverage, 'current');
  const backfileDimensions = calculateDimensions(coverage, 'backfile');
  const hasBackfile = journal.counts['backfile-dois'] > 0;

  // Average current and backfile to get overall dimensions (matching leaderboard logic)
  const dimensions = averageDimensions(currentDimensions, backfileDimensions, hasBackfile);

  // Sum total score
  const total = Math.round(
    Object.values(dimensions).reduce((sum, dim) => sum + dim.score, 0)
  );

  // Calculate trend
  const trend = calculateTrend(coverage);

  // Generate recommendations
  const recommendations = generateRecommendations(dimensions, coverage);

  return {
    total,
    grade: scoreToGrade(total),
    dimensions,
    trend,
    recommendations,
    metadata: {
      entityId: journal.ISSN[0],
      entityType: 'journal',
      entityName: journal.title,
      calculatedAt: new Date().toISOString(),
      totalWorks: journal.counts['total-dois'],
      currentWorks: journal.counts['current-dois'],
      backfileWorks: journal.counts['backfile-dois'],
      dataSource: 'api-coverage',
    },
  };
}

/**
 * Calculate all dimension scores for a specific period
 */
function calculateDimensions(coverage: MemberCoverage, period: 'current' | 'backfile'): DimensionScores {
  return {
    provenance: calculateDimension('provenance', coverage, period),
    people: calculateDimension('people', coverage, period),
    organizations: calculateDimension('organizations', coverage, period),
    funding: calculateDimension('funding', coverage, period),
    access: calculateDimension('access', coverage, period),
  };
}

/**
 * Average current and backfile dimensions to produce overall scores.
 * If the publisher has no backfile works, use current dimensions only.
 */
function averageDimensions(
  current: DimensionScores,
  backfile: DimensionScores,
  hasBackfile: boolean
): DimensionScores {
  if (!hasBackfile) return current;

  const result: Partial<DimensionScores> = {};
  for (const key of Object.keys(current) as DimensionName[]) {
    const cur = current[key];
    const back = backfile[key];
    const avgScore = round((cur.score + back.score) / 2);
    result[key] = {
      score: avgScore,
      maxScore: cur.maxScore,
      percentage: Math.round((avgScore / cur.maxScore) * 100),
      metrics: cur.metrics, // Show current-era metric details for actionability
    };
  }
  return result as DimensionScores;
}

/**
 * Calculate a single dimension score for a specific period
 */
function calculateDimension(
  dimension: DimensionName,
  coverage: MemberCoverage,
  period: 'current' | 'backfile'
): DimensionDetail {
  const metrics = METRICS_BY_DIMENSION[dimension];
  const maxScore = DIMENSION_WEIGHTS[dimension];

  const metricDetails = metrics.map((metric) =>
    calculateMetric(metric, coverage, period)
  );

  const score = metricDetails.reduce((sum, m) => sum + m.contribution, 0);

  return {
    score: round(score),
    maxScore,
    percentage: Math.round((score / maxScore) * 100),
    metrics: metricDetails,
  };
}

/**
 * Calculate a single metric for a specific period
 */
function calculateMetric(
  metric: MetricWeight,
  coverage: MemberCoverage,
  period: 'current' | 'backfile'
): MetricDetail {
  const key = metric.key.replace('-current', `-${period}`) as keyof MemberCoverage;
  const value = (coverage[key] as number) || 0;
  const contribution = value * metric.weight;

  return {
    name: metric.name,
    key: metric.key,
    value: round(value),
    contribution: round(contribution),
    maxContribution: metric.weight,
    status: valueToStatus(value),
  };
}

/**
 * Calculate trend comparing current vs backfile scores
 */
function calculateTrend(coverage: MemberCoverage): TrendInfo {
  const currentScore = calculateSimpleScore(coverage, 'current');
  const backfileScore = calculateSimpleScore(coverage, 'backfile');
  const change = currentScore - backfileScore;

  return {
    direction:
      change > TREND_THRESHOLD ? 'up' : change < -TREND_THRESHOLD ? 'down' : 'stable',
    change: Math.round(change),
    currentScore: Math.round(currentScore),
    backfileScore: Math.round(backfileScore),
  };
}

/**
 * Calculate a simple score for trend comparison
 */
function calculateSimpleScore(
  coverage: MemberCoverage,
  period: 'current' | 'backfile'
): number {
  let total = 0;

  for (const [dimension, metrics] of Object.entries(METRICS_BY_DIMENSION)) {
    for (const metric of metrics) {
      // Replace 'current' with the period
      const key = metric.key.replace('-current', `-${period}`) as keyof MemberCoverage;
      const value = (coverage[key] as number) || 0;
      total += value * metric.weight;
    }
  }

  return total;
}

/**
 * Convert a 0-100 score to a letter grade
 */
function scoreToGrade(score: number): Grade {
  if (score >= GRADE_THRESHOLDS.A) return 'A';
  if (score >= GRADE_THRESHOLDS.B) return 'B';
  if (score >= GRADE_THRESHOLDS.C) return 'C';
  if (score >= GRADE_THRESHOLDS.D) return 'D';
  return 'F';
}

/**
 * Convert a 0-1 value to a status
 */
function valueToStatus(value: number): MetricStatus {
  if (value >= STATUS_THRESHOLDS.excellent) return 'excellent';
  if (value >= STATUS_THRESHOLDS.good) return 'good';
  if (value >= STATUS_THRESHOLDS['needs-work']) return 'needs-work';
  return 'poor';
}

/**
 * Round to 2 decimal places
 */
function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Get the maximum possible score (should always be 100)
 */
export function getMaxScore(): number {
  return Object.values(DIMENSION_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
}

/**
 * Calculate score from raw coverage values (utility function)
 */
export function calculateScoreFromCoverage(coverage: Partial<MemberCoverage>): number {
  let total = 0;

  for (const metrics of Object.values(METRICS_BY_DIMENSION)) {
    for (const metric of metrics) {
      const value = (coverage[metric.key as keyof MemberCoverage] as number) || 0;
      total += value * metric.weight;
    }
  }

  return Math.round(total);
}
