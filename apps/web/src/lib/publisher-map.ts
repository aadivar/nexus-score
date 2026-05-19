/**
 * Institutional-analysis types — re-exported from the shared core library so
 * the web app and the MCP server stay on a single source of truth.
 * (Filename kept to avoid churn across existing importers.)
 */
export type {
  CoverageMetrics,
  PublisherGap,
  ProgressEvent,
  InstitutionReport,
} from '@nexus-score/core';
