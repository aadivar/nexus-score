/**
 * Shared types for the institutional analysis feature.
 *
 * NOTE: This file used to hold a hand-maintained OpenAlex→Crossref member ID
 * map (`PUBLISHER_MAP`) that gated which articles got analyzed. That approach
 * was removed: it dropped real Crossref deposits into an "unmapped" bucket and
 * guessed "not in Crossref" from a name heuristic. Analysis is now evidence-
 * based — every DOI is probed against Crossref and grouped by the member +
 * publisher Crossref itself reports. See `analyze-institution.ts`.
 *
 * (Filename kept to avoid churn across importers; it is types-only now.)
 */

export interface CoverageMetrics {
  affiliations: number;
  rorIds: number;
  funders: number;
  abstracts: number;
  orcids: number;
  licenses: number;
}

export interface PublisherGap {
  name: string;
  /** Crossref member ID as reported on the work record (0 if Crossref omitted it). */
  crossrefId: number;
  articles: number;
  /** True when we measured gaps; false when articles < MIN_SAMPLE_SIZE */
  measured: boolean;
  coverage: CoverageMetrics;
  /** institutionalRor: articles where THIS institution's ROR was deposited on any author */
  institutionalRor: number;
  gap: {
    noAffiliation: number;
    noRor: number;
    noFunder: number;
    noAbstract: number;
    noLicense: number;
    noOrcid: number;
    /** articles missing this institution's ROR specifically (not just any ROR) */
    noInstitutionalRor: number;
  };
}

/**
 * Streamed events from `analyzeInstitution`. The route emits these as NDJSON
 * so the UI can show live progress instead of a 60-300s blank loader. The
 * final event is always `done` (with the report) or `error`.
 */
export type ProgressEvent =
  | { type: 'phase'; message: string }
  | { type: 'institution'; name: string; ror: string; country: string }
  | { type: 'openalex_total'; totalArticles: number }
  | { type: 'openalex_dois'; fetched: number; total: number }
  | { type: 'crossref_probe'; probed: number; total: number; foundArticles: number }
  | { type: 'crossref_grouped'; publishers: number; analyzed: number }
  | { type: 'done'; report: InstitutionReport }
  | { type: 'error'; message: string };

export interface InstitutionReport {
  institution: {
    name: string;
    ror: string;
    country: string;
  };
  dateRange: string;
  windowDays: number;
  /** Journal articles OpenAlex attributes to the institution in the window (the universe probed). */
  totalArticles: number;
  /** Institution's journal-article count in the last 365 days — used for annual extrapolation in cost estimates. */
  annualArticleCount: number;
  /** DOIs present in Crossref AS a journal-article (every analyzable record). */
  analyzedArticles: number;
  /** Subset of analyzedArticles in publishers with sample >= MIN_SAMPLE_SIZE. */
  measuredArticles: number;
  publishers: PublisherGap[];
  /**
   * Evidence-based classification of every OpenAlex article-type work. By
   * construction these reconcile to the OpenAlex universe:
   *   analyzed + otherContentType + notInCrossref + probeFailed
   *     + noDoi + duplicateDoi === totalArticles
   * (subject to minor drift if OpenAlex updates mid-pagination).
   */
  crossrefScope: {
    /** Present in Crossref, type journal-article — fed into `publishers`. */
    analyzed: number;
    /** Present in Crossref under a different content type (content-type deposit gap). */
    otherContentType: number;
    /** Absent from Crossref entirely — registered with DataCite / a repository / preprint server. */
    notInCrossref: number;
    /** Crossref probe failed after retries — excluded from every denominator, not assumed absent. */
    probeFailed: number;
    /** OpenAlex has the article record but no DOI — nothing to probe (not a Crossref question). */
    noDoi: number;
    /** Multiple OpenAlex works share one DOI; counted once in the probe, the rest tallied here. */
    duplicateDoi: number;
  };
  /** Crossref content types seen for the `otherContentType` bucket, largest first. */
  otherTypeBreakdown: Array<{ type: string; count: number }>;
  /** Totals computed only over measuredArticles */
  totals: {
    noAffiliation: number;
    noRor: number;
    noFunder: number;
    noAbstract: number;
    noLicense: number;
    noInstitutionalRor: number;
    affiliationPercent: number;
    rorPercent: number;
    funderPercent: number;
    abstractPercent: number;
    institutionalRorPercent: number;
  };
  generatedAt: string;
  notes: {
    contentType: string;
    source: string;
    minSampleSize: number;
  };
}
