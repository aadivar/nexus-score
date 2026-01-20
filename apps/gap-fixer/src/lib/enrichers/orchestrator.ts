/**
 * Enrichment Orchestrator
 * Combines all enrichment sources and produces a comprehensive comparison
 */

import { fetchCrossrefMetadata, identifyGaps, type CrossrefMetadata } from './crossref';
import { enrichFromOpenAlex } from './openalex';
import { fetchOrcidRecord, enrichAuthorsWithOrcid } from './orcid';
import { enrichAffiliationsWithRor, matchAffiliation } from './ror';
import { findPdfUrl } from './unpaywall';
import { extractMetadataWithPipeline, type ReductoExtractedMetadata } from './reducto';
import { createEnrichmentSummary, analyzeGaps } from '../scoring/confidence';
import type { EnrichmentResult, Author, Reference, Funder } from './types';
import type { GapType } from '../db/types';

export interface SourceVerification {
  source: string;
  url: string;
  label: string;
}

export interface ComparisonField {
  field: string;
  label: string;
  crossrefValue: string | null;      // Summary for display
  enrichedValue: string | null;      // Summary for display
  crossrefFullData: unknown | null;  // Full raw data from Crossref
  enrichedFullData: unknown | null;  // Full enriched data
  hasEnrichedData: boolean;          // We found data from enrichment sources
  isImproved: boolean;               // Crossref was missing AND we found data
  confidence: number;
  sources: string[];
  sourceVerifications: SourceVerification[];  // Links to verify the data
}

export interface ArticleComparison {
  doi: string;
  title: string | null;
  publisher: string | null;
  journal: string | null;
  gaps: GapType[];

  // Current state from Crossref
  crossref: CrossrefMetadata | null;
  crossrefGapAnalysis: ReturnType<typeof identifyGaps> | null;

  // Enriched data
  enrichmentSources: string[];
  enrichedAuthors: Author[];
  enrichedReferences: Reference[];
  enrichedFunders: Funder[];
  enrichedAbstract: string | null;
  enrichedLicense: string | null;

  // PDF extraction info
  pdfUrl: string | null;
  pdfSource: string | null;
  reductoUsed: boolean;

  // Source verification links
  openalexUrl: string | null;
  crossrefUrl: string;

  // Field-by-field comparison
  comparisons: ComparisonField[];

  // Summary
  totalImprovements: number;
  totalWithData: number;  // Fields where we found data (even if Crossref has it)
  overallConfidence: number;
}

/**
 * Run full enrichment pipeline for a single DOI
 */
