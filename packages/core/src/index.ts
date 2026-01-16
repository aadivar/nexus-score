/**
 * @nexus-score/core
 * Core library for Crossref metadata quality scoring
 */

// Crossref API client and types
export {
  CrossrefClient,
  createCrossrefClient,
  type CrossrefClientOptions,
} from './crossref/client.js';

export {
  CrossrefAPIError,
  CrossrefNotFoundError,
  CrossrefRateLimitError,
  CrossrefTimeoutError,
} from './crossref/errors.js';

export type {
  CrossrefMember,
  CrossrefJournal,
  CrossrefWork,
  MemberCoverage,
  MemberFlags,
  MemberPrefix,
  Author,
  Affiliation,
  AffiliationId,
  Funder,
  Reference,
  License,
  Link,
  DateParts,
  SearchResult,
  WorksResult,
  WorkType,
} from './crossref/types.js';

// Scoring engine
export {
  calculateMemberScore,
  calculateJournalScore,
  calculateScoreFromCoverage,
  getMaxScore,
} from './scoring/calculator.js';

export {
  DIMENSION_WEIGHTS,
  METRICS_BY_DIMENSION,
  GRADE_THRESHOLDS,
  STATUS_THRESHOLDS,
  TREND_THRESHOLD,
  PROVENANCE_METRICS,
  PEOPLE_METRICS,
  ORGANIZATIONS_METRICS,
  FUNDING_METRICS,
  ACCESS_METRICS,
  type MetricWeight,
} from './scoring/weights.js';

export type {
  NexusScore,
  DimensionScores,
  DimensionDetail,
  DimensionName,
  MetricDetail,
  MetricStatus,
  TrendInfo,
  TrendDirection,
  Recommendation,
  Priority,
  ScoreMetadata,
  Grade,
  DataSource,
} from './scoring/types.js';

// Recommendations
export {
  generateRecommendations,
  getTopRecommendations,
  getRecommendationsByPriority,
  getTotalPotentialGain,
  groupRecommendationsByDimension,
} from './recommendations/engine.js';

export {
  RECOMMENDATION_TEMPLATES,
  getTemplateById,
  getTemplatesByDimension,
  type RecommendationTemplate,
} from './recommendations/templates.js';
