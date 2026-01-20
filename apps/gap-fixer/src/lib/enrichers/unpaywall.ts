/**
 * Unpaywall API client to find open access PDFs
 * With publisher-specific fallbacks for known OA publishers
 */

const UNPAYWALL_BASE_URL = 'https://api.unpaywall.org/v2';

/**
 * Publisher-specific PDF URL patterns
 * Some publishers have predictable PDF URLs that Unpaywall doesn't always capture
 */
function getPublisherPdfUrl(doi: string): string | null {
  // eLife: 10.7554/elife.06758 -> https://elifesciences.org/articles/06758.pdf
  if (doi.startsWith('10.7554/elife.')) {
    const articleId = doi.replace('10.7554/elife.', '');
    return `https://elifesciences.org/articles/${articleId}.pdf`;
  }

  // PLOS ONE: 10.1371/journal.pone.* -> https://journals.plos.org/plosone/article/file?id=10.1371/journal.pone.*&type=printable
  if (doi.startsWith('10.1371/journal.pone.')) {
    return `https://journals.plos.org/plosone/article/file?id=${doi}&type=printable`;
  }

  // PeerJ: 10.7717/peerj.* -> https://peerj.com/articles/*.pdf
  if (doi.startsWith('10.7717/peerj.')) {
    const articleId = doi.replace('10.7717/peerj.', '');
    return `https://peerj.com/articles/${articleId}.pdf`;
  }

  // Frontiers: 10.3389/* -> construct from DOI
  if (doi.startsWith('10.3389/')) {
    return `https://www.frontiersin.org/articles/${doi}/pdf`;
  }

  // MDPI: 10.3390/* -> https://www.mdpi.com/*/pdf
  if (doi.startsWith('10.3390/')) {
    const path = doi.replace('10.3390/', '');
    return `https://www.mdpi.com/${path}/pdf`;
  }

  return null;
}

export interface UnpaywallLocation {
  url: string;
  url_for_pdf: string | null;
  url_for_landing_page: string;
  evidence: string;
  license: string | null;
  version: string;
  host_type: string;
  is_best: boolean;
  repository_institution?: string;
}

export interface UnpaywallResult {
  doi: string;
  title: string;
  is_oa: boolean;
  oa_status: string;
  best_oa_location: UnpaywallLocation | null;
  oa_locations: UnpaywallLocation[];
}

/**
 * Find open access PDF URL for a DOI
 */
export async function findPdfUrl(doi: string): Promise<{
  pdfUrl: string | null;
  landingPage: string | null;
  license: string | null;
  source: string | null;
}> {
  try {
    const email = process.env.OPENALEX_EMAIL || 'test@example.com';
    const url = `${UNPAYWALL_BASE_URL}/${encodeURIComponent(doi)}?email=${email}`;

    const response = await fetch(url);

    if (!response.ok) {
      console.log(`Unpaywall: API error for DOI ${doi} (${response.status})`);
      // Try publisher-specific pattern as fallback
      const publisherPdfUrl = getPublisherPdfUrl(doi);
      if (publisherPdfUrl) {
        console.log(`Unpaywall: Using publisher-specific PDF URL for ${doi}`);
        return { pdfUrl: publisherPdfUrl, landingPage: null, license: null, source: 'publisher-pattern' };
      }
      return { pdfUrl: null, landingPage: null, license: null, source: null };
    }

    const data: UnpaywallResult = await response.json();

    if (!data.is_oa) {
      console.log(`Unpaywall: DOI ${doi} is not open access`);
      // Still try publisher-specific pattern (some OA content not indexed)
      const publisherPdfUrl = getPublisherPdfUrl(doi);
      if (publisherPdfUrl) {
        console.log(`Unpaywall: Using publisher-specific PDF URL for ${doi}`);
        return { pdfUrl: publisherPdfUrl, landingPage: null, license: null, source: 'publisher-pattern' };
      }
      return { pdfUrl: null, landingPage: null, license: null, source: null };
    }

    // Try best OA location first
    if (data.best_oa_location?.url_for_pdf) {
      return {
        pdfUrl: data.best_oa_location.url_for_pdf,
        landingPage: data.best_oa_location.url_for_landing_page,
        license: data.best_oa_location.license,
        source: data.best_oa_location.host_type,
      };
    }

    // Try other locations
    for (const location of data.oa_locations || []) {
      if (location.url_for_pdf) {
        return {
          pdfUrl: location.url_for_pdf,
          landingPage: location.url_for_landing_page,
          license: location.license,
          source: location.host_type,
        };
      }
    }

    // No PDF from Unpaywall - try publisher-specific pattern
    const publisherPdfUrl = getPublisherPdfUrl(doi);
    if (publisherPdfUrl) {
      console.log(`Unpaywall: Using publisher-specific PDF URL for ${doi}`);
      return {
        pdfUrl: publisherPdfUrl,
        landingPage: data.best_oa_location?.url_for_landing_page || null,
        license: data.best_oa_location?.license || null,
        source: 'publisher-pattern',
      };
    }

    // No PDF found, return landing page
    if (data.best_oa_location) {
      return {
        pdfUrl: null,
        landingPage: data.best_oa_location.url_for_landing_page,
        license: data.best_oa_location.license,
        source: data.best_oa_location.host_type,
      };
    }

    return { pdfUrl: null, landingPage: null, license: null, source: null };
  } catch (error) {
    console.error(`Unpaywall error for DOI ${doi}:`, error);
    // Try publisher-specific pattern as last resort
    const publisherPdfUrl = getPublisherPdfUrl(doi);
    if (publisherPdfUrl) {
      console.log(`Unpaywall: Using publisher-specific PDF URL for ${doi}`);
      return { pdfUrl: publisherPdfUrl, landingPage: null, license: null, source: 'publisher-pattern' };
    }
    return { pdfUrl: null, landingPage: null, license: null, source: null };
  }
}