export async function enrichArticle(
  doi: string,
  gaps: GapType[],
  options: {
    useReducto?: boolean;
    skipPdf?: boolean;
  } = {}
): Promise<ArticleComparison> {
  const { useReducto = true, skipPdf = false } = options;

  console.log(`\n[Orchestrator] Enriching DOI: ${doi}`);
  console.log(`  Gaps to fix: ${gaps.join(', ')}`);

  // 1. Get current Crossref metadata
  console.log('  1. Fetching Crossref metadata...');
  const crossref = await fetchCrossrefMetadata(doi);
  const crossrefGapAnalysis = crossref ? identifyGaps(crossref) : null;

  // 2. Get OpenAlex enrichment
  console.log('  2. Fetching OpenAlex data...');
  const openalexResult = await enrichFromOpenAlex(doi);

  // 3. Enrich authors with ORCID data
  let enrichedAuthors: Author[] = openalexResult?.authors || [];
  if (enrichedAuthors.length > 0) {
    console.log('  3. Enriching with ORCID data...');
    enrichedAuthors = await enrichAuthorsWithOrcid(enrichedAuthors);
  }

  // 4. Enrich affiliations with ROR
  console.log('  4. Enriching affiliations with ROR...');
  for (const author of enrichedAuthors) {
    if (author.affiliations.length > 0) {
      author.affiliations = await enrichAffiliationsWithRor(author.affiliations);
    }
  }

  // 5. Get PDF and run Reducto if needed
  let pdfUrl: string | null = null;
  let pdfSource: string | null = null;
  let reductoResult: EnrichmentResult | null = null;

  const needsPdfExtraction =
    gaps.includes('references') ||
    gaps.includes('abstracts') ||
    gaps.includes('funding_award_numbers');

  if (useReducto && needsPdfExtraction && !skipPdf) {
    console.log('  5. Finding PDF via Unpaywall...');
    const pdfInfo = await findPdfUrl(doi);
    pdfUrl = pdfInfo.pdfUrl;
    pdfSource = pdfInfo.source;

    if (pdfUrl) {
      console.log(`     Found PDF: ${pdfSource}`);
      console.log('  6. Running Reducto pipeline extraction...');

      try {
        const extracted = await extractMetadataWithPipeline(pdfUrl);
        if (extracted) {
          // Convert structured pipeline output to EnrichmentResult
          reductoResult = convertPipelineToEnrichment(doi, extracted);
          console.log(`     Reducto: Found abstract=${!!extracted.abstract}, refs=${extracted.references?.length || 0}, funders=${extracted.funding?.length || 0}`);
        }
      } catch (error) {
        console.log(`     Reducto extraction failed: ${error}`);
      }
    } else {
      console.log('     No PDF available');
    }
  }

  // 6. Combine all enrichment results
  const allResults: EnrichmentResult[] = [];
  if (openalexResult) allResults.push(openalexResult);
  if (reductoResult) allResults.push(reductoResult);

  // 7. Create enrichment summary
  const summary = createEnrichmentSummary(doi, allResults);
  const gapAnalysis = analyzeGaps(summary, gaps);

  // 8. Build comparison with source verification
  const openalexRaw = openalexResult?.raw as { id?: string; title?: string } | undefined;
  const comparisons = buildComparisons(crossref, summary, enrichedAuthors, gaps, {
    openalexUrl: openalexRaw?.id || null,
    pdfUrl,
    doi,
  });

  return {
    doi,
    title: crossref?.title || openalexRaw?.title || null,
    publisher: crossref?.publisher || null,
    journal: crossref?.journal || null,
    gaps,
    crossref,
    crossrefGapAnalysis,
    enrichmentSources: allResults.map(r => r.source),
    enrichedAuthors,
    enrichedReferences: summary.recovered.references || [],
    enrichedFunders: summary.recovered.funders || [],
    enrichedAbstract: summary.recovered.abstract || null,
    enrichedLicense: summary.recovered.license || null,
    pdfUrl,
    pdfSource,
    reductoUsed: !!reductoResult,
    openalexUrl: openalexRaw?.id || null,
    crossrefUrl: `https://api.crossref.org/works/${doi}`,
    comparisons,
    totalImprovements: comparisons.filter(c => c.isImproved).length,
    totalWithData: comparisons.filter(c => c.hasEnrichedData).length,
    overallConfidence: gapAnalysis.recoverableGaps > 0
      ? Math.round(
          gapAnalysis.gapDetails
            .filter(g => g.recoverable)
            .reduce((sum, g) => sum + g.confidence, 0) / gapAnalysis.recoverableGaps
        )
      : 0,
  };
}

/**
 * Build field-by-field comparisons with source verification
 */
