import type { EnrichmentResult, EnrichmentSummary, Author, Reference, Funder } from '../enrichers/types';
import type { GapType } from '../db/types';

/**
 * Source weights for confidence scoring
 * Higher weight = more trusted source
 *
 * Scoring rationale:
 * - OpenAlex alone (80) is trusted for ORCID/ROR since it aggregates authoritative data
 * - Multiple sources add agreement bonuses
 * - Reducto (60) is trusted for abstracts/references from PDFs
 */
const SOURCE_WEIGHTS: Record<EnrichmentResult['source'], number> = {
  openalex: 80,   // Comprehensive, well-maintained, aggregates from authoritative sources
  orcid: 75,      // Authoritative for people
  ror: 75,        // Authoritative for organizations
  lens: 60,       // Good secondary source
  reducto: 60,    // PDF extraction - reliable for structured content
};

/**
 * Minimum confidence threshold for auto-submission
 */
export const AUTO_SUBMIT_THRESHOLD = 90;

/**
 * Minimum confidence threshold for recoverable status
 */
export const RECOVERABLE_THRESHOLD = 60;

/**
 * Calculate confidence score for a specific field based on source agreement
 */
function calculateFieldConfidence(
  sources: EnrichmentResult[],
  fieldExtractor: (result: EnrichmentResult) => unknown
): number {
  const sourcesWithData = sources.filter(s => {
    const value = fieldExtractor(s);
    return value !== undefined && value !== null;
  });

  if (sourcesWithData.length === 0) {
    return 0;
  }

  // Base confidence from source weights
  let totalWeight = 0;
  for (const source of sourcesWithData) {
    totalWeight += SOURCE_WEIGHTS[source.source];
  }

  // Normalize to 0-100
  let confidence = Math.min(100, totalWeight);

  // Agreement bonus: +15 if 2+ sources have data
  if (sourcesWithData.length >= 2) {
    confidence = Math.min(100, confidence + 15);
  }

  // Strong agreement bonus: +10 if 3+ sources have data
  if (sourcesWithData.length >= 3) {
    confidence = Math.min(100, confidence + 10);
  }

  return Math.round(confidence);
}

/**
 * Check if values from different sources match
 */
function valuesMatch(values: unknown[]): boolean {
  if (values.length < 2) return true;

  // For strings, check equality (case-insensitive)
  if (typeof values[0] === 'string') {
    const normalized = values.map(v => (v as string).toLowerCase().trim());
    return normalized.every(v => v === normalized[0]);
  }

  // For arrays, check length match (rough heuristic)
  if (Array.isArray(values[0])) {
    const lengths = values.map(v => (v as unknown[]).length);
    // Allow 20% variance in array lengths
    const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    return lengths.every(l => Math.abs(l - avg) / avg < 0.2);
  }

  return true;
}

/**
 * Select best value from multiple sources
 */
function selectBestValue<T>(
  sources: EnrichmentResult[],
  fieldExtractor: (result: EnrichmentResult) => T | undefined
): T | undefined {
  // Sort by source weight (highest first)
  const sortedSources = [...sources].sort(
    (a, b) => SOURCE_WEIGHTS[b.source] - SOURCE_WEIGHTS[a.source]
  );

  for (const source of sortedSources) {
    const value = fieldExtractor(source);
    if (value !== undefined && value !== null) {
      return value;
    }
  }

  return undefined;
}

/**
 * Merge authors from multiple sources
 */
function mergeAuthors(sources: EnrichmentResult[]): Author[] {
  const authorMap = new Map<string, Author>();

  // Sort sources by weight
  const sortedSources = [...sources].sort(
    (a, b) => SOURCE_WEIGHTS[b.source] - SOURCE_WEIGHTS[a.source]
  );

  for (const source of sortedSources) {
    if (!source.authors) continue;

    for (const author of source.authors) {
      const key = author.name.toLowerCase();

      if (!authorMap.has(key)) {
        authorMap.set(key, { ...author });
      } else {
        const existing = authorMap.get(key)!;

        // Merge ORCID (prefer non-null)
        if (!existing.orcid && author.orcid) {
          existing.orcid = author.orcid;
        }

        // Merge affiliations
        for (const aff of author.affiliations) {
          if (!existing.affiliations.some(a => a.name === aff.name)) {
            existing.affiliations.push(aff);
          } else if (aff.ror) {
            // Update with ROR if available
            const existingAff = existing.affiliations.find(a => a.name === aff.name);
            if (existingAff && !existingAff.ror) {
              existingAff.ror = aff.ror;
            }
          }
        }
      }
    }
  }

  return Array.from(authorMap.values());
}

/**
 * Merge references from multiple sources
 */
function mergeReferences(sources: EnrichmentResult[]): Reference[] {
  const refMap = new Map<string, Reference>();

  for (const source of sources) {
    if (!source.references) continue;

    for (const ref of source.references) {
      // Key by DOI if available, otherwise by unstructured text
      const key = ref.doi || ref.unstructured || JSON.stringify(ref);

      if (!refMap.has(key)) {
        refMap.set(key, { ...ref });
      } else if (ref.doi && !refMap.get(key)!.doi) {
        // Update with DOI if we found one
        refMap.get(key)!.doi = ref.doi;
      }
    }
  }

  return Array.from(refMap.values());
}

