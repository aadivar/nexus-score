/**
 * Institutional research visibility analysis — evidence-based Crossref
 * classification. Shared by the web app and the MCP server.
 */

export { analyzeInstitution, searchInstitutions } from './analyze.js';
export type {
  CoverageMetrics,
  PublisherGap,
  ProgressEvent,
  InstitutionReport,
} from './types.js';