function buildComparisons(
  crossref: CrossrefMetadata | null,
  summary: ReturnType<typeof createEnrichmentSummary>,
  enrichedAuthors: Author[],
  gaps: GapType[],
  sourceUrls: {
    openalexUrl: string | null;
    pdfUrl: string | null;
    doi: string;
  }
): ComparisonField[] {
  const comparisons: ComparisonField[] = [];

  // Helper to build source verification links based on which sources have data
  const buildVerifications = (sources: string[]): SourceVerification[] => {
    const verifications: SourceVerification[] = [];

    if (sources.includes('openalex') && sourceUrls.openalexUrl) {
      verifications.push({
        source: 'openalex',
        url: sourceUrls.openalexUrl,
        label: 'View in OpenAlex',
      });
    }
    if (sources.includes('reducto') && sourceUrls.pdfUrl) {
      verifications.push({
        source: 'reducto',
        url: sourceUrls.pdfUrl,
        label: 'View PDF source',
      });
    }
    // Always add Crossref link for comparison
    verifications.push({
      source: 'crossref',
      url: `https://api.crossref.org/works/${sourceUrls.doi}`,
      label: 'View Crossref API',
    });

    return verifications;
  };

  // Abstract
  if (gaps.includes('abstracts')) {
    const crossrefAbstract = crossref?.abstract;
    const enrichedAbstract = summary.recovered.abstract;
    const sources = summary.sources.filter(s => s.abstract).map(s => s.source);
    comparisons.push({
      field: 'abstract',
      label: 'Abstract',
      crossrefValue: crossrefAbstract
        ? `${crossrefAbstract.substring(0, 200)}...`
        : null,
      enrichedValue: enrichedAbstract
        ? `${enrichedAbstract.substring(0, 200)}...`
        : null,
      crossrefFullData: crossrefAbstract || null,
      enrichedFullData: enrichedAbstract || null,
      hasEnrichedData: !!enrichedAbstract,
      isImproved: !crossrefAbstract && !!enrichedAbstract,
      confidence: summary.confidence.abstract || 0,
      sources,
      sourceVerifications: buildVerifications(sources),
    });
  }

  // References
  if (gaps.includes('references')) {
    const crossrefRefs = crossref?.references || [];
    const enrichedRefs = summary.recovered.references || [];
    const sources = summary.sources.filter(s => s.references?.length).map(s => s.source);
    comparisons.push({
      field: 'references',
      label: 'References',
      crossrefValue: crossrefRefs.length > 0 ? `${crossrefRefs.length} references` : null,
      enrichedValue: enrichedRefs.length > 0 ? `${enrichedRefs.length} references` : null,
      crossrefFullData: crossrefRefs.length > 0 ? crossrefRefs : null,
      enrichedFullData: enrichedRefs.length > 0 ? enrichedRefs : null,
      hasEnrichedData: enrichedRefs.length > 0,
      isImproved: crossrefRefs.length === 0 && enrichedRefs.length > 0,
      confidence: summary.confidence.references || 0,
      sources,
      sourceVerifications: buildVerifications(sources),
    });
  }

  // ORCID IDs
  if (gaps.includes('orcid_ids')) {
    const crossrefAuthors = crossref?.authors || [];
    const crossrefOrcids = crossrefAuthors.filter(a => a.orcid).length;
    const enrichedOrcids = enrichedAuthors.filter(a => a.orcid).length;
    const sources = summary.sources.filter(s => s.authors?.some(a => a.orcid)).map(s => s.source);

    comparisons.push({
      field: 'orcid_ids',
      label: 'ORCID IDs',
      crossrefValue: crossrefAuthors.length > 0 ? `${crossrefOrcids}/${crossrefAuthors.length} authors` : null,
      enrichedValue: enrichedAuthors.length > 0 ? `${enrichedOrcids}/${enrichedAuthors.length} authors` : null,
      crossrefFullData: crossrefAuthors.length > 0 ? crossrefAuthors : null,
      enrichedFullData: enrichedAuthors.length > 0 ? enrichedAuthors : null,
      hasEnrichedData: enrichedOrcids > 0,
      isImproved: enrichedOrcids > crossrefOrcids,
      confidence: summary.confidence.orcidIds || 0,
      sources,
      sourceVerifications: buildVerifications(sources),
    });
  }

  // Affiliations
  if (gaps.includes('affiliations')) {
    const crossrefAuthors = crossref?.authors || [];
    const crossrefAffs = crossrefAuthors.filter(a => a.affiliations.length > 0).length;
    const enrichedAffs = enrichedAuthors.filter(a => a.affiliations.length > 0).length;
    const sources = summary.sources.filter(s => s.authors?.some(a => a.affiliations.length > 0)).map(s => s.source);

    comparisons.push({
      field: 'affiliations',
      label: 'Affiliations',
      crossrefValue: crossrefAffs > 0 ? `${crossrefAffs} authors with affiliations` : null,
      enrichedValue: enrichedAffs > 0 ? `${enrichedAffs} authors with affiliations` : null,
      crossrefFullData: crossrefAuthors.length > 0 ? crossrefAuthors : null,
      enrichedFullData: enrichedAuthors.length > 0 ? enrichedAuthors : null,
      hasEnrichedData: enrichedAffs > 0,
      isImproved: enrichedAffs > crossrefAffs,
      confidence: summary.confidence.affiliations || 0,
      sources,
      sourceVerifications: buildVerifications(sources),
    });
  }

  // ROR IDs
  if (gaps.includes('ror_ids')) {
    const enrichedRors = enrichedAuthors
      .flatMap(a => a.affiliations)
      .filter(aff => aff.ror).length;
    const sources = ['openalex', 'ror'];

    comparisons.push({
      field: 'ror_ids',
      label: 'ROR IDs',
      crossrefValue: null, // Crossref doesn't store ROR directly
      enrichedValue: enrichedRors > 0 ? `${enrichedRors} ROR IDs found` : null,
      crossrefFullData: null,
      enrichedFullData: enrichedAuthors.length > 0 ? enrichedAuthors : null,
      hasEnrichedData: enrichedRors > 0,
      isImproved: enrichedRors > 0,
      confidence: summary.confidence.rorIds || 0,
      sources,
      sourceVerifications: buildVerifications(sources),
    });
  }

  // Funder Registry IDs
  if (gaps.includes('funder_registry_ids')) {
    const crossrefFunders = crossref?.funders || [];
    const enrichedFunders = summary.recovered.funders || [];
    const crossrefFunderDois = crossrefFunders.filter(f => f.doi).length;
    const enrichedFunderDois = enrichedFunders.filter(f => f.doi).length;
    const sources = summary.sources.filter(s => s.funders?.some(f => f.doi)).map(s => s.source);

    comparisons.push({
      field: 'funder_registry_ids',
      label: 'Funder Registry IDs',
      crossrefValue: crossrefFunderDois > 0 ? `${crossrefFunderDois} funders with DOI` : null,
      enrichedValue: enrichedFunderDois > 0 ? `${enrichedFunderDois} funders with DOI` : null,
      crossrefFullData: crossrefFunders.length > 0 ? crossrefFunders : null,
      enrichedFullData: enrichedFunders.length > 0 ? enrichedFunders : null,
      hasEnrichedData: enrichedFunderDois > 0,
      isImproved: enrichedFunderDois > crossrefFunderDois,
      confidence: summary.confidence.funderIds || 0,
      sources,
      sourceVerifications: buildVerifications(sources),
    });
  }

  // Award Numbers
  if (gaps.includes('funding_award_numbers')) {
    const crossrefFunders = crossref?.funders || [];
    const enrichedFunders = summary.recovered.funders || [];
    const crossrefAwards = crossrefFunders.filter(f => f.awards.length > 0).length;
    const enrichedAwards = enrichedFunders.filter(f => f.awardNumber).length;
    const sources = summary.sources.filter(s => s.funders?.some(f => f.awardNumber)).map(s => s.source);

    comparisons.push({
      field: 'funding_award_numbers',
      label: 'Award Numbers',
      crossrefValue: crossrefAwards > 0 ? `${crossrefAwards} funders with awards` : null,
      enrichedValue: enrichedAwards > 0 ? `${enrichedAwards} awards found` : null,
      crossrefFullData: crossrefFunders.length > 0 ? crossrefFunders : null,
      enrichedFullData: enrichedFunders.length > 0 ? enrichedFunders : null,
      hasEnrichedData: enrichedAwards > 0,
      isImproved: enrichedAwards > crossrefAwards,
      confidence: summary.confidence.awardNumbers || 0,
      sources,
      sourceVerifications: buildVerifications(sources),
    });
  }

  // License
  if (gaps.includes('license_urls')) {
    const sources = summary.sources.filter(s => s.license).map(s => s.source);
    comparisons.push({
      field: 'license_urls',
      label: 'License URL',
      crossrefValue: crossref?.license || null,
      enrichedValue: summary.recovered.license || null,
      crossrefFullData: crossref?.license || null,
      enrichedFullData: summary.recovered.license || null,
      hasEnrichedData: !!summary.recovered.license,
      isImproved: !crossref?.license && !!summary.recovered.license,
      confidence: summary.confidence.license || 0,
      sources,
      sourceVerifications: buildVerifications(sources),
    });
  }

  return comparisons;
}

