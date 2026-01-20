import Papa from 'papaparse';
import type { GapType } from '../db/types';

/**
 * Raw row from Crossref gap report CSV
 */
interface GapReportRow {
  DOI: string;
  'Created Date': string;
  'Missing Field': string;
}

/**
 * Parsed article with its gaps
 */
export interface ParsedArticle {
  doi: string;
  createdDate: string;
  gaps: GapType[];
}

/**
 * Map Crossref gap report field names to our internal gap types
 */
const FIELD_MAP: Record<string, GapType> = {
  'References': 'references',
  'Abstracts': 'abstracts',
  'ORCID iDs': 'orcid_ids',
  'Affiliations': 'affiliations',
  'ROR IDs': 'ror_ids',
  'Funder Registry IDs': 'funder_registry_ids',
  'Funding award numbers': 'funding_award_numbers',
  'License URLs': 'license_urls',
  'Crossmark enabled': 'crossmark_enabled',
};

/**
 * Parse gap report CSV content
 */
export function parseGapReport(csvContent: string): {
  articles: ParsedArticle[];
  totalRows: number;
  uniqueArticles: number;
  gapCounts: Record<GapType, number>;
  errors: string[];
} {
  const errors: string[] = [];
  const articleMap = new Map<string, ParsedArticle>();
  const gapCounts: Record<GapType, number> = {
    references: 0,
    abstracts: 0,
    orcid_ids: 0,
    affiliations: 0,
    ror_ids: 0,
    funder_registry_ids: 0,
    funding_award_numbers: 0,
    license_urls: 0,
    crossmark_enabled: 0,
  };

  // Parse CSV
  const result = Papa.parse<GapReportRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  if (result.errors.length > 0) {
    for (const error of result.errors) {
      errors.push(`Row ${error.row}: ${error.message}`);
    }
  }

  // Process rows
  for (const row of result.data) {
    const doi = row.DOI?.trim();
    const createdDate = row['Created Date']?.trim();
    const missingField = row['Missing Field']?.trim();

    if (!doi) {
      continue;
    }

    // Map field name to gap type
    const gapType = FIELD_MAP[missingField];
    if (!gapType) {
      if (missingField && missingField !== 'Missing Field') {
        errors.push(`Unknown gap type: "${missingField}" for DOI ${doi}`);
      }
      continue;
    }

    // Get or create article
    if (!articleMap.has(doi)) {
      articleMap.set(doi, {
        doi,
        createdDate: createdDate || '',
        gaps: [],
      });
    }

    const article = articleMap.get(doi)!;

    // Add gap if not already present
    if (!article.gaps.includes(gapType)) {
      article.gaps.push(gapType);
      gapCounts[gapType]++;
    }
  }

  const articles = Array.from(articleMap.values());

  return {
    articles,
    totalRows: result.data.length,
    uniqueArticles: articles.length,
    gapCounts,
    errors,
  };
}

/**
 * Parse gap report from File object (browser)
 */
export function parseGapReportFile(file: File): Promise<ReturnType<typeof parseGapReport>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target?.result as string;
      resolve(parseGapReport(content));
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Validate that file looks like a Crossref gap report
 */
export function validateGapReportFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!file.name.endsWith('.csv')) {
    return { valid: false, error: 'File must be a CSV file' };
  }

  // Check file size (max 50MB)
  if (file.size > 50 * 1024 * 1024) {
    return { valid: false, error: 'File is too large (max 50MB)' };
  }

  return { valid: true };
}

/**
 * Get summary statistics for parsed gap report
 */
export function getGapReportSummary(parsed: ReturnType<typeof parseGapReport>): {
  totalArticles: number;
  totalGaps: number;
  avgGapsPerArticle: number;
  gapDistribution: Record<number, number>;
  estimatedPrice: number;
  pricePerArticle: number;
} {
  const gapDistribution: Record<number, number> = {};

  for (const article of parsed.articles) {
    const numGaps = article.gaps.length;
    gapDistribution[numGaps] = (gapDistribution[numGaps] || 0) + 1;
  }

  const totalGaps = Object.values(parsed.gapCounts).reduce((a, b) => a + b, 0);
  const pricePerArticle = 2.0;

  return {
    totalArticles: parsed.uniqueArticles,
    totalGaps,
    avgGapsPerArticle: totalGaps / parsed.uniqueArticles,
    gapDistribution,
    estimatedPrice: parsed.uniqueArticles * pricePerArticle,
    pricePerArticle,
  };
}
