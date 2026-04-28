import type { EnrichmentResult, Author, Reference, Funder } from './types';

const OPENALEX_BASE_URL = 'https://api.openalex.org';

interface OpenAlexWork {
  id: string;
  doi?: string;
  title?: string;
  abstract_inverted_index?: Record<string, number[]>;
  authorships?: Array<{
    author: {
      id: string;
      display_name: string;
      orcid?: string;
    };
    institutions: Array<{
      id: string;
      display_name: string;
      ror?: string;
    }>;
  }>;
  referenced_works?: string[];
  grants?: Array<{
    funder: string;
    funder_display_name?: string;
    award_id?: string;
  }>;
  primary_location?: {
    license?: string;
  };
  open_access?: {
    oa_url?: string;
  };
}

interface OpenAlexWorkDetails {
  id: string;
  doi?: string;
  title?: string;
}

/**
 * Reconstruct abstract from inverted index
 */
function reconstructAbstract(invertedIndex: Record<string, number[]>): string {
  const words: Array<{ word: string; position: number }> = [];

  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const position of positions) {
      words.push({ word, position });
    }
  }

  words.sort((a, b) => a.position - b.position);
  return words.map(w => w.word).join(' ');
}

/**
 * Extract OpenAlex ID from URL
 */
function extractOpenAlexId(url: string): string {
  // https://openalex.org/W1234567890 -> W1234567890
  return url.split('/').pop() || '';
}

/**
 * Fetch work details by OpenAlex ID (for references)
 */
async function fetchWorkById(openalexId: string, email?: string): Promise<OpenAlexWorkDetails | null> {
  try {
    const params = new URLSearchParams();
    if (email) params.set('mailto', email);
    const apiKey = process.env.OPENALEX_API_KEY;
    if (apiKey) params.set('api_key', apiKey);

    const url = `${OPENALEX_BASE_URL}/works/${openalexId}?${params}`;
    const response = await fetch(url);

    if (!response.ok) return null;

    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Fetch enrichment data from OpenAlex by DOI
 */
export async function enrichFromOpenAlex(doi: string): Promise<EnrichmentResult | null> {
  const email = process.env.CROSSREF_MAILTO || process.env.OPENALEX_EMAIL;
  const apiKey = process.env.OPENALEX_API_KEY;

  try {
    const params = new URLSearchParams();
    if (email) params.set('mailto', email);
    if (apiKey) params.set('api_key', apiKey);

    const url = `${OPENALEX_BASE_URL}/works/doi:${doi}?${params}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.log(`OpenAlex: No data for DOI ${doi} (${response.status})`);
      return null;
    }

    const work: OpenAlexWork = await response.json();

    // Extract abstract
    let abstract: string | undefined;
    if (work.abstract_inverted_index) {
      abstract = reconstructAbstract(work.abstract_inverted_index);
    }

    // Extract authors with ORCIDs and affiliations
    const authors: Author[] = (work.authorships || []).map(authorship => ({
      name: authorship.author.display_name,
      orcid: authorship.author.orcid?.replace('https://orcid.org/', ''),
      affiliations: (authorship.institutions || []).map(inst => ({
        name: inst.display_name,
        ror: inst.ror?.replace('https://ror.org/', ''),
      })),
    }));

    // Extract references (just IDs for now, can fetch details if needed)
    const references: Reference[] = (work.referenced_works || []).map(refUrl => {
      const openalexId = extractOpenAlexId(refUrl);
      return {
        // We'll need to fetch details for each reference if needed
        // For now, just store the OpenAlex ID
        unstructured: `openalex:${openalexId}`,
      };
    });

    // Extract funders
    const funders: Funder[] = (work.grants || []).map(grant => ({
      name: grant.funder_display_name || grant.funder,
      doi: grant.funder.startsWith('https://')
        ? grant.funder.replace('https://openalex.org/', '')
        : undefined,
      awardNumber: grant.award_id,
    }));

    // Extract license
    const license = work.primary_location?.license;

    return {
      doi,
      source: 'openalex',
      timestamp: new Date(),
      abstract,
      references: references.length > 0 ? references : undefined,
      authors: authors.length > 0 ? authors : undefined,
      funders: funders.length > 0 ? funders : undefined,
      license,
      raw: work,
    };
  } catch (error) {
    console.error(`OpenAlex error for DOI ${doi}:`, error);
    return null;
  }
}

/**
 * Fetch detailed reference information (batch)
 */
export async function fetchReferenceDetails(
  openalexIds: string[],
  email?: string
): Promise<Map<string, OpenAlexWorkDetails>> {
  const results = new Map<string, OpenAlexWorkDetails>();

  // Batch fetch in groups of 50
  const batchSize = 50;
  for (let i = 0; i < openalexIds.length; i += batchSize) {
    const batch = openalexIds.slice(i, i + batchSize);
    const filter = batch.join('|');

    try {
      const params = new URLSearchParams({
        filter: `openalex_id:${filter}`,
        per_page: '50',
      });
      if (email) params.set('mailto', email);
      const apiKey = process.env.OPENALEX_API_KEY;
      if (apiKey) params.set('api_key', apiKey);

      const url = `${OPENALEX_BASE_URL}/works?${params}`;
      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        for (const work of data.results || []) {
          results.set(work.id, work);
        }
      }
    } catch (error) {
      console.error('Error fetching reference details:', error);
    }
  }

  return results;
}