/**
 * Convert Reducto pipeline output to EnrichmentResult format
 */
function convertPipelineToEnrichment(doi: string, extracted: ReductoExtractedMetadata): EnrichmentResult {
  // Convert references
  const references: Reference[] = (extracted.references || []).map(ref => ({
    unstructured: ref.citation,
    doi: ref.doi || undefined,
    title: ref.title,
    authors: ref.authors ? [ref.authors] : undefined,
    year: ref.year ? parseInt(ref.year, 10) : undefined,
  }));

  // Convert funders
  const funders: Funder[] = (extracted.funding || []).map(f => ({
    name: f.funder_name,
    awardNumber: f.award_number || undefined,
  }));

  // Convert authors (if present)
  const authors: Author[] = (extracted.authors || []).map(a => ({
    name: a.name,
    orcid: a.orcid || undefined,
    affiliations: (a.affiliations || []).map(aff => ({
      name: aff,
    })),
  }));

  return {
    doi,
    source: 'reducto',
    timestamp: new Date(),
    abstract: extracted.abstract,
    references: references.length > 0 ? references : undefined,
    funders: funders.length > 0 ? funders : undefined,
    authors: authors.length > 0 ? authors : undefined,
    license: extracted.license || undefined,
  };
}

// Legacy helper functions for raw Reducto extraction (fallback)
function extractAbstractFromReducto(result: { chunks: Array<{ content: string }> }): string | undefined {
  console.log(`     Reducto: Processing ${result.chunks.length} chunks`);

  for (const chunk of result.chunks) {
    const content = chunk.content;
    const contentLower = content.toLowerCase();

    // Method 1: Look for explicit "Abstract" heading
    if (contentLower.includes('abstract')) {
      const match = content.match(/abstract[:\s]*\n?([\s\S]*?)(?=\n\s*(introduction|keywords|1\.|background|methods|results)|$)/i);
      if (match && match[1] && match[1].trim().length > 50) {
        console.log(`     Reducto: Found abstract via heading (${match[1].trim().length} chars)`);
        return match[1].trim();
      }
    }

    // Method 2: For eLife "Insight" articles - look for short summary after title
    // These often start with a single sentence summary
    if (contentLower.includes('elife') || contentLower.includes('insight')) {
      // Look for a paragraph that looks like a summary (1-3 sentences, 50-500 chars)
      const paragraphs = content.split(/\n\n+/);
      for (const para of paragraphs) {
        const trimmed = para.trim();
        // Skip headings, titles, author names
        if (trimmed.startsWith('#') || trimmed.length < 50 || trimmed.length > 500) continue;
        // Skip if it looks like metadata
        if (/^(doi:|copyright|license|related|image)/i.test(trimmed)) continue;
        // Check if it looks like a summary sentence
        if (/\.$/.test(trimmed) && !trimmed.includes('\n')) {
          console.log(`     Reducto: Found summary paragraph (${trimmed.length} chars)`);
          return trimmed;
        }
      }
    }
  }

  // Method 3: Fallback - get the first substantial paragraph from early chunks
  for (let i = 0; i < Math.min(3, result.chunks.length); i++) {
    const content = result.chunks[i].content;
    const paragraphs = content.split(/\n\n+/);
    for (const para of paragraphs) {
      const trimmed = para.trim();
      // Look for a paragraph that's 100-1000 chars, ends with period, no special formatting
      if (trimmed.length >= 100 && trimmed.length <= 1000 &&
          /\.$/.test(trimmed) && !trimmed.startsWith('#') &&
          !/^(doi:|copyright|license)/i.test(trimmed)) {
        console.log(`     Reducto: Found abstract via fallback (${trimmed.length} chars)`);
        return trimmed;
      }
    }
  }

  console.log('     Reducto: No abstract found');
  return undefined;
}

