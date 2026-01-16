/**
 * Recommendations Engine
 * Generates actionable improvement suggestions based on current scores
 */

import type { MemberCoverage } from '../crossref/types.js';
import type {
  DimensionScores,
  Recommendation,
  Priority,
} from '../scoring/types.js';
import { RECOMMENDATION_TEMPLATES, type RecommendationTemplate } from './templates.js';

/**
 * Generate recommendations based on dimension scores and coverage data
 */
export function generateRecommendations(
  dimensions: DimensionScores,
  coverage: MemberCoverage
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  for (const template of RECOMMENDATION_TEMPLATES) {
    const currentValue = (coverage[template.metric as keyof MemberCoverage] as number) || 0;

    // Skip if already at or above target
    if (currentValue >= template.targetValue) {
      continue;
    }

    // Calculate potential gain
    const potentialGain = calculatePotentialGain(template, currentValue);

    // Determine priority based on current value
    const priority = determinePriority(currentValue, template.priorityThreshold);

    recommendations.push({
      id: template.id,
      priority,
      dimension: template.dimension,
      metric: template.metric,
      title: template.title,
      description: template.description,
      currentValue: Math.round(currentValue * 100),
      targetValue: Math.round(template.targetValue * 100),
      potentialGain: Math.round(potentialGain),
      howToImprove: template.howToImprove,
      documentationUrl: template.documentationUrl,
    });
  }

  // Sort by priority (high first) then by potential gain (highest first)
  return recommendations.sort((a, b) => {
    const priorityOrder: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return b.potentialGain - a.potentialGain;
  });
}

/**
 * Calculate the potential score gain from implementing a recommendation
 */
function calculatePotentialGain(
  template: RecommendationTemplate,
  currentValue: number
): number {
  const improvement = template.targetValue - currentValue;
  return improvement * template.metricWeight;
}

/**
 * Determine priority based on current value and thresholds
 */
function determinePriority(
  value: number,
  threshold: { high: number; medium: number }
): Priority {
  if (value < threshold.high) return 'high';
  if (value < threshold.medium) return 'medium';
  return 'low';
}

/**
 * Get top N recommendations
 */
export function getTopRecommendations(
  recommendations: Recommendation[],
  limit: number
): Recommendation[] {
  return recommendations.slice(0, limit);
}

/**
 * Get recommendations by priority
 */
export function getRecommendationsByPriority(
  recommendations: Recommendation[],
  priority: Priority
): Recommendation[] {
  return recommendations.filter((r) => r.priority === priority);
}

/**
 * Get total potential gain from all recommendations
 */
export function getTotalPotentialGain(recommendations: Recommendation[]): number {
  return recommendations.reduce((sum, r) => sum + r.potentialGain, 0);
}

/**
 * Get recommendations grouped by dimension
 */
export function groupRecommendationsByDimension(
  recommendations: Recommendation[]
): Record<string, Recommendation[]> {
  const grouped: Record<string, Recommendation[]> = {};

  for (const rec of recommendations) {
    if (!grouped[rec.dimension]) {
      grouped[rec.dimension] = [];
    }
    grouped[rec.dimension].push(rec);
  }

  return grouped;
}
