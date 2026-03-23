/**
 * Scoring Types
 */

export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';
export type MetricStatus = 'excellent' | 'good' | 'needs-work' | 'poor';
export type TrendDirection = 'up' | 'down' | 'stable';
export type Priority = 'high' | 'medium' | 'low';
export type DataSource = 'api-coverage' | 'sample-analysis' | 'leaderboard-cache';

export interface NexusScore {
  /** Total score out of 100 */
  total: number;
  /** Letter grade */
  grade: Grade;
  /** Breakdown by dimension */
  dimensions: DimensionScores;
  /** Trend comparing current vs backfile */
  trend: TrendInfo;
  /** Improvement suggestions */
  recommendations: Recommendation[];
  /** Score metadata */
  metadata: ScoreMetadata;
}

export interface DimensionScores {
  provenance: DimensionDetail;
  people: DimensionDetail;
  organizations: DimensionDetail;
  funding: DimensionDetail;
  access: DimensionDetail;
}

export type DimensionName = keyof DimensionScores;

export interface DimensionDetail {
  /** Points earned */
  score: number;
  /** Maximum possible points */
  maxScore: number;
  /** Percentage (0-100) */
  percentage: number;
  /** Individual metrics */
  metrics: MetricDetail[];
}

export interface MetricDetail {
  /** Human-readable name */
  name: string;
  /** API field key */
  key: string;
  /** Raw value (0-1 percentage from API) */
  value: number;
  /** Points contributed to score */
  contribution: number;
  /** Maximum possible contribution */
  maxContribution: number;
  /** Status indicator */
  status: MetricStatus;
}

export interface TrendInfo {
  /** Overall direction */
  direction: TrendDirection;
  /** Point change (current - backfile) */
  change: number;
  /** Score for current works (last 2 years) */
  currentScore: number;
  /** Score for backfile works (older than 2 years) */
  backfileScore: number;
}

export interface Recommendation {
  /** Unique identifier */
  id: string;
  /** Priority level */
  priority: Priority;
  /** Which dimension this improves */
  dimension: DimensionName;
  /** Which metric this addresses */
  metric: string;
  /** Short title */
  title: string;
  /** Explanation of why this matters */
  description: string;
  /** Current percentage (0-100) */
  currentValue: number;
  /** Target percentage (0-100) */
  targetValue: number;
  /** Estimated point gain */
  potentialGain: number;
  /** How to improve */
  howToImprove: string;
  /** Link to Crossref docs */
  documentationUrl: string;
}

export interface ScoreMetadata {
  /** Member/journal ID */
  entityId: number | string;
  /** Entity type */
  entityType: 'member' | 'journal';
  /** Display name */
  entityName: string;
  /** Location (city, region, country) */
  location?: string;
  /** When score was calculated */
  calculatedAt: string;
  /** Total DOI count */
  totalWorks: number;
  /** Current works count (last 2 years) */
  currentWorks: number;
  /** Backfile works count */
  backfileWorks: number;
  /** How the score was calculated */
  dataSource: DataSource;
}

/**
 * Coverage fields as returned within coverage-type entries.
 * Uses simplified names (no era suffix).
 */
export interface ContentTypeCoverage {
  abstracts: number;
  affiliations: number;
  orcids: number;
  licenses: number;
  references: number;
  funders: number;
  'similarity-checking': number;
  'award-numbers': number;
  'ror-ids': number;
  'update-policies': number;
  'resource-links': number;
}

/**
 * Score calculated for a single content type (e.g., journal-article).
 */
export interface ContentTypeScore {
  /** Crossref content type key, e.g. 'journal-article' */
  type: string;
  /** Human-readable label, e.g. 'Journal Articles' */
  label: string;
  /** Weighted score 0-100 */
  score: number;
  /** Letter grade */
  grade: Grade;
  /** Per-dimension percentages (0-100) */
  dimensions: {
    provenance: number;
    people: number;
    organizations: number;
    funding: number;
    access: number;
  };
}