function extractReferencesFromReducto(result: { chunks: Array<{ content: string }> }): Reference[] {
  const references: Reference[] = [];
  let inRefs = false;

  for (const chunk of result.chunks) {
    const trimmedContent = chunk.content.trim();

    // Check if this chunk starts the references section
    if (/^(references|bibliography|works cited|literature cited)/i.test(trimmedContent) ||
        /^#+\s*(references|bibliography)/i.test(trimmedContent)) {
      inRefs = true;
      console.log('     Reducto: Found references section');
      continue;
    }
    if (inRefs) {
      // Split by reference numbers or new lines
      const lines = chunk.content.split(/\n(?=\[?\d+[\.\])]|\n(?=[A-Z][a-z]+,?\s+[A-Z]))/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.length > 30) {
          const doiMatch = trimmed.match(/10\.\d{4,}\/[^\s\]]+/);
          references.push({
            unstructured: trimmed.substring(0, 500), // Limit length
            doi: doiMatch?.[0]?.replace(/[.,;)\]]+$/, ''),
          });
        }
      }
    }

    // Also look for DOI links in any chunk (some papers have DOIs inline)
    const doiMatches = chunk.content.matchAll(/(?:doi[:\s]*|https?:\/\/doi\.org\/)(10\.\d{4,}\/[^\s\]]+)/gi);
    for (const match of doiMatches) {
      const doi = match[1].replace(/[.,;)\]]+$/, '');
      if (!references.some(r => r.doi === doi)) {
        references.push({ doi });
      }
    }
  }

  if (references.length > 0) {
    console.log(`     Reducto: Found ${references.length} references`);
  }
  return references;
}