/**
 * Merge funders from multiple sources
 */
function mergeFunders(sources: EnrichmentResult[]): Funder[] {
  const funderMap = new Map<string, Funder>();

  for (const source of sources) {
    if (!source.funders) continue;

    for (const funder of source.funders) {
      const key = funder.name.toLowerCase();

      if (!funderMap.has(key)) {
        funderMap.set(key, { ...funder });
      } else {
        const existing = funderMap.get(key)!;

        // Merge DOI and award number
        if (!existing.doi && funder.doi) {
          existing.doi = funder.doi;
        }
        if (!existing.awardNumber && funder.awardNumber) {
          existing.awardNumber = funder.awardNumber;
        }
      }
    }
  }

  return Array.from(funderMap.values());
}

/**
 * Calculate overall article confidence score
 */
function calculateOverallConfidence(fieldConfidences: Record<string, number>): number {
  const values = Object.values(fieldConfidences).filter(v => v > 0);

  if (values.length === 0) {
    return 0;
  }

  // Average of all field confidences
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

/**
 * Create enrichment summary from multiple sources
 */
export function createEnrichmentSummary(
  doi: string,
  results: EnrichmentResult[]
): EnrichmentSummary {
  // Calculate confidence for each field
  const confidence: EnrichmentSummary['confidence'] = {
    abstract: calculateFieldConfidence(results, r => r.abstract),
    references: calculateFieldConfidence(results, r => r.references),
    orcidIds: calculateFieldConfidence(results, r =>
      r.authors?.filter(a => a.orcid).length
    ),
    affiliations: calculateFieldConfidence(results, r =>
      r.authors?.flatMap(a => a.affiliations).length
    ),
    rorIds: calculateFieldConfidence(results, r =>
      r.authors?.flatMap(a => a.affiliations).filter(aff => aff.ror).length
    ),
    funderIds: calculateFieldConfidence(results, r =>
      r.funders?.filter(f => f.doi).length
    ),
    awardNumbers: calculateFieldConfidence(results, r =>
      r.funders?.filter(f => f.awardNumber).length
    ),
    license: calculateFieldConfidence(results, r => r.license),
  };

  // Select/merge best values
  const recovered: EnrichmentSummary['recovered'] = {
    abstract: selectBestValue(results, r => r.abstract),
    references: mergeReferences(results),
    authors: mergeAuthors(results),
    funders: mergeFunders(results),
    license: selectBestValue(results, r => r.license),
  };

  // Clean up empty arrays
  if (recovered.references?.length === 0) recovered.references = undefined;
  if (recovered.authors?.length === 0) recovered.authors = undefined;
  if (recovered.funders?.length === 0) recovered.funders = undefined;

  return {
    doi,
    sources: results,
    confidence,
    recovered,
  };
}

/**
 * Map gap type to confidence field
 */
const GAP_TO_CONFIDENCE_FIELD: Record<GapType, keyof EnrichmentSummary['confidence']> = {
  references: 'references',
  abstracts: 'abstract',
  orcid_ids: 'orcidIds',
  affiliations: 'affiliations',
  ror_ids: 'rorIds',
  funder_registry_ids: 'funderIds',
  funding_award_numbers: 'awardNumbers',
  license_urls: 'license',
  crossmark_enabled: 'abstract', // Not recoverable, placeholder
};

/**
 * Check if a specific gap is recoverable
 */
export function isGapRecoverable(
  summary: EnrichmentSummary,
  gapType: GapType
): { recoverable: boolean; confidence: number } {
  // Crossmark is a policy setting, not recoverable from PDFs
  if (gapType === 'crossmark_enabled') {
    return { recoverable: false, confidence: 0 };
  }

  const confidenceField = GAP_TO_CONFIDENCE_FIELD[gapType];
  const confidence = summary.confidence[confidenceField] || 0;

  return {
    recoverable: confidence >= RECOVERABLE_THRESHOLD,
    confidence,
  };
}

/**
 * Check if gap can be auto-submitted (high confidence)
 */
export function canAutoSubmit(
  summary: EnrichmentSummary,
  gapType: GapType
): boolean {
  const { recoverable, confidence } = isGapRecoverable(summary, gapType);
  return recoverable && confidence >= AUTO_SUBMIT_THRESHOLD;
}

/**
 * Get recovery status for all gaps in an article
 */
export function analyzeGaps(
  summary: EnrichmentSummary,
  gapTypes: GapType[]
): {
  totalGaps: number;
  recoverableGaps: number;
  autoSubmitGaps: number;
  gapDetails: Array<{
    type: GapType;
    recoverable: boolean;
    confidence: number;
    autoSubmit: boolean;
  }>;
} {
  const gapDetails = gapTypes.map(type => {
    const { recoverable, confidence } = isGapRecoverable(summary, type);
    return {
      type,
      recoverable,
      confidence,
      autoSubmit: canAutoSubmit(summary, type),
    };
  });

  return {
    totalGaps: gapTypes.length,
    recoverableGaps: gapDetails.filter(g => g.recoverable).length,
    autoSubmitGaps: gapDetails.filter(g => g.autoSubmit).length,
    gapDetails,
  };
}
