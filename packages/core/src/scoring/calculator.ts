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
  ContentTypeCoverage,
  ContentTypeScore,
  ScorableEraScore,
  ScorableMemberScore,
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
import { isScorableContentType } from './content-types.js';

/**
 * Calculate Nexus Score for a Crossref member (publisher)
 * Uses pre-computed coverage statistics from the API
 */
export function calculateMemberScore(member: CrossrefMember): NexusScore {
  const coverage = member.coverage;

  // Calculate current and backfile dimensions separately, then average
  const currentDimensions = calculateDimensionsForPeriod(coverage, 'current');
  const backfileDimensions = calculateDimensionsForPeriod(coverage, 'backfile');
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
  const currentDimensions = calculateDimensionsForPeriod(coverage, 'current');
  const backfileDimensions = calculateDimensionsForPeriod(coverage, 'backfile');
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
export function calculateDimensionsForPeriod(
  coverage: MemberCoverage,
  period: 'current' | 'backfile'
): DimensionScores {
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

// ============ CONTENT-TYPE SCORING ============

const CONTENT_TYPE_LABELS: Record<string, string> = {
  'journal-article': 'Journal Articles',
  'posted-content': 'Posted Content',
  'book-chapter': 'Book Chapters',
  'proceedings-article': 'Proceedings',
  'peer-review': 'Peer Reviews',
  'component': 'Components',
  'book': 'Books',
  'dataset': 'Datasets',
  'monograph': 'Monographs',
  'edited-book': 'Edited Books',
  'book-section': 'Book Sections',
  'reference-book': 'Reference Books',
  'report': 'Reports',
  'journal': 'Journals',
  'journal-issue': 'Journal Issues',
  'journal-volume': 'Journal Volumes',
  'book-part': 'Book Parts',
  'book-series': 'Book Series',
  'book-set': 'Book Sets',
  'dissertation': 'Dissertations',
  'standard': 'Standards',
  'other': 'Other',
};

/**
 * Map simplified coverage-type field names to the metric weight keys.
 * coverage-type entries use names like "abstracts" while our weights use "abstracts-current".
 */
const SIMPLIFIED_FIELD_MAP: Record<string, string> = {
  'references': 'references',
  'update-policies': 'update-policies',
  'similarity-checking': 'similarity-checking',
  'orcids': 'orcids',
  'affiliations': 'affiliations',
  'ror-ids': 'ror-ids',
  'funders': 'funders',
  'award-numbers': 'award-numbers',
  'licenses': 'licenses',
  'resource-links': 'resource-links',
  'abstracts': 'abstracts',
};

/**
 * Calculate a score from simplified coverage-type fields using the same weight system.
 */
function buildContentTypeMetricDetails(
  coverage: Record<string, number>,
  percentages: ContentTypeScore['dimensions']
): DimensionScores {
  const result: Partial<DimensionScores> = {};

  for (const dimension of Object.keys(METRICS_BY_DIMENSION) as DimensionName[]) {
    const metrics = METRICS_BY_DIMENSION[dimension].map((metric) => {
      const simplifiedKey = metric.key.replace(/-current$/, '');
      const value = coverage[simplifiedKey] || 0;

      return {
        name: metric.name,
        key: metric.key,
        value: round(value),
        contribution: round(value * metric.weight),
        maxContribution: metric.weight,
        status: valueToStatus(value),
      };
    });

    result[dimension] = {
      score: round(metrics.reduce((sum, metric) => sum + metric.contribution, 0)),
      maxScore: DIMENSION_WEIGHTS[dimension],
      percentage: percentages[dimension],
      metrics,
    };
  }

  return result as DimensionScores;
}

export function scoreFromSimplifiedCoverage(coverage: Record<string, number>): {
  score: number;
  dimensions: { provenance: number; people: number; organizations: number; funding: number; access: number };
  metricDetails: DimensionScores;
} {
  // Calculate each dimension percentage
  const refVal = coverage['references'] || 0;
  const upVal = coverage['update-policies'] || 0;
  const simVal = coverage['similarity-checking'] || 0;
  const provenance = Math.round((refVal * 15 + upVal * 5 + simVal * 5) / 25 * 100);

  const people = Math.round((coverage['orcids'] || 0) * 100);

  const affVal = coverage['affiliations'] || 0;
  const rorVal = coverage['ror-ids'] || 0;
  const organizations = Math.round((affVal * 5 + rorVal * 10) / 15 * 100);

  const funVal = coverage['funders'] || 0;
  const awardVal = coverage['award-numbers'] || 0;
  const funding = Math.round((funVal * 10 + awardVal * 10) / 20 * 100);

  const licVal = coverage['licenses'] || 0;
  const linkVal = coverage['resource-links'] || 0;
  const absVal = coverage['abstracts'] || 0;
  const access = Math.round((licVal * 7 + linkVal * 7 + absVal * 6) / 20 * 100);

  const score = Math.round(
    (provenance * DIMENSION_WEIGHTS.provenance +
      people * DIMENSION_WEIGHTS.people +
      organizations * DIMENSION_WEIGHTS.organizations +
      funding * DIMENSION_WEIGHTS.funding +
      access * DIMENSION_WEIGHTS.access) / 100
  );

  const dimensions = { provenance, people, organizations, funding, access };

  return {
    score,
    dimensions,
    metricDetails: buildContentTypeMetricDetails(coverage, dimensions),
  };
}

/**
 * Extract the simplified coverage object for one content type in one era,
 * or null when there is no coverage entry.
 */
function getEraCoverage(
  eraData: Record<string, unknown> | undefined,
  type: string
): Record<string, number> | null {
  const coverage = eraData?.[type];
  if (!coverage || typeof coverage !== 'object') return null;

  // coverage-type entries use simplified field names (e.g., "abstracts" not "abstracts-current")
  // which don't match MemberCoverage's era-suffixed keys, so we cast through unknown
  return coverage as unknown as Record<string, number>;
}

function coverageHasData(cov: Record<string, number>): boolean {
  return Object.keys(SIMPLIFIED_FIELD_MAP).some(
    (key) => typeof cov[key] === 'number' && cov[key] > 0
  );
}

/**
 * Calculate scores for each content type from Crossref coverage-type data.
 * Top-level score uses the "all" period; current/backfile era scores are
 * attached when that era applies.
 *
 * A type is included in the diagnostic breakdown when the member has works of
 * that type (counts-type), even if every returned coverage field is 0%.
 * `scorable` separately says whether the Participation Report methodology
 * applies; unsupported schemas remain visible but do not enter member totals.
 */
export function calculateContentTypeScores(
  coverageType: CrossrefMember['coverage-type'] | undefined,
  countsType?: CrossrefMember['counts-type']
): ContentTypeScore[] {
  if (!coverageType?.all) return [];

  const results: ContentTypeScore[] = [];

  for (const type of Object.keys(coverageType.all)) {
    const allCov = getEraCoverage(coverageType.all, type);
    if (!allCov) continue;

    const worksAll = countsType?.all?.[type];
    const include =
      worksAll !== undefined ? worksAll > 0 : coverageHasData(allCov);
    if (!include) continue;

    const { score, dimensions, metricDetails } = scoreFromSimplifiedCoverage(allCov);

    const entry: ContentTypeScore = {
      type,
      label: CONTENT_TYPE_LABELS[type] || type.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      scorable: isScorableContentType(type),
      score,
      grade: scoreToGrade(score),
      dimensions,
      metricDetails,
      works: worksAll,
    };

    for (const era of ['current', 'backfile'] as const) {
      const eraCov = getEraCoverage(coverageType[era], type);
      if (!eraCov) continue;

      const eraWorks = countsType?.[era]?.[type];
      const eraInclude =
        eraWorks !== undefined ? eraWorks > 0 : coverageHasData(eraCov);
      if (!eraInclude) continue;

      const eraScore = scoreFromSimplifiedCoverage(eraCov);
      entry[era] = {
        ...eraScore,
        grade: scoreToGrade(eraScore.score),
        works: eraWorks,
      };
    }

    results.push(entry);
  }

  // Sort by score descending, then by works so large zero-score types surface
  results.sort((a, b) => b.score - a.score || (b.works ?? 0) - (a.works ?? 0));
  return results;
}

function calculateScorableEra(
  member: CrossrefMember,
  era: 'all' | 'current' | 'backfile'
): ScorableEraScore | null {
  const counts = member['counts-type']?.[era];
  const coverage = member['coverage-type']?.[era];
  if (!counts || !coverage) return null;

  const included = Object.entries(counts).filter(
    ([type, works]) => isScorableContentType(type) && works > 0
  );
  const works = included.reduce((sum, [, count]) => sum + count, 0);
  if (works === 0) return null;

  // Missing coverage is missing data, not observed 0%. Do not manufacture a score.
  if (included.some(([type]) => !getEraCoverage(coverage as unknown as Record<string, unknown>, type))) {
    return null;
  }

  const weightedCoverage = Object.fromEntries(
    Object.keys(SIMPLIFIED_FIELD_MAP).map((key) => {
      const numerator = included.reduce((sum, [type, count]) => {
        const typeCoverage = getEraCoverage(coverage as unknown as Record<string, unknown>, type)!;
        return sum + (typeCoverage[key] ?? 0) * count;
      }, 0);
      return [key, numerator / works];
    })
  ) as unknown as ContentTypeCoverage;

  const scored = scoreFromSimplifiedCoverage(
    weightedCoverage as unknown as Record<string, number>
  );
  const registeredWorks = Object.values(counts).reduce((sum, count) => sum + count, 0);

  return {
    ...scored,
    grade: scoreToGrade(scored.score),
    coverage: weightedCoverage,
    works,
    excludedWorks: Math.max(0, registeredWorks - works),
  };
}

/**
 * Calculate the generic member-wide view from Crossref Participation Report
 * work types only. This prevents schema-specific records such as peer reviews
 * from being interpreted as 0% coverage for inapplicable article metadata.
 */
export function calculateScorableMemberScore(member: CrossrefMember): ScorableMemberScore {
  return {
    all: calculateScorableEra(member, 'all'),
    current: calculateScorableEra(member, 'current'),
    backfile: calculateScorableEra(member, 'backfile'),
  };
}