function extractFundersFromReducto(result: { chunks: Array<{ content: string }> }): Funder[] {
  const funders: Funder[] = [];

  for (const chunk of result.chunks) {
    const content = chunk.content.toLowerCase();

    // Look for funding/acknowledgment sections
    if (content.includes('acknowledgment') || content.includes('funding') ||
        content.includes('supported by') || content.includes('grant')) {

      // Extract grant/award numbers
      const awardMatches = chunk.content.matchAll(/(?:grant|award|contract|agreement)[\s#:No.]*([A-Z0-9][-A-Z0-9/]+)/gi);
      for (const match of awardMatches) {
        if (match[1].length >= 3) {
          funders.push({ name: 'Unknown Funder', awardNumber: match[1] });
        }
      }

      // Look for common funder names
      const funderPatterns = [
        { pattern: /National Institutes of Health|NIH/i, name: 'National Institutes of Health' },
        { pattern: /National Science Foundation|NSF/i, name: 'National Science Foundation' },
        { pattern: /European Research Council|ERC/i, name: 'European Research Council' },
        { pattern: /Wellcome Trust/i, name: 'Wellcome Trust' },
        { pattern: /Howard Hughes Medical Institute|HHMI/i, name: 'Howard Hughes Medical Institute' },
        { pattern: /Bill & Melinda Gates Foundation|Gates Foundation/i, name: 'Bill & Melinda Gates Foundation' },
      ];

      for (const { pattern, name } of funderPatterns) {
        if (pattern.test(chunk.content) && !funders.some(f => f.name === name)) {
          funders.push({ name });
        }
      }
    }
  }

  if (funders.length > 0) {
    console.log(`     Reducto: Found ${funders.length} funders`);
  }
  return funders;
}

/**
 * Enrich multiple articles (top N by gap count)
 */
export async function enrichTopArticles(
  articles: Array<{ doi: string; gaps: GapType[] }>,
  count: number = 5,
  options?: { useReducto?: boolean; skipPdf?: boolean }
): Promise<ArticleComparison[]> {
  // Sort by number of gaps (descending)
  const sorted = [...articles].sort((a, b) => b.gaps.length - a.gaps.length);
  const topArticles = sorted.slice(0, count);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Enriching top ${count} articles with most gaps`);
  console.log(`${'='.repeat(60)}`);

  const results: ArticleComparison[] = [];

  for (const article of topArticles) {
    try {
      const comparison = await enrichArticle(article.doi, article.gaps, options);
      results.push(comparison);

      // Small delay between articles
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Failed to enrich ${article.doi}:`, error);
    }
  }

  return results;
}
